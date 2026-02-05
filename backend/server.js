/* ========== SIMPLE RAILWAY DATABASE CONNECTION ========== */
console.log('🚀 Starting Smart Barangay Backend');

let db;

try {
  // SA RAILWAY: Dapat meron na ito sa variables mo
  const mysqlUrl = process.env.MYSQL_URL;
  
  if (!mysqlUrl) {
    console.log('❌ ERROR: MYSQL_URL not found in environment variables');
    console.log('💡 Go to backend service → Variables tab → Add MYSQL_URL');
    process.exit(1);
  }
  
  console.log('✅ Found MYSQL_URL');
  console.log('📡 Connecting to Railway MySQL...');
  
  // Parse the URL
  const url = new URL(mysqlUrl);
  
  console.log('🔗 Connection details:');
  console.log(`   Host: ${url.hostname}`);
  console.log(`   Database: ${url.pathname.replace('/', '')}`);
  console.log(`   User: ${url.username}`);
  
  db = mysql.createPool({
    host: url.hostname,
    port: url.port || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: false }, // IMPORTANTE: Required for Railway
    connectTimeout: 10000
  });
  
  // Test connection
  db.getConnection((err, connection) => {
    if (err) {
      console.log('❌ DATABASE CONNECTION FAILED:');
      console.log('   Error:', err.message);
      console.log('   Code:', err.code);
      
      if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log('   🔑 Password might be wrong in MYSQL_URL');
        console.log('   💡 Check if password in URL is correct');
      }
    } else {
      console.log('✅ SUCCESS! Connected to Railway MySQL');
      console.log('   Thread ID:', connection.threadId);
      
      // Test query
      connection.query('SELECT DATABASE() as db_name', (queryErr, results) => {
        if (queryErr) {
          console.log('⚠️  Query failed:', queryErr.message);
        } else {
          console.log(`✅ Database: ${results[0].db_name}`);
          
          // Check tables
          connection.query('SHOW TABLES', (tableErr, tables) => {
            if (tableErr) {
              console.log('⚠️  Cannot list tables:', tableErr.message);
            } else {
              console.log(`📋 Tables found: ${tables.length}`);
              tables.forEach(table => {
                const tableName = Object.values(table)[0];
                console.log(`   - ${tableName}`);
              });
            }
            connection.release();
          });
        }
      });
    }
  });
  
} catch (error) {
  console.error('🔥 Setup error:', error.message);
  process.exit(1);
}