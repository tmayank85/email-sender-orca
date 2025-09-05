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

// Logging helper
const log = {
  info: (message, data = null) => {
    console.log(`ℹ️  [INFO] ${new Date().toISOString()} - ${message}`, data ? data : '');
  },
  success: (message, data = null) => {
    console.log(`✅ [SUCCESS] ${new Date().toISOString()} - ${message}`, data ? data : '');
  },
  warning: (message, data = null) => {
    console.log(`⚠️  [WARNING] ${new Date().toISOString()} - ${message}`, data ? data : '');
  },
  error: (message, error = null) => {
    console.log(`❌ [ERROR] ${new Date().toISOString()} - ${message}`, error ? error.message || error : '');
  },
  auth: (message, user = null) => {
    console.log(`🔐 [AUTH] ${new Date().toISOString()} - ${message}`, user ? `(User: ${user})` : '');
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  log.info(`${req.method} ${req.path}`, `IP: ${req.ip || req.connection.remoteAddress}`);
  next();
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    log.warning('Authentication attempt without token', `IP: ${req.ip}`);
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    log.auth('Token verified successfully', decoded.username);
    next();
  } catch (error) {
    log.warning('Invalid token provided', `IP: ${req.ip}`);
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
  log.auth('Login attempt', username);

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
    log.warning('Login failed - Invalid credentials', username);
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

  log.success('Login successful', user.username);
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
  const startTime = Date.now();
  const { senderEmail, senderName, appPassword, recipients, subject, template } = req.body;
  
  log.info('Email sending initiated', `User: ${req.user.username}, Recipients: ${recipients?.length || 0}`);
  
  try {
    // Validation
    if (!senderEmail || !senderName || !appPassword || !recipients || !subject || !template) {
      log.warning('Email sending failed - Missing required fields', req.user.username);
      return res.status(400).json({
        success: false,
        message: 'All fields are required: senderEmail, senderName, appPassword, recipients, subject, template'
      });
    }

    // Validate sender email format
    if (!isValidEmail(senderEmail)) {
      log.warning('Email sending failed - Invalid sender email format', senderEmail);
      return res.status(400).json({
        success: false,
        message: 'Invalid sender email format'
      });
    }

    // Validate recipients
    if (!Array.isArray(recipients) || recipients.length === 0) {
      log.warning('Email sending failed - Invalid recipients array', req.user.username);
      return res.status(400).json({
        success: false,
        message: 'Recipients must be a non-empty array'
      });
    }

    if (recipients.length > 25) {
      log.warning('Email sending failed - Too many recipients', `Count: ${recipients.length}`);
      return res.status(400).json({
        success: false,
        message: 'Maximum 25 recipients allowed'
      });
    }

    // Validate all recipient emails
    const invalidEmails = recipients.filter(email => !isValidEmail(email));
    if (invalidEmails.length > 0) {
      log.warning('Email sending failed - Invalid recipient emails', invalidEmails.join(', '));
      return res.status(400).json({
        success: false,
        message: `Invalid email format for: ${invalidEmails.join(', ')}`
      });
    }

    log.info('Email validation passed, creating transporter', senderEmail);
    
    // Create transporter
    const transporter = createTransporter(senderEmail, appPassword);

    // Verify connection configuration
    log.info('Verifying SMTP connection...');
    await transporter.verify();
    log.success('SMTP connection verified');

    // Prepare email options
    const mailOptions = {
      from: `${senderName} <${senderEmail}>`, // Display name with email
      to: recipients[0], // First recipient as primary recipient
      bcc: recipients.length > 1 ? recipients.slice(1) : undefined, // Remaining recipients in BCC (if any)
      subject: subject,
      html: template
    };

    log.info('Sending email...', `To: ${recipients[0]}, BCC: ${recipients.length - 1} recipients`);
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    const processingTime = Date.now() - startTime;

    log.success(`Email sent successfully in ${processingTime}ms`, `MessageID: ${info.messageId}, Recipients: ${recipients.length}`);

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
    const processingTime = Date.now() - startTime;
    log.error(`Email sending failed after ${processingTime}ms`, error);
    
    // Handle specific nodemailer errors
    if (error.code === 'EAUTH') {
      log.warning('Email authentication failed', senderEmail);
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Please check your email and app password.'
      });
    }
    
    if (error.code === 'ECONNECTION') {
      log.error('SMTP connection failed');
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
    log.info('Server info requested');
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
    log.error('Error getting server info', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve server information',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  log.error('Unhandled error occurred', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// Handle 404 routes
app.use((req, res) => {
  log.warning('404 - Route not found', `${req.method} ${req.path}`);
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
  console.log('');
  log.success('Email Service started successfully');
  log.info('Logging system initialized');
});