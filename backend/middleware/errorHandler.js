// backend/middleware/errorHandler.js

class AppError extends Error {
    constructor(message, statusCode, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            success: false,
            error: err,
            message: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            timestamp: new Date().toISOString()
        });
    }
};

const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const notFound = (req, res) => {
    res.status(404).json({ error: 'Not found' });
};

module.exports = {
    AppError,
    globalErrorHandler,
    catchAsync,
    notFound
};