import { db } from './index';
import { users, apiKeys, companies, phoneNumbers, contacts } from './schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');
  
  try {
    // Check if default company exists
    const existingCompanies = await db.select().from(companies).where(eq(companies.slug, 'default'));
    
    let defaultCompany;
    if (existingCompanies.length > 0) {
      defaultCompany = existingCompanies[0];
      console.log('✅ Default company already exists:', defaultCompany.id);
    } else {
      // Create default company with data collection fields
      const [newCompany] = await db.insert(companies).values({
      name: 'Default Company',
      slug: 'default',
      email: 'support@defaultcompany.com',
      supportPhone: '8811001',
      settings: {
        greeting: 'Welcome to our customer service line',
        departments: ['sales', 'support', 'billing', 'technical'],
        voiceSettings: {
          voice: 'alloy',
          temperature: 0.8
        }
      },
      dataCollectionFields: {
        standardFields: {
          callerName: true,
          companyName: true,
          contactNumber: true,
          email: false,
          reasonForCalling: true
        },
        customFields: [
          {
            name: 'accountNumber',
            label: 'Account Number',
            type: 'text',
            required: false,
            aiPrompt: 'Ask for their account number if they have one'
          },
          {
            name: 'preferredContactTime',
            label: 'Preferred Contact Time',
            type: 'text',
            required: false,
            aiPrompt: 'Ask when is the best time to reach them'
          }
        ],
        collectionOrder: ['callerName', 'companyName', 'contactNumber', 'reasonForCalling']
      },
      isActive: true,
    }).$returningId();
      
      defaultCompany = { id: newCompany.id };
      console.log('✅ Created default company:', defaultCompany.id);
    }

    // Check if phone number exists
    const existingPhones = await db.select().from(phoneNumbers).where(eq(phoneNumbers.phoneNumber, '9988001'));
    
    if (existingPhones.length === 0) {
      // Create phone number with 9988001
      await db.insert(phoneNumbers).values({
      companyId: defaultCompany.id,
      phoneNumber: '9988001',
      displayName: 'Main Support Line',
      type: 'main',
      instructions: `You are a helpful customer service AI assistant for our company. IMPORTANT: You must ONLY speak in English. Never use any other language regardless of what language the customer speaks. If a customer speaks in another language, politely ask them to speak in English.
      
Your goal is to:
1. Understand the customer's issue or request through natural conversation IN ENGLISH ONLY
2. Try to resolve simple issues yourself when possible
3. Gather necessary information before transferring to appropriate departments
4. Only transfer when you cannot resolve the issue or when specifically requested

Available departments for transfer:
- sales: For new purchases, pricing inquiries, product information
- support: For general help, account issues, basic troubleshooting
- billing: For payment issues, billing inquiries, account charges
- technical: For complex technical problems, advanced troubleshooting

Be conversational, helpful, and efficient. Always explain what you're doing and why.`,
      supportNumber: '8811001',
      metadata: {
        departments: [
          {
            name: 'sales',
            transferNumber: '8811001',
            description: 'For new purchases, pricing inquiries, product information'
          },
          {
            name: 'support',
            transferNumber: '8811001',
            description: 'For general help, account issues, basic troubleshooting'
          },
          {
            name: 'billing',
            transferNumber: '8811001',
            description: 'For payment issues, billing inquiries, account charges'
          },
          {
            name: 'technical',
            transferNumber: '8811001',
            description: 'For complex technical problems, advanced troubleshooting'
          }
        ],
        voiceSettings: {
          voice: 'alloy',
          language: 'en-US',
          temperature: 0.8
        }
      },
      isActive: true,
      });

      console.log('✅ Created phone number: 9988001');
    } else {
      console.log('✅ Phone number 9988001 already exists');
    }

    // Check if admin user exists
    const existingAdminUser = await db.select().from(users).where(eq(users.email, 'admin@caller.com'));
    
    let adminUser;
    if (existingAdminUser.length === 0) {
      // Create admin user with password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const [newAdminUser] = await db.insert(users).values({
      companyId: defaultCompany.id,
      email: 'admin@caller.com',
      username: 'admin',
      passwordHash: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      isActive: true,
      metadata: { role: 'admin' },
      }).$returningId();
      
      adminUser = { id: newAdminUser.id };
      console.log('✅ Created admin user:', adminUser.id);
      console.log('📧 Email: admin@caller.com');
      console.log('🔑 Password: admin123');

      const adminApiKey = `pk_${crypto.randomBytes(32).toString('hex')}`;
      
      await db.insert(apiKeys).values({
        userId: adminUser.id,
        key: adminApiKey,
        name: 'Admin Full Access',
        permissions: ['*'],
        isActive: true,
      });

      console.log('🔑 Admin API Key:', adminApiKey);
      console.log('⚠️  Store this key securely - it will not be shown again!');
    } else {
      adminUser = existingAdminUser[0];
      console.log('✅ Admin user already exists');
    }

    // Check if service user exists
    const existingServiceUser = await db.select().from(users).where(eq(users.email, 'service@internal.com'));
    
    if (existingServiceUser.length === 0) {
      const [serviceUser] = await db.insert(users).values({
      companyId: defaultCompany.id,
      email: 'service@internal.com',
      username: 'service',
      passwordHash: await bcrypt.hash('servicepass123', 10),
      firstName: 'Service',
      lastName: 'Account',
      role: 'service',
      isActive: true,
      metadata: { role: 'service' },
    }).$returningId();

      const serviceApiKey = `pk_${crypto.randomBytes(32).toString('hex')}`;
      
      await db.insert(apiKeys).values({
        userId: serviceUser.id,
        key: serviceApiKey,
        name: 'Service Limited Access',
        permissions: ['users:read', 'users:create'],
        isActive: true,
      });

      console.log('🔑 Service API Key:', serviceApiKey);
    } else {
      console.log('✅ Service user already exists');
    }

    // Check if test contacts exist
    const existingContacts = await db.select().from(contacts).where(eq(contacts.companyId, defaultCompany.id));
    
    if (existingContacts.length === 0) {
      // Create test contacts
      const testContacts = [
        {
          companyId: defaultCompany.id,
          name: 'John Smith',
          phoneNumber: '+1234567890',
          email: 'john.smith@techcorp.com',
          companyName: 'TechCorp Solutions',
          department: 'IT',
          role: 'IT Manager',
          notes: 'VIP customer, prefers email communication',
          isVip: true,
          customFields: {
            accountNumber: 'TC-12345',
            preferredContactTime: 'Morning 9-11 AM'
          }
        },
        {
          companyId: defaultCompany.id,
          name: 'Sarah Johnson',
          phoneNumber: '+1234567891',
          email: 'sarah@retailstore.com',
          companyName: 'Retail Store Inc',
          department: 'Operations',
          role: 'Operations Director',
          notes: 'Frequent caller, issues with network connectivity',
          totalCalls: 5,
          customFields: {
            accountNumber: 'RS-67890',
            preferredContactTime: 'Afternoon 2-4 PM'
          }
        },
        {
          companyId: defaultCompany.id,
          name: 'Mike Davis',
          phoneNumber: '+1234567892',
          email: 'mike.davis@startup.io',
          companyName: 'Startup Innovations',
          department: 'Engineering',
          role: 'CTO',
          notes: 'Technical expert, usually calls for advanced support',
          totalCalls: 3,
          isVip: true,
          customFields: {
            accountNumber: 'SI-11223',
            preferredContactTime: 'Flexible'
          }
        },
        {
          companyId: defaultCompany.id,
          name: 'Lisa Chen',
          phoneNumber: '+1234567893',
          email: 'lisa@finance.com',
          companyName: 'Finance Corp',
          department: 'Finance',
          role: 'CFO',
          notes: 'Billing inquiries only',
          totalCalls: 2,
          customFields: {
            accountNumber: 'FC-44556'
          }
        },
        {
          companyId: defaultCompany.id,
          name: 'Robert Wilson',
          phoneNumber: '+1234567894',
          companyName: 'Local Business LLC',
          department: 'Management',
          role: 'Owner',
          notes: 'Small business owner, needs simple solutions',
          totalCalls: 8
        }
      ];

      for (const contact of testContacts) {
        await db.insert(contacts).values(contact);
      }

      console.log('✅ Created test contacts:', testContacts.length);
    } else {
      console.log('✅ Test contacts already exist');
    }
    
    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();