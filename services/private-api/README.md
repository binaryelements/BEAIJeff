# Private API Service

Internal API service accessible only from within the Docker network.

## Features

- Express server running on Bun runtime
- MySQL/MariaDB database with DrizzleORM
- Internal network validation (Docker containers only)
- API key authentication
- User management endpoints
- Audit logging

## Setup

### 1. Install dependencies
```bash
bun install
```

### 2. Initialize database
```bash
# Push schema to database
bun run db:push

# Or generate and run migrations
bun run db:generate
bun run db:migrate

# Seed with initial data
bun run db:seed
```

### 3. Start the service
```bash
# Development
bun run dev

# Production
bun run start
```

## API Endpoints

### Health Check (No Auth Required)
- `GET /health` - Service health status
- `GET /health/ready` - Readiness probe

### Protected Endpoints (API Key Required)
Add `X-API-Key` header to all requests.

#### Users
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Soft delete user

#### API Keys
- `GET /api/api-keys` - List API keys
- `POST /api/api-keys` - Create API key
- `DELETE /api/api-keys/:id` - Revoke API key

## Internal Access

From other Docker containers in the same network:
```javascript
// Example from jambonz or caller service
const response = await fetch('http://private-api:3000/api/users', {
  headers: {
    'X-API-Key': 'pk_your_api_key_here',
    'X-Container-Name': 'jambonz'
  }
});
```

## Security

- Only accessible from internal Docker network
- API key authentication for all data endpoints
- Permission-based access control
- Audit logging for all actions
- Automatic API key expiration support

## Environment Variables

```env
DB_SERVER=mariadb
DB_NAME=d1store
DB_USERNAME=mariadb
DB_PASSWORD=your_password
DB_PORT=3306
PORT=3000
```