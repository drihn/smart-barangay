const mysql = require('mysql2');
const fs = require('fs');

console.log('🔧 Testing with CORRECT password...');

// CORRECT MYSQL_URL
const mysqlUrl = 'mysql://root:rXyORFyQitdNyUdebCegvlmGWJcPfBhD@gondola.proxy.rlwy.net:51241/railway';

console.log('🔗 Using:', mysqlUrl.replace(/:[^:]*@/, ':****@'));

try {
  const url = new URL(mysqlUrl);
  
  const connection = mysql.createConnection({
    host: url.hostname,
    port: url.port || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'railway',
    ssl: { rejectUnauthorized: false },
    connectTimeout: 15000
  });
  
  console.log('📋 Connection details:');
  console.log(`   Host: ${url.hostname}`);
  console.log(`   Port: ${url.port}`);
  console.log(`   User: ${url.username}`);
  console.log(`   Database: ${url.pathname.replace('/', '')}`);
  console.log(`   Password length: ${url.password.length} characters`);
  
  connection.connect((err) => {
    if (err) {
      console.log('❌ Connection failed:', err.message);
      console.log('💡 Double check the password!');
      console.log('💡 Expected: rXyORFyQitdNyUdebCegvlmGWJcPfBhD');
      console.log('💡 Check for: l vs I, G vs g, D vs d');
    } else {
      console.log('✅ CONNECTED SUCCESSFULLY!');
      
      // Test query
      connection.query('SELECT 1 as test, DATABASE() as db, USER() as user', (queryErr, results) => {
        if (queryErr) {
          console.log('⚠️ Query failed:', queryErr.message);
        } else {
          console.log('✅ Query successful!');
          console.log(`   Test: ${results[0].test}`);
          console.log(`   Database: ${results[0].db}`);
          console.log(`   User: ${results[0].user}`);
          
          // Create users table
          createUsersTable();
        }
      });
    }
  });
  
  function createUsersTable() {
    console.log('\n📊 Creating users table...');
    
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'citizen') DEFAULT 'citizen',
        status ENUM('pending', 'approve', 'reject') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
      
      INSERT IGNORE INTO users (first_name, email, password, role, status) VALUES
      ('Admin User', 'admin@barangay.com', 'admin123', 'admin', 'approve'),
      ('Juan Dela Cruz', 'juan@email.com', 'citizen123', 'citizen', 'approve'),
      ('Maria Santos', 'maria@email.com', 'maria123', 'citizen', 'approve');
    `;
    
    connection.query(sql, (err, results) => {
      if (err) {
        console.log('❌ Table creation failed:', err.message);
      } else {
        console.log('✅ Users table created!');
        
        // Check data
        connection.query('SELECT COUNT(*) as count FROM users', (countErr, countResult) => {
          if (countErr) {
            console.log('⚠️ Cannot count users:', countErr.message);
          } else {
            console.log(`📊 Total users: ${countResult[0].count}`);
            
            // Show users
            connection.query('SELECT * FROM users', (selectErr, users) => {
              if (!selectErr) {
                console.log('\n📋 Users in database:');
                users.forEach(user => {
                  console.log(`   ${user.id}. ${user.first_name} - ${user.email} (${user.status})`);
                });
              }
              connection.end();
              console.log('\n🎉 DATABASE SETUP COMPLETE!');
            });
          }
        });
      }
    });
  }
  
} catch (error) {
  console.log('❌ Error:', error.message);
}