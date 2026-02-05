require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();

// CORS - simple muna
app.use(cors({
  origin: '*',  // Allow all muna for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

/* ========== DATABASE CONNECTION ========== */
console.log('🚀 Starting Smart Barangay Backend...');

let db;

try {
  // Sa Railway, automatic may MYSQL_URL
  // Sa local, gagamit tayo ng .env file
  const mysqlUrl = process.env.MYSQL_URL;
  
  if (mysqlUrl) {
    console.log('📡 Connecting to Railway MySQL...');
    // For Railway
    const url = new URL(mysqlUrl);
    db = mysql.createPool({
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.replace('/', ''),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: { rejectUnauthorized: false }
    });
    console.log('✅ Configured for Railway');
  } else {
    console.log('💻 Connecting to Local MySQL...');
    // For local development
    db = mysql.createPool({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'Barangay123!',
      database: 'smart_barangay',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('✅ Configured for Local');
  }
  
  // Test connection
  db.getConnection((err, connection) => {
    if (err) {
      console.log('❌ Database Connection Failed:');
      console.log('   Error:', err.message);
    } else {
      console.log('✅ Connected to MySQL successfully!');
      connection.release();
    }
  });
  
} catch (error) {
  console.error('🔥 Database error:', error.message);
}

/* ========== ROUTES ========== */

// Basic test route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Barangay Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    const [result] = await db.promise().query('SELECT 1 + 1 AS test');
    res.json({
      success: true,
      message: 'Database is working',
      test: result[0].test
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check users table
app.get('/users', async (req, res) => {
  try {
    const [users] = await db.promise().query('SELECT * FROM users LIMIT 10');
    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple login (temporary)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const [users] = await db.promise().query(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    const user = users[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.first_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple signup (temporary)
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    const [result] = await db.promise().query(
      'INSERT INTO users (first_name, email, password, role, status) VALUES (?, ?, ?, "citizen", "pending")',
      [name, email, password]
    );
    
    res.json({
      success: true,
      message: 'Registration successful - pending approval',
      userId: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/* ========== START SERVER ========== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🌐 Railway: https://smart-barangay-production.up.railway.app`);
  console.log('\n📡 Available endpoints:');
  console.log(`   GET  /        - Server status`);
  console.log(`   GET  /test-db - Test database`);
  console.log(`   GET  /users   - List users`);
  console.log(`   POST /login   - User login`);
  console.log(`   POST /signup  - User registration`);
  console.log('='.repeat(50));
});