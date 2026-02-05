const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('📤 SMART BARANGAY DATABASE IMPORT TOOL');
console.log('='.repeat(60));

// Your Railway MySQL URL
const mysqlUrl = 'mysql://root:rXyORFyQitdNyUdebCegvlmGWJcPfBhD@gondola.proxy.rlwy.net:51241/railway';

console.log('🔗 Using MySQL URL:', mysqlUrl.replace(/:[^:]*@/, ':****@'));

// FILE NAMES TO CHECK (try different possibilities)
const possibleFiles = [
  'smart_barangay_users.sql',  // Your actual file
  'backup.sql',
  'smart_barangay.sql',
  'export.sql'
];

try {
  const url = new URL(mysqlUrl);
  
  // Create connection
  const connection = mysql.createConnection({
    host: url.hostname,
    port: url.port || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'railway',
    ssl: { rejectUnauthorized: false },
    multipleStatements: true,
    connectTimeout: 30000
  });

  // Find the backup file
  let backupFile = null;
  for (const fileName of possibleFiles) {
    const filePath = path.join(__dirname, fileName);
    if (fs.existsSync(filePath)) {
      backupFile = filePath;
      console.log(`✅ Found backup file: ${fileName}`);
      break;
    }
  }

  if (!backupFile) {
    console.log('❌ No backup file found!');
    console.log('💡 Looking for files:');
    possibleFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
    console.log('\n💡 Please export your database from MySQL Workbench first.');
    console.log('💡 Save it in this folder:', __dirname);
    process.exit(1);
  }

  console.log('🔗 Connecting to Railway MySQL...');

  connection.connect((err) => {
    if (err) {
      console.log('❌ Connection failed:', err.message);
      console.log('💡 Troubleshooting:');
      console.log('   1. Check if password is correct');
      console.log('   2. Check if Railway MySQL is running');
      return;
    }
    
    console.log('✅ Connected to Railway!');
    
    // Check current tables
    connection.query('SHOW TABLES', (showErr, tables) => {
      if (showErr) {
        console.log('⚠️ Cannot check existing tables:', showErr.message);
        proceedWithImport();
      } else if (tables.length > 0) {
        console.log(`📋 Found ${tables.length} existing table(s):`);
        tables.forEach(table => {
          const tableName = Object.values(table)[0];
          console.log(`   - ${tableName}`);
        });
        
        // Ask user what to do
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        console.log('\n❓ What do you want to do?');
        console.log('   1. Clear existing tables and import fresh');
        console.log('   2. Skip import (keep existing data)');
        console.log('   3. Just add sample data');
        
        readline.question('Choose (1/2/3): ', (answer) => {
          if (answer === '1') {
            console.log('🗑️ Clearing existing tables...');
            connection.query('DROP TABLE IF EXISTS users', (dropErr) => {
              if (dropErr) console.log('Drop error:', dropErr.message);
              proceedWithImport();
            });
          } else if (answer === '3') {
            addSampleData();
          } else {
            console.log('❌ Import skipped.');
            connection.end();
          }
          readline.close();
        });
      } else {
        console.log('📭 Database is empty. Proceeding with import...');
        proceedWithImport();
      }
    });
    
    function proceedWithImport() {
      console.log('📖 Reading backup file...');
      const sql = fs.readFileSync(backupFile, 'utf8');
      
      // Fix common export issues
      let fixedSql = sql
        .replace(/`smart_barangay`\.`/g, '`')  // Remove database prefix
        .replace(/ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci/g, '')
        .replace(/CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci/g, '');
      
      console.log('📤 Importing data... (Please wait)');
      
      // Split into individual statements if needed
      const statements = fixedSql.split(';').filter(stmt => stmt.trim());
      
      let currentStatement = 0;
      
      function executeNextStatement() {
        if (currentStatement >= statements.length) {
          console.log('✅ All statements executed!');
          verifyData();
          return;
        }
        
        const stmt = statements[currentStatement] + ';';
        currentStatement++;
        
        if (currentStatement % 5 === 0) {
          console.log(`   Processing statement ${currentStatement}/${statements.length}...`);
        }
        
        connection.query(stmt, (err) => {
          if (err) {
            console.log(`⚠️ Error in statement ${currentStatement}:`, err.message);
            console.log('   Statement:', stmt.substring(0, 100) + '...');
          }
          executeNextStatement();
        });
      }
      
      executeNextStatement();
    }
    
    function addSampleData() {
      console.log('➕ Adding sample data...');
      
      const sampleSQL = `
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
        ('Maria Santos', 'maria@email.com', 'maria123', 'citizen', 'approve'),
        ('Test Pending', 'pending@test.com', 'test123', 'citizen', 'pending');
      `;
      
      connection.query(sampleSQL, (err) => {
        if (err) {
          console.log('❌ Error creating sample data:', err.message);
        } else {
          console.log('✅ Sample data added!');
          verifyData();
        }
      });
    }
    
    function verifyData() {
      console.log('📊 Verifying imported data...');
      
      connection.query('SELECT COUNT(*) as count FROM users', (err, result) => {
        if (err) {
          console.log('⚠️ Cannot check users:', err.message);
        } else {
          console.log(`✅ Total users in database: ${result[0].count}`);
          
          // Show some users
          connection.query('SELECT id, first_name, email, role, status FROM users LIMIT 5', (sampleErr, users) => {
            if (!sampleErr && users.length > 0) {
              console.log('\n📋 Sample of imported users:');
              console.log('   ID  Name              Email                     Role     Status');
              console.log('   --- ----------------- ------------------------ -------- ---------');
              users.forEach(user => {
                console.log(`   ${user.id.toString().padEnd(3)} ${user.first_name.padEnd(17)} ${user.email.padEnd(24)} ${user.role.padEnd(8)} ${user.status}`);
              });
            }
            
            console.log('\n' + '='.repeat(60));
            console.log('🎉 DATABASE IMPORT COMPLETE!');
            console.log('='.repeat(60));
            console.log('\n💡 Next steps:');
            console.log('   1. Update your backend service with MYSQL_URL');
            console.log('   2. Deploy your updated server.js');
            console.log('   3. Test at: https://smart-barangay-production.up.railway.app/');
            
            connection.end();
          });
        }
      });
    }
  });
  
} catch (error) {
  console.log('❌ Setup error:', error.message);
}