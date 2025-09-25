// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(403).json({ message: 'No token provided.' });
    }

    // Token format is "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'Malformed token.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
        }
        // If everything is good, save the decoded user to the request for use in other routes
        req.user = decoded;
        next();
    });
};

const isAdmin = (req, res, next) => {
    // This middleware should run AFTER verifyToken
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
};

module.exports = { verifyToken, isAdmin };