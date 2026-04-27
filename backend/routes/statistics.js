const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');

// @GET /api/statistics/overview
router.get('/overview', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const [salesData, purchaseData, stockData, productSummary, topProducts] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId, type: 'sale' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { userId, type: 'purchase' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Product.aggregate([
        { $match: { userId } },
        { $group: { _id: null, inStock: { $sum: { $cond: [{ $gt: ['$quantity', 0] }, 1, 0] } }, toBeReceived: { $sum: { $cond: [{ $eq: ['$status', 'Out-of-stock'] }, 1, 0] } } } }
      ]),
      Product.aggregate([
        { $match: { userId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $count: 'categories' }
      ]),
      Product.find({ userId }).sort({ salesCount: -1 }).limit(6).select('productName salesCount revenue')
    ]);

    const suppliers = await Product.distinct('category', { userId });

    res.json({
      success: true,
      overview: {
        sales: { total: salesData[0]?.total || 0, count: salesData[0]?.count || 0 },
        purchases: { total: purchaseData[0]?.total || 0, count: purchaseData[0]?.count || 0 },
        revenue: salesData[0]?.total || 0,
        profit: (salesData[0]?.total || 0) - (purchaseData[0]?.total || 0),
        cost: purchaseData[0]?.total || 0,
        inStock: stockData[0]?.inStock || 0,
        toBeReceived: stockData[0]?.toBeReceived || 0,
        suppliersCount: suppliers.length,
        categoriesCount: productSummary[0]?.categories || 0,
        topProducts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/statistics/graph?period=weekly|monthly
router.get('/graph', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = 'monthly' } = req.query;
    const now = new Date();

    let labels = [];
    let salesByPeriod = [];
    let purchasesByPeriod = [];

    if (period === 'monthly') {
      // Last 10 months
      for (let i = 9; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        labels.push(date.toLocaleString('default', { month: 'short' }));

        const [sales, purchases] = await Promise.all([
          Transaction.aggregate([
            { $match: { userId, type: 'sale', month, year } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ]),
          Transaction.aggregate([
            { $match: { userId, type: 'purchase', month, year } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ])
        ]);
        salesByPeriod.push(sales[0]?.total || 0);
        purchasesByPeriod.push(purchases[0]?.total || 0);
      }
    } else {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const start = new Date(date.setHours(0, 0, 0, 0));
        const end = new Date(date.setHours(23, 59, 59, 999));
        labels.push(start.toLocaleDateString('default', { weekday: 'short' }));

        const [sales, purchases] = await Promise.all([
          Transaction.aggregate([
            { $match: { userId, type: 'sale', createdAt: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ]),
          Transaction.aggregate([
            { $match: { userId, type: 'purchase', createdAt: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ])
        ]);
        salesByPeriod.push(sales[0]?.total || 0);
        purchasesByPeriod.push(purchases[0]?.total || 0);
      }
    }

    res.json({ success: true, labels, sales: salesByPeriod, purchases: purchasesByPeriod });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/statistics/top-cards
router.get('/top-cards', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1));

    const [revenueData, prevRevenueData, soldData, prevSoldData, stockCount] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId, type: 'sale' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Transaction.aggregate([
        { $match: { userId, type: 'sale', createdAt: { $lt: lastMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Transaction.aggregate([
        { $match: { userId, type: 'sale' } },
        { $group: { _id: null, count: { $sum: '$quantity' } } }
      ]),
      Transaction.aggregate([
        { $match: { userId, type: 'sale', createdAt: { $lt: lastMonth } } },
        { $group: { _id: null, count: { $sum: '$quantity' } } }
      ]),
      Product.countDocuments({ userId, status: 'In-stock' })
    ]);

    const revenue = revenueData[0]?.total || 0;
    const prevRevenue = prevRevenueData[0]?.total || 0;
    const sold = soldData[0]?.count || 0;
    const prevSold = prevSoldData[0]?.count || 0;

    const revenueChange = prevRevenue ? (((revenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : 0;
    const soldChange = prevSold ? (((sold - prevSold) / prevSold) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      cards: {
        totalRevenue: revenue,
        revenueChange,
        productsSold: sold,
        soldChange,
        productsInStock: stockCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
