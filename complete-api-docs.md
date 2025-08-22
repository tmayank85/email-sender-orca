# Updated Email Service API Documentation

## Complete API Reference with Sender Name Support

### Base URL
```
http://localhost:3000
```

---

## 📧 Send Bulk Email API

### Endpoint
```
POST /api/send-email
```

### Description
Send emails to multiple recipients using BCC with sender name display support.

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
interface EmailRequest {
  senderEmail: string;
  senderName: string;
  appPassword: string;
  recipients: string[];
  subject: string;
  template: string;
}

const sendBulkEmail = async (emailData: EmailRequest) => {
  try {
    const response = await fetch('http://localhost:3000/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log(`📧 From: ${result.data.senderName} <${result.data.senderEmail}>`);
      console.log(`👥 Recipients: ${result.data.recipientCount}`);
      console.log(`🆔 Message ID: ${result.data.messageId}`);
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};

// Usage
const emailData = {
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Welcome!</h1>
      <p>Thank you for joining our service.</p>
      <div style="background-color: #f0f0f0; padding: 20px; margin: 20px 0;">
        <p>This email was sent to you as part of our bulk email service.</p>
      </div>
      <footer style="color: #888; font-size: 12px;">
        Best regards,<br>
        The Team
      </footer>
    </div>
  `
};

sendBulkEmail(emailData);
```

### cURL Example
```bash
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
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
- Recipients won't see each other's email addresses (BCC)
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
