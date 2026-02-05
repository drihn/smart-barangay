// server.js - CORRECT BACKEND SERVER
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();

// CORS
app.use(cors({
  origin: ['https://smart-barangay.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

/* ========== DATABASE CONNECTION ========== */
console.log('🚀 Smart Barangay Backend Starting...');

let db;

try {
  const mysqlUrl = process.env.MYSQL_URL;
  
  if (!mysqlUrl) {
    console.log('❌ MYSQL_URL not found in environment');
    process.exit(1);
  }
  
  console.log('✅ Using MYSQL_URL from Railway');
  
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
      console.log('✅ Connected to Railway MySQL Database!');
      connection.query('SELECT COUNT(*) as count FROM users', (queryErr, result) => {
        if (!queryErr) {
          console.log(`📊 Total users in database: ${result[0].count}`);
        }
        connection.release();
      });
    }
  });
  
} catch (error) {
  console.error('🔥 Database setup error:', error.message);
}

/* ========== ROUTES ========== */

// Home
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✅ Smart Barangay Backend is LIVE!',
    database: db ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const [result] = await db.promise().query('SELECT 1 as test');
    const [users] = await db.promise().query('SELECT COUNT(*) as count FROM users');
    
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      test: result[0].test,
      totalUsers: users[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Test database
app.get('/api/test', async (req, res) => {
  try {
    const [users] = await db.promise().query(
      'SELECT id, first_name, email, role, status FROM users ORDER BY id DESC'
    );
    
    res.json({
      success: true,
      totalUsers: users.length,
      users: users,
      message: 'Database connection successful'
    });
  } catch (err) {
    console.error('❌ Database test error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Citizen login (existing)
app.post("/citizen-login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const [users] = await db.promise().query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0)
      return res.status(401).json({ success: false, error: "Email not found" });

    const user = users[0];

    if (user.password !== password)
      return res.status(401).json({ success: false, error: "Incorrect password" });

    if (user.status !== 'approve')
      return res.status(401).json({ success: false, error: `Account not approved. Status: ${user.status}` });

    res.json({
      success: true,
      message: "Login successful",
      citizen: {
        id: user.id,
        first_name: user.first_name,
        email: user.email,
        role: user.role || "citizen"
      }
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ========== ADMIN ENDPOINTS ==========

// Get pending users
app.get('/api/pending-users', async (req, res) => {
  console.log('📥 Fetching pending users...');
  
  try {
    const [rows] = await db.promise().query(
      `SELECT id, first_name, email, status, created_at
       FROM users 
       WHERE status = 'pending'
       ORDER BY id DESC`
    );

    console.log(`✅ Found ${rows.length} pending users`);
    res.json({ 
      success: true, 
      users: rows, 
      count: rows.length 
    });
  } catch (error) {
    console.error('❌ Error fetching pending users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch pending users' 
    });
  }
});

// Approve user
app.post('/api/approve-user', async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      error: 'User ID is required' 
    });
  }
  
  try {
    const [check] = await db.promise().query(
      'SELECT id, first_name, email, status FROM users WHERE id = ?',
      [userId]
    );
    
    if (check.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: `User ID ${userId} not found` 
      });
    }
    
    const [result] = await db.promise().query(
      'UPDATE users SET status = "approve" WHERE id = ?',
      [userId]
    );
    
    const [updated] = await db.promise().query(
      'SELECT id, first_name, email, status FROM users WHERE id = ?',
      [userId]
    );
    
    res.json({ 
      success: true, 
      message: 'User approved successfully',
      affectedRows: result.affectedRows,
      user: updated[0]
    });
    
  } catch (error) {
    console.error(`❌ Error approving user ${userId}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to approve user',
      details: error.message
    });
  }
});

// Reject user
app.post('/api/reject-user', async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      error: 'User ID is required' 
    });
  }
  
  try {
    const [check] = await db.promise().query(
      'SELECT id, first_name, email, status FROM users WHERE id = ?',
      [userId]
    );
    
    if (check.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: `User ID ${userId} not found` 
      });
    }
    
    const [result] = await db.promise().query(
      'UPDATE users SET status = "reject" WHERE id = ?',
      [userId]
    );
    
    const [updated] = await db.promise().query(
      'SELECT id, first_name, email, status FROM users WHERE id = ?',
      [userId]
    );
    
    res.json({ 
      success: true, 
      message: 'User rejected successfully',
      affectedRows: result.affectedRows,
      user: updated[0]
    });
    
  } catch (error) {
    console.error(`❌ Error rejecting user ${userId}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reject user',
      details: error.message
    });
  }
});

/* ========== START SERVER ========== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 BACKEND SERVER STARTED ON PORT ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🌐 Railway: https://smart-barangay-production.up.railway.app`);
  console.log('='.repeat(60));
  console.log('\n📡 Available endpoints:');
  console.log(`   GET  /         - Server status`);
  console.log(`   GET  /health   - Health check`);
  console.log(`   GET  /api/test - Test database`);
  console.log(`   POST /citizen-login - User login`);
  console.log('='.repeat(60));
});