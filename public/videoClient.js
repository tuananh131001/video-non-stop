const socket = io(SOCKET_URL, {
  transports: ['websocket'],
});
const videoGrid = document.querySelector('#video-grid');

const myPeer = new Peer();

const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};

navigator.mediaDevices
  .getUserMedia({
    video: {
      width: { min: 1024, ideal: 1280, max: 1920 },
      height: { min: 576, ideal: 720, max: 1080 },
    },
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
      setTimeout(connectToNewUser, 3000, userId, stream);
    });
  })
  .catch(function (error) {
    alert(error);
  });

myPeer.on('open', (id) => {
  socket.emit('join-room', roomId, id);
});

socket.on('user-disconnect', (userID) => {
  if (peers[userID]) peers[userID].close();
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
  });
  call.on('close', () => {
    video.remove();
  });
  peers[userId] = call;
};
