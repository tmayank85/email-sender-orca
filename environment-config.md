# Environment Variables Configuration

## Overview
The Email Service API uses environment variables for configuration management. This provides better security and flexibility for different deployment environments.

## Setup

### 1. Install dotenv
```bash
npm install dotenv
```

### 2. Create .env file
Copy the `.env.example` file to `.env` and update the values:
```bash
cp .env.example .env
```

### 3. Configure your variables
Edit the `.env` file with your specific configuration:

```env
# Required
JWT_SECRET=your-super-secure-jwt-secret-key-here
PORT=3000

# Optional
NODE_ENV=production
JWT_EXPIRES_IN=24h
```

---

## Environment Variables Reference

### 🔐 Security Variables

**JWT_SECRET** (Required)
- **Description**: Secret key used to sign and verify JWT tokens
- **Example**: `JWT_SECRET=80e833d12f1f1a6b9e91b6eea7154781e7ea82625f478eadf1fa95dea00abe27`
- **Generation**: Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **Security**: Keep this secret and never commit it to version control

**JWT_EXPIRES_IN** (Optional)
- **Description**: JWT token expiration time
- **Default**: `24h`
- **Examples**: `1h`, `30m`, `7d`, `1y`

### 🌐 Server Variables

**PORT** (Optional)
- **Description**: Port number for the server
- **Default**: `3000`
- **Example**: `PORT=8080`

**NODE_ENV** (Optional)
- **Description**: Application environment
- **Default**: `development`
- **Values**: `development`, `production`, `test`

---

## Usage Examples

### Development Environment
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=dev-secret-key-not-for-production
JWT_EXPIRES_IN=1h
```

### Production Environment
```env
NODE_ENV=production
PORT=8080
JWT_SECRET=super-secure-production-key-256-bits-minimum
JWT_EXPIRES_IN=24h
```

### Testing Environment
```env
NODE_ENV=test
PORT=3001
JWT_SECRET=test-secret-key
JWT_EXPIRES_IN=5m
```

---

## Security Best Practices

### 1. JWT Secret Security
- ✅ Use a strong, randomly generated secret (minimum 256 bits)
- ✅ Keep different secrets for different environments
- ✅ Never commit secrets to version control
- ✅ Rotate secrets regularly in production

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Environment Separation
- ✅ Use different `.env` files for different environments
- ✅ Use environment-specific configurations
- ✅ Validate required environment variables on startup

### 3. File Security
```bash
# Set proper file permissions (Unix/Linux/macOS)
chmod 600 .env

# Add .env to .gitignore
echo ".env" >> .gitignore
```

---

## Validation and Error Handling

The application will:
- ✅ Load environment variables on startup
- ✅ Fall back to secure defaults if variables are missing
- ✅ Display configuration status in startup logs
- ✅ Validate critical configuration values

### Startup Log Examples

**Success (with .env):**
```
[dotenv@17.2.1] injecting env (1) from .env
🔐 Configuration:
  JWT Secret: ✅ Loaded from .env
  Port: 3000
```

**Fallback (without .env):**
```
🔐 Configuration:
  JWT Secret: ❌ Using fallback
  Port: 3000
```

---

## Docker Support

### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  email-service:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - PORT=3000
    env_file:
      - .env
```

---

## Troubleshooting

### Common Issues

**1. JWT Secret Not Loading**
- Check if `.env` file exists in project root
- Verify file permissions (readable by Node.js process)
- Ensure no syntax errors in `.env` file

**2. Environment Variables Not Working**
- Confirm `dotenv` is installed: `npm list dotenv`
- Check if `require('dotenv').config()` is at the top of `server.js`
- Verify `.env` file format (KEY=VALUE, no spaces around =)

**3. Port Already in Use**
- Change PORT in `.env` file
- Or set via command line: `PORT=8080 npm start`

### Debugging
Enable dotenv debug logging:
```javascript
require('dotenv').config({ debug: true });
```

---

## Migration from Hardcoded Values

### Before (Hardcoded)
```javascript
const JWT_SECRET = 'hardcoded-secret-key';
const PORT = 3000;
```

### After (Environment Variables)
```javascript
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const PORT = process.env.PORT || 3000;
```

This approach provides better security, flexibility, and follows the [12-Factor App](https://12factor.net/config) methodology! 🔐✨
