require('dotenv').config(); 
const sqlite3 = require('sqlite3').verbose();
const dbFile = process.env.DB_FILE;
const db = new sqlite3.Database(dbFile);

// Create tables if they don't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT CHECK( type IN ('income', 'expense') ) NOT NULL
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT CHECK( type IN ('income', 'expense') ) NOT NULL,
            category INTEGER NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            description TEXT,
            FOREIGN KEY (category) REFERENCES categories(id)
        )
    `);
});

module.exports = db;