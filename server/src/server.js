const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');


// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const serviceRequestRoutes = require('./routes/serviceRequest.routes.js');
const adminRoutes = require('./routes/admin.routes');
const errorCodeRoutes = require('./routes/errorCode.routes');

// Import error handler
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const http = require('http');

// HTTP request logging (Absolute Top for visibility)
app.use(morgan('dev'));

const server = http.createServer(app);
const { initSocket } = require('./services/socketService');

// Initialize Socket.io
initSocket(server);

// Security middleware
// app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for file uploads
app.use('/uploads', express.static(path.resolve('uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Techno Home API is running',
    timestamp: new Date().toISOString()
  });
});

// Test uploads availability
app.get('/api/test-uploads', (req, res) => {
  const fs = require('fs');
  const uploadsPath = path.join(__dirname, '../uploads/requests');
  if (fs.existsSync(uploadsPath)) {
    const files = fs.readdirSync(uploadsPath);
    res.json({ status: 'success', path: uploadsPath, files });
  } else {
    res.json({ status: 'error', message: 'Path not found', path: uploadsPath });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/error-codes', errorCodeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

// Database connection
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    server.listen(PORT, () => {
      console.log(`🚀 Server with Socket.io running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
