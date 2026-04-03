const socketIO = require('socket.io');

const initSocket = (server) => {
    const io = socketIO(server, {
        cors: {
            origin: "*", // In production, specify your frontend URL
            methods: ["GET", "POST"]
        }
    });

    console.log('⚡ Socket.io middleware initialized');

    io.on('connection', (socket) => {
        console.log(`🔌 New client connected: ${socket.id}`);

        /**
         * @section Join Room
         * Rooms are based on Request ID for private updates
         */
        socket.on('join-room', (requestId) => {
            socket.join(requestId);
            console.log(`🏠 Client ${socket.id} joined room: ${requestId}`);
        });

        /**
         * @section New Request Broadcast
         * Broadcasts a new request only to relevant mechanics
         */
        socket.on('new-request', (data) => {
            // This is usually triggered from the REST API createRequest,
            // but can also be emitted here for instant UI updates.
            io.emit('request-received', data);
        });

        /**
         * @section Request Accepted
         * Notifies the user that a mechanic is on their way
         */
        socket.on('accept-request', (data) => {
            const { requestId, mechanicId, mechanicName } = data;
            io.to(requestId).emit('request-accepted', {
                mechanicId,
                mechanicName,
                status: 'accepted'
            });
            console.log(`✅ Request ${requestId} accepted by ${mechanicName}`);
        });

        /**
         * @section Live Tracking
         * Sends mechanic's real-time coordinates to the user's room
         */
        socket.on('mechanic-location', (data) => {
            const { requestId, location } = data; // location: { lat, lng }
            io.to(requestId).emit('location-update', { location });
        });

        /**
         * @section Status Update
         * Broad status changes (On the way -> Arrived -> Completed)
         */
        socket.on('status-update', (data) => {
            const { requestId, status } = data;
            io.to(requestId).emit('status-changed', { status });
            console.log(`📈 Status for ${requestId} changed to ${status}`);
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

module.exports = initSocket;
