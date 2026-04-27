const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Invoice = require('../models/Invoice');

// @GET /api/invoices
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = { userId: req.user._id };
    if (search) {
      query.$or = [
        { invoiceId: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, invoices, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/invoices/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentTransactions, totalInvoices, processedInvoices, paidData, unpaidData] = await Promise.all([
      Invoice.countDocuments({ userId, createdAt: { $gte: sevenDaysAgo } }),
      Invoice.countDocuments({ userId }),
      Invoice.countDocuments({ userId, status: 'Paid' }),
      Invoice.aggregate([
        { $match: { userId, status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Invoice.aggregate([
        { $match: { userId, status: 'Unpaid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      summary: {
        recentTransactions,
        totalInvoices,
        processedInvoices,
        paidAmount: paidData[0]?.total || 0,
        paidCustomers: paidData[0]?.count || 0,
        unpaidAmount: unpaidData[0]?.total || 0,
        unpaidCustomers: unpaidData[0]?.count || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/invoices/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/invoices/:id/status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/invoices/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
