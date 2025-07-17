const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: Date,
  description: String,
  category: String,
  amount: Number,
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
});

module.exports = mongoose.model('Expense', expenseSchema);