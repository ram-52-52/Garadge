const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mechanic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mechanic'
    },
    issueType: {
        type: [String],
        enum: ['PUNCTURE', 'BATTERY', 'ENGINE', 'FUEL', 'GENERAL'],
        required: [true, 'Please select at least one issue type']
    },
    vehicleType: {
        type: String,
        enum: ['2-WHEELER', '4-WHEELER'],
        required: [true, 'Please select your vehicle type']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    imageUrl: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'on-the-way', 'completed', 'cancelled'],
        default: 'pending'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    address: {
        type: String
    },
    price: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

requestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Request', requestSchema);
