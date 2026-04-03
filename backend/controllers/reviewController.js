const Review = require('../models/Review');
const Request = require('../models/Request');

// @desc    Add a review for a service
// @route   POST /api/reviews
// @access  Private (Customer)
exports.addReview = async (req, res) => {
    try {
        const { requestId, rating, comment } = req.body;

        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Ensure user is the one who made the request
        if (request.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const review = await Review.create({
            request: requestId,
            user: req.user.id,
            mechanic: request.mechanic,
            rating,
            comment
        });

        res.status(201).json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get reviews for a mechanic
// @route   GET /api/reviews/mechanic/:mechanicId
// @access  Public
exports.getMechanicReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ mechanic: req.params.mechanicId })
            .populate('user', 'name');

        res.status(200).json({ success: true, count: reviews.length, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
