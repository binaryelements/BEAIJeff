// Script to add new fields to contacts table
import { db } from './index';
import { sql } from 'drizzle-orm';

console.log('Adding new fields to contacts table...');

try {
  // Check if columns already exist
  const checkColumn = async (columnName: string) => {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
      AND table_name = 'contacts' 
      AND column_name = ${columnName}
    `);
    return (result[0] as any)[0].count > 0;
  };

  // Add is_internal column if it doesn't exist
  if (!(await checkColumn('is_internal'))) {
    await db.execute(sql`
      ALTER TABLE contacts 
      ADD COLUMN is_internal BOOLEAN DEFAULT FALSE
    `);
    console.log('✓ Added is_internal column');
  } else {
    console.log('- is_internal column already exists');
  }

  // Add can_be_contacted_by_ai column if it doesn't exist
  if (!(await checkColumn('can_be_contacted_by_ai'))) {
    await db.execute(sql`
      ALTER TABLE contacts 
      ADD COLUMN can_be_contacted_by_ai BOOLEAN DEFAULT FALSE
    `);
    console.log('✓ Added can_be_contacted_by_ai column');
  } else {
    console.log('- can_be_contacted_by_ai column already exists');
  }

  // Add direct_extension column if it doesn't exist
  if (!(await checkColumn('direct_extension'))) {
    await db.execute(sql`
      ALTER TABLE contacts 
      ADD COLUMN direct_extension VARCHAR(20)
    `);
    console.log('✓ Added direct_extension column');
  } else {
    console.log('- direct_extension column already exists');
  }

  console.log('\n✅ Database schema updated successfully');
  
  // Update some sample contacts to be internal and AI-contactable
  console.log('\nUpdating sample contacts for testing...');
  
  await db.execute(sql`
    UPDATE contacts 
    SET is_internal = TRUE, 
        can_be_contacted_by_ai = TRUE,
        direct_extension = '101'
    WHERE name IN ('John Smith', 'Sarah Johnson')
    LIMIT 2
  `);
  
  await db.execute(sql`
    UPDATE contacts 
    SET is_internal = TRUE, 
        can_be_contacted_by_ai = FALSE,
        direct_extension = '102'
    WHERE name = 'Michael Brown'
    LIMIT 1
  `);
  
  console.log('✓ Updated sample contacts with internal/AI settings');
  
} catch (error) {
  console.error('Error updating schema:', error);
  process.exit(1);
}

process.exit(0);