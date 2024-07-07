const socket = io('http://localhost:3002');
const videoGrid = document.querySelector('#video-grid');

const myPeer = new Peer();

const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    myPeer.on('call', (call) => {
      console.log('New user joined');
      call.answer(stream);
      console.log('Answer call');
      const video = document.createElement('video');
      call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on('user-connected', (userId) => {
      setTimeout(connectToNewUser, 1000, userId, stream);
    });
  });

myPeer.on('open', (id) => {
  socket.emit('join-room', roomId, id);
});

socket.on('user-disconnect', (userID) => {
  if (peers[userID]) peers[userID].close();
});

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}

const connectToNewUser = (userId, stream) => {
  console.log('New user has joined', userId);
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on('close', () => {
    video.remove();
  });
  peers[userId] = call;
};
