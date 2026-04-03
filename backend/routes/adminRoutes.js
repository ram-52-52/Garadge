const express = require('express');
const router = express.Router();
const { 
    getPlatformStats, 
    getPendingMechanics, 
    approveMechanic, 
    getAllUsers, 
    getAllMechanics 
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);
router.use(isAdmin);

router.get('/stats', getPlatformStats);
router.get('/pending-mechanics', getPendingMechanics);
router.put('/approve-mechanic/:id', approveMechanic);
router.get('/users', getAllUsers);
router.get('/mechanics', getAllMechanics);

module.exports = router;
