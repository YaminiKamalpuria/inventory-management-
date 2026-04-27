const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { protect } = require('../middleware/auth');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');

// Multer setup for image and CSV
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// @GET /api/products - Get all products with pagination & search
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = { userId: req.user._id };
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productId: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, products, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/products/inventory-summary
router.get('/inventory-summary', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [categories, totalProducts, lowStockProducts, topSelling] = await Promise.all([
      Product.distinct('category', { userId }),
      Product.countDocuments({ userId }),
      Product.countDocuments({ userId, status: { $in: ['Low-stock', 'Out-of-stock'] } }),
      Product.find({ userId }).sort({ salesCount: -1 }).limit(5)
    ]);

    const newProductsCount = await Product.countDocuments({ userId, createdAt: { $gte: sevenDaysAgo } });
    const totalRevenue = await Product.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: '$revenue' } } }
    ]);

    const outOfStock = await Product.countDocuments({ userId, status: 'Out-of-stock' });

    res.json({
      success: true,
      summary: {
        categoriesCount: categories.length,
        totalProducts,
        newProductsCount,
        totalRevenue: totalRevenue[0]?.total || 0,
        topSellingCount: 5,
        topSellingRevenue: topSelling.reduce((acc, p) => acc + p.revenue, 0),
        lowStockCount: lowStockProducts,
        outOfStockCount: outOfStock,
        topProducts: topSelling
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/products - Add individual product
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { productName, productId, category, price, quantity, unit, expiryDate, thresholdValue } = req.body;
    
    if (!productName || !productId || !category || !price || !quantity || !unit || !thresholdValue) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled' });
    }

    const existingProduct = await Product.findOne({ userId: req.user._id, productId });
    if (existingProduct) {
      return res.status(400).json({ success: false, message: 'Product ID already exists' });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : '';

    const product = await Product.create({
      userId: req.user._id,
      productName, productId, category,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      unit,
      expiryDate: expiryDate || undefined,
      thresholdValue: parseInt(thresholdValue),
      image: imagePath
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/products/csv-upload - Bulk upload
router.post('/csv-upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const results = [];
    const errors = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    const created = [];
    for (const row of results) {
      try {
        const productId = (row.productId || '').trim();
        const productName = (row.productName || row.name || '').trim();
        const category = (row.category || '').trim();
        const unit = (row.unit || '').trim();
        const price = parseFloat(row.price);
        const quantity = parseInt(row.quantity);
        const thresholdValue = parseInt(row.thresholdValue || row.threshold || 5);

        if (!productId) { errors.push(`Skipped row: missing productId`); continue; }
        if (!productName) { errors.push(`Skipped ${productId}: missing productName`); continue; }
        if (!category) { errors.push(`Skipped ${productId}: missing category`); continue; }
        if (isNaN(price)) { errors.push(`Skipped ${productId}: invalid price "${row.price}"`); continue; }
        if (isNaN(quantity)) { errors.push(`Skipped ${productId}: invalid quantity "${row.quantity}"`); continue; }

        const existing = await Product.findOne({ userId: req.user._id, productId });
        if (existing) { errors.push(`Duplicate ID skipped: ${productId}`); continue; }

        const product = await Product.create({
          userId: req.user._id,
          productName,
          productId,
          category,
          price,
          quantity,
          unit,
          expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
          thresholdValue: isNaN(thresholdValue) ? 5 : thresholdValue,
          image: ''
        });
        created.push(product);
      } catch (err) {
        errors.push(`Row error (${row.productId || '?'}): ${err.message}`);
      }
    }
    
    fs.unlinkSync(req.file.path);
    res.json({ success: true, created: created.length, errors, message: `${created.length} products added` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/products/:id/buy - Simulate buy (reduces stock, generates invoice)
router.post('/:id/buy', protect, async (req, res) => {
  try {
    const { quantity } = req.body;
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (quantity <= 0) return res.status(400).json({ success: false, message: 'Invalid quantity' });
    if (product.quantity < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });

    product.quantity -= quantity;
    product.salesCount += quantity;
    product.revenue += product.price * quantity;
    await product.save();

    // Create transaction
    await Transaction.create({
      userId: req.user._id,
      productId: product._id,
      productName: product.productName,
      quantity,
      pricePerUnit: product.price,
      totalAmount: product.price * quantity,
      type: 'sale'
    });

    // Auto-generate invoice
    const invoiceCount = await Invoice.countDocuments({ userId: req.user._id });
    const invoiceId = `INV-${String(invoiceCount + 1001).padStart(4, '0')}`;
    const subtotal = product.price * quantity;
    const tax = subtotal * 0.1;
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Invoice.create({
      userId: req.user._id,
      invoiceId,
      items: [{ productName: product.productName, quantity, price: product.price }],
      subtotal,
      tax,
      totalAmount: subtotal + tax,
      status: 'Unpaid',
      dueDate,
      type: 'sale'
    });

    res.json({ success: true, message: 'Purchase successful', product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/products/:id - Update product
router.put('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.image = `/uploads/${req.file.filename}`;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/products/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
