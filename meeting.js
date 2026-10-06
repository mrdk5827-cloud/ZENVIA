/* =========================================
   ZENVIA - WEBRTC MEETING
========================================= */

"use strict";

/* =========================================
   RENDER SIGNALING SERVER
========================================= */

const SIGNALING_SERVER =
    "https://zenvia-g2u.onrender.com";


/* =========================================
   ELEMENTS
========================================= */

const localVideo =
    document.getElementById("localVideo");

const remoteVideo =
    document.getElementById("remoteVideo");

const micBtn =
    document.getElementById("micBtn");

const cameraBtn =
    document.getElementById("cameraBtn");

const screenShareBtn =
    document.getElementById("screenShareBtn");

const participantsBtn =
    document.getElementById("participantsBtn");

const chatBtn =
    document.getElementById("chatBtn");

const leaveBtn =
    document.getElementById("leaveBtn");

const shareMeetingBtn =
    document.getElementById("shareMeetingBtn");

const meetingIdDisplay =
    document.getElementById("meetingIdDisplay");

const shareMeetingId =
    document.getElementById("shareMeetingId");

const connectionText =
    document.getElementById("connectionText");

const cameraOffMessage =
    document.getElementById("cameraOffMessage");

const statusMessage =
    document.getElementById("statusMessage");

const statusMessageText =
    document.getElementById("statusMessageText");

const participantsPanel =
    document.getElementById("participantsPanel");

const chatPanel =
    document.getElementById("chatPanel");

const closeParticipants =
    document.getElementById("closeParticipants");

const closeChat =
    document.getElementById("closeChat");

const shareModal =
    document.getElementById("shareModal");

const closeShareModal =
    document.getElementById("closeShareModal");

const copyMeetingIdBtn =
    document.getElementById("copyMeetingIdBtn");

const copyMessage =
    document.getElementById("copyMessage");

const leaveModal =
    document.getElementById("leaveModal");

const cancelLeave =
    document.getElementById("cancelLeave");

const confirmLeave =
    document.getElementById("confirmLeave");

const chatForm =
    document.getElementById("chatForm");

const chatInput =
    document.getElementById("chatInput");

const chatMessages =
    document.getElementById("chatMessages");


/* =========================================
   VARIABLES
========================================= */

let localStream = null;

let screenStream = null;

let peerConnection = null;

let remoteSocketId = null;

let socket = null;

let micEnabled = true;

let cameraEnabled = true;

let isScreenSharing = false;

let statusTimer = null;


/* =========================================
   MEETING ID
========================================= */

function generateMeetingId() {

    const letters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let randomLetters = "";

    for (let i = 0; i < 3; i++) {

        randomLetters +=
            letters[
                Math.floor(
                    Math.random() *
                    letters.length
                )
            ];
    }

    const randomNumber =
        Math.floor(
            100000 +
            Math.random() * 900000
        );

    return `ZEN-${randomLetters}-${randomNumber}`;
}


function getMeetingId() {

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const urlMeetingId =
        urlParams.get("id");

    if (urlMeetingId) {

        return urlMeetingId.toUpperCase();
    }

    const savedMeetingId =
        localStorage.getItem(
            "zenviaMeetingId"
        );

    if (savedMeetingId) {

        return savedMeetingId;
    }

    const newId =
        generateMeetingId();

    localStorage.setItem(
        "zenviaMeetingId",
        newId
    );

    return newId;
}


const meetingId =
    getMeetingId();


/* =========================================
   DISPLAY MEETING ID
========================================= */

function displayMeetingId() {

    if (meetingIdDisplay) {

        meetingIdDisplay.textContent =
            meetingId;
    }

    if (shareMeetingId) {

        shareMeetingId.textContent =
            meetingId;
    }
}


/* =========================================
   STATUS
========================================= */

function showStatus(message) {

    if (!statusMessage ||
        !statusMessageText) {

        return;
    }

    statusMessageText.textContent =
        message;

    statusMessage.classList.add(
        "show"
    );

    clearTimeout(statusTimer);

    statusTimer =
        setTimeout(() => {

            statusMessage.classList.remove(
                "show"
            );

        }, 2500);
}


/* =========================================
   CONNECTION STATUS
========================================= */

function setConnectionStatus(
    text,
    connected = false
) {

    if (connectionText) {

        connectionText.textContent =
            text;
    }

    const dot =
        document.querySelector(
            ".status-dot"
        );

    if (!dot) return;

    if (connected) {

        dot.style.background =
            "#36d98a";

        dot.style.boxShadow =
            "0 0 10px rgba(54,217,138,.6)";

    } else {

        dot.style.background =
            "#ffb020";

        dot.style.boxShadow =
            "0 0 10px rgba(255,176,32,.6)";
    }
}


/* =========================================
   CAMERA + MICROPHONE
========================================= */

async function startCameraAndMic() {

    try {

        setConnectionStatus(
            "Requesting access..."
        );

        localStream =
            await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

        if (localVideo) {

            localVideo.srcObject =
                localStream;

            localVideo.muted = true;

            localVideo.playsInline = true;

            localVideo.classList.add(
                "active"
            );
        }

        cameraEnabled = true;

        micEnabled = true;

        updateCameraUI();

        updateMicUI();

        setConnectionStatus(
            "Connecting..."
        );

        connectToServer();

    } catch (error) {

        console.error(
            "Camera/Mic error:",
            error
        );

        setConnectionStatus(
            "Permission needed"
        );

        if (error.name ===
            "NotAllowedError") {

            showStatus(
                "Camera/microphone permission allow karo."
            );

        } else {

            showStatus(
                "Camera aur microphone start nahi ho paya."
            );
        }

        cameraEnabled = false;

        micEnabled = false;

        updateCameraUI();

        updateMicUI();
    }
}


/* =========================================
   SOCKET.IO CONNECTION
========================================= */

function connectToServer() {

    if (typeof io === "undefined") {

        console.error(
            "Socket.IO client not found."
        );

        showStatus(
            "Socket.IO load nahi hua."
        );

        return;
    }

    socket =
        io(SIGNALING_SERVER, {
            transports: ["websocket", "polling"]
        });


    /* CONNECTED */

    socket.on(
        "connect",
        () => {

            console.log(
                "Socket connected:",
                socket.id
            );

            setConnectionStatus(
                "Connected",
                true
            );

            socket.emit(
                "join-room",
                meetingId
            );

            showStatus(
                "Meeting room joined."
            );
        }
    );


    /* CONNECTION ERROR */

    socket.on(
        "connect_error",
        (error) => {

            console.error(
                "Socket connection error:",
                error
            );

            setConnectionStatus(
                "Server connection failed"
            );

            showStatus(
                "Signaling server se connection nahi hua."
            );
        }
    );


    /* DISCONNECTED */

    socket.on(
        "disconnect",
        () => {

            setConnectionStatus(
                "Disconnected"
            );

            console.log(
                "Socket disconnected"
            );
        }
    );


    /* =====================================
       NEW USER JOINED
    ===================================== */

    socket.on(
        "user-joined",
        async (userId) => {

            console.log(
                "New user joined:",
                userId
            );

            remoteSocketId =
                userId;

            showStatus(
                "Another participant joined."
            );

            await createOffer(userId);
        }
    );


    /* =====================================
       RECEIVE OFFER
    ===================================== */

    socket.on(
        "offer",
        async (data) => {

            console.log(
                "Offer received"
            );

            remoteSocketId =
                data.sender;

            await handleOffer(
                data.offer
            );
        }
    );


    /* =====================================
       RECEIVE ANSWER
    ===================================== */

    socket.on(
        "answer",
        async (data) => {

            console.log(
                "Answer received"
            );

            try {

                if (!peerConnection) {
                    return;
                }

                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(
                        data.answer
                    )
                );

                setConnectionStatus(
                    "Call connected",
                    true
                );

            } catch (error) {

                console.error(
                    "Answer error:",
                    error
                );
            }
        }
    );


    /* =====================================
       ICE CANDIDATE
    ===================================== */

    socket.on(
        "ice-candidate",
        async (data) => {

            try {

                if (!peerConnection) {
                    return;
                }

                if (!data.candidate) {
                    return;
                }

                await peerConnection.addIceCandidate(
                    new RTCIceCandidate(
                        data.candidate
                    )
                );

            } catch (error) {

                console.error(
                    "ICE candidate error:",
                    error
                );
            }
        }
    );


    /* =====================================
       USER LEFT
    ===================================== */

    socket.on(
        "user-left",
        (userId) => {

            console.log(
                "User left:",
                userId
            );

            if (
                remoteSocketId === userId ||
                !userId
            ) {

                closePeerConnection();

                if (remoteVideo) {

                    remoteVideo.srcObject =
                        null;
                }

                remoteSocketId =
                    null;

                setConnectionStatus(
                    "Waiting for participant"
                );

                showStatus(
                    "Participant left the meeting."
                );
            }
        }
    );
}


/* =========================================
   CREATE PEER CONNECTION
========================================= */

function createPeerConnection() {

    if (peerConnection) {

        return peerConnection;
    }


    peerConnection =
        new RTCPeerConnection({

            iceServers: [

                {
                    urls:
                        "stun:stun.l.google.com:19302"
                },

                {
                    urls:
                        "stun:stun1.l.google.com:19302"
                }

            ]
        });


    /* ADD LOCAL TRACKS */

    if (localStream) {

        localStream
            .getTracks()
            .forEach(track => {

                peerConnection.addTrack(
                    track,
                    localStream
                );
            });
    }


    /* REMOTE TRACK */

    peerConnection.ontrack =
        (event) => {

            console.log(
                "Remote track received"
            );

            if (remoteVideo) {

                remoteVideo.srcObject =
                    event.streams[0];

                remoteVideo.classList.add(
                    "active"
                );

                remoteVideo.play()
                    .catch(() => {});
            }

            setConnectionStatus(
                "Call connected",
                true
            );
        };


    /* ICE */

    peerConnection.onicecandidate =
        (event) => {

            if (
                event.candidate &&
                socket &&
                remoteSocketId
            ) {

                socket.emit(
                    "ice-candidate",
                    {
                        target:
                            remoteSocketId,

                        candidate:
                            event.candidate
                    }
                );
            }
        };


    /* CONNECTION STATE */

    peerConnection.onconnectionstatechange =
        () => {

            console.log(
                "Peer connection:",
                peerConnection.connectionState
            );

            const state =
                peerConnection.connectionState;

            if (
                state === "connected"
            ) {

                setConnectionStatus(
                    "Call connected",
                    true
                );

            } else if (
                state === "connecting"
            ) {

                setConnectionStatus(
                    "Connecting..."
                );

            } else if (
                state === "disconnected"
            ) {

                setConnectionStatus(
                    "Connection interrupted"
                );

            } else if (
                state === "failed"
            ) {

                setConnectionStatus(
                    "Connection failed"
                );

                showStatus(
                    "Call connection failed."
                );
            }
        };


    return peerConnection;
}


/* =========================================
   CREATE OFFER
========================================= */

async function createOffer(targetId) {

    try {

        remoteSocketId =
            targetId;

        const pc =
            createPeerConnection();

        const offer =
            await pc.createOffer();

        await pc.setLocalDescription(
            offer
        );

        socket.emit(
            "offer",
            {
                target:
                    targetId,

                offer:
                    offer
            }
        );

        setConnectionStatus(
            "Calling..."
        );

    } catch (error) {

        console.error(
            "Create offer error:",
            error
        );

        showStatus(
            "Call start nahi ho payi."
        );
    }
}


/* =========================================
   HANDLE OFFER
========================================= */

async function handleOffer(offer) {

    try {

        const pc =
            createPeerConnection();

        await pc.setRemoteDescription(
            new RTCSessionDescription(
                offer
            )
        );

        const answer =
            await pc.createAnswer();

        await pc.setLocalDescription(
            answer
        );

        socket.emit(
            "answer",
            {
                target:
                    remoteSocketId,

                answer:
                    answer
            }
        );

        setConnectionStatus(
            "Connecting..."
        );

    } catch (error) {

        console.error(
            "Handle offer error:",
            error
        );

        showStatus(
            "Call accept nahi ho payi."
        );
    }
}


/* =========================================
   CLOSE PEER CONNECTION
========================================= */

function closePeerConnection() {

    if (peerConnection) {

        peerConnection.ontrack = null;

        peerConnection.onicecandidate =
            null;

        peerConnection.close();

        peerConnection = null;
    }

    if (remoteVideo) {

        remoteVideo.srcObject =
            null;
    }
}


/* =========================================
   CAMERA TOGGLE
========================================= */

function toggleCamera() {

    if (!localStream) {

        showStatus(
            "Camera start nahi hua."
        );

        return;
    }

    const tracks =
        localStream.getVideoTracks();

    if (!tracks.length) {

        showStatus(
            "Camera track nahi mila."
        );

        return;
    }

    cameraEnabled =
        !cameraEnabled;

    tracks.forEach(
        track => {

            track.enabled =
                cameraEnabled;
        }
    );

    updateCameraUI();
}


function updateCameraUI() {

    if (!cameraBtn) {
        return;
    }

    const icon =
        cameraBtn.querySelector(
            ".control-icon"
        );

    const label =
        cameraBtn.querySelector(
            ".control-label"
        );

    if (cameraEnabled) {

        cameraBtn.classList.remove(
            "off"
        );

        if (icon) {
            icon.textContent =
                "📹";
        }

        if (label) {
            label.textContent =
                "Camera";
        }

        if (cameraOffMessage) {

            cameraOffMessage.style.display =
                "none";
        }

    } else {

        cameraBtn.classList.add(
            "off"
        );

        if (icon) {
            icon.textContent =
                "🚫";
        }

        if (label) {
            label.textContent =
                "Camera";
        }

        if (cameraOffMessage) {

            cameraOffMessage.style.display =
                "flex";
        }
    }
}


/* =========================================
   MICROPHONE TOGGLE
========================================= */

function toggleMicrophone() {

    if (!localStream) {

        showStatus(
            "Microphone start nahi hua."
        );

        return;
    }

    const tracks =
        localStream.getAudioTracks();

    if (!tracks.length) {

        showStatus(
            "Microphone track nahi mila."
        );

        return;
    }

    micEnabled =
        !micEnabled;

    tracks.forEach(
        track => {

            track.enabled =
                micEnabled;
        }
    );

    updateMicUI();
}


function updateMicUI() {

    if (!micBtn) {
        return;
    }

    const icon =
        micBtn.querySelector(
            ".control-icon"
        );

    const label =
        micBtn.querySelector(
            ".control-label"
        );

    if (micEnabled) {

        micBtn.classList.remove(
            "off"
        );

        if (icon) {
            icon.textContent =
                "🎤";
        }

        if (label) {
            label.textContent =
                "Mic";
        }

    } else {

        micBtn.classList.add(
            "off"
        );

        if (icon) {
            icon.textContent =
                "🔇";
        }

        if (label) {
            label.textContent =
                "Mic";
        }
    }
}


/* =========================================
   SCREEN SHARE
========================================= */

async function toggleScreenShare() {

    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getDisplayMedia) {

        showStatus(
            "Screen sharing supported nahi hai."
        );

        return;
    }


    if (isScreenSharing) {

        stopScreenShare();

        return;
    }


    try {

        screenStream =
            await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false
            });

        const screenTrack =
            screenStream.getVideoTracks()[0];

        if (!screenTrack) {
            return;
        }


        /* Replace video track in WebRTC */

        if (peerConnection) {

            const sender =
                peerConnection
                    .getSenders()
                    .find(
                        s =>
                            s.track &&
                            s.track.kind ===
                            "video"
                    );

            if (sender) {

                await sender.replaceTrack(
                    screenTrack
                );
            }
        }


        if (localVideo) {

            localVideo.srcObject =
                screenStream;

            localVideo.muted = true;
        }


        isScreenSharing =
            true;


        if (screenShareBtn) {

            screenShareBtn.classList.add(
                "off"
            );

            const icon =
                screenShareBtn.querySelector(
                    ".control-icon"
                );

            const label =
                screenShareBtn.querySelector(
                    ".control-label"
                );

            if (icon) {
                icon.textContent =
                    "⛔";
            }

            if (label) {
                label.textContent =
                    "Stop";
            }
        }


        showStatus(
            "Screen sharing started."
        );


        screenTrack.onended =
            () => {

                stopScreenShare();
            };

    } catch (error) {

        console.log(
            "Screen share cancelled:",
            error
        );

        showStatus(
            "Screen sharing cancelled."
        );
    }
}


/* =========================================
   STOP SCREEN SHARE
========================================= */

async function stopScreenShare() {

    if (screenStream) {

        screenStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        screenStream =
            null;
    }


    if (
        peerConnection &&
        localStream
    ) {

        const cameraTrack =
            localStream.getVideoTracks()[0];

        const sender =
            peerConnection
                .getSenders()
                .find(
                    s =>
                        s.track &&
                        s.track.kind ===
                        "video"
                );

        if (
            sender &&
            cameraTrack
        ) {

            await sender.replaceTrack(
                cameraTrack
            );
        }
    }


    if (localVideo &&
        localStream) {

        localVideo.srcObject =
            localStream;
    }


    isScreenSharing =
        false;


    if (screenShareBtn) {

        screenShareBtn.classList.remove(
            "off"
        );

        const icon =
            screenShareBtn.querySelector(
                ".control-icon"
            );

        const label =
            screenShareBtn.querySelector(
                ".control-label"
            );

        if (icon) {
            icon.textContent =
                "🖥️";
        }

        if (label) {
            label.textContent =
                "Share";
        }
    }


    showStatus(
        "Screen sharing stopped."
    );
}


/* =========================================
   PARTICIPANTS
========================================= */

function openParticipants() {

    if (chatPanel) {

        chatPanel.classList.remove(
            "open"
        );
    }

    if (participantsPanel) {

        participantsPanel.classList.add(
            "open"
        );
    }
}


function closeParticipantsPanel() {

    if (participantsPanel) {

        participantsPanel.classList.remove(
            "open"
        );
    }
}


/* =========================================
   CHAT
========================================= */

function openChat() {

    if (participantsPanel) {

        participantsPanel.classList.remove(
            "open"
        );
    }

    if (chatPanel) {

        chatPanel.classList.add(
            "open"
        );
    }

    setTimeout(() => {

        if (chatInput) {

            chatInput.focus();
        }

    }, 250);
}


function closeChatPanel() {

    if (chatPanel) {

        chatPanel.classList.remove(
            "open"
        );
    }
}


function sendChatMessage(message) {

    const text =
        message.trim();

    if (!text ||
        !chatMessages) {

        return;
    }

    const empty =
        chatMessages.querySelector(
            ".chat-empty"
        );

    if (empty) {
        empty.remove();
    }

    const element =
        document.createElement(
            "div"
        );

    element.style.marginBottom =
        "12px";

    element.style.padding =
        "10px 12px";

    element.style.borderRadius =
        "10px";

    element.style.background =
        "rgba(124,92,255,.15)";

    element.style.border =
        "1px solid rgba(124,92,255,.18)";


    const name =
        document.createElement(
            "strong"
        );

    name.textContent =
        "You";

    name.style.display =
        "block";

    name.style.fontSize =
        "11px";


    const body =
        document.createElement(
            "div"
        );

    body.textContent =
        text;

    body.style.fontSize =
        "13px";

    body.style.marginTop =
        "4px";


    element.appendChild(name);

    element.appendChild(body);

    chatMessages.appendChild(
        element
    );

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


/* =========================================
   SHARE
========================================= */

function openShareModal() {

    if (shareMeetingId) {

        shareMeetingId.textContent =
            meetingId;
    }

    if (copyMessage) {

        copyMessage.textContent =
            "";
    }

    if (shareModal) {

        shareModal.classList.add(
            "show"
        );
    }
}


function closeShare() {

    if (shareModal) {

        shareModal.classList.remove(
            "show"
        );
    }
}


async function copyMeetingId() {

    try {

        await navigator.clipboard.writeText(
            meetingId
        );

        if (copyMessage) {

            copyMessage.textContent =
                "Meeting ID copied!";
        }

        showStatus(
            "Meeting ID copied."
        );

    } catch (error) {

        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value =
            meetingId;

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand(
            "copy"
        );

        textarea.remove();

        showStatus(
            "Meeting ID copied."
        );
    }
}


async function shareMeeting() {

    const meetingUrl =
        `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(meetingId)}`;

    if (navigator.share) {

        try {

            await navigator.share({

                title:
                    "Join my Zenvia Meeting",

                text:
                    `Join my Zenvia meeting. Meeting ID: ${meetingId}`,

                url:
                    meetingUrl
            });

            return;

        } catch (error) {

            console.log(
                "Share cancelled"
            );
        }
    }

    openShareModal();
}


/* =========================================
   LEAVE
========================================= */

function openLeaveModal() {

    if (leaveModal) {

        leaveModal.classList.add(
            "show"
        );
    }
}


function closeLeaveModal() {

    if (leaveModal) {

        leaveModal.classList.remove(
            "show"
        );
    }
}


function leaveMeeting() {

    closePeerConnection();

    stopAllMedia();

    if (socket) {

        socket.disconnect();

        socket = null;
    }

    localStorage.removeItem(
        "zenviaJoinedMeeting"
    );

    window.location.href =
        "index.html";
}


/* =========================================
   STOP MEDIA
========================================= */

function stopAllMedia() {

    if (screenStream) {

        screenStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        screenStream =
            null;
    }

    if (localStream) {

        localStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        localStream =
            null;
    }

    if (localVideo) {

        localVideo.srcObject =
            null;
    }

    if (remoteVideo) {

        remoteVideo.srcObject =
            null;
    }
}


/* =========================================
   BUTTON EVENTS
========================================= */

if (micBtn) {

    micBtn.addEventListener(
        "click",
        toggleMicrophone
    );
}


if (cameraBtn) {

    cameraBtn.addEventListener(
        "click",
        toggleCamera
    );
}


if (screenShareBtn) {

    screenShareBtn.addEventListener(
        "click",
        toggleScreenShare
    );
}


if (participantsBtn) {

    participantsBtn.addEventListener(
        "click",
        openParticipants
    );
}


if (chatBtn) {

    chatBtn.addEventListener(
        "click",
        openChat
    );
}


if (closeParticipants) {

    closeParticipants.addEventListener(
        "click",
        closeParticipantsPanel
    );
}


if (closeChat) {

    closeChat.addEventListener(
        "click",
        closeChatPanel
    );
}


if (shareMeetingBtn) {

    shareMeetingBtn.addEventListener(
        "click",
        shareMeeting
    );
}


if (closeShareModal) {

    closeShareModal.addEventListener(
        "click",
        closeShare
    );
}


if (copyMeetingIdBtn) {

    copyMeetingIdBtn.addEventListener(
        "click",
        copyMeetingId
    );
}


if (leaveBtn) {

    leaveBtn.addEventListener(
        "click",
        openLeaveModal
    );
}


if (cancelLeave) {

    cancelLeave.addEventListener(
        "click",
        closeLeaveModal
    );
}


if (confirmLeave) {

    confirmLeave.addEventListener(
        "click",
        leaveMeeting
    );
}


/* =========================================
   CHAT FORM
========================================= */

if (chatForm) {

    chatForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            if (!chatInput) {
                return;
            }

            sendChatMessage(
                chatInput.value
            );

            chatInput.value =
                "";

            chatInput.focus();
        }
    );
}


/* =========================================
   MODALS
========================================= */

if (shareModal) {

    shareModal.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                shareModal
            ) {

                closeShare();
            }
        }
    );
}


if (leaveModal) {

    leaveModal.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                leaveModal
            ) {

                closeLeaveModal();
            }
        }
    );
}


/* =========================================
   ESCAPE
========================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (event.key !== "Escape") {
            return;
        }

        closeParticipantsPanel();

        closeChatPanel();

        closeShare();

        closeLeaveModal();
    }
);


/* =========================================
   PAGE CLOSE
========================================= */

window.addEventListener(
    "beforeunload",
    function() {

        stopAllMedia();

        if (socket) {

            socket.disconnect();
        }
    }
);


/* =========================================
   INITIALIZE
========================================= */

function initializeMeeting() {

    displayMeetingId();

    updateCameraUI();

    updateMicUI();

    setConnectionStatus(
        "Starting..."
    );

    setTimeout(
        startCameraAndMic,
        400
    );
}


/* =========================================
   START
========================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeMeeting
    );

} else {

    initializeMeeting();
}
