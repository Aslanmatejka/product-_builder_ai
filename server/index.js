const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const buildRoutes = require('./routes/build');

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.use(express.json());

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} - ${req.ip}`);
  if (req.path.startsWith('/exports')) {
    console.log(`📂 Static file request: ${req.method} ${req.path}`);
  }
  next();
});

// Response logging to capture success/error payloads
app.use((req, res, next) => {
  const startTime = Date.now();
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  const captureBody = (body) => {
    try {
      res.locals.responseBody = typeof body === 'string' ? body : JSON.stringify(body);
    } catch (err) {
      res.locals.responseBody = '[unserializable response body]';
    }
  };

  res.json = (body) => {
    captureBody(body);
    return originalJson(body);
  };

  res.send = (body) => {
    captureBody(body);
    return originalSend(body);
  };

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const route = `${req.method} ${req.originalUrl}`;
    if (res.statusCode >= 400) {
      console.error(`❌ RESPONSE ${route} -> ${res.statusCode} (${duration}ms)`);
      if (res.locals.responseBody) {
        console.error(`   Payload: ${res.locals.responseBody}`);
      }
    } else {
      console.log(`✅ RESPONSE ${route} -> ${res.statusCode} (${duration}ms)`);
    }
  });

  next();
});

// Routes
app.use('/api', buildRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Product Builder API is running' });
});

// Static file serving for exports (use absolute path)
const exportsPath = path.join(__dirname, '..', 'exports');

// Enhanced CORS middleware for exports with proper OPTIONS handling
app.use('/exports', (req, res, next) => {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

app.use('/exports', express.static(exportsPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.stl')) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Accept-Ranges', 'bytes');
    } else if (filePath.endsWith('.step')) {
      res.setHeader('Content-Type', 'application/step');
    }
  }
}));

// Serve React app static files
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
app.use(express.static(clientBuildPath));

// Handle React routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Product Builder API running on port ${PORT}`);
  console.log(`📁 Serving exports from: ${exportsPath}`);
});
