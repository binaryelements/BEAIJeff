// Script to rename can_be_contacted_by_ai to allow_call_transfer
import { db } from './index';
import { sql } from 'drizzle-orm';

console.log('Renaming contact field from can_be_contacted_by_ai to allow_call_transfer...');

try {
  // Check if old column exists
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

  // Rename column if old name exists
  if (await checkColumn('can_be_contacted_by_ai')) {
    await db.execute(sql`
      ALTER TABLE contacts 
      CHANGE COLUMN can_be_contacted_by_ai allow_call_transfer BOOLEAN DEFAULT FALSE
    `);
    console.log('✓ Renamed can_be_contacted_by_ai to allow_call_transfer');
  } else if (!(await checkColumn('allow_call_transfer'))) {
    // Add new column if neither exists
    await db.execute(sql`
      ALTER TABLE contacts 
      ADD COLUMN allow_call_transfer BOOLEAN DEFAULT FALSE
    `);
    console.log('✓ Added allow_call_transfer column');
  } else {
    console.log('- allow_call_transfer column already exists');
  }

  console.log('\n✅ Database schema updated successfully');
  
  // Update sample contacts for testing
  console.log('\nUpdating sample contacts for testing...');
  
  await db.execute(sql`
    UPDATE contacts 
    SET allow_call_transfer = TRUE
    WHERE is_internal = TRUE AND name IN ('John Smith', 'Sarah Johnson')
    LIMIT 2
  `);
  
  console.log('✓ Updated sample contacts with allow_call_transfer settings');
  
} catch (error) {
  console.error('Error updating schema:', error);
  process.exit(1);
}

process.exit(0);