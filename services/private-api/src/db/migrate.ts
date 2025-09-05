import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db } from './index';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  console.log('🔄 Running migrations...');
  
  try {
    await migrate(db, { 
      migrationsFolder: `${__dirname}/migrations` 
    });
    
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();