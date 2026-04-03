const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Mechanic = require('../models/Mechanic');

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized for this route' });
    }

    try {
        // Decode token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'antigravity_secret_key_777');

        // Check if user or mechanic
        const user = await User.findById(decoded.id) || await Mechanic.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'No user found' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }
};

// Grant access to specific roles
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ 
            success: false, 
            message: `User role ${req.user.role} is not authorized to access this route` 
        });
    }
};
