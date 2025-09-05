// Script to fix contacts with problematic phone numbers
import { db } from './index';
import { contacts, calls } from './schema';
import { eq, like, or, sql } from 'drizzle-orm';

console.log('Finding contacts with problematic phone numbers...');

// Find contacts with phrases instead of actual phone numbers
const problematicPhrases = [
  '%number provided%',
  '%this number%',
  '%same number%',
  '%my number%',
  '%current number%',
  '%the number%',
  '%this phone%',
  '%my phone%',
  '%same phone%'
];

const conditions = problematicPhrases.map(phrase => like(contacts.phoneNumber, phrase));

const problematicContacts = await db.select({
  id: contacts.id,
  name: contacts.name,
  phoneNumber: contacts.phoneNumber,
  createdAt: contacts.createdAt
})
.from(contacts)
.where(or(...conditions))
.orderBy(contacts.createdAt);

console.log(`Found ${problematicContacts.length} contacts with problematic phone numbers`);

if (problematicContacts.length > 0) {
  console.log('\nProblematic contacts:');
  problematicContacts.forEach(contact => {
    console.log(`- ID: ${contact.id}, Name: ${contact.name}, Phone: "${contact.phoneNumber}"`);
  });

  // Try to find the actual phone numbers from recent calls
  for (const contact of problematicContacts) {
    // Find the most recent call around the time this contact was created
    const recentCall = await db.select({
      phoneNumber: calls.phoneNumber
    })
    .from(calls)
    .where(
      sql`ABS(TIMESTAMPDIFF(MINUTE, ${calls.startedAt}, ${contact.createdAt})) < 10`
    )
    .orderBy(sql`ABS(TIMESTAMPDIFF(SECOND, ${calls.startedAt}, ${contact.createdAt}))`)
    .limit(1);

    if (recentCall.length > 0 && recentCall[0].phoneNumber) {
      const actualPhone = recentCall[0].phoneNumber;
      console.log(`\nFixing contact ${contact.id} (${contact.name}): "${contact.phoneNumber}" -> "${actualPhone}"`);
      
      await db.update(contacts)
        .set({ phoneNumber: actualPhone })
        .where(eq(contacts.id, contact.id));
      
      console.log('✓ Fixed');
    } else {
      console.log(`\n⚠ Could not find matching call for contact ${contact.id} (${contact.name})`);
      console.log('  This contact may need manual review');
    }
  }
  
  console.log('\n✅ Phone number fix completed');
} else {
  console.log('✅ No problematic phone numbers found');
}

process.exit(0);