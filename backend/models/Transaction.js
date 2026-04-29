const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  pricePerUnit: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  type: { type: String, enum: ['sale', 'purchase'], required: true },
  month: { type: Number },
  year: { type: Number },
}, { timestamps: true });

transactionSchema.pre('save', async function() {
  const now = new Date();
  this.month = now.getMonth() + 1;
  this.year = now.getFullYear();
});

module.exports = mongoose.model('Transaction', transactionSchema);
