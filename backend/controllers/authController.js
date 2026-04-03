const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Mechanic = require('../models/Mechanic');

// @desc    Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

// @desc    Register a new user (Customer or Mechanic)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, services, pricing } = req.body;

        const Model = role === 'mechanic' ? Mechanic : User;
        
        // Check if user exists
        const userExists = await Model.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create user
        const userData = { name, email, password };
        if (role === 'mechanic') {
            userData.services = services || ['General Service'];
            userData.pricing = pricing || 0;
            userData.role = 'mechanic';
        }

        const user = new Model(userData);
        
        // STRICT SAVE with await
        await user.save();

        if (user) {
            res.status(201).json({
                success: true,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: role,
                token: generateToken(user._id)
            });
        }
    } catch (error) {
        // Catch validation errors specifically for 400
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: Object.values(error.errors).map(v => v.message) });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Login user / mechanic
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // 🛡️ ADMIN OVERRIDE LOGIN
        if (email === 'admin@yopmail.com' && password === 'Admin@123') {
            let admin = await User.findOne({ email: 'admin@yopmail.com' });
            
            // Auto-create admin if it doesn't exist
            if (!admin) {
                admin = await User.create({
                    name: 'Super Admin',
                    email: 'admin@yopmail.com',
                    password: 'Admin@123', // Model will hash this on create
                    role: 'admin'
                });
            }

            return res.json({
                success: true,
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: 'admin',
                token: generateToken(admin._id)
            });
        }

        // 🧠 Smart Collection Selector
        const Model = role === 'mechanic' ? Mechanic : User;
        const OtherModel = role === 'mechanic' ? User : Mechanic;

        const user = await Model.findOne({ email }).select('+password');
        
        if (!user) {
            // Check if user exists in the OTHER collection to provide a better error
            const otherUser = await OtherModel.findOne({ email });
            if (otherUser) {
                const registeredAs = role === 'mechanic' ? 'Customer' : 'Mechanic';
                return res.status(401).json({ 
                    success: false, 
                    message: `This account is registered as a ${registeredAs}. Please switch the toggle to ${registeredAs}.` 
                });
            }
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        res.json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role || (role === 'mechanic' ? 'mechanic' : 'customer'), 
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: req.user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { vehicleTypes, expertise, name, services, pricing, addresses, gender } = req.body;
        
        let user;
        const updateData = {};
        if (name) updateData.name = name;
        if (gender) updateData.gender = gender;
        if (addresses) updateData.addresses = addresses;

        if (req.user.role === 'mechanic') {
            if (vehicleTypes) updateData.vehicleTypes = vehicleTypes;
            if (expertise) updateData.expertise = expertise;
            if (services) updateData.services = services;
            if (pricing) updateData.pricing = pricing;

            user = await Mechanic.findByIdAndUpdate(req.user._id, updateData, {
                new: true,
                runValidators: true
            });
        } else {
            user = await User.findByIdAndUpdate(req.user._id, updateData, {
                new: true,
                runValidators: true
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
