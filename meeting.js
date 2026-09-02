/* =========================================
   ZENVIA - MEETING ROOM JAVASCRIPT
========================================= */

"use strict";


/* =========================================
   ELEMENTS
========================================= */

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const micBtn = document.getElementById("micBtn");
const cameraBtn = document.getElementById("cameraBtn");
const screenShareBtn = document.getElementById("screenShareBtn");

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

let micEnabled = true;

let cameraEnabled = true;

let screenStream = null;

let isScreenSharing = false;

let statusTimer = null;


/* =========================================
   MEETING ID
========================================= */

function generateMeetingId() {

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let randomLetters = "";

    for (let i = 0; i < 3; i++) {
        randomLetters +=
            letters[
                Math.floor(
                    Math.random() * letters.length
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
   STATUS MESSAGE
========================================= */

function showStatus(message) {

    if (!statusMessage ||
        !statusMessageText) {
        return;
    }

    statusMessageText.textContent =
        message;

    statusMessage.classList.add("show");

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

    if (dot) {

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
}


/* =========================================
   CAMERA + MICROPHONE
========================================= */

async function startCameraAndMic() {

    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {

        showStatus(
            "Camera and microphone are not supported here."
        );

        setConnectionStatus(
            "Unsupported"
        );

        return;
    }

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

            localVideo.classList.add(
                "active"
            );
        }

        cameraEnabled = true;
        micEnabled = true;

        updateCameraUI();
        updateMicUI();

        setConnectionStatus(
            "Ready",
            true
        );

        showStatus(
            "Camera and microphone are ready."
        );

    } catch (error) {

        console.error(
            "Media permission error:",
            error
        );

        setConnectionStatus(
            "Permission needed"
        );

        if (error.name ===
            "NotAllowedError") {

            showStatus(
                "Camera/microphone permission was not allowed."
            );

        } else if (
            error.name ===
            "NotFoundError"
        ) {

            showStatus(
                "Camera or microphone was not found."
            );

        } else {

            showStatus(
                "Could not start camera and microphone."
            );
        }

        cameraEnabled = false;
        micEnabled = false;

        updateCameraUI();
        updateMicUI();
    }
}


/* =========================================
   CAMERA TOGGLE
========================================= */

function toggleCamera() {

    if (!localStream) {

        showStatus(
            "Camera is not started yet."
        );

        return;
    }

    const videoTracks =
        localStream.getVideoTracks();

    if (!videoTracks.length) {

        showStatus(
            "No camera track is available."
        );

        return;
    }

    cameraEnabled =
        !cameraEnabled;

    videoTracks.forEach(
        track => {
            track.enabled =
                cameraEnabled;
        }
    );

    updateCameraUI();
}


/* =========================================
   CAMERA UI
========================================= */

function updateCameraUI() {

    if (!cameraBtn) {
        return;
    }

    if (cameraEnabled) {

        cameraBtn.classList.remove(
            "off"
        );

        cameraBtn.querySelector(
            ".control-icon"
        ).textContent = "📹";

        cameraBtn.querySelector(
            ".control-label"
        ).textContent = "Camera";

        if (cameraOffMessage) {
            cameraOffMessage.style.display =
                "none";
        }

    } else {

        cameraBtn.classList.add(
            "off"
        );

        cameraBtn.querySelector(
            ".control-icon"
        ).textContent = "🚫";

        cameraBtn.querySelector(
            ".control-label"
        ).textContent = "Camera";

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
            "Microphone is not started yet."
        );

        return;
    }

    const audioTracks =
        localStream.getAudioTracks();

    if (!audioTracks.length) {

        showStatus(
            "No microphone track is available."
        );

        return;
    }

    micEnabled =
        !micEnabled;

    audioTracks.forEach(
        track => {
            track.enabled =
                micEnabled;
        }
    );

    updateMicUI();
}


/* =========================================
   MICROPHONE UI
========================================= */

function updateMicUI() {

    if (!micBtn) {
        return;
    }

    if (micEnabled) {

        micBtn.classList.remove(
            "off"
        );

        micBtn.querySelector(
            ".control-icon"
        ).textContent = "🎤";

        micBtn.querySelector(
            ".control-label"
        ).textContent = "Mic";

    } else {

        micBtn.classList.add(
            "off"
        );

        micBtn.querySelector(
            ".control-icon"
        ).textContent = "🔇";

        micBtn.querySelector(
            ".control-label"
        ).textContent = "Mic";
    }
}


/* =========================================
   SCREEN SHARE
========================================= */

async function toggleScreenShare() {

    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getDisplayMedia) {

        showStatus(
            "Screen sharing is not supported here."
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

        if (localVideo) {

            localVideo.srcObject =
                screenStream;

            localVideo.classList.add(
                "active"
            );
        }

        isScreenSharing = true;

        if (screenShareBtn) {

            screenShareBtn.classList.add(
                "off"
            );

            screenShareBtn.querySelector(
                ".control-icon"
            ).textContent = "⛔";

            screenShareBtn.querySelector(
                ".control-label"
            ).textContent = "Stop";
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
            "Screen sharing was cancelled."
        );
    }
}


/* =========================================
   STOP SCREEN SHARE
========================================= */

function stopScreenShare() {

    if (screenStream) {

        screenStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        screenStream = null;
    }

    isScreenSharing = false;

    if (localVideo &&
        localStream) {

        localVideo.srcObject =
            localStream;

        localVideo.classList.add(
            "active"
        );
    }

    if (screenShareBtn) {

        screenShareBtn.classList.remove(
            "off"
        );

        screenShareBtn.querySelector(
            ".control-icon"
        ).textContent = "🖥️";

        screenShareBtn.querySelector(
            ".control-label"
        ).textContent = "Share";
    }

    showStatus(
        "Screen sharing stopped."
    );
}


/* =========================================
   PARTICIPANTS PANEL
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
   CHAT PANEL
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


/* =========================================
   CHAT
========================================= */

function sendChatMessage(message) {

    const text =
        message.trim();

    if (!text) {
        return;
    }

    if (!chatMessages) {
        return;
    }

    const empty =
        chatMessages.querySelector(
            ".chat-empty"
        );

    if (empty) {
        empty.remove();
    }

    const messageElement =
        document.createElement(
            "div"
        );

    messageElement.style.marginBottom =
        "12px";

    messageElement.style.padding =
        "10px 12px";

    messageElement.style.borderRadius =
        "10px";

    messageElement.style.background =
        "rgba(124,92,255,.15)";

    messageElement.style.border =
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

    name.style.marginBottom =
        "4px";

    const body =
        document.createElement(
            "div"
        );

    body.textContent =
        text;

    body.style.fontSize =
        "13px";

    body.style.lineHeight =
        "1.4";

    messageElement.appendChild(
        name
    );

    messageElement.appendChild(
        body
    );

    chatMessages.appendChild(
        messageElement
    );

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


/* =========================================
   SHARE MEETING
========================================= */

function openShareModal() {

    if (shareMeetingId) {
        shareMeetingId.textContent =
            meetingId;
    }

    if (copyMessage) {
        copyMessage.textContent = "";
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


/* =========================================
   COPY MEETING ID
========================================= */

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

        /* Fallback */

        const textArea =
            document.createElement(
                "textarea"
            );

        textArea.value =
            meetingId;

        document.body.appendChild(
            textArea
        );

        textArea.select();

        try {

            document.execCommand(
                "copy"
            );

            if (copyMessage) {
                copyMessage.textContent =
                    "Meeting ID copied!";
            }

            showStatus(
                "Meeting ID copied."
            );

        } catch (copyError) {

            showStatus(
                "Copy failed. Please copy it manually."
            );
        }

        textArea.remove();
    }
}


/* =========================================
   SHARE LINK
========================================= */

async function shareMeeting() {

    const meetingUrl =
        `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(meetingId)}`;

    if (navigator.share) {

        try {

            await navigator.share({
                title: "Join my Zenvia Meeting",
                text:
                    `Join my Zenvia meeting. Meeting ID: ${meetingId}`,
                url: meetingUrl
            });

            return;

        } catch (error) {

            console.log(
                "Share cancelled."
            );
        }
    }

    openShareModal();
}


/* =========================================
   LEAVE MEETING
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

    stopAllMedia();

    localStorage.removeItem(
        "zenviaJoinedMeeting"
    );

    window.location.href =
        "index.html";
}


/* =========================================
   STOP ALL MEDIA
========================================= */

function stopAllMedia() {

    if (screenStream) {

        screenStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        screenStream = null;
    }

    if (localStream) {

        localStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        localStream = null;
    }

    if (localVideo) {
        localVideo.srcObject = null;
    }

    if (remoteVideo) {
        remoteVideo.srcObject = null;
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
        function (event) {

            event.preventDefault();

            if (!chatInput) {
                return;
            }

            sendChatMessage(
                chatInput.value
            );

            chatInput.value = "";

            chatInput.focus();
        }
    );
}


/* =========================================
   CLOSE MODALS BY BACKDROP
========================================= */

if (shareModal) {

    shareModal.addEventListener(
        "click",
        function (event) {

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
        function (event) {

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
   ESCAPE KEY
========================================= */

document.addEventListener(
    "keydown",
    function (event) {

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
    function () {

        stopAllMedia();

    }
);


/* =========================================
   START ZENVIA MEETING
========================================= */

function initializeMeeting() {

    displayMeetingId();

    updateCameraUI();

    updateMicUI();

    setConnectionStatus(
        "Starting..."
    );

    /*
       Small delay gives the page time
       to finish loading before asking
       for camera/microphone permission.
    */

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
