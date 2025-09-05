// Quick query script
import { db } from './index';
import { contacts } from './schema';
import { like } from 'drizzle-orm';

const problematicContacts = await db.select({
  id: contacts.id,
  name: contacts.name,
  phoneNumber: contacts.phoneNumber
})
.from(contacts)
.where(like(contacts.phoneNumber, '%number%'))
.limit(10);

console.log('Contacts with problematic phone numbers:');
console.log(JSON.stringify(problematicContacts, null, 2));

process.exit(0);
