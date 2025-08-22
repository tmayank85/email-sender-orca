const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to create transporter
const createTransporter = (senderEmail, appPassword) => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: senderEmail,
      pass: appPassword
    }
  });
};

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Routes

// POST /api/send-email - Send bulk emails
app.post('/api/send-email', async (req, res) => {
  try {
    const { senderEmail, appPassword, recipients, subject, template } = req.body;
    
    // Validation
    if (!senderEmail || !appPassword || !recipients || !subject || !template) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: senderEmail, appPassword, recipients, subject, template'
      });
    }

    // Validate sender email format
    if (!isValidEmail(senderEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sender email format'
      });
    }

    // Validate recipients
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipients must be a non-empty array'
      });
    }

    if (recipients.length > 25) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 25 recipients allowed'
      });
    }

    // Validate all recipient emails
    const invalidEmails = recipients.filter(email => !isValidEmail(email));
    if (invalidEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid email format for: ${invalidEmails.join(', ')}`
      });
    }

    // Create transporter
    const transporter = createTransporter(senderEmail, appPassword);

    // Verify connection configuration
    await transporter.verify();

    // Prepare email options
    const mailOptions = {
      from: senderEmail,
      to: senderEmail, // Send to sender as primary recipient
      bcc: recipients, // All recipients in BCC
      subject: subject,
      html: template
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: {
        messageId: info.messageId,
        recipientCount: recipients.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Email sending error:', error);
    
    // Handle specific nodemailer errors
    if (error.code === 'EAUTH') {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Please check your email and app password.'
      });
    }
    
    if (error.code === 'ECONNECTION') {
      return res.status(503).json({
        success: false,
        message: 'Connection failed. Please check your internet connection.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// GET /api/health - Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Email service is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Email Service is running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('POST   /api/send-email - Send bulk emails via BCC');
  console.log('GET    /api/health     - Health check');
});