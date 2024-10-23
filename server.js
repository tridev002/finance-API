require('dotenv').config(); 
const express = require('express');
const bodyParser = require('body-parser');
const transactionRoutes = require('./Routes/transactions');
const app = express();

app.use(bodyParser.json());

const port = process.env.PORT || 3000;


// Transaction routes
app.use('/transactions', transactionRoutes);

// Basic error handling
app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
