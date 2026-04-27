const cron = require('node-cron');
const Product = require('../models/Product');

const startCronJobs = () => {
  // Run every hour to check stock status
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[CRON] Running stock status update...');
      const products = await Product.find({});
      for (const product of products) {
        let newStatus;
        if (product.quantity === 0) {
          newStatus = 'Out-of-stock';
        } else if (product.quantity <= product.thresholdValue) {
          newStatus = 'Low-stock';
        } else {
          newStatus = 'In-stock';
        }
        if (product.status !== newStatus) {
          await Product.findByIdAndUpdate(product._id, { status: newStatus });
        }
      }
      console.log('[CRON] Stock status update complete');
    } catch (error) {
      console.error('[CRON] Error:', error.message);
    }
  });

  console.log('[CRON] Cron jobs started');
};

module.exports = { startCronJobs };
