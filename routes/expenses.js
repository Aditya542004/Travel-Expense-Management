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
      user: req.session.userId,
      date,
      category,
      amount,
      description
    });
    res.redirect('/expenses');
  } catch (err) {
    const expenses = await Expense.find({ user: req.session.userId });
    res.render('expenses', { expenses, error: 'Failed to add expense.' });
  }
});

module.exports = router;