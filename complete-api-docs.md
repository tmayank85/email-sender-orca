# Updated Email Service API Documentation

## Complete API Reference with JWT Authentication & Sender Name Support

### Base URL
```
http://localhost:3000
```

⚠️ **Authentication Required**: The `/api/send-email` endpoint now requires JWT authentication.

---

## 🔐 Authentication

### Login (POST /api/login)

Get a JWT token for API access.

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

**Default Credentials:**
- `admin` / `admin123`
- `user` / `user123`
- `emailsender` / `email123`

---

## 📧 Send Bulk Email API (🔒 Protected)

### Endpoint
```
POST /api/send-email
```

### Authentication
**Required:** JWT Token in Authorization header
```
Authorization: Bearer your-jwt-token-here
```

### Description
Send emails to multiple recipients where the first recipient receives the email directly and remaining recipients are added to BCC. **Authentication required.**

### Request Body
```json
{
  "senderEmail": "your-email@gmail.com",
  "senderName": "Your Full Name",
  "appPassword": "your-16-digit-app-password",
  "recipients": [
    "recipient1@example.com",
    "recipient2@example.com",
    "recipient3@example.com"
  ],
  "subject": "Your Email Subject",
  "template": "<h1>Hello!</h1><p>This is your email content with HTML support.</p>"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `senderEmail` | string | ✅ | Gmail address to send from |
| `senderName` | string | ✅ | Display name for the sender |
| `appPassword` | string | ✅ | Gmail App Password (16 digits) |
| `recipients` | array | ✅ | List of recipient emails (max 25) |
| `subject` | string | ✅ | Email subject line |
| `template` | string | ✅ | HTML email content |

### Success Response (200)
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "<unique-message-id@gmail.com>",
    "senderName": "Your Full Name",
    "senderEmail": "your-email@gmail.com",
    "recipientCount": 3,
    "sentBy": "admin",
    "timestamp": "2025-08-22T10:30:00.000Z"
  }
}
```

### Error Responses

#### Missing Fields (400)
```json
{
  "success": false,
  "message": "All fields are required: senderEmail, senderName, appPassword, recipients, subject, template"
}
```

#### Invalid Email Format (400)
```json
{
  "success": false,
  "message": "Invalid sender email format"
}
```

#### Too Many Recipients (400)
```json
{
  "success": false,
  "message": "Maximum 25 recipients allowed"
}
```

#### Authentication Failed (401)
```json
{
  "success": false,
  "message": "Authentication failed. Please check your email and app password."
}
```

#### No Token Provided (401)
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

#### Invalid Token (403)
```json
{
  "success": false,
  "message": "Invalid token."
}
```

#### Connection Failed (503)
```json
{
  "success": false,
  "message": "Connection failed. Please check your internet connection."
}
```

---

## 🏥 Health Check API

### Endpoint
```
GET /api/health
```

### Response (200)
```json
{
  "success": true,
  "message": "Email service is running",
  "timestamp": "2025-08-22T10:30:00.000Z"
}
```

---

## 🖥️ Server Information API

### Endpoint
```
GET /api/server-info
```

### Response (200)
```json
{
  "success": true,
  "message": "Server information retrieved successfully",
  "data": {
    "hostname": "DESKTOP-ABC123",
    "platform": "win32",
    "architecture": "x64",
    "port": 3000,
    "networkInterfaces": [
      {
        "interface": "Wi-Fi",
        "address": "192.168.1.100",
        "netmask": "255.255.255.0"
      }
    ],
    "primaryIP": "192.168.1.100",
    "urls": {
      "local": "http://localhost:3000",
      "network": "http://192.168.1.100:3000"
    },
    "uptime": 3600.5,
    "timestamp": "2025-08-22T10:30:00.000Z"
  }
}
```

---

## 💡 Usage Examples

### JavaScript/TypeScript Example
```typescript
class AuthenticatedEmailService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  // Step 1: Login to get JWT token
  async login(username: string, password: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    
    if (result.success) {
      this.token = result.data.token;
      console.log(`✅ Logged in as: ${result.data.username}`);
    } else {
      throw new Error(result.message);
    }
  }

  // Step 2: Send email with authentication
  async sendBulkEmail(emailData: {
    senderEmail: string;
    senderName: string;
    appPassword: string;
    recipients: string[];
    subject: string;
    template: string;
  }) {
    if (!this.token) {
      throw new Error('Please login first');
    }

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
      console.log('✅ Email sent successfully!');
      console.log(`📧 From: ${result.data.senderName} <${result.data.senderEmail}>`);
      console.log(`👥 Recipients: ${result.data.recipientCount}`);
      console.log(`👤 Sent by: ${result.data.sentBy}`);
      console.log(`🆔 Message ID: ${result.data.messageId}`);
      return result;
    } else {
      throw new Error(result.message);
    }
  }
}

// Usage Example
async function sendEmail() {
  const emailService = new AuthenticatedEmailService();
  
  try {
    // Step 1: Login
    await emailService.login('admin', 'admin123');
    
    // Step 2: Send Email
    await emailService.sendBulkEmail({
      senderEmail: "john.doe@gmail.com",
      senderName: "John Doe",
      appPassword: "abcd efgh ijkl mnop",
      recipients: [
        "customer1@example.com",
        "customer2@example.com",
        "customer3@example.com"
      ],
      subject: "Welcome to Our Service!",
      template: `
        <div style="font-family: Arial, sans-serif;">
          <h1>Welcome!</h1>
          <p>Thank you for joining our service.</p>
        </div>
      `
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sendEmail();
```

### cURL Example
```bash
# Step 1: Login to get JWT token
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Response: {"success":true,"data":{"token":"eyJhbGciOiJIUzI1NiIs..."}}

# Step 2: Use token to send email
export TOKEN="your-jwt-token-from-step-1"

curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "senderEmail": "your-email@gmail.com",
    "senderName": "Your Full Name",
    "appPassword": "your-app-password",
    "recipients": [
      "recipient1@example.com",
      "recipient2@example.com"
    ],
    "subject": "Test Email",
    "template": "<h1>Hello World!</h1><p>This is a test email.</p>"
  }'
```

### Python Example
```python
import requests
import json

def send_bulk_email(sender_email, sender_name, app_password, recipients, subject, template):
    url = "http://localhost:3000/api/send-email"
    
    payload = {
        "senderEmail": sender_email,
        "senderName": sender_name,
        "appPassword": app_password,
        "recipients": recipients,
        "subject": subject,
        "template": template
    }
    
    try:
        response = requests.post(url, json=payload)
        result = response.json()
        
        if result['success']:
            print(f"✅ Email sent successfully!")
            print(f"📧 From: {result['data']['senderName']} <{result['data']['senderEmail']}>")
            print(f"👥 Recipients: {result['data']['recipientCount']}")
            return result
        else:
            print(f"❌ Error: {result['message']}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

# Usage
send_bulk_email(
    sender_email="john.doe@gmail.com",
    sender_name="John Doe",
    app_password="abcd efgh ijkl mnop",
    recipients=["customer1@example.com", "customer2@example.com"],
    subject="Welcome Email",
    template="<h1>Welcome!</h1><p>Thank you for joining us.</p>"
)
```

---

## 📋 Important Notes

### 🔐 Gmail App Password Setup
1. Enable 2-Step Verification on your Google Account
2. Go to Google Account Settings → Security → App passwords
3. Generate a new app password for "Mail"
4. Use the 16-character password (with spaces) in your API calls

### 📧 Email Display
- Emails will show as: **"Your Name <your-email@gmail.com>"**
- First recipient gets the email directly in the "To" field
- Remaining recipients are in BCC and won't see each other's email addresses
- HTML templates are fully supported

### 🚀 Best Practices
1. **Batch Size**: Keep recipients under 25 per request
2. **Rate Limiting**: Don't send emails too frequently to avoid being flagged
3. **HTML Templates**: Use responsive design for better compatibility
4. **Error Handling**: Always handle authentication and network errors
5. **Validation**: Validate email addresses before sending

### 🌐 Network Access
- Use `GET /api/server-info` to get network URLs
- Access from other devices using the network IP
- Perfect for mobile app integration

---

## 🔧 Integration Examples

### React Hook
```typescript
import { useState } from 'react';

interface EmailData {
  senderEmail: string;
  senderName: string;
  appPassword: string;
  recipients: string[];
  subject: string;
  template: string;
}

export const useEmailSender = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async (emailData: EmailData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendEmail, loading, error };
};
```

This updated API now includes sender name support, making your emails more professional and personalized! 🎉
