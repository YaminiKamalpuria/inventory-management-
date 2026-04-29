const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invoiceId: { type: String, required: true, unique: true },

  items: [invoiceItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
  dueDate: { type: Date, required: true },
  customerName: { type: String, default: 'Customer' },
  type: { type: String, enum: ['sale', 'purchase'], default: 'sale' },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
