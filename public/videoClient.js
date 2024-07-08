const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'], // use WebSocket first, if available
});
const videoGrid = document.querySelector('#video-grid');
const connectingMessage = document.createElement('div'); // Create a div for connecting message
connectingMessage.textContent = 'Connecting...'; // Set initial text content
connectingMessage.style.color = 'white'; // Optional: Set styles for the message
connectingMessage.style.position = 'absolute';
connectingMessage.style.top = '50%';
connectingMessage.style.left = '50%';
connectingMessage.style.transform = 'translate(-50%, -50%)';
connectingMessage.style.fontWeight = 'bold';
videoGrid.appendChild(connectingMessage); // Append message to video grid initially hidden

const myPeer = new Peer();
let myPeerId = null; // Store my Peer ID

const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};
let userCount = 0; // Initialize user count

let reconnectInterval = null; // Interval for reconnect attempts

navigator.mediaDevices
  .getUserMedia({
    video: {
      width: { min: 1024, ideal: 1280, max: 1920 },
      height: { min: 576, ideal: 720, max: 1080 },
    },
    audio: true,
  })
  .then((stream) => {
    console.log('stream added');
    addVideoStream(myVideo, stream);

    myPeer.on('open', (id) => {
      myPeerId = id; // Store my Peer ID
      socket.emit('join-room', roomId, id);
    });

    myPeer.on('call', (call) => {
      console.log('New user joined');
      call.answer(stream);
      console.log('Answer call');
      const video = document.createElement('video');
      call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream);
        removeConnectingMessage();
      });
      call.on('close', () => {
        video.remove();
        userCount--; // Decrement user count
        updateUsersDisplay();
      });
      peers[call.peer] = call;
    });

    socket.on('user-connected', (userId) => {
      console.log('Guest is connecting');
      setTimeout(connectToNewUser, 3000, userId, stream);
      showConnectingMessage();
      userCount++;
      updateUsersDisplay();
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      clearInterval(reconnectInterval); // Clear reconnect attempts if connected
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      startReconnectInterval();
    });

    socket.on('connect_error', (err) => {
      console.log(`connect_error due to ${err.message}`);
      startReconnectInterval();
    });

    socket.on('user-disconnect', (userID) => {
      if (peers[userID]) peers[userID].close();
    });
  })
  .catch(function (error) {
    alert(error);
  });

function addVideoStream(video, stream) {
  video.srcObject = stream;
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) video.autoplay = true;
  video.addEventListener(
    'loadeddata',
    () => {
      video.play();
    },
    false,
  );
  videoGrid.append(video);
}

const connectToNewUser = (userId, stream) => {
  console.log('New user has joined', userId);
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', (userVideoStream) => {
    addVideoStream(video, userVideoStream);
    removeConnectingMessage();
  });
  call.on('close', () => {
    video.remove();
    userCount--; // Decrement user count
    updateUsersDisplay();
  });
  peers[userId] = call;
};

function showConnectingMessage() {
  connectingMessage.style.display = 'block';
}

function removeConnectingMessage() {
  connectingMessage.style.display = 'none';
}

function updateUsersDisplay() {
  // Example: Update a div with id 'user-count' to display the current user count
  const userCountElement = document.getElementById('user-count');
  if (userCountElement) {
    userCountElement.textContent = `Users Connected: ${userCount}`;
  }
}

function startReconnectInterval() {
  // Attempt to reconnect every 5 seconds
  if (!reconnectInterval) {
    reconnectInterval = setInterval(() => {
      console.log('Attempting to reconnect...');
      socket.connect(); // Try to reconnect socket
    }, 5000); // Adjust the interval as needed
  }
}
