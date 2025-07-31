
// Upload Middleware (middleware/upload.js)
const multer = require('multer');
const path = require('path');
const { AppError } = require('./errorHandler');

// Memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
    // Allowed image types
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    // Allowed document types
    const allowedDocTypes = ['application/pdf'];
    
    const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError('Invalid file type. Only JPEG, PNG, WebP images and PDF documents are allowed.', 400), false);
    }
};

// General upload configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5 // Maximum 5 files
    },
    fileFilter: fileFilter
});

// Specific upload configurations
const uploadConfigs = {
    // Single book image
    bookImage: upload.single('image'),
    
    // Multiple book images (up to 5)
    bookImages: upload.array('images', 5),
    
    // Profile picture
    profilePicture: upload.single('profilePicture'),
    
    // Documents (for verification)
    documents: upload.array('documents', 3),
    
    // Mixed upload (image + documents)
    mixed: upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'images', maxCount: 5 },
        { name: 'documents', maxCount: 3 }
    ])
};

// Upload validation middleware
const validateUpload = (requiredFields = []) => {
    return (req, res, next) => {
        // Check if files were uploaded when required
        if (requiredFields.length > 0) {
            const hasRequiredFiles = requiredFields.some(field => {
                return (req.file && req.file.fieldname === field) ||
                       (req.files && (
                           (Array.isArray(req.files) && req.files.some(f => f.fieldname === field)) ||
                           (req.files[field] && req.files[field].length > 0)
                       ));
            });

            if (!hasRequiredFiles) {
                return next(new AppError(`Required file fields: ${requiredFields.join(', ')}`, 400));
            }
        }

        // Validate file sizes and types
        const files = req.file ? [req.file] : (Array.isArray(req.files) ? req.files : Object.values(req.files || {}).flat());
        
        for (const file of files) {
            // Additional file type validation
            if (file.fieldname === 'image' || file.fieldname === 'images' || file.fieldname === 'profilePicture') {
                const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!allowedImageTypes.includes(file.mimetype)) {
                    return next(new AppError('Image must be JPEG, PNG, or WebP format', 400));
                }
                
                // Check image file size (5MB for images)
                if (file.size > 5 * 1024 * 1024) {
                    return next(new AppError('Image size must be less than 5MB', 400));
                }
            }
            
            if (file.fieldname === 'documents') {
                if (file.mimetype !== 'application/pdf') {
                    return next(new AppError('Documents must be PDF format', 400));
                }
                
                // Check document file size (10MB for documents)
                if (file.size > 10 * 1024 * 1024) {
                    return next(new AppError('Document size must be less than 10MB', 400));
                }
            }
        }

        next();
    };
};

// Clean up uploaded files on error
const cleanupFiles = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
        // If there was an error and files were uploaded to temp storage
        if (res.statusCode >= 400 && (req.file || req.files)) {
            // Files are in memory, so no cleanup needed for memory storage
            // This middleware is more relevant for disk storage
        }
        
        originalSend.call(this, data);
    };
    
    next();
};

module.exports = {
    upload,
    uploadConfigs,
    validateUpload,
    cleanupFiles
};

// Security Middleware (middleware/security.js)
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['http://localhost:3000', 'http://localhost:3001'];
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

// Helmet configuration
const helmetOptions = {
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    }
};

// HPP whitelist for parameters that can have multiple values
const hppWhitelist = [
    'category',
    'condition',
    'tags',
    'sort'
];

const setupSecurity = (app) => {
    // Enable trust proxy for accurate IP addresses
    app.set('trust proxy', 1);
    
    // Security headers
    app.use(helmet(helmetOptions));
    
    // CORS
    app.use(cors(corsOptions));
    
    // Data sanitization against NoSQL query injection
    app.use(mongoSanitize());
    
    // Data sanitization against XSS
    app.use(xss());
    
    // Prevent parameter pollution
    app.use(hpp({
        whitelist: hppWhitelist
    }));
    
    // Custom security headers
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        next();
    });
};

module.exports = {
    setupSecurity,
    corsOptions,
    helmetOptions
};

// Logging Middleware (middleware/logger.js)
const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Winston logger configuration
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'librolink-api' },
    transports: [
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({ 
            filename: path.join(logsDir, 'error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs to combined.log
        new winston.transports.File({ 
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// HTTP request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log request
    logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || 'anonymous'
    });
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(...args) {
        const duration = Date.now() - start;
        
        logger.info('Request completed', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userId: req.user?.id || 'anonymous'
        });
        
        originalEnd.apply(this, args);
    };
    
    next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
    logger.error('Error occurred', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userId: req.user?.id || 'anonymous',
        body: req.body,
        params: req.params,
        query: req.query
    });
    
    next(err);
};

module.exports = {
    logger,
    requestLogger,
    errorLogger
};