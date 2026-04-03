const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mechanic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mechanic',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Please add a rating between 1 and 5'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: [true, 'Please add a comment']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Update the average rating of the mechanic
reviewSchema.statics.getAverageRating = async function(mechanicId) {
    const obj = await this.aggregate([
        { $match: { mechanic: mechanicId } },
        { 
            $group: {
                _id: '$mechanic',
                averageRating: { $avg: '$rating' },
                totalRatings: { $sum: 1 }
            }
        }
    ]);

    try {
        if (obj[0]) {
            await mongoose.model('Mechanic').findByIdAndUpdate(mechanicId, {
                rating: Number(obj[0].averageRating).toFixed(1),
                totalRatings: obj[0].totalRatings
            });
        }
    } catch (err) {
        console.error(err);
    }
};

// Call getAverageRating after save
reviewSchema.post('save', function() {
    this.constructor.getAverageRating(this.mechanic);
});

module.exports = mongoose.model('Review', reviewSchema);
