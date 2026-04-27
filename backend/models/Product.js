const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productName: { type: String, required: true, trim: true },
  productId: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true },
  expiryDate: { type: Date },
  thresholdValue: { type: Number, required: true, min: 0 },
  image: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['In-stock', 'Low-stock', 'Out-of-stock'], 
    default: 'In-stock' 
  },
  salesCount: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
}, { timestamps: true });

// Auto-update status based on quantity and threshold
productSchema.pre('save', async function() {
  if (this.quantity === 0) {
    this.status = 'Out-of-stock';
  } else if (this.quantity <= this.thresholdValue) {
    this.status = 'Low-stock';
  } else {
    this.status = 'In-stock';
  }
});

module.exports = mongoose.model('Product', productSchema);
