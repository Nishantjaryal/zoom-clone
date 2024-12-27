const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.use(express.static('public')); // Serve static files from the "public" directory

// Home route
app.get("/", (req, res) => {
    res.render('home');
});

// Generate a new room ID
app.get("/gen", (req, res) => {
    res.render('generate', { id: `${uuidV4()}` });
});

// Error route for bad requests
app.get("/Bad-Request", (req, res) => {
    res.render('err');
});

// Room route - captures dynamic room IDs
app.get("/:room", (req, res) => {
    res.render('room', { roomId: req.params.room });
});

// Socket.IO connection handling
io.on("connection", socket => {
    socket.on('join-room', (roomId, userId) => {
        console.log(`${userId} joined room: ${roomId}`);
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', userId);

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`${userId} disconnected from room: ${roomId}`);
            socket.broadcast.to(roomId).emit('user-disconnect', userId);
        });
    });
});

// Start the server on port 3000
server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
