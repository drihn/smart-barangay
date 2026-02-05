const mysql = require('mysql2');

console.log('🚀 Creating Smart Barangay Database');
console.log('='.repeat(60));

// CORRECT PASSWORD - with capital I
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
    
    // Execute statements ONE BY ONE
    const statements = [
      // 1. Drop table if exists
      'DROP TABLE IF EXISTS users',
      
      // 2. Create users table
      `CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'citizen') DEFAULT 'citizen',
        status ENUM('pending', 'approve', 'reject') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      // 3. Insert sample data
      `INSERT INTO users (first_name, email, password, role, status) VALUES
      ('Admin User', 'admin@barangay.com', 'admin123', 'admin', 'approve'),
      ('Juan Dela Cruz', 'juan@email.com', 'citizen123', 'citizen', 'approve'),
      ('Maria Santos', 'maria@email.com', 'maria123', 'citizen', 'approve'),
      ('Pedro Reyes', 'pedro@email.com', 'pedro123', 'citizen', 'pending'),
      ('Ana Lopez', 'ana@email.com', 'ana123', 'citizen', 'reject')`
    ];
    
    let currentStep = 0;
    
    function executeNextStatement() {
      if (currentStep >= statements.length) {
        console.log('✅ All statements executed!');
        verifyData();
        return;
      }
      
      console.log(`📝 Executing step ${currentStep + 1}/${statements.length}...`);
      connection.query(statements[currentStep], (err, result) => {
        if (err) {
          console.log(`❌ Step ${currentStep + 1} failed:`, err.message);
          console.log('SQL:', statements[currentStep].substring(0, 100) + '...');
        } else {
          console.log(`✅ Step ${currentStep + 1} successful`);
          currentStep++;
          executeNextStatement();
        }
      });
    }
    
    executeNextStatement();
    
    function verifyData() {
      console.log('\n📊 Verifying database...');
      
      connection.query('SELECT COUNT(*) as count FROM users', (err, result) => {
        if (err) {
          console.log('⚠️ Cannot count users:', err.message);
        } else {
          console.log(`✅ Total users: ${result[0].count}`);
          
          connection.query('SELECT * FROM users', (selectErr, users) => {
            if (selectErr) {
              console.log('⚠️ Cannot fetch users:', selectErr.message);
            } else {
              console.log('\n📋 Users in database:');
              console.log('   ID  Name              Email                     Role     Status');
              console.log('   --- ----------------- ------------------------ -------- ---------');
              users.forEach(user => {
                console.log(`   ${user.id.toString().padEnd(3)} ${user.first_name.padEnd(17)} ${user.email.padEnd(24)} ${user.role.padEnd(8)} ${user.status}`);
              });
            }
            
            console.log('\n' + '='.repeat(60));
            console.log('🎉 DATABASE CREATION COMPLETE!');
            console.log('='.repeat(60));
            
            // Get connection URL for backend
            console.log('\n💡 Add this to your backend service MYSQL_URL:');
            console.log(`   ${mysqlUrl}`);
            
            connection.end();
          });
        }
      });
    }
  });
  
} catch (error) {
  console.log('❌ Error:', error.message);
}