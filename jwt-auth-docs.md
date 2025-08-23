# JWT Authentication Documentation

## Overview
The Email Service API now includes JWT (JSON Web Token) based authentication to secure the email sending functionality.

## Authentication Flow
1. **Login** with username/password to get a JWT token
2. **Include** the token in the Authorization header for protected endpoints
3. **Token expires** after 24 hours (configurable)

---

## 🔐 Authentication Endpoints

### Login (POST /api/login)

Generate a JWT token for API access.

**Endpoint:**
```
POST /api/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "username": "admin",
    "expiresIn": "24h",
    "tokenType": "Bearer"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

### Default Credentials
```
Username: admin     | Password: admin123
Username: user      | Password: user123
Username: emailsender | Password: email123
```

---

## 🔒 Protected Endpoints

### Send Email (POST /api/send-email)

**Authorization Required:** Bearer Token

**Headers:**
```
Authorization: Bearer your-jwt-token-here
Content-Type: application/json
```

**Request Body:**
```json
{
  "senderEmail": "your-email@gmail.com",
  "senderName": "Your Name",
  "appPassword": "your-app-password",
  "recipients": ["recipient1@example.com", "recipient2@example.com"],
  "subject": "Your Subject",
  "template": "<h1>Your HTML content</h1>"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "<message-id>",
    "senderName": "Your Name",
    "senderEmail": "your-email@gmail.com",
    "recipientCount": 2,
    "sentBy": "admin",
    "timestamp": "2025-08-22T10:30:00.000Z"
  }
}
```

**Authentication Error Responses:**

**No Token (401):**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**Invalid Token (403):**
```json
{
  "success": false,
  "message": "Invalid token."
}
```

---

## 📋 Usage Examples

### JavaScript/TypeScript Example

```typescript
class EmailServiceClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  // Step 1: Login to get token
  async login(username: string, password: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.success) {
        this.token = result.data.token;
        console.log('✅ Login successful');
        return this.token;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  // Step 2: Send email with authentication
  async sendEmail(emailData: {
    senderEmail: string;
    senderName: string;
    appPassword: string;
    recipients: string[];
    subject: string;
    template: string;
  }) {
    if (!this.token) {
      throw new Error('Please login first to get authentication token');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Email sent successfully');
        console.log(`📧 From: ${result.data.senderName}`);
        console.log(`👥 Recipients: ${result.data.recipientCount}`);
        console.log(`👤 Sent by: ${result.data.sentBy}`);
        return result;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  }
}

// Usage Example
const emailService = new EmailServiceClient();

async function sendBulkEmail() {
  try {
    // Step 1: Login
    await emailService.login('admin', 'admin123');

    // Step 2: Send Email
    const result = await emailService.sendEmail({
      senderEmail: 'john.doe@gmail.com',
      senderName: 'John Doe',
      appPassword: 'your-app-password',
      recipients: ['customer1@example.com', 'customer2@example.com'],
      subject: 'Welcome!',
      template: '<h1>Welcome to our service!</h1><p>Thank you for joining us.</p>'
    });

    console.log('Email sent:', result.data.messageId);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

sendBulkEmail();
```

### cURL Examples

**Step 1: Login**
```bash
# Get JWT token
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Response will contain the token
# {"success":true,"data":{"token":"eyJhbGciOiJIUzI1NiIs..."}}
```

**Step 2: Send Email**
```bash
# Use the token from step 1
export TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "senderEmail": "your-email@gmail.com",
    "senderName": "Your Name",
    "appPassword": "your-app-password",
    "recipients": ["recipient1@example.com"],
    "subject": "Test Email",
    "template": "<h1>Hello World!</h1>"
  }'
```

### Python Example

```python
import requests
import json

class EmailServiceAPI:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.token = None

    def login(self, username, password):
        """Login and get JWT token"""
        url = f"{self.base_url}/api/login"
        data = {"username": username, "password": password}
        
        try:
            response = requests.post(url, json=data)
            result = response.json()
            
            if result['success']:
                self.token = result['data']['token']
                print(f"✅ Login successful for user: {result['data']['username']}")
                return self.token
            else:
                raise Exception(result['message'])
        except Exception as e:
            print(f"❌ Login failed: {e}")
            raise

    def send_email(self, sender_email, sender_name, app_password, recipients, subject, template):
        """Send email with JWT authentication"""
        if not self.token:
            raise Exception("Please login first to get authentication token")
        
        url = f"{self.base_url}/api/send-email"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}"
        }
        
        data = {
            "senderEmail": sender_email,
            "senderName": sender_name,
            "appPassword": app_password,
            "recipients": recipients,
            "subject": subject,
            "template": template
        }
        
        try:
            response = requests.post(url, json=data, headers=headers)
            result = response.json()
            
            if result['success']:
                print(f"✅ Email sent successfully!")
                print(f"📧 Message ID: {result['data']['messageId']}")
                print(f"👥 Recipients: {result['data']['recipientCount']}")
                print(f"👤 Sent by: {result['data']['sentBy']}")
                return result
            else:
                raise Exception(result['message'])
        except Exception as e:
            print(f"❌ Email sending failed: {e}")
            raise

# Usage
if __name__ == "__main__":
    api = EmailServiceAPI()
    
    try:
        # Login
        api.login("admin", "admin123")
        
        # Send email
        result = api.send_email(
            sender_email="john.doe@gmail.com",
            sender_name="John Doe",
            app_password="your-app-password",
            recipients=["customer1@example.com", "customer2@example.com"],
            subject="Welcome Email",
            template="<h1>Welcome!</h1><p>Thank you for joining us.</p>"
        )
        
        print(f"Success! Message ID: {result['data']['messageId']}")
        
    except Exception as e:
        print(f"Error: {e}")
```

---

## 🛡️ Security Features

### JWT Token Security
- **Expiry**: Tokens expire after 24 hours
- **Secret Key**: Uses configurable JWT secret (change in production)
- **Bearer Format**: Standard Authorization header format
- **User Context**: Tracks which user sent the email

### Production Security Recommendations

1. **Environment Variables:**
```bash
# Set in production
JWT_SECRET=your-super-secure-secret-key-at-least-256-bits
```

2. **Password Hashing:**
```javascript
// Replace simple password check with bcrypt in production
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, user.hashedPassword);
```

3. **Database Integration:**
```javascript
// Replace hardcoded users with database lookup
const user = await User.findOne({ username });
```

4. **Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
});
app.use('/api/login', loginLimiter);
```

---

## 🔧 Configuration

### Environment Variables
```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your-super-secure-secret-key
JWT_EXPIRES_IN=24h

# In production, also configure:
DB_CONNECTION_STRING=mongodb://localhost:27017/emailservice
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### Custom JWT Secret
```javascript
// In production, use a strong secret key
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
```

This JWT authentication system provides a secure way to protect your email sending API while maintaining ease of use for authorized clients! 🔐
