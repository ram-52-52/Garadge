const express = require('express');
const router = express.Router();
const { createRequest, getRequests, updateRequestStatus, getRequest } = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @desc Get all requests
 * @access Private (authenticated users only)
 */
router.get('/', protect, getRequests);

/**
 * @desc Create a new request & find nearby mechanics
 * @access Private (authenticated users only)
 */
router.post('/', protect, createRequest);

/**
 * @desc Get single request & update status
 * @access Private (authenticated users only)
 */
router.get('/:id', protect, getRequest);
router.put('/:id', protect, updateRequestStatus);

module.exports = router;
