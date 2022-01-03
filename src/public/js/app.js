const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;

let roomName;

let myPeerConnection;
let myDataChannel;


async function getCameras(){
    try {
        const devices = await navigator.mediaDevices.enumerateDevices(); // Promise => await 해줘야함
        // console.log(devices);
        const cameras = devices.filter(device => device.kind === "videoinput");
        // console.log(cameras);
        const currentCamera = myStream.getVideoTracks()[0];

        cameras.forEach(camera => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label){
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        })
    } catch (e) {
        console.log(e);
    } 
}

async function getMedia(deviceId){
    const initialConstraints = {
        audio: true,
        video: {facingMode: "user"},
    };
    const cameraConstraints = {
        audio: true,
        video: {deviceId: {exact: deviceId}},
    };
    
    try {
    // myStream = await navigator.mediaDevices.getUserMedia(
    //     {
    //         audio: true,
    //         video: true,
    //     } 
    // );
    // console.log(myStream);

    myStream = await navigator.mediaDevices.getUserMedia(
        deviceId ? cameraConstraints : initialConstraints
    );
    myFace.srcObject = myStream;
    if(!deviceId){
        await getCameras();
    }
    } catch (e) {
        console.log(e);
    }

}

// getMedia();

function handleMuteClick() {
    // console.log(myStream.getAudioTracks());
    myStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    
    if(!muted){
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute"; 
        muted = false;
    }
}

function handleCameraClick() {
    // console.log(myStream.getVideoTracks());
    myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));

    if(cameraOff){
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    } else {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

async function handleCameraChange() {
    // console.log(camerasSelect.value);
    await getMedia(camerasSelect.value);

    if(myPeerConnection) {
        // console.log(myPeerConnection.getSenders());
        const videoTrack = myStream.getVideoTracks()[0];

        const videoSender = myPeerConnection
            .getSenders()
            .find((sender) => sender.track.kind === "video");
        // console.log(videoSender);
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);



/// Welcome Form (join a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form")

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    // console.log(input.value);
    roomName = input.value;
    await initCall(); //await은 async 함수에서만 유효함
    socket.emit("join_room", roomName);
    input.value = "";
}

welcome.addEventListener("submit", handleWelcomeSubmit);



// Socket Code

socket.on("welcome", async () => {
    // console.log("Someone joined!");
    myDataChannel = myPeerConnection.createDataChannel("chat");
    // myDataChannel.addEventListener("message", console.log);
    myDataChannel.addEventListener("message", (event) => console.log(event.data));
    console.log("made data channel");

    const offer = await  myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    // console.log(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
    // console.log(offer);
    // myPeerConnection.addEventListener("datachannel", console.log);
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        // myDataChannel.addEventListener("message", console.log);
        myDataChannel.addEventListener("message", (event) => console.log(event.data));
    });    

    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    // console.log(answer);
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer");
});

socket.on("answer", async (answer) => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
    console.log("received the candidate");
    myPeerConnection.addIceCandidate(ice);
});



// RTC Code

function makeConnection() {
    // myPeerConnection = new RTCPeerConnection();
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    // "stun:stun2.l.google.com:19302",
                    // "stun:stun3.l.google.com:19302",
                    // "stun:stun4.l.google.com:19302",
                ]    
            }
        ]
    });

    // myPeerConnection.onicecandidate = (e) => {
    //     if (!e.candidate) return;
    //     console.log(e.candidate.candidate)
    // };
    // myPeerConnection.onicecandidateerror = (e) => {
    //     console.error(e);
    // };
      

    // console.log(myStream.getTracks());
    myPeerConnection.addEventListener("icecandidate",handleIce);
    // myPeerConnection.addEventListener("addstream", handleAddStream);
    myPeerConnection.addEventListener("track", handleTrack);


    myStream
        .getTracks()
        .forEach((track) => myPeerConnection.addTrack(track, myStream));
    // console.log(myPeerConnection);
}

function handleIce(data){
    // console.log("got ice candidate");
    // console.log(data);
    console.log("sent the candidate");
    socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
    console.log("got a stream from my peer");
    // console.log(data.stream);
    // console.log("Peer's stream: ", data.stream);
    // console.log("My stream: ", myStream);

    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
}


function handleTrack(data) {
    console.log("handle track");
    const peerFace = document.querySelector("#peerFace");
    peerFace.srcObject = data.streams[0];
}
