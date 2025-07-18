const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// Show all expenses for the logged-in user
router.get('/', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  try {
    const expenses = await Expense.find({ user: req.session.userId });
    res.render('expenses', { expenses, error: null });
  } catch (err) {
    res.render('expenses', { expenses: [], error: 'Failed to load expenses.' });
  }
});
// Add a new expense
router.post('/add', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const { date, category, amount, description } = req.body;
  try {
    await Expense.create({
      userId: req.session.userId,
      date,
      category,
      amount: Number(amount),
      description
    });
    res.redirect('/employee/dashboard');
  } catch (err) {
    const expenses = await Expense.find({ userId: req.session.userId });
    res.render('expenses', { expenses, error: 'Failed to add expense.' });
  }
});

// Manager: Get all expenses (for dashboard)
router.get('/all', async (req, res) => {
  // Optionally, check if user is manager
  try {
    const expenses = await Expense.find({})
      .populate('userId', 'username email')
      .sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch all expenses.' });
  }
});

// Manager: Approve an expense
router.post('/:id/approve', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { status: 'Approved' },
      { new: true }
    );
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve expense.' });
  }
});

// Manager: Reject an expense
router.post('/:id/reject', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { status: 'Rejected' },
      { new: true }
    );
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject expense.' });
  }
});

module.exports = router;