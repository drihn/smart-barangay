// create_database.js
const mysql = require('mysql2');

console.log('🚀 CREATING SMART BARANGAY DATABASE');
console.log('='.repeat(60));

// CORRECT PASSWORD
const mysqlUrl = 'mysql://root:rXyORFyQitdNyUdebCegvImGWJcPfBhD@gondola.proxy.rlwy.net:51241/railway';

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
    connectTimeout: 10000
  });
  
  connection.connect((err) => {
    if (err) {
      console.log('❌ Connection failed:', err.message);
      return;
    }
    
    console.log('✅ Connected to Railway MySQL!');
    
    // Create users table
    const sql = `
      -- Drop if exists
      DROP TABLE IF EXISTS users;
      
      -- Create users table
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'citizen') DEFAULT 'citizen',
        status ENUM('pending', 'approve', 'reject') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
      
      -- Insert sample data
      INSERT INTO users (first_name, email, password, role, status) VALUES
      ('Admin User', 'admin@barangay.com', 'admin123', 'admin', 'approve'),
      ('Juan Dela Cruz', 'juan@email.com', 'citizen123', 'citizen', 'approve'),
      ('Maria Santos', 'maria@email.com', 'maria123', 'citizen', 'approve'),
      ('Pedro Reyes', 'pedro@email.com', 'pedro123', 'citizen', 'pending'),
      ('Ana Lopez', 'ana@email.com', 'ana123', 'citizen', 'reject');
    `;
    
    console.log('📊 Creating database structure...');
    
    connection.query(sql, (err, results) => {
      if (err) {
        console.log('❌ Database creation failed:', err.message);
      } else {
        console.log('✅ Database created successfully!');
        
        // Verify data
        connection.query('SELECT * FROM users', (selectErr, users) => {
          if (selectErr) {
            console.log('⚠️ Cannot fetch users:', selectErr.message);
          } else {
            console.log(`\n📋 Created ${users.length} users:`);
            console.log('   ID  Name              Email                     Role     Status');
            console.log('   --- ----------------- ------------------------ -------- ---------');
            users.forEach(user => {
              console.log(`   ${user.id.toString().padEnd(3)} ${user.first_name.padEnd(17)} ${user.email.padEnd(24)} ${user.role.padEnd(8)} ${user.status}`);
            });
          }
          
          console.log('\n' + '='.repeat(60));
          console.log('🎉 DATABASE READY FOR DEPLOYMENT!');
          console.log('='.repeat(60));
          console.log('\n💡 Next steps:');
          console.log('   1. Update MYSQL_URL in backend service');
          console.log('   2. Deploy your updated server.js');
          console.log('   3. Test at: https://smart-barangay-production.up.railway.app/');
          
          connection.end();
        });
      }
    });
  });
  
} catch (error) {
  console.log('❌ Error:', error.message);
}