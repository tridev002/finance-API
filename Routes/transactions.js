const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('./auth');

// Protect all routes under /transactions with authentication
router.use(authenticateToken);


// Add a new transaction
router.post('/', (req, res) => {
    const { type, category, amount, date, description } = req.body;
    if (!type || !category || !amount || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const query = `INSERT INTO transactions (type, category, amount, date, description) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [type, category, amount, date, description], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Get all transactions
router.get('/', (req, res) => {
    const query = `SELECT * FROM transactions`;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get a transaction by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const query = `SELECT * FROM transactions WHERE id = ?`;
    db.get(query, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Transaction not found' });
        res.json(row);
    });
});

// Update a transaction by ID
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { type, category, amount, date, description } = req.body;
    const query = `UPDATE transactions SET type = ?, category = ?, amount = ?, date = ?, description = ? WHERE id = ?`;
    db.run(query, [type, category, amount, date, description, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Transaction not found' });
        res.json({ message: 'Transaction updated' });
    });
});

// Delete a transaction by ID
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM transactions WHERE id = ?`;
    db.run(query, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Transaction not found' });
        res.json({ message: 'Transaction deleted' });
    });
});

// Add a new transaction
router.post('/', (req, res) => {
    const { type, category, amount, date, description } = req.body;
    const userId = req.user.userId;  // Add userId from the JWT token

    const query = `INSERT INTO transactions (type, category, amount, date, description, user_id) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [type, category, amount, date, description, userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Get all transactions for the authenticated user
router.get('/', (req, res) => {
    const userId = req.user.userId;

    const query = `SELECT * FROM transactions WHERE user_id = ?`;
    db.all(query, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get a summary of transactions
router.get('/summary', (req, res) => {
    const userId = req.user.userId;
    const { startDate, endDate, category } = req.query;

    let query = `SELECT 
                    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
                    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses
                 FROM transactions WHERE user_id = ?`;
    const params = [userId];

    if (startDate && endDate) {
        query += ` AND date BETWEEN ? AND ?`;
        params.push(startDate, endDate);
    }

    if (category) {
        query += ` AND category = ?`;
        params.push(category);
    }

    db.get(query, params, (err, summary) => {
        if (err) return res.status(500).json({ error: err.message });
        const balance = summary.total_income - summary.total_expenses;
        res.json({ ...summary, balance });
    });
});

router.get('/reports/monthly', (req, res) => {
    const userId = req.user.userId;
    const { month, year } = req.query;

    const query = `
        SELECT categories.name, SUM(transactions.amount) AS total
        FROM transactions
        INNER JOIN categories ON transactions.category = categories.id
        WHERE transactions.user_id = ? AND strftime('%m', transactions.date) = ? AND strftime('%Y', transactions.date) = ?
        GROUP BY transactions.category;
    `;
    db.all(query, [userId, month, year], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});



module.exports = router;
