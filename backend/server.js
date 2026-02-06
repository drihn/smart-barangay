// server.js - SMART BARANGAY BACKEND (SIMPLIFIED VERSION)
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');

const app = express();

// ⭐⭐⭐ SUPER SIMPLE CORS - ALWAYS ALLOWS EVERYTHING ⭐⭐⭐
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

// ========== DATABASE CONNECTION ==========
console.log('🚀 Starting Smart Barangay Backend...');

let db;

try {
  const mysqlUrl = process.env.MYSQL_URL;
  
  if (!mysqlUrl) {
    console.log('❌ MYSQL_URL not found');
    process.exit(1);
  }
  
  console.log('✅ Using Railway MySQL');
  
  const url = new URL(mysqlUrl);
  db = mysql.createPool({
    host: url.hostname,
    port: url.port || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: false }
  });
  
  // Test connection
  db.getConnection((err, connection) => {
    if (err) {
      console.log('❌ Database Connection Failed:', err.message);
    } else {
      console.log('✅ Connected to MySQL Database!');
      connection.query('SELECT COUNT(*) as count FROM users', (queryErr, result) => {
        if (!queryErr) {
          console.log(`📊 Total users: ${result[0].count}`);
        }
        connection.release();
      });
    }
  });
  
} catch (error) {
  console.error('🔥 Database error:', error.message);
}

// ========== BASIC ENDPOINTS ==========

// Root - Server status
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✅ Smart Barangay Backend is LIVE!',
    database: db ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET  /health',
      'GET  /users',
      'POST /admin-login',
      'POST /citizen-login',
      'POST /signup',
      'GET  /pending',
      'POST /approve/:id',
      'POST /reject/:id'
    ]
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    if (!db) {
      return res.json({ success: false, error: 'Database not connected' });
    }
    
    const [result] = await db.promise().query('SELECT 1 as test');
    const [users] = await db.promise().query('SELECT COUNT(*) as count FROM users');
    
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      users: users[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Get all users
app.get('/users', async (req, res) => {
  try {
    const [users] = await db.promise().query(
      'SELECT id, first_name, email, role, status, created_at FROM users ORDER BY id'
    );
    
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ========== AUTHENTICATION ==========

// Admin login
app.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log('🔐 Admin login:', email);
  
  try {
    const [users] = await db.promise().query(
      "SELECT * FROM users WHERE email = ? AND role = 'admin'",
      [email]
    );
    
    if (users.length === 0) {
      return res.json({ success: false, error: 'Admin not found' });
    }
    
    const user = users[0];
    
    if (user.password !== password) {
      return res.json({ success: false, error: 'Incorrect password' });
    }
    
    res.json({
      success: true,
      message: 'Login successful',
      admin: {
        id: user.id,
        name: user.first_name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Citizen login
app.post('/citizen-login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const [users] = await db.promise().query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    
    if (users.length === 0) {
      return res.json({ success: false, error: 'User not found' });
    }
    
    const user = users[0];
    
    if (user.password !== password) {
      return res.json({ success: false, error: 'Incorrect password' });
    }
    
    if (user.status !== 'approve') {
      return res.json({ success: false, error: `Account ${user.status}` });
    }
    
    res.json({
      success: true,
      message: 'Login successful',
      citizen: {
        id: user.id,
        name: user.first_name,
        email: user.email,
        role: user.role || 'citizen'
      }
    });
    
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// User registration
app.post('/signup', async (req, res) => {
  const { full_name, email, password } = req.body;
  
  console.log('📝 New signup:', email);
  
  try {
    // Check if email exists
    const [existing] = await db.promise().query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    
    if (existing.length > 0) {
      return res.json({ success: false, error: 'Email already exists' });
    }
    
    // Create user
    const [result] = await db.promise().query(
      `INSERT INTO users (first_name, email, password, status, role) 
       VALUES (?, ?, ?, 'pending', 'citizen')`,
      [full_name, email, password]
    );
    
    res.json({
      success: true,
      message: 'Registration successful - pending approval',
      userId: result.insertId
    });
    
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ========== ADMIN FUNCTIONS ==========

// Get pending users
app.get('/pending', async (req, res) => {
  try {
    const [users] = await db.promise().query(
      `SELECT id, first_name, email, status, created_at 
       FROM users WHERE status = 'pending' ORDER BY id DESC`
    );
    
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Approve user
app.post('/approve/:id', async (req, res) => {
  const userId = req.params.id;
  
  try {
    const [result] = await db.promise().query(
      "UPDATE users SET status = 'approve' WHERE id = ?",
      [userId]
    );
    
    if (result.affectedRows === 0) {
      return res.json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User approved' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Reject user
app.post('/reject/:id', async (req, res) => {
  const userId = req.params.id;
  
  try {
    const [result] = await db.promise().query(
      "UPDATE users SET status = 'reject' WHERE id = ?",
      [userId]
    );
    
    if (result.affectedRows === 0) {
      return res.json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User rejected' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Create admin user (for setup)
app.post('/create-admin', async (req, res) => {
  try {
    // Check if admin exists
    const [existing] = await db.promise().query(
      "SELECT * FROM users WHERE email = 'admin@barangay.com'"
    );
    
    if (existing.length > 0) {
      return res.json({
        success: true,
        message: 'Admin already exists',
        admin: existing[0]
      });
    }
    
    // Create admin
    const [result] = await db.promise().query(
      `INSERT INTO users (first_name, email, password, status, role) 
       VALUES (?, ?, ?, 'approve', 'admin')`,
      ['System Admin', 'admin@barangay.com', 'admin123']
    );
    
    res.json({
      success: true,
      message: 'Admin user created',
      credentials: {
        email: 'admin@barangay.com',
        password: 'admin123'
      }
    });
    
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ========== TEST ENDPOINTS ==========

// Test JSON parsing
app.post('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working!',
    yourData: req.body,
    timestamp: new Date().toISOString()
  });
});

// Test database
app.get('/test-db', async (req, res) => {
  try {
    const [users] = await db.promise().query('SELECT * FROM users LIMIT 5');
    res.json({ success: true, users });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ========== ERROR HANDLING ==========

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint ${req.method} ${req.url} not found`
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('🔥 Server Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🌐 Railway: https://smart-barangay-production.up.railway.app`);
  console.log('='.repeat(60));
  console.log('\n📡 ENDPOINTS:');
  console.log('   GET  /              - Server status');
  console.log('   GET  /health        - Health check');
  console.log('   GET  /users         - All users');
  console.log('   POST /admin-login   - Admin login');
  console.log('   POST /citizen-login - Citizen login');
  console.log('   POST /signup        - Register');
  console.log('   GET  /pending       - Pending users');
  console.log('   POST /create-admin  - Create admin');
  console.log('='.repeat(60));
});