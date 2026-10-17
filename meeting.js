/* =========================================
   ZENVIA - PROFESSIONAL WEBRTC VIDEO ENGINE
========================================= */

"use strict";

// Connect directly to local signaling server
const SIGNALING_SERVER = window.location.origin;

/* =========================================
   DOM ELEMENTS
========================================= */
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const remoteVideoTile = document.getElementById("remoteVideoTile");
const localVideoTile = document.getElementById("localVideoTile");
const waitingScreen = document.getElementById("waitingScreen");

const micBtn = document.getElementById("micBtn");
const cameraBtn = document.getElementById("cameraBtn");
const flipCameraBtn = document.getElementById("flipCameraBtn");
const screenShareBtn = document.getElementById("screenShareBtn");
const reactionsBtn = document.getElementById("reactionsBtn");
const handBtn = document.getElementById("handBtn");
const participantsBtn = document.getElementById("participantsBtn");
const chatBtn = document.getElementById("chatBtn");
const pipBtn = document.getElementById("pipBtn");
const leaveBtn = document.getElementById("leaveBtn");

const shareMeetingBtn = document.getElementById("shareMeetingBtn");
const quickCopyLinkBtn = document.getElementById("quickCopyLinkBtn");
const testBotBtn = document.getElementById("testBotBtn");
const testBotBtnLabel = document.getElementById("testBotBtnLabel");
const openTabBtn = document.getElementById("openTabBtn");

const meetingIdDisplay = document.getElementById("meetingIdDisplay");
const headerMeetingIdBox = document.getElementById("headerMeetingIdBox");
const shareMeetingId = document.getElementById("shareMeetingId");
const shareMeetingUrl = document.getElementById("shareMeetingUrl");
const connectionText = document.getElementById("connectionText");
const callTimer = document.getElementById("callTimer");

const cameraOffMessage = document.getElementById("cameraOffMessage");
const remoteCameraOffMessage = document.getElementById("remoteCameraOffMessage");
const remoteMeta = document.getElementById("remoteMeta");
const remoteName = document.getElementById("remoteName");
const remoteMicPill = document.getElementById("remoteMicPill");
const localDisplayName = document.getElementById("localDisplayName");
const localMicIcon = document.getElementById("localMicIcon");

const participantsBadge = document.getElementById("participantsBadge");
const chatBadge = document.getElementById("chatBadge");
const panelParticipantsCount = document.getElementById("panelParticipantsCount");
const participantsPanel = document.getElementById("participantsPanel");
const chatPanel = document.getElementById("chatPanel");
const closeParticipants = document.getElementById("closeParticipants");
const closeChat = document.getElementById("closeChat");
const remoteParticipantsContainer = document.getElementById("remoteParticipantsContainer");
const emptyParticipantsNotice = document.getElementById("emptyParticipantsNotice");
const panelInviteBtn = document.getElementById("panelInviteBtn");

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const chatEmptyState = document.getElementById("chatEmptyState");

const shareModal = document.getElementById("shareModal");
const closeShareModal = document.getElementById("closeShareModal");
const copyMeetingIdBtn = document.getElementById("copyMeetingIdBtn");
const copyMeetingUrlBtn = document.getElementById("copyMeetingUrlBtn");
const nativeShareBtn = document.getElementById("nativeShareBtn");
const copyMessage = document.getElementById("copyMessage");

const leaveModal = document.getElementById("leaveModal");
const cancelLeave = document.getElementById("cancelLeave");
const confirmLeave = document.getElementById("confirmLeave");

const reactionsPicker = document.getElementById("reactionsPicker");
const floatingReactionsContainer = document.getElementById("floatingReactionsContainer");
const statusMessage = document.getElementById("statusMessage");
const statusMessageText = document.getElementById("statusMessageText");

/* =========================================
   STATE & VARIABLES
========================================= */
let localStream = null;
let screenStream = null;
let socket = null;
let peerConnections = new Map(); // socketId -> RTCPeerConnection
let remoteParticipants = new Map(); // socketId -> { name, micOn, cameraOn }
let isHost = false;

let micEnabled = true;
let cameraEnabled = true;
let isScreenSharing = false;
let isHandRaised = false;
let currentFacingMode = "user";
let isVirtualCamera = false;
let unreadChatCount = 0;
let callStartTime = null;
let callTimerInterval = null;
let statusTimer = null;
let audioContext = null;
let localAudioAnalyser = null;

// Virtual Test Bot state
let testBotActive = false;
let testBotStream = null;
let testBotCanvasInterval = null;

// STUN Configuration
const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" }
    ]
};

/* =========================================
   MEETING & USER IDENTITY
========================================= */
function generateMeetingId() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let randomLetters = "";
    for (let i = 0; i < 3; i++) {
        randomLetters += letters[Math.floor(Math.random() * letters.length)];
    }
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    return `ZEN-${randomLetters}-${randomNumber}`;
}

function getMeetingId() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlMeetingId = urlParams.get("id");
    if (urlMeetingId && urlMeetingId.trim()) {
        return urlMeetingId.trim().toUpperCase();
    }
    const saved = localStorage.getItem("zenviaMeetingId");
    if (saved) return saved.toUpperCase();
    const newId = generateMeetingId();
    localStorage.setItem("zenviaMeetingId", newId);
    return newId;
}

function getUserName() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlName = urlParams.get("name");
    if (urlName && urlName.trim()) {
        localStorage.setItem("zenviaUserName", urlName.trim());
        return urlName.trim();
    }
    const saved = localStorage.getItem("zenviaUserName");
    if (saved && saved.trim()) return saved.trim();
    const randomUser = "User " + Math.floor(100 + Math.random() * 900);
    localStorage.setItem("zenviaUserName", randomUser);
    return randomUser;
}

const meetingId = getMeetingId();
const myUserName = getUserName();

/* =========================================
   UI HELPERS & NOTIFICATIONS
========================================= */
function showStatus(text, duration = 3000) {
    if (!statusMessage || !statusMessageText) return;
    statusMessageText.textContent = text;
    statusMessage.classList.add("show");
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
        statusMessage.classList.remove("show");
    }, duration);
}

function setConnectionStatus(text, isConnected = false) {
    if (connectionText) connectionText.textContent = text;
    const dot = document.querySelector(".status-dot");
    if (!dot) return;
    if (isConnected) {
        dot.style.background = "#36d98a";
        dot.style.boxShadow = "0 0 10px rgba(54, 217, 138, 0.7)";
    } else {
        dot.style.background = "#ffb020";
        dot.style.boxShadow = "0 0 10px rgba(255, 176, 32, 0.7)";
    }
}

function startCallTimer() {
    if (callTimerInterval) clearInterval(callTimerInterval);
    callStartTime = Date.now();
    callTimerInterval = setInterval(() => {
        if (!callStartTime) return;
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const secs = String(elapsed % 60).padStart(2, "0");
        if (callTimer) callTimer.textContent = `${mins}:${secs}`;
    }, 1000);
}

/* Synthesizes soft notification chime via Web Audio */
function playChime(type = "message") {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "message") {
            osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        } else if (type === "join") {
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        }
    } catch (e) {
        // audio context blocked until user gesture, safe to ignore
    }
}

/* =========================================
   MEDIA STREAMS (CAMERA & MIC)
========================================= */
// Creates a virtual avatar stream if hardware camera is blocked or unavailable
function createVirtualStream(userName) {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    let hue = 220;

    function renderVirtualFrame() {
        hue = (hue + 0.5) % 360;
        // Background gradient
        const grad = ctx.createRadialGradient(320, 240, 50, 320, 240, 340);
        grad.addColorStop(0, `hsl(${hue}, 40%, 20%)`);
        grad.addColorStop(1, "#070a12");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 480);

        // Grid lines effect
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1;
        for (let x = 0; x < 640; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 480);
            ctx.stroke();
        }

        // Central Avatar Circle
        const pulse = Math.sin(Date.now() / 400) * 8;
        ctx.beginPath();
        ctx.arc(320, 210, 80 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(124, 92, 255, 0.25)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(320, 210, 70, 0, Math.PI * 2);
        ctx.fillStyle = "linear-gradient(135deg, #7c5cff, #00d9ff)";
        ctx.fillStyle = "#7c5cff";
        ctx.fill();

        // Initial Letter
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 56px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText((userName[0] || "U").toUpperCase(), 320, 210);

        // Name badge
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.roundRect(180, 310, 280, 38, 10);
        ctx.fill();

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "600 16px sans-serif";
        ctx.fillText(userName, 320, 334);

        // Virtual Camera Badge
        ctx.fillStyle = "#36d98a";
        ctx.font = "12px sans-serif";
        ctx.fillText("● Virtual Video Mode", 320, 375);
    }

    const intervalId = setInterval(renderVirtualFrame, 1000 / 25);
    renderVirtualFrame();

    const canvasStream = canvas.captureStream(25);

    // Add silent/synthesized audio track
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            const actx = new AudioCtx();
            const osc = actx.createOscillator();
            const dst = actx.createMediaStreamDestination();
            const gain = actx.createGain();
            gain.gain.value = 0.0001; // nearly silent
            osc.connect(gain);
            gain.connect(dst);
            osc.start();
            canvasStream.addTrack(dst.stream.getAudioTracks()[0]);
        }
    } catch (e) {
        console.warn("Silent audio synth skipped:", e);
    }

    canvasStream._stopLoop = () => clearInterval(intervalId);
    return canvasStream;
}

async function requestRealCamera(userTriggered = false) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (userTriggered) showStatus("Camera not supported on this device/browser.");
        return false;
    }

    try {
        if (userTriggered) setConnectionStatus("Accessing camera...");
        let stream = null;

        // Try standard mobile constraints first
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: currentFacingMode },
                audio: true
            });
        } catch (e1) {
            console.log("FacingMode attempt failed, trying basic video+audio:", e1.name);
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
            } catch (e2) {
                console.log("Video+Audio failed, trying video only:", e2.name);
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });
            }
        }

        if (!stream) throw new Error("No camera stream available");

        // Stop any old virtual animation loop
        if (localStream && localStream._stopLoop) {
            localStream._stopLoop();
        }
        if (localStream && isVirtualCamera) {
            localStream.getTracks().forEach(t => t.stop());
        }

        localStream = stream;
        isVirtualCamera = false;

        if (localVideo) {
            localVideo.srcObject = localStream;
            localVideo.muted = true;
            localVideo.setAttribute("playsinline", "true");
            localVideo.setAttribute("webkit-playsinline", "true");
            localVideo.classList.add("active");
            try {
                await localVideo.play();
            } catch (playErr) {
                console.log("Video play call note:", playErr);
            }
        }

        cameraEnabled = true;
        updateCameraUI();
        checkCameraDevices();
        setupLocalAudioMonitor(localStream);

        // Update tracks in active WebRTC peer connections
        const newVideoTrack = localStream.getVideoTracks()[0];
        const newAudioTrack = localStream.getAudioTracks()[0];

        peerConnections.forEach(pc => {
            if (newVideoTrack) {
                const vSender = pc.getSenders().find(s => s.track && s.track.kind === "video");
                if (vSender) vSender.replaceTrack(newVideoTrack);
            }
            if (newAudioTrack) {
                const aSender = pc.getSenders().find(s => s.track && s.track.kind === "audio");
                if (aSender) aSender.replaceTrack(newAudioTrack);
            }
        });

        if (socket) {
            socket.emit("user-media-state", {
                micOn: micEnabled,
                cameraOn: true,
                isScreenSharing: isScreenSharing
            });
        }

        setConnectionStatus("Camera connected", true);
        showStatus("Real camera is now active!");
        return true;
    } catch (err) {
        console.warn("Real camera request failed:", err);
        if (userTriggered) {
            showStatus("Camera permission denied. Please allow camera in browser address bar.");
        }
        return false;
    }
}

async function startCameraAndMic() {
    // Attempt real camera immediately
    const realSuccess = await requestRealCamera(false);

    // If real camera permission denied or unavailable, use virtual avatar fallback
    if (!realSuccess && !localStream) {
        console.log("Falling back to Virtual Avatar stream");
        isVirtualCamera = true;
        localStream = createVirtualStream(myUserName);

        if (localVideo) {
            localVideo.srcObject = localStream;
            localVideo.muted = true;
            localVideo.setAttribute("playsinline", "true");
            localVideo.setAttribute("webkit-playsinline", "true");
            localVideo.classList.add("active");
            localVideo.play().catch(() => {});
        }

        cameraEnabled = true;
        micEnabled = true;
        updateCameraUI();
        updateMicUI();
        setupLocalAudioMonitor(localStream);

        showStatus("Tap Camera icon or video tile to turn on your real camera 📷", 4000);
    }
}

async function checkCameraDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === "videoinput");
        if (videoInputs.length > 1 && flipCameraBtn) {
            flipCameraBtn.style.display = "inline-flex";
        }
    } catch (e) {}
}

async function switchCameraFacing() {
    if (isVirtualCamera || !localStream) return;
    currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
    try {
        const newStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode },
            audio: false
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldVideoTrack = localStream.getVideoTracks()[0];

        if (oldVideoTrack) {
            oldVideoTrack.stop();
            localStream.removeTrack(oldVideoTrack);
        }
        localStream.addTrack(newVideoTrack);

        if (localVideo) localVideo.srcObject = localStream;

        // Replace track in all peer connections
        peerConnections.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track && s.track.kind === "video");
            if (sender) sender.replaceTrack(newVideoTrack);
        });

        showStatus("Switched camera.");
    } catch (e) {
        showStatus("Could not switch camera.");
    }
}

/* Monitor audio level to highlight when user speaks */
function setupLocalAudioMonitor(stream) {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        audioContext = new AudioCtx();
        const source = audioContext.createMediaStreamSource(stream);
        localAudioAnalyser = audioContext.createAnalyser();
        localAudioAnalyser.fftSize = 256;
        source.connect(localAudioAnalyser);

        const dataArray = new Uint8Array(localAudioAnalyser.frequencyBinCount);
        function checkVolume() {
            if (!localAudioAnalyser || !localVideoTile) return;
            localAudioAnalyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const average = sum / dataArray.length;

            if (average > 25 && micEnabled) {
                localVideoTile.classList.add("speaking");
            } else {
                localVideoTile.classList.remove("speaking");
            }
            requestAnimationFrame(checkVolume);
        }
        checkVolume();
    } catch (e) {
        console.warn("Audio monitoring not supported:", e);
    }
}

/* =========================================
   SOCKET.IO & WEBRTC SIGNALING
========================================= */
function connectToServer() {
    if (typeof io === "undefined") {
        setConnectionStatus("Socket library not loaded");
        showStatus("Socket.IO client missing. Retrying...");
        return;
    }

    setConnectionStatus("Joining room...");

    socket = io(SIGNALING_SERVER, {
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        timeout: 8000
    });

    socket.on("connect", () => {
        console.log("[Socket.io connected] ID:", socket.id);
        setConnectionStatus("Connected", true);
        startCallTimer();

        // Join room with identity
        socket.emit("join-room", {
            roomId: meetingId,
            userName: myUserName
        });
    });

    socket.on("room-joined", (data) => {
        isHost = data.isHost;
        const count = data.totalCount || 1;
        updateParticipantsCount(count);

        if (isHost) {
            if (localDisplayName) localDisplayName.textContent = `${myUserName} (Host)`;
            showStatus(`Meeting room ready. Meeting ID: ${meetingId}`);
        } else {
            if (localDisplayName) localDisplayName.textContent = `${myUserName}`;
            showStatus(`Joined meeting room ${meetingId}`);
        }

        // If there are already participants in the room, create offers to them
        if (data.participants && data.participants.length > 0) {
            data.participants.forEach(participant => {
                remoteParticipants.set(participant.socketId, {
                    name: participant.userName,
                    micOn: participant.micOn,
                    cameraOn: participant.cameraOn
                });
                initiatePeerConnection(participant.socketId, participant.userName, true);
            });
            renderParticipantsList();
        }
    });

    socket.on("user-joined", (data) => {
        console.log("[User joined]", data);
        playChime("join");
        showStatus(`${data.userName || "A participant"} joined the call.`);
        remoteParticipants.set(data.socketId, {
            name: data.userName,
            micOn: data.micOn,
            cameraOn: data.cameraOn
        });

        updateParticipantsCount(data.totalCount || (remoteParticipants.size + 1));
        renderParticipantsList();

        // If test partner was active, we can dismiss it or keep both
        if (testBotActive) {
            stopTestBot();
            showStatus("Real participant connected!");
        }

        // Existing client initiates offer to the newcomer
        initiatePeerConnection(data.socketId, data.userName, true);
    });

    socket.on("offer", async (data) => {
        console.log("[Offer received from]", data.sender);
        remoteParticipants.set(data.sender, {
            name: data.senderName || "Participant",
            micOn: true,
            cameraOn: true
        });
        renderParticipantsList();
        await handleOffer(data.sender, data.offer, data.senderName);
    });

    socket.on("answer", async (data) => {
        console.log("[Answer received from]", data.sender);
        const pc = peerConnections.get(data.sender);
        if (pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                setConnectionStatus("Call Connected", true);
            } catch (err) {
                console.error("SetRemoteDescription error:", err);
            }
        }
    });

    socket.on("ice-candidate", async (data) => {
        const pc = peerConnections.get(data.sender);
        if (pc && data.candidate) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (err) {
                console.error("AddIceCandidate error:", err);
            }
        }
    });

    socket.on("user-media-state-changed", (data) => {
        const participant = remoteParticipants.get(data.socketId);
        if (participant) {
            if (typeof data.micOn === "boolean") participant.micOn = data.micOn;
            if (typeof data.cameraOn === "boolean") participant.cameraOn = data.cameraOn;
            renderParticipantsList();
            updateRemoteMediaDisplay(participant);
        }
    });

    socket.on("chat-message", (msg) => {
        appendChatMessage(msg);
    });

    socket.on("reaction-received", (data) => {
        spawnFloatingEmoji(data.emoji);
    });

    socket.on("user-left", (data) => {
        console.log("[User left]", data);
        showStatus(`${data.userName || "Participant"} left the meeting.`);
        remoteParticipants.delete(data.socketId);

        const pc = peerConnections.get(data.socketId);
        if (pc) {
            pc.close();
            peerConnections.delete(data.socketId);
        }

        updateParticipantsCount(data.totalCount || (remoteParticipants.size + 1));
        renderParticipantsList();

        // If no more remote participants and not test bot, restore waiting screen
        if (remoteParticipants.size === 0 && !testBotActive) {
            if (remoteVideo) {
                remoteVideo.srcObject = null;
                remoteVideo.classList.remove("active");
            }
            if (waitingScreen) waitingScreen.style.display = "block";
            if (remoteMeta) remoteMeta.style.display = "none";
            if (remoteCameraOffMessage) remoteCameraOffMessage.style.display = "none";
        }
    });

    socket.on("disconnect", () => {
        setConnectionStatus("Disconnected");
        showStatus("Disconnected from signaling server.");
    });

    socket.on("connect_error", (e) => {
        console.error("Signaling connection error:", e);
        setConnectionStatus("Connection Error");
    });
}

/* =========================================
   WEBRTC PEER CONNECTIONS
========================================= */
function createPeerConnection(targetSocketId) {
    if (peerConnections.has(targetSocketId)) {
        return peerConnections.get(targetSocketId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    if (localStream) {
        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
            socket.emit("ice-candidate", {
                target: targetSocketId,
                candidate: event.candidate
            });
        }
    };

    // Remote Track handler
    pc.ontrack = (event) => {
        console.log("[Remote track received]", event.track.kind);
        const remoteStream = event.streams[0];
        if (remoteVideo) {
            remoteVideo.srcObject = remoteStream;
            remoteVideo.classList.add("active");
            remoteVideo.play().catch(() => {});
        }
        if (waitingScreen) waitingScreen.style.display = "none";
        if (remoteMeta) remoteMeta.style.display = "flex";

        const participant = remoteParticipants.get(targetSocketId);
        if (participant && remoteName) {
            remoteName.textContent = participant.name;
        }

        setConnectionStatus("Call Connected", true);
    };

    pc.onconnectionstatechange = () => {
        console.log(`[PC State (${targetSocketId})]`, pc.connectionState);
        if (pc.connectionState === "connected") {
            setConnectionStatus("Call Connected", true);
        } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
            setConnectionStatus("Call Interrupted");
        }
    };

    peerConnections.set(targetSocketId, pc);
    return pc;
}

async function initiatePeerConnection(targetSocketId, targetName, isCaller) {
    const pc = createPeerConnection(targetSocketId);
    if (!isCaller) return;

    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", {
            target: targetSocketId,
            offer: offer,
            senderName: myUserName
        });
    } catch (err) {
        console.error("CreateOffer error:", err);
    }
}

async function handleOffer(senderSocketId, offer, senderName) {
    const pc = createPeerConnection(senderSocketId);
    try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answer", {
            target: senderSocketId,
            answer: answer
        });

        if (remoteName) remoteName.textContent = senderName || "Participant";
    } catch (err) {
        console.error("HandleOffer error:", err);
    }
}

function updateRemoteMediaDisplay(participant) {
    if (!participant) return;
    if (remoteMicPill) {
        remoteMicPill.textContent = participant.micOn ? "🎤 Active" : "🔇 Muted";
        remoteMicPill.style.color = participant.micOn ? "#36d98a" : "#ff4757";
    }
    if (remoteCameraOffMessage) {
        if (!participant.cameraOn) {
            remoteCameraOffMessage.style.display = "flex";
            const initial = (participant.name[0] || "P").toUpperCase();
            const avatarInitial = document.getElementById("remoteAvatarInitial");
            if (avatarInitial) avatarInitial.textContent = initial;
        } else {
            remoteCameraOffMessage.style.display = "none";
        }
    }
}

/* =========================================
   INTERACTIVE TEST PARTNER (AI / DEMO CALL)
========================================= */
function startTestBot() {
    testBotActive = true;
    if (testBotBtnLabel) testBotBtnLabel.textContent = "Remove Test Partner";
    if (waitingScreen) waitingScreen.style.display = "none";

    const botCanvas = document.createElement("canvas");
    botCanvas.width = 640;
    botCanvas.height = 480;
    const bctx = botCanvas.getContext("2d");

    let eyeBlinkTimer = 0;
    let mouthWaveTimer = 0;

    function renderBotFrame() {
        eyeBlinkTimer += 0.05;
        mouthWaveTimer += 0.15;
        const isBlinking = Math.sin(eyeBlinkTimer) > 0.94;

        // Background
        const bgGrad = bctx.createLinearGradient(0, 0, 640, 480);
        bgGrad.addColorStop(0, "#1e2235");
        bgGrad.addColorStop(1, "#0d111a");
        bctx.fillStyle = bgGrad;
        bctx.fillRect(0, 0, 640, 480);

        // Office Plant / Background elements
        bctx.fillStyle = "rgba(0, 217, 255, 0.08)";
        bctx.fillRect(40, 60, 160, 240);

        // Character Silhouette & Avatar
        // Shoulders
        bctx.beginPath();
        bctx.ellipse(320, 460, 180, 100, 0, 0, Math.PI * 2);
        bctx.fillStyle = "#2d3748";
        bctx.fill();

        // Neck
        bctx.fillStyle = "#f6ad55";
        bctx.fillRect(300, 310, 40, 70);

        // Head
        bctx.beginPath();
        bctx.arc(320, 240, 75, 0, Math.PI * 2);
        bctx.fillStyle = "#fbd38d";
        bctx.fill();

        // Hair
        bctx.beginPath();
        bctx.arc(320, 220, 82, Math.PI, 0, false);
        bctx.fillStyle = "#1a202c";
        bctx.fill();

        // Glasses
        bctx.lineWidth = 4;
        bctx.strokeStyle = "#4a5568";
        bctx.strokeRect(275, 220, 35, 26);
        bctx.strokeRect(330, 220, 35, 26);
        bctx.beginPath();
        bctx.moveTo(310, 233);
        bctx.lineTo(330, 233);
        bctx.stroke();

        // Eyes
        if (isBlinking) {
            bctx.beginPath();
            bctx.moveTo(280, 235);
            bctx.lineTo(305, 235);
            bctx.moveTo(335, 235);
            bctx.lineTo(360, 235);
            bctx.stroke();
        } else {
            bctx.fillStyle = "#2b6cb0";
            bctx.beginPath();
            bctx.arc(292, 233, 5, 0, Math.PI * 2);
            bctx.arc(347, 233, 5, 0, Math.PI * 2);
            bctx.fill();
        }

        // Mouth (Speaking Wave)
        const mouthOpen = Math.abs(Math.sin(mouthWaveTimer)) * 8;
        bctx.beginPath();
        bctx.ellipse(320, 275, 14, 4 + mouthOpen, 0, 0, Math.PI * 2);
        bctx.fillStyle = "#e53e3e";
        bctx.fill();

        // Audio Frequency Equalizer Bars at bottom
        bctx.fillStyle = "#36d98a";
        for (let i = 0; i < 20; i++) {
            const h = (Math.sin(mouthWaveTimer * 2 + i * 0.5) + 1) * 12 + 4;
            bctx.fillRect(200 + i * 12, 450 - h, 8, h);
        }

        // Live Test Banner
        bctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        bctx.roundRect(20, 20, 210, 34, 8);
        bctx.fill();
        bctx.fillStyle = "#36d98a";
        bctx.font = "bold 13px sans-serif";
        bctx.textAlign = "left";
        bctx.fillText("● Priya Sharma (AI Partner)", 32, 42);
    }

    testBotCanvasInterval = setInterval(renderBotFrame, 1000 / 25);
    renderBotFrame();

    testBotStream = botCanvas.captureStream(25);

    if (remoteVideo) {
        remoteVideo.srcObject = testBotStream;
        remoteVideo.classList.add("active");
        remoteVideo.play().catch(() => {});
    }

    if (remoteMeta) remoteMeta.style.display = "flex";
    if (remoteName) remoteName.textContent = "Priya Sharma (AI Test Partner)";
    if (remoteMicPill) remoteMicPill.textContent = "🎤 Speaking";

    // Add to participants list
    remoteParticipants.set("test-bot-id", {
        name: "Priya Sharma (AI Partner)",
        micOn: true,
        cameraOn: true
    });
    updateParticipantsCount(remoteParticipants.size + 1);
    renderParticipantsList();

    setConnectionStatus("Demo Call Active", true);
    showStatus("Demo partner connected! Testing two-way call.");

    // Automated welcome message in chat
    setTimeout(() => {
        if (!testBotActive) return;
        appendChatMessage({
            id: "msg-bot-welcome",
            senderId: "test-bot-id",
            senderName: "Priya Sharma",
            text: "Hi! I've joined your Zenvia video call. Your camera and microphone test is looking smooth! Feel free to chat with me or invite friends.",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        });
    }, 1200);
}

function stopTestBot() {
    testBotActive = false;
    if (testBotBtnLabel) testBotBtnLabel.textContent = "Test Call (Add Partner)";
    if (testBotCanvasInterval) {
        clearInterval(testBotCanvasInterval);
        testBotCanvasInterval = null;
    }
    if (testBotStream) {
        testBotStream.getTracks().forEach(t => t.stop());
        testBotStream = null;
    }

    remoteParticipants.delete("test-bot-id");
    updateParticipantsCount(remoteParticipants.size + 1);
    renderParticipantsList();

    if (remoteParticipants.size === 0) {
        if (remoteVideo) {
            remoteVideo.srcObject = null;
            remoteVideo.classList.remove("active");
        }
        if (waitingScreen) waitingScreen.style.display = "block";
        if (remoteMeta) remoteMeta.style.display = "none";
    }
    showStatus("Demo partner disconnected.");
}

/* =========================================
   CONTROLS: MIC, CAMERA, SCREEN, PIP
========================================= */
function toggleCamera() {
    if (isVirtualCamera || !localStream) {
        requestRealCamera(true);
        return;
    }

    const tracks = localStream.getVideoTracks();
    if (!tracks.length) {
        requestRealCamera(true);
        return;
    }

    cameraEnabled = !cameraEnabled;
    tracks.forEach(track => {
        track.enabled = cameraEnabled;
    });

    updateCameraUI();

    // Broadcast state to room
    if (socket) {
        socket.emit("user-media-state", {
            micOn: micEnabled,
            cameraOn: cameraEnabled,
            isScreenSharing: isScreenSharing
        });
    }

    showStatus(cameraEnabled ? "Camera turned on" : "Camera turned off");
}

function updateCameraUI() {
    if (!cameraBtn) return;
    const icon = cameraBtn.querySelector(".control-icon");
    if (cameraEnabled) {
        cameraBtn.classList.remove("off");
        if (icon) icon.textContent = "📹";
        if (cameraOffMessage) cameraOffMessage.style.display = "none";
    } else {
        cameraBtn.classList.add("off");
        if (icon) icon.textContent = "🚫";
        if (cameraOffMessage) cameraOffMessage.style.display = "flex";
    }
}

function toggleMicrophone() {
    if (!localStream) return;
    const tracks = localStream.getAudioTracks();
    if (!tracks.length) return;

    micEnabled = !micEnabled;
    tracks.forEach(track => {
        track.enabled = micEnabled;
    });

    updateMicUI();

    // Broadcast state to room
    if (socket) {
        socket.emit("user-media-state", {
            micOn: micEnabled,
            cameraOn: cameraEnabled,
            isScreenSharing: isScreenSharing
        });
    }

    showStatus(micEnabled ? "Microphone unmuted" : "Microphone muted");
}

function updateMicUI() {
    if (!micBtn) return;
    const icon = micBtn.querySelector(".control-icon");
    if (micEnabled) {
        micBtn.classList.remove("off");
        if (icon) icon.textContent = "🎤";
        if (localMicIcon) localMicIcon.textContent = "🎤";
    } else {
        micBtn.classList.add("off");
        if (icon) icon.textContent = "🔇";
        if (localMicIcon) localMicIcon.textContent = "🔇";
    }
    const localPartMic = document.getElementById("localParticipantMicIcon");
    if (localPartMic) localPartMic.textContent = micEnabled ? "🎤" : "🔇";
}

async function toggleScreenShare() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        showStatus("Screen sharing not supported on this device/browser.");
        return;
    }

    if (isScreenSharing) {
        stopScreenShare();
        return;
    }

    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        if (!screenTrack) return;

        // Replace track in all WebRTC connections
        peerConnections.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track && s.track.kind === "video");
            if (sender) sender.replaceTrack(screenTrack);
        });

        if (localVideo) localVideo.srcObject = screenStream;
        isScreenSharing = true;

        if (screenShareBtn) {
            screenShareBtn.classList.add("off");
            const icon = screenShareBtn.querySelector(".control-icon");
            if (icon) icon.textContent = "⛔";
            const label = screenShareBtn.querySelector(".control-label");
            if (label) label.textContent = "Stop";
        }

        screenTrack.onended = () => stopScreenShare();
        showStatus("Screen sharing active.");
    } catch (err) {
        console.log("Screen share cancelled:", err);
    }
}

async function stopScreenShare() {
    if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
        screenStream = null;
    }

    if (localStream) {
        const cameraTrack = localStream.getVideoTracks()[0];
        if (cameraTrack) {
            peerConnections.forEach(pc => {
                const sender = pc.getSenders().find(s => s.track && s.track.kind === "video");
                if (sender) sender.replaceTrack(cameraTrack);
            });
        }
        if (localVideo) localVideo.srcObject = localStream;
    }

    isScreenSharing = false;
    if (screenShareBtn) {
        screenShareBtn.classList.remove("off");
        const icon = screenShareBtn.querySelector(".control-icon");
        if (icon) icon.textContent = "🖥️";
        const label = screenShareBtn.querySelector(".control-label");
        if (label) label.textContent = "Share";
    }
    showStatus("Screen sharing stopped.");
}

async function togglePictureInPicture() {
    const targetVideo = (remoteVideo && remoteVideo.classList.contains("active")) ? remoteVideo : localVideo;
    if (!targetVideo) return;

    try {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else if (document.pictureInPictureEnabled) {
            await targetVideo.requestPictureInPicture();
        } else {
            showStatus("Picture-in-Picture not supported.");
        }
    } catch (e) {
        showStatus("PiP failed: " + e.message);
    }
}

function toggleRaiseHand() {
    isHandRaised = !isHandRaised;
    if (handBtn) {
        if (isHandRaised) {
            handBtn.classList.add("off");
            showStatus("You raised your hand ✋");
            spawnFloatingEmoji("✋");
            if (socket) socket.emit("send-reaction", { emoji: "✋", senderName: myUserName });
        } else {
            handBtn.classList.remove("off");
            showStatus("Hand lowered.");
        }
    }
}

/* =========================================
   REACTIONS & FLOATING EMOJIS
========================================= */
function toggleReactionsPicker() {
    if (!reactionsPicker) return;
    const isShowing = reactionsPicker.style.display === "flex";
    reactionsPicker.style.display = isShowing ? "none" : "flex";
}

function sendReaction(emoji) {
    spawnFloatingEmoji(emoji);
    if (socket) {
        socket.emit("send-reaction", {
            emoji: emoji,
            senderName: myUserName
        });
    }
    if (reactionsPicker) reactionsPicker.style.display = "none";
}

function spawnFloatingEmoji(emoji) {
    if (!floatingReactionsContainer) return;
    const el = document.createElement("div");
    el.className = "floating-emoji";
    el.textContent = emoji;

    // Randomize horizontal positioning across screen
    const leftPercent = 15 + Math.random() * 70;
    el.style.left = `${leftPercent}%`;
    floatingReactionsContainer.appendChild(el);

    setTimeout(() => {
        el.remove();
    }, 2500);
}

/* =========================================
   PARTICIPANTS LIST
========================================= */
function updateParticipantsCount(count) {
    if (participantsBadge) participantsBadge.textContent = count;
    if (panelParticipantsCount) panelParticipantsCount.textContent = count;
}

function renderParticipantsList() {
    if (!remoteParticipantsContainer || !emptyParticipantsNotice) return;
    remoteParticipantsContainer.innerHTML = "";

    if (remoteParticipants.size === 0) {
        emptyParticipantsNotice.style.display = "block";
    } else {
        emptyParticipantsNotice.style.display = "none";
        remoteParticipants.forEach((p, socketId) => {
            const item = document.createElement("div");
            item.className = "participant-item";
            item.style.marginTop = "10px";

            const avatar = document.createElement("div");
            avatar.className = "participant-avatar";
            avatar.textContent = (p.name[0] || "P").toUpperCase();

            const details = document.createElement("div");
            details.className = "participant-details";
            const strong = document.createElement("strong");
            strong.textContent = p.name;
            const span = document.createElement("span");
            span.textContent = p.cameraOn ? "Camera on" : "Camera off";
            details.appendChild(strong);
            details.appendChild(span);

            const micSpan = document.createElement("span");
            micSpan.className = "participant-mic";
            micSpan.textContent = p.micOn ? "🎤" : "🔇";

            item.appendChild(avatar);
            item.appendChild(details);
            item.appendChild(micSpan);

            remoteParticipantsContainer.appendChild(item);
        });
    }
}

function openParticipants() {
    if (chatPanel) chatPanel.classList.remove("open");
    if (participantsPanel) participantsPanel.classList.add("open");
}

function closeParticipantsPanel() {
    if (participantsPanel) participantsPanel.classList.remove("open");
}

/* =========================================
   CHAT SYSTEM
========================================= */
function openChat() {
    if (participantsPanel) participantsPanel.classList.remove("open");
    if (chatPanel) chatPanel.classList.add("open");
    unreadChatCount = 0;
    if (chatBadge) {
        chatBadge.style.display = "none";
        chatBadge.textContent = "0";
    }
    setTimeout(() => {
        if (chatInput) chatInput.focus();
    }, 200);
}

function closeChatPanel() {
    if (chatPanel) chatPanel.classList.remove("open");
}

function sendChatMessage(text) {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();

    // Broadcast to room via socket
    if (socket) {
        socket.emit("chat-message", {
            roomId: meetingId,
            senderName: myUserName,
            text: cleanText
        });
    } else {
        // Fallback for offline/local
        appendChatMessage({
            senderId: "self",
            senderName: myUserName,
            text: cleanText,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        });
    }

    // AI/Demo Partner smart response
    if (testBotActive) {
        setTimeout(() => {
            if (!testBotActive) return;
            const responses = [
                "Got your message! Video and audio are synced nicely.",
                "Awesome, audio and video quality looks crystal clear!",
                "Everything is working perfectly on Zenvia! You can invite others with the meeting ID.",
                "Yes, I can hear and see you well!"
            ];
            const botReply = responses[Math.floor(Math.random() * responses.length)];
            appendChatMessage({
                id: "bot-" + Date.now(),
                senderId: "test-bot-id",
                senderName: "Priya Sharma",
                text: botReply,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            });
        }, 1500);
    }
}

function appendChatMessage(msg) {
    if (!chatMessages) return;
    if (chatEmptyState) chatEmptyState.remove();

    const isSelf = (socket && msg.senderId === socket.id) || msg.senderId === "self";

    const msgWrapper = document.createElement("div");
    msgWrapper.style.marginBottom = "14px";
    msgWrapper.style.padding = "10px 14px";
    msgWrapper.style.borderRadius = "12px";
    msgWrapper.style.background = isSelf ? "rgba(124, 92, 255, 0.2)" : "rgba(255, 255, 255, 0.07)";
    msgWrapper.style.border = isSelf ? "1px solid rgba(124, 92, 255, 0.35)" : "1px solid rgba(255, 255, 255, 0.1)";

    const headerDiv = document.createElement("div");
    headerDiv.style.display = "flex";
    headerDiv.style.justifyContent = "space-between";
    headerDiv.style.alignItems = "center";
    headerDiv.style.marginBottom = "4px";

    const senderSpan = document.createElement("strong");
    senderSpan.textContent = isSelf ? "You" : (msg.senderName || "Participant");
    senderSpan.style.fontSize = "12px";
    senderSpan.style.color = isSelf ? "#a78bfa" : "#38bdf8";

    const timeSpan = document.createElement("span");
    timeSpan.textContent = msg.time || "";
    timeSpan.style.fontSize = "10px";
    timeSpan.style.color = "#94a3b8";

    headerDiv.appendChild(senderSpan);
    headerDiv.appendChild(timeSpan);

    const bodyDiv = document.createElement("div");
    bodyDiv.textContent = msg.text || "";
    bodyDiv.style.fontSize = "13px";
    bodyDiv.style.lineHeight = "1.5";
    bodyDiv.style.color = "#f8fafc";
    bodyDiv.style.wordBreak = "break-word";

    msgWrapper.appendChild(headerDiv);
    msgWrapper.appendChild(bodyDiv);
    chatMessages.appendChild(msgWrapper);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (!isSelf) {
        playChime("message");
        if (!chatPanel || !chatPanel.classList.contains("open")) {
            unreadChatCount++;
            if (chatBadge) {
                chatBadge.style.display = "inline-flex";
                chatBadge.textContent = unreadChatCount;
            }
            showStatus(`New message from ${msg.senderName || "Participant"}: "${msg.text.slice(0, 30)}..."`);
        }
    }
}

/* =========================================
   SHARE & INVITE MODAL
========================================= */
function getFullMeetingUrl() {
    return `${window.location.origin}/meeting.html?id=${encodeURIComponent(meetingId)}`;
}

function openShareModal() {
    const fullUrl = getFullMeetingUrl();
    if (shareMeetingId) shareMeetingId.textContent = meetingId;
    if (shareMeetingUrl) shareMeetingUrl.textContent = fullUrl;
    if (copyMessage) copyMessage.textContent = "";
    if (shareModal) shareModal.classList.add("show");
}

function closeShare() {
    if (shareModal) shareModal.classList.remove("show");
}

async function copyTextToClipboard(text, successMsg) {
    try {
        await navigator.clipboard.writeText(text);
        showStatus(successMsg);
        if (copyMessage) copyMessage.textContent = successMsg;
    } catch (e) {
        // Fallback for non-secure contexts
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
        showStatus(successMsg);
        if (copyMessage) copyMessage.textContent = successMsg;
    }
}

async function shareViaNativeApps() {
    const fullUrl = getFullMeetingUrl();
    if (navigator.share) {
        try {
            await navigator.share({
                title: "Join my Zenvia Meeting",
                text: `Join my Zenvia video meeting! Meeting ID: ${meetingId}`,
                url: fullUrl
            });
            return;
        } catch (e) {}
    }
    copyTextToClipboard(fullUrl, "Meeting link copied to clipboard!");
}

/* =========================================
   LEAVE MEETING
========================================= */
function openLeaveModal() {
    if (leaveModal) leaveModal.classList.add("show");
}

function closeLeaveModal() {
    if (leaveModal) leaveModal.classList.remove("show");
}

function leaveMeeting() {
    peerConnections.forEach(pc => pc.close());
    peerConnections.clear();

    if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
        if (localStream._stopLoop) localStream._stopLoop();
    }
    if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
    }
    if (testBotStream) {
        testBotStream.getTracks().forEach(t => t.stop());
    }
    if (testBotCanvasInterval) clearInterval(testBotCanvasInterval);
    if (callTimerInterval) clearInterval(callTimerInterval);

    if (socket) {
        socket.emit("leave-room");
        socket.disconnect();
    }

    localStorage.removeItem("zenviaJoinedMeeting");
    window.location.href = "index.html";
}

/* =========================================
   EVENT LISTENERS INITIALIZATION
========================================= */
function setupEventListeners() {
    // Media controls
    if (micBtn) micBtn.addEventListener("click", toggleMicrophone);
    if (cameraBtn) cameraBtn.addEventListener("click", toggleCamera);
    if (flipCameraBtn) flipCameraBtn.addEventListener("click", switchCameraFacing);
    if (screenShareBtn) screenShareBtn.addEventListener("click", toggleScreenShare);
    if (pipBtn) pipBtn.addEventListener("click", togglePictureInPicture);
    if (handBtn) handBtn.addEventListener("click", toggleRaiseHand);

    // Tap local video tile to enable real camera
    if (localVideoTile) {
        localVideoTile.style.cursor = "pointer";
        localVideoTile.title = "Tap to enable real camera";
        localVideoTile.addEventListener("click", () => {
            if (isVirtualCamera) {
                requestRealCamera(true);
            }
        });
    }

    // Reactions
    if (reactionsBtn) reactionsBtn.addEventListener("click", toggleReactionsPicker);
    document.querySelectorAll(".reaction-emoji-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const emoji = btn.getAttribute("data-emoji");
            if (emoji) sendReaction(emoji);
        });
    });

    // Panels
    if (participantsBtn) participantsBtn.addEventListener("click", openParticipants);
    if (chatBtn) chatBtn.addEventListener("click", openChat);
    if (closeParticipants) closeParticipants.addEventListener("click", closeParticipantsPanel);
    if (closeChat) closeChat.addEventListener("click", closeChatPanel);

    // Chat submit
    if (chatForm) {
        chatForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (!chatInput) return;
            sendChatMessage(chatInput.value);
            chatInput.value = "";
            chatInput.focus();
        });
    }

    // Share & Invites
    if (shareMeetingBtn) shareMeetingBtn.addEventListener("click", openShareModal);
    if (panelInviteBtn) panelInviteBtn.addEventListener("click", openShareModal);
    if (closeShareModal) closeShareModal.addEventListener("click", closeShare);
    if (copyMeetingIdBtn) {
        copyMeetingIdBtn.addEventListener("click", () => copyTextToClipboard(meetingId, "Meeting ID copied!"));
    }
    if (copyMeetingUrlBtn) {
        copyMeetingUrlBtn.addEventListener("click", () => copyTextToClipboard(getFullMeetingUrl(), "Meeting link copied!"));
    }
    if (quickCopyLinkBtn) {
        quickCopyLinkBtn.addEventListener("click", () => copyTextToClipboard(getFullMeetingUrl(), "Meeting link copied!"));
    }
    if (headerMeetingIdBox) {
        headerMeetingIdBox.addEventListener("click", () => copyTextToClipboard(meetingId, "Meeting ID copied!"));
    }
    if (nativeShareBtn) nativeShareBtn.addEventListener("click", shareViaNativeApps);

    // Test Partner / Demo Call
    if (testBotBtn) {
        testBotBtn.addEventListener("click", () => {
            if (testBotActive) {
                stopTestBot();
            } else {
                startTestBot();
            }
        });
    }

    // Open second window to test 2-way WebRTC immediately
    if (openTabBtn) {
        openTabBtn.addEventListener("click", () => {
            window.open(`meeting.html?id=${encodeURIComponent(meetingId)}&name=Partner%20Tester`, "_blank");
            showStatus("Opening 2nd tab to test real two-way WebRTC!");
        });
    }

    // Leave
    if (leaveBtn) leaveBtn.addEventListener("click", openLeaveModal);
    if (cancelLeave) cancelLeave.addEventListener("click", closeLeaveModal);
    if (confirmLeave) confirmLeave.addEventListener("click", leaveMeeting);

    // Modal background dismiss
    if (shareModal) {
        shareModal.addEventListener("click", (e) => {
            if (e.target === shareModal) closeShare();
        });
    }
    if (leaveModal) {
        leaveModal.addEventListener("click", (e) => {
            if (e.target === leaveModal) closeLeaveModal();
        });
    }

    // Dismiss reaction picker on outside click
    document.addEventListener("click", (e) => {
        if (reactionsPicker && reactionsPicker.style.display === "flex") {
            if (!reactionsPicker.contains(e.target) && e.target !== reactionsBtn && !reactionsBtn.contains(e.target)) {
                reactionsPicker.style.display = "none";
            }
        }
    });

    // Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeParticipantsPanel();
            closeChatPanel();
            closeShare();
            closeLeaveModal();
            if (reactionsPicker) reactionsPicker.style.display = "none";
        }
    });

    window.addEventListener("beforeunload", () => {
        if (socket) socket.disconnect();
    });
}

/* =========================================
   INITIALIZATION
========================================= */
function initialize() {
    console.log("Initializing Zenvia Meeting:", meetingId);
    if (meetingIdDisplay) meetingIdDisplay.textContent = meetingId;
    if (shareMeetingId) shareMeetingId.textContent = meetingId;
    if (localDisplayName) localDisplayName.textContent = `${myUserName} (Host)`;
    const localItemName = document.getElementById("participantItemLocalName");
    if (localItemName) localItemName.textContent = myUserName;
    const localAvatar = document.getElementById("localAvatarBadge");
    if (localAvatar) localAvatar.textContent = (myUserName[0] || "Y").toUpperCase();

    setupEventListeners();
    connectToServer();
    startCameraAndMic();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
} else {
    initialize();
}
