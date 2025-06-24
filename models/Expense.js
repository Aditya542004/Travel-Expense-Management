const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: Date,
  category: String,
  amount: Number,
  description: String
});

module.exports = mongoose.model('Expense', expenseSchema);