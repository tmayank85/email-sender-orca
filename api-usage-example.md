# Email Service API Usage

## Base URL
```
http://localhost:3000
```

## Endpoints

### 1. Send Bulk Email (POST /api/send-email)

Send emails to multiple recipients using BCC.

**Request Body:**
```json
{
  "senderEmail": "your-email@gmail.com",
  "appPassword": "your-app-password",
  "recipients": [
    "recipient1@example.com",
    "recipient2@example.com",
    "recipient3@example.com"
  ],
  "subject": "Your Email Subject",
  "template": "<h1>Hello!</h1><p>This is your email content with HTML support.</p>"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "<message-id>",
    "recipientCount": 3,
    "timestamp": "2025-08-22T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "All fields are required: senderEmail, appPassword, recipients, subject, template"
}
```

### 2. Health Check (GET /api/health)

Check if the service is running.

**Response (200):**
```json
{
  "success": true,
  "message": "Email service is running",
  "timestamp": "2025-08-22T10:30:00.000Z"
}
```

## Important Notes

1. **App Password**: You need to generate an App Password from your Gmail account settings, not your regular password.

2. **Recipients Limit**: Maximum 25 recipients per request.

3. **BCC Implementation**: All recipients are added to BCC, so they won't see each other's email addresses.

4. **HTML Support**: The template field supports HTML content.

5. **Error Handling**: The API provides specific error messages for authentication failures, connection issues, and validation errors.

## Example Frontend Integration

```typescript
const sendEmail = async (emailData: {
  senderEmail: string;
  appPassword: string;
  recipients: string[];
  subject: string;
  template: string;
}) => {
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
      console.log('Email sent successfully:', result.data);
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};
```
