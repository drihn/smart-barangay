const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

// 1. SIMPLE DATABASE CONNECTION
const db = mysql.createPool({
  host: "mysql.railway.internal",
  user: "root",
  password: "mysql://root:rXyORFyQitdNyUdebCegvImGWJcPfBhD@mysql.railway.internal:3306/railway",
  database: "railway",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 2. CREATE TABLE ON STARTUP
db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100),
    email VARCHAR(100),
    password VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    role VARCHAR(20) DEFAULT 'citizen',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.log("TABLE ERROR:", err.message);
  } else {
    console.log("✅ TABLE READY");
    
    // CREATE ADMIN IF NOT EXISTS
    db.query(`
      INSERT IGNORE INTO users 
      (first_name, email, password, role, status) 
      VALUES ('Admin', 'admin@barangay.com', 'admin123', 'admin', 'approve')
    `, (err) => {
      if (err) console.log("ADMIN ERROR:", err.message);
      else console.log("✅ ADMIN READY: admin@barangay.com / admin123");
    });
  }
});

// 3. HEALTH CHECK
app.get('/health', (req, res) => {
  db.query('SELECT 1 as test', (err, results) => {
    if (err) {
      res.json({ success: false, error: err.message });
    } else {
      res.json({ success: true, database: 'connected' });
    }
  });
});

// 4. ADMIN LOGIN
app.post('/admin-login', (req, res) => {
  const { email, password } = req.body;
  
  db.query(
    "SELECT * FROM users WHERE email = ? AND password = ? AND role = 'admin'",
    [email, password],
    (err, results) => {
      if (err) {
        res.json({ success: false, error: 'Server error' });
      } else if (results.length === 0) {
        res.json({ success: false, error: 'Invalid credentials' });
      } else {
        res.json({ 
          success: true, 
          message: 'Login successful',
          user: results[0]
        });
      }
    }
  );
});

// 5. CITIZEN REGISTRATION
app.post('/signup', (req, res) => {
  const { full_name, email, password } = req.body;
  
  db.query(
    "INSERT INTO users (first_name, email, password) VALUES (?, ?, ?)",
    [full_name, email, password],
    (err, results) => {
      if (err) {
        res.json({ success: false, error: 'Registration failed' });
      } else {
        res.json({ 
          success: true, 
          message: 'Registration successful',
          userId: results.insertId
        });
      }
    }
  );
});

// 6. CITIZEN LOGIN
app.post('/citizen-login', (req, res) => {
  const { email, password } = req.body;
  
  db.query(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, results) => {
      if (err) {
        res.json({ success: false, error: 'Server error' });
      } else if (results.length === 0) {
        res.json({ success: false, error: 'Invalid credentials' });
      } else {
        res.json({ 
          success: true, 
          message: 'Login successful',
          user: results[0]
        });
      }
    }
  );
});

// 7. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
});

// 8. HANDLE SHUTDOWN
process.on('SIGTERM', () => {
  db.end();
  process.exit(0);
});