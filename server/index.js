require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// In-memory room state
// rooms = {
//   roomId: {
//     trackerSocketId: string | null,
//     trackedSocketId: string | null,
//     lastPosition: object | null
//   }
// }
const rooms = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (roomId) => {
        // Validate roomId
        if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
            return;
        }

        roomId = roomId.trim();

        // Initialize room if doesn't exist
        if (!rooms[roomId]) {
            rooms[roomId] = {
                trackerSocketId: null,
                trackedSocketId: null,
                lastPosition: null
            };
        }

        const room = rooms[roomId];

        // Check if room is full
        if (room.trackerSocketId && room.trackedSocketId) {
            socket.emit('room_full');
            return;
        }

        // Assign role
        let role = '';
        if (!room.trackerSocketId) {
            room.trackerSocketId = socket.id;
            role = 'tracker';
        } else {
            room.trackedSocketId = socket.id;
            role = 'tracked';
        }

        // Join socket.io room
        socket.join(roomId);

        // Track which room this socket is in
        socket.roomId = roomId;

        console.log(`Socket ${socket.id} joined room ${roomId} as ${role}`);

        // Emit assigned role to user
        socket.emit('role_assigned', role);

        // If tracked user joined, notify tracker
        if (role === 'tracked' && room.trackerSocketId) {
            socket.to(room.trackerSocketId).emit('participant_joined');
        }

        // If there's a last known position and this is the tracked user, send it immediately
        if (role === 'tracked' && room.lastPosition) {
            socket.emit('map_sync', room.lastPosition);
        }
    });

    socket.on('map_update', (data) => {
        const { roomId, center, zoom, tilt, timestamp } = data;

        if (!roomId || !rooms[roomId]) return;

        // Only tracker can update the map
        if (rooms[roomId].trackerSocketId !== socket.id) return;

        // Store last position
        rooms[roomId].lastPosition = { center, zoom, tilt, timestamp };

        // Broadcast to others in the room
        socket.to(roomId).emit('map_sync', rooms[roomId].lastPosition);
    });

    socket.on('disconnecting', () => {
        // disconnecting event allows us to access socket.rooms before it's actually disconnected
        handleDisconnect(socket);
    });

    // also handle standard disconnect just in case
    socket.on('disconnect', () => {
        // handleDisconnect relies on socket.roomId tracking
        handleDisconnect(socket);
    });
});

function handleDisconnect(socket) {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;

    const room = rooms[roomId];

    console.log(`Socket ${socket.id} disconnected from room ${roomId}`);

    if (room.trackerSocketId === socket.id) {
        // Tracker disconnected
        room.trackerSocketId = null;

        if (room.trackedSocketId) {
            // Promote tracked -> tracker
            console.log(`Promoting tracked user ${room.trackedSocketId} to tracker in room ${roomId}`);
            room.trackerSocketId = room.trackedSocketId;
            room.trackedSocketId = null;

            // Emit new role directly to the promoted socket
            io.to(room.trackerSocketId).emit('role_assigned', 'tracker');

            // Also notify them so they know someone disconnected
            io.to(room.trackerSocketId).emit('user_disconnected', 'tracker_left_promoted');
        } else {
            // Room is empty, clean up
            delete rooms[roomId];
        }
    } else if (room.trackedSocketId === socket.id) {
        // Tracked user disconnected
        room.trackedSocketId = null;

        if (room.trackerSocketId) {
            // Notify tracker that the tracked user left
            io.to(room.trackerSocketId).emit('user_disconnected', 'tracked_left');
        }
    }

    // Clear socket's roomId so it only happens once
    delete socket.roomId;
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
