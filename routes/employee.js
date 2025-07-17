const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// ✅ Get employee expense stats
router.get('/stats', async (req, res) => {
  const userId = req.user._id; // or however you store current logged-in user

  try {
    const total = await Expense.countDocuments({ userId });
    const pending = await Expense.countDocuments({ userId, status: 'Pending' });
    const approved = await Expense.countDocuments({ userId, status: 'Approved' });
    const rejected = await Expense.countDocuments({ userId, status: 'Rejected' });

    res.json({ total, pending, approved, rejected });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

// ✅ Get recent employee expenses
router.get('/expenses', async (req, res) => {
  const userId = req.user._id;

  try {
    const expenses = await Expense.find({ userId })
      .sort({ date: -1 }) // most recent first
      .limit(10);

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching expenses' });
  }
});

module.exports = router; 