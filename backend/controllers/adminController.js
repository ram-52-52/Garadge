const User = require('../models/User');
const Mechanic = require('../models/Mechanic');
const Request = require('../models/Request');

// @desc    Get all platform statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getPlatformStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'customer' });
        const totalMechanics = await Mechanic.countDocuments();
        
        // Sum up revenue from completed requests
        const completedRequests = await Request.find({ status: 'completed' });
        const totalRevenue = completedRequests.reduce((acc, curr) => acc + (curr.price || 0), 0);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalMechanics,
                totalRevenue,
                totalRequests: await Request.countDocuments()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all pending mechanic approvals
// @route   GET /api/admin/pending-mechanics
// @access  Private/Admin
exports.getPendingMechanics = async (req, res) => {
    try {
        const pendingMechanics = await Mechanic.find({ isVerified: false }).sort('-createdAt');

        res.status(200).json({
            success: true,
            count: pendingMechanics.length,
            data: pendingMechanics
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Approve/Verify a mechanic
// @route   PUT /api/admin/approve-mechanic/:id
// @access  Private/Admin
exports.approveMechanic = async (req, res) => {
    try {
        const mechanic = await Mechanic.findByIdAndUpdate(
            req.params.id, 
            { isVerified: true }, 
            { new: true, runValidators: false }
        );

        if (!mechanic) {
            return res.status(404).json({ success: false, message: 'Mechanic not found' });
        }

        res.status(200).json({
            success: true,
            message: `Mechanic ${mechanic.name} has been verified`,
            data: mechanic
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all users (Admin view)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'customer' }).sort('-createdAt');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all mechanics (Admin view)
// @route   GET /api/admin/mechanics
// @access  Private/Admin
exports.getAllMechanics = async (req, res) => {
    try {
        const mechanics = await Mechanic.find().sort('-createdAt');
        res.status(200).json({ success: true, count: mechanics.length, data: mechanics });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
