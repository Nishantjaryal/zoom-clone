const socket = io('/');

let peers = {};

// PeerJS setup
const myPeer = new Peer(undefined, {
    host: 'localhost',
    port: '3001',
    secure: false // Ensure this is set to false since you're using HTTP
});

// Event when PeerJS connection is established
myPeer.on('open', id => {
    console.log('Peer connection opened with ID:', id);
    socket.emit('join-room', room_id, id);
});

// Handle PeerJS errors
myPeer.on('error', err => {
    console.error('PeerJS error:', err);
});

// Handle Socket.IO connection errors
socket.on('connect_error', err => {
    console.error('Socket.IO connection error:', err);
});

// Handle general Socket.IO errors
socket.on('error', err => {
    console.error('Socket.IO error:', err);
});

const vidGrid = document.getElementById("video-grid");

const myVid = document.createElement('video');
myVid.muted = true;

// Access user's media devices
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    console.log('Media stream obtained:', stream);
    addVidStream(myVid, stream);

    // Handle incoming calls
    myPeer.on('call', call => {
        console.log('Receiving call from:', call.peer);
        call.answer(stream);

        const userVid = document.createElement('video');

        call.on('stream', userVidStream => {
            console.log('Stream received from:', call.peer);
            addVidStream(userVid, userVidStream);
        });
    });

    // Handle new user connection
    socket.on('user-connected', userId => {
        console.log('User connected:', userId);
        connectToNewUser(userId, stream);
    });

}).catch(error => {
    console.error('Error accessing media devices:', error);
});

// Handle user disconnection
socket.on('user-disconnect', userId => {
    console.log('User disconnected:', userId);
    if (peers[userId]) peers[userId].close();
});

// Function to add video stream to the video grid
function addVidStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    vidGrid.append(video);
}

// Function to connect to a new user
function connectToNewUser(userId, stream) {
    console.log('Connecting to new user:', userId);
    const call = myPeer.call(userId, stream);
    const userVid = document.createElement('video');

    call.on('stream', userVidStream => {
        console.log('Stream received from new user:', userId);
        addVidStream(userVid, userVidStream);
    });

    call.on('close', () => {
        console.log('Call closed with user:', userId);
        userVid.remove();
    });

    call.on('error', err => {
        console.error('Call error with user:', userId, err);
    });

    peers[userId] = call;
}
