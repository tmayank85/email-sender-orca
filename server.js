// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const os = require('os');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// JWT Secret - Now loaded from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Helper function to get server IP addresses
const getServerIPs = () => {
  const networkInterfaces = os.networkInterfaces();
  const ips = [];
  
  for (const interfaceName in networkInterfaces) {
    const networkInterface = networkInterfaces[interfaceName];
    for (const network of networkInterface) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (network.family === 'IPv4' && !network.internal) {
        ips.push({
          interface: interfaceName,
          address: network.address,
          netmask: network.netmask
        });
      }
    }
  }
  
  return ips;
};

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

// POST /api/login - Generate JWT token
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Simple authentication - In production, use proper user authentication
  const validCredentials = [
    { username: 'admin', password: 'admin123' },
    { username: 'user', password: 'user123' },
    { username: 'emailsender', password: 'email123' }
  ];

  const user = validCredentials.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    { 
      username: user.username,
      iat: Date.now()
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token: token,
      username: user.username,
      expiresIn: '24h',
      tokenType: 'Bearer'
    }
  });
});

// POST /api/send-email - Send bulk emails (Protected Route)
app.post('/api/send-email', verifyToken, async (req, res) => {
  try {
    const { senderEmail, senderName, appPassword, recipients, subject, template } = req.body;
    
    // Validation
    if (!senderEmail || !senderName || !appPassword || !recipients || !subject || !template) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: senderEmail, senderName, appPassword, recipients, subject, template'
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
      from: `${senderName} <${senderEmail}>`, // Display name with email
      // to: recipients[0], // First recipient as primary recipient
      bcc: recipients, //.length > 1 ? recipients.slice(1) : undefined, // Remaining recipients in BCC (if any)
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
        senderName: senderName,
        senderEmail: senderEmail,
        recipientCount: recipients.length,
        sentBy: req.user.username,
        timestamp: new Date().toISOString()
      }
    });
    //console.log("email sent successfully", recipients);

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

// GET /api/server-info - Get server information including IP addresses
app.get('/api/server-info', (req, res) => {
  try {
    const serverIPs = getServerIPs();
    const serverInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      architecture: os.arch(),
      port: PORT,
      networkInterfaces: serverIPs,
      primaryIP: serverIPs.length > 0 ? serverIPs[0].address : 'localhost',
      urls: {
        local: `http://localhost:${PORT}`,
        network: serverIPs.length > 0 ? `http://${serverIPs[0].address}:${PORT}` : `http://localhost:${PORT}`
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Server information retrieved successfully',
      data: serverInfo
    });
  } catch (error) {
    console.error('Error getting server info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve server information',
      error: error.message
    });
  }
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
  const serverIPs = getServerIPs();
  const primaryIP = serverIPs.length > 0 ? serverIPs[0].address : 'localhost';
  
  console.log(`🚀 Email Service is running on:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${primaryIP}:${PORT}`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log('POST   /api/login       - Generate JWT token');
  console.log('POST   /api/send-email  - Send bulk emails via BCC (🔒 Protected)');
  console.log('GET    /api/health      - Health check');
  console.log('GET    /api/server-info - Get server IP and information');
  console.log('');
  console.log('🔐 Configuration:');
  console.log(`  JWT Secret: ${process.env.JWT_SECRET ? '✅ Loaded from .env' : '❌ Using fallback'}`);
  console.log(`  Port: ${PORT}`);
  console.log('');
  console.log('🔑 Default credentials:');
  console.log('  admin/admin123, user/user123, emailsender/email123');
});