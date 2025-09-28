const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeThreadsTables() {
    try {
        console.log('🚀 Initializing threads database tables...');
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'alumni_connect',
            multipleStatements: true
        });

        // Read and execute the schema file
        const fs = require('fs');
        const path = require('path');
        const schemaPath = path.join(__dirname, 'database', 'threads_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        await connection.execute(schema);
        
        console.log('✅ Successfully created threads tables:');
        console.log('   - threads (main thread data)');
        console.log('   - thread_likes (like tracking)');
        console.log('   - thread_comments (comment system)');
        console.log('   - thread_shares (share tracking)');
        
        // Verify tables were created
        const [tables] = await connection.execute("SHOW TABLES LIKE 'thread%'");
        console.log(`📊 Found ${tables.length} thread-related tables`);
        
        await connection.end();
        console.log('🎉 Database initialization complete!');
        
    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
        console.error('Make sure your database is running and the .env file is configured correctly.');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    initializeThreadsTables();
}

module.exports = initializeThreadsTables;