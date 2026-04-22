const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  payeeType: { type: String, enum: ['restaurant', 'delivery_partner'], required: true },
  payee: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'payeeModel' },
  payeeModel: { type: String, enum: ['Restaurant', 'User'], required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  grossAmount: { type: Number, required: true },
  commission: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  orderCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'on_hold', 'failed'],
    default: 'pending'
  },
  transactionId: { type: String },
  paidAt: { type: Date },
  notes: { type: String },
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

payoutSchema.index({ payeeType: 1, status: 1 });
payoutSchema.index({ payee: 1, periodEnd: -1 });

module.exports = mongoose.model('Payout', payoutSchema);
