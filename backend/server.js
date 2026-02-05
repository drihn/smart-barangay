const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors({
  origin: [
    'https://smart-barangay.vercel.app',  // DITO: palitan ng aktwal na Vercel domain mo
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

/* ================== RAILWAY MYSQL CONNECTION ================== */
let db;

try {
  // Use Railway's MYSQL_URL or fallback to local for development
  const mysqlUrl = process.env.MYSQL_URL || "mysql://root:Barangay123!@localhost:3306/smart_barangay";
  
  console.log("🔧 Initializing MySQL connection...");
  
  // Parse the MySQL URL
  const url = new URL(mysqlUrl);
  const dbConfig = {
    host: url.hostname,
    port: url.port || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: false } // Required for Railway
  };
  
  console.log("📋 Database Configuration:");
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  
  db = mysql.createPool(dbConfig);
  
  // Test connection
  db.getConnection((err, conn) => {
    if (err) {
      console.log("❌ MySQL Connection Failed:", err.message);
      console.log("❌ Error code:", err.code);
    } else {
      console.log("✅ Connected to MySQL database successfully!");
      conn.release();
    }
  });
  
} catch (error) {
  console.error("🔥 Database initialization error:", error.message);
  process.exit(1);
}

/* ================== ROUTES ================== */

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✅ Smart Barangay Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const [result] = await db.promise().query('SELECT 1 + 1 AS test');
    res.json({
      success: true,
      database: 'connected',
      testResult: result[0].test,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      database: 'disconnected',
      error: error.message
    });
  }
});

// Debug database
app.get('/api/debug-db', async (req, res) => {
  try {
    const [test] = await db.promise().query('SELECT 1 as test');
    const [users] = await db.promise().query(
      'SELECT id, first_name, email, status FROM users ORDER BY id DESC'
    );
    
    res.json({
      success: true,
      dbConnected: true,
      testResult: test[0].test,
      totalUsers: users.length,
      users: users,
      message: 'Database connection successful'
    });
  } catch (err) {
    console.error('❌ Database debug error:', err);
    res.status(500).json({
      success: false,
      dbConnected: false,
      error: err.message
    });
  }
});

// Check table structure
app.get('/api/check-table', async (req, res) => {
  try {
    const [structure] = await db.promise().query('DESCRIBE users');
    const [statusValues] = await db.promise().query(
      'SELECT DISTINCT status, COUNT(*) as count FROM users GROUP BY status'
    );
    
    res.json({
      success: true,
      tableStructure: structure,
      statusValues: statusValues,
      message: 'Table check successful'
    });
  } catch (err) {
    console.error('❌ Table check error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Citizen login
app.post("/citizen-login", async (req, res) => {
  const { email, password } = req.body;
  console.log("🔐 Login attempt:", email);

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

// Signup
app.post("/signup", async (req, res) => {
  const { full_name, email, password } = req.body;

  try {
    const sql = `INSERT INTO users (first_name, email, password, status, role)
                 VALUES (?, ?, ?, 'pending', 'citizen')`;

    const [result] = await db.promise().query(sql, [full_name, email, password]);

    res.json({
      success: true,
      message: "Registration successful - pending approval",
      userId: result.insertId
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ success: false, error: "Email already exists" });

    console.error("❌ Registration error:", err);
    res.status(500).json({ success: false, error: "Registration failed" });
  }
});

// Admin login
app.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.promise().query(
      "SELECT * FROM users WHERE email = ? AND role = 'admin'",
      [email]
    );

    if (users.length === 0)
      return res.status(401).json({ success: false, error: "Admin not found" });

    const user = users[0];

    if (user.password !== password)
      return res.status(401).json({ success: false, error: "Incorrect password" });

    res.json({
      success: true,
      message: "Admin login successful",
      admin: {
        id: user.id,
        first_name: user.first_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("❌ Admin login error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Get pending users
app.get('/api/pending-users', async (req, res) => {
  console.log("📥 Fetching pending users...");
  
  try {
    const [rows] = await db.promise().query(
      `SELECT id, first_name, email, status, created_at
       FROM users 
       WHERE status = 'pending'
       ORDER BY id DESC`
    );

    console.log(`✅ Found ${rows.length} pending users`);
    res.json({ success: true, users: rows, count: rows.length });
  } catch (error) {
    console.error('❌ Error fetching pending users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending users' });
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

// Update status
app.post('/api/update-status', async (req, res) => {
  const { userId, newStatus } = req.body;
  
  try {
    const [result] = await db.promise().query(
      'UPDATE users SET status = ? WHERE id = ?',
      [newStatus, userId]
    );
    
    res.json({ 
      success: true, 
      message: `User ${userId} updated to ${newStatus}`,
      affectedRows: result.affectedRows
    });
    
  } catch (error) {
    console.error('❌ Update status error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test SQL
app.post('/api/test-sql', async (req, res) => {
  const { sql, params } = req.body;
  
  try {
    const [result] = await db.promise().query(sql, params || []);
    
    res.json({ 
      success: true, 
      result: result,
      message: 'SQL executed successfully'
    });
    
  } catch (error) {
    console.error('❌ SQL Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

/* ================== START SERVER ================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 BACKEND SERVER STARTED SUCCESSFULLY!');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Public URL: https://smart-barangay-production.up.railway.app`);
  console.log('='.repeat(60));
  console.log('\n📋 AVAILABLE ENDPOINTS:');
  console.log(`1. GET  http://localhost:${PORT}/`);
  console.log(`2. GET  http://localhost:${PORT}/health`);
  console.log(`3. GET  http://localhost:${PORT}/api/debug-db`);
  console.log(`4. GET  http://localhost:${PORT}/api/check-table`);
  console.log(`5. GET  http://localhost:${PORT}/api/pending-users`);
  console.log(`6. POST http://localhost:${PORT}/citizen-login`);
  console.log(`7. POST http://localhost:${PORT}/signup`);
  console.log(`8. POST http://localhost:${PORT}/admin-login`);
  console.log('='.repeat(60));
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down server...');
  if (db) db.end();
  process.exit(0);
});