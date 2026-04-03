const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Request = require('../models/Request');

/**
 * @desc Create a mock payment order
 * @route POST /api/payments/order
 */
router.post('/order', protect, async (req, res) => {
    try {
        const { requestId, amount } = req.body;
        
        // In real Razorpay, you would call razorpay.orders.create()
        // Here we return a mock order ID
        const mockOrderId = `order_${Math.random().toString(36).substring(7)}`;

        res.json({
            success: true,
            orderId: mockOrderId,
            amount,
            currency: 'INR'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @desc Verify mock payment
 * @route POST /api/payments/verify
 */
router.post('/verify', protect, async (req, res) => {
    try {
        const { requestId, paymentId, orderId } = req.body;

        // Update the request status to completed and paid
        const request = await Request.findByIdAndUpdate(requestId, {
            status: 'completed'
        }, { new: true });

        res.json({
            success: true,
            message: 'Payment verified and request completed',
            data: request
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
