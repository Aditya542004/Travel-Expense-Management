const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// ✅ Get employee expense stats
router.get('/stats', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

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
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const expenses = await Expense.find({ userId })
      .sort({ date: -1 })
      .limit(10);

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching expenses' });
  }
});

module.exports = router; 