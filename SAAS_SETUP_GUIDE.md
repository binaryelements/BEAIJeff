# SaaS Multi-Tenant Phone System Setup Guide

## Overview
This system enables multiple companies to have dedicated phone numbers with custom AI agents and routing configurations.

## Architecture Components

### 1. Database Schema (MySQL via Drizzle ORM)

#### Key Tables Added:
- **companies**: Stores company information
- **phone_numbers**: Maps phone numbers to companies with configurations

#### Schema Location: 
`services/private-api/src/db/schema.ts`

```typescript
// Companies table structure
companies {
  id, name, slug, email, supportPhone, settings, isActive
}

// Phone numbers table structure  
phoneNumbers {
  id, companyId, phoneNumber, displayName, type,
  instructions, supportNumber, metadata, isActive
}

// Updated calls table
calls {
  + companyId, phoneNumberId, calledNumber // New fields
}
```

### 2. API Endpoints

#### Phone Number Management API
Location: `services/private-api/src/routes/phone-numbers.ts`

- `GET /api/phone-numbers/lookup/:phoneNumber` - Get config for incoming calls
- `GET /api/phone-numbers/company/:companyId` - List company numbers
- `POST /api/phone-numbers` - Create new phone number
- `PATCH /api/phone-numbers/:id` - Update configuration

### 3. Jambonz Integration

#### Main Service Handler
Location: `services/jambonz/src/routes/main-service.ts`

Key changes:
1. Fetches phone config on session:new
2. Uses custom instructions from database
3. Department-specific transfer routing
4. Tracks companyId and phoneNumberId

#### API Client
Location: `services/jambonz/src/utils/api-client.ts`
- Added `getPhoneNumberConfig()` method
- Updated `createCall()` to include company fields

## Quick Setup Steps

### 1. Database Migration
```bash
cd services/private-api
npx drizzle-kit push --force  # Apply schema changes
npm run db:seed                # Seed initial data
```

### 2. Environment Configuration
```bash
# services/jambonz/.env
WS_PORT=3000
PRIVATE_API_URL=http://private-api:3000  # Docker service name
AGENT_NUMBER=8811001                     # Default transfer number

# services/private-api/.env  
PORT=3000
DATABASE_URL=mysql://user:pass@host/db
```

### 3. Docker Setup
Both services run in containers on the same network:
- jambonz: Port 3000 (WebSocket)
- private-api: Port 3000 (HTTP API)
- Communication: Via service names (private-api, jambonz)

## Phone Number Configuration Structure

```json
{
  "phoneNumber": "9988001",
  "displayName": "Main Support Line",
  "instructions": "Custom AI agent instructions...",
  "supportNumber": "8811001",
  "metadata": {
    "departments": [
      {
        "name": "sales",
        "transferNumber": "8811001",
        "description": "Sales inquiries"
      }
    ],
    "voiceSettings": {
      "voice": "alloy",
      "temperature": 0.8,
      "language": "en-US"
    }
  }
}
```

## Call Flow

1. **Incoming Call** → Phone number (e.g., 9988001)
2. **Jambonz** → Fetches config from `/api/phone-numbers/lookup/9988001`
3. **AI Agent** → Uses custom instructions and voice settings
4. **Transfer** → Routes to department-specific numbers
5. **Tracking** → Stores companyId and phoneNumberId with call

## Adding New Company/Phone Number

```bash
# Via API
curl -X POST http://localhost:3000/api/phone-numbers \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": 1,
    "phoneNumber": "9988002",
    "displayName": "Sales Line",
    "instructions": "You are a sales agent...",
    "supportNumber": "8811001",
    "metadata": {
      "departments": [...],
      "voiceSettings": {...}
    }
  }'
```

## Testing

1. Check phone config:
```bash
curl http://localhost:3000/api/phone-numbers/lookup/9988001 | jq .
```

2. Verify services are running:
```bash
# Private API health check
curl http://localhost:3000/health

# Jambonz WebSocket check  
curl http://localhost:3001/health  # If on different port
```

## Key Files Modified

1. `services/private-api/src/db/schema.ts` - Database schema
2. `services/private-api/src/db/seed.ts` - Seed data
3. `services/private-api/src/routes/phone-numbers.ts` - Phone API
4. `services/private-api/src/index.ts` - Added phone routes
5. `services/jambonz/src/routes/main-service.ts` - Multi-tenant support
6. `services/jambonz/src/utils/api-client.ts` - Phone lookup method

## Default Seeded Data

- Company: "Default Company" (ID: 1)
- Phone: "9988001" 
- Transfer Number: "8811001"
- Departments: sales, support, billing, technical

## Troubleshooting

1. **Port conflicts**: Services run in Docker containers, so same ports are OK
2. **Database connection**: Check DATABASE_URL in private-api/.env
3. **Service discovery**: Use service names (private-api, jambonz) not localhost
4. **Phone not found**: Ensure phone number exists in database

## Future Enhancements

- [ ] Web UI for managing companies/phone numbers
- [ ] Real-time call analytics per company
- [ ] Custom business hours per phone number
- [ ] IVR menu configuration
- [ ] Call recording management per company
- [ ] Billing integration for usage tracking