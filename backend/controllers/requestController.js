const Request = require('../models/Request');
const Mechanic = require('../models/Mechanic');

// @desc    Create a new service request & find nearby mechanics
// @route   POST /api/requests
// @access  Private (User)
exports.createRequest = async (req, res) => {
    try {
        const { issueType, vehicleType, description, location, address } = req.body;

        // 🛠️ Normalize data for the new schema
        const normalizedVehicle = (vehicleType === '2-wheel' || vehicleType === '2-WHEELER') ? '2-WHEELER' : '4-WHEELER';
        const normalizedIssues = Array.isArray(issueType) 
            ? issueType.map(i => i.toUpperCase().split(' ')[0]) // Take first word to avoid "GENERAL SERVICE" mismatch
            : [issueType.toUpperCase().split(' ')[0]];

        // Ensure location is formatted correctly for GeoJSON: [longitude, latitude]
        const coordinates = location ? [location.lng, location.lat] : [72.5714, 23.0225];

        // Create the request
        const request = await Request.create({
            user: req.user._id,
            issueType: normalizedIssues,
            vehicleType: normalizedVehicle,
            description,
            location: {
                type: 'Point',
                coordinates: coordinates
            },
            address
        });

        // 🚀 Smart Matchmaking Engine with $geoNear
        const mechanics = await Mechanic.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: coordinates
                    },
                    distanceField: 'distance',
                    maxDistance: 10000, // 10km in meters
                    query: { 
                        isOnline: true,
                        vehicleTypes: { $in: [normalizedVehicle] },
                        expertise: { $in: normalizedIssues }
                    },
                    spherical: true
                }
            },
            {
                $project: {
                    name: 1,
                    location: 1,
                    rating: 1,
                    expertise: 1,
                    vehicleTypes: 1,
                    distance: 1,
                    distanceStr: {
                        $cond: {
                            if: { $lt: ["$distance", 1000] },
                            then: "Less than 1 km",
                            else: { 
                                $concat: [
                                    { $toString: { $round: [{ $divide: ["$distance", 1000] }, 1] } }, 
                                    " km away"
                                ] 
                            }
                        }
                    }
                }
            }
        ]);

        res.status(201).json({
            success: true,
            data: request,
            nearbyMechanics: mechanics
        });

        // 📢 Emit socket event AFTER response so user has time to join room
        const io = req.app.get('io');
        if (io) {
            io.emit('request-received', {
                request,
                nearbyMechanics: mechanics
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all requests (for Admin or individual user)
// @route   GET /api/requests
// @access  Private
exports.getRequests = async (req, res) => {
    try {
        let query;
        if (req.user.role === 'customer') {
            query = Request.find({ user: req.user._id });
        } else if (req.user.role === 'mechanic') {
            query = Request.find({ status: 'pending' }); // Mechanics see pending requests in radius usually, but for now all pending
        } else {
            query = Request.find();
        }

        const requests = await query.populate('user', 'name email').populate('mechanic', 'name email');
        res.status(200).json({ success: true, count: requests.length, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update request status
// @route   PUT /api/requests/:id
// @access  Private
exports.updateRequestStatus = async (req, res) => {
    try {
        const { status, mechanicId, price } = req.body;
        let request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Logic to prevent multiple mechanics from accepting
        if (status === 'accepted' && request.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Request already accepted by another mechanic' });
        }

        const updateData = { status };
        if (mechanicId) updateData.mechanic = mechanicId;
        if (price) updateData.price = price;

        request = await Request.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        // 📢 Emit socket event for status change
        const io = req.app.get('io');
        if (io) {
            io.to(req.params.id).emit('status-changed', { 
                status: request.status,
                requestId: request._id
            });
            
            if (status === 'accepted') {
                io.to(req.params.id).emit('request-accepted', {
                    mechanicId: request.mechanic,
                    status: 'accepted'
                });
            }
        }

        res.status(200).json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single request
// @route   GET /api/requests/:id
// @access  Private
exports.getRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate('user', 'name email')
            .populate('mechanic', 'name email');

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        res.status(200).json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
