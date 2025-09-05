import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { phoneNumbers, companies } from '../db/schema';

const router = Router();

// Get phone number configuration by phone number
router.get('/lookup/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    // Find phone number with company info
    const result = await db
      .select({
        phoneNumber: phoneNumbers,
        company: companies
      })
      .from(phoneNumbers)
      .leftJoin(companies, eq(phoneNumbers.companyId, companies.id))
      .where(eq(phoneNumbers.phoneNumber, phoneNumber))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ 
        error: 'Phone number not found',
        phoneNumber 
      });
    }

    const { phoneNumber: phoneConfig, company } = result[0];

    // Prepare response with all necessary configuration
    const response = {
      id: phoneConfig.id,
      phoneNumber: phoneConfig.phoneNumber,
      displayName: phoneConfig.displayName,
      type: phoneConfig.type,
      instructions: phoneConfig.instructions,
      supportNumber: phoneConfig.supportNumber,
      company: company ? {
        id: company.id,
        name: company.name,
        slug: company.slug,
        settings: company.settings,
        dataCollectionFields: company.dataCollectionFields
      } : null,
      metadata: phoneConfig.metadata,
      isActive: phoneConfig.isActive
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching phone number:', error);
    res.status(500).json({ 
      error: 'Failed to fetch phone number configuration' 
    });
  }
});

// Get all phone numbers for a company
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const results = await db
      .select()
      .from(phoneNumbers)
      .where(eq(phoneNumbers.companyId, parseInt(companyId)));

    res.json(results);
  } catch (error) {
    console.error('Error fetching company phone numbers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch company phone numbers' 
    });
  }
});

// Create a new phone number
router.post('/', async (req, res) => {
  try {
    const {
      companyId,
      phoneNumber,
      displayName,
      type = 'main',
      instructions,
      supportNumber,
      metadata
    } = req.body;

    // Check if phone number already exists
    const existing = await db
      .select()
      .from(phoneNumbers)
      .where(eq(phoneNumbers.phoneNumber, phoneNumber))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ 
        error: 'Phone number already exists' 
      });
    }

    const [newPhoneNumber] = await db
      .insert(phoneNumbers)
      .values({
        companyId,
        phoneNumber,
        displayName,
        type,
        instructions,
        supportNumber,
        metadata,
        isActive: true
      })
      .$returningId();

    res.status(201).json({ 
      id: newPhoneNumber.id,
      message: 'Phone number created successfully' 
    });
  } catch (error) {
    console.error('Error creating phone number:', error);
    res.status(500).json({ 
      error: 'Failed to create phone number' 
    });
  }
});

// Update phone number configuration
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    await db
      .update(phoneNumbers)
      .set(updates)
      .where(eq(phoneNumbers.id, parseInt(id)));

    res.json({ 
      message: 'Phone number updated successfully' 
    });
  } catch (error) {
    console.error('Error updating phone number:', error);
    res.status(500).json({ 
      error: 'Failed to update phone number' 
    });
  }
});

export default router;