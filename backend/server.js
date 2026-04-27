const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const invoiceRoutes = require('./routes/invoices');
const statisticsRoutes = require('./routes/statistics');
const { startCronJobs } = require('./utils/cron');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://inventory-management-nhyt.onrender.com',
    'https://inventory-management-dun-nu.vercel.app'
  ],
  credentials: true
}));app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/statistics', statisticsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Connect DB and start server
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_db';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    startCronJobs();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
