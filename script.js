/* =========================================
   ZENVIA - HOMEPAGE JAVASCRIPT
========================================= */

"use strict";

const newMeetingBtn = document.getElementById("newMeetingBtn");
const joinMeetingBtn = document.getElementById("joinMeetingBtn");
const joinBox = document.getElementById("joinBox");
const meetingIdInput = document.getElementById("meetingId");
const joinBtn = document.getElementById("joinBtn");
const joinMessage = document.getElementById("joinMessage");
const userNameInput = document.getElementById("userNameInput");
const menuBtn = document.getElementById("menuBtn");

/* =========================================
   USER NAME PERSISTENCE
========================================= */
function initUserName() {
    if (!userNameInput) return;
    const savedName = localStorage.getItem("zenviaUserName");
    if (savedName && savedName.trim()) {
        userNameInput.value = savedName.trim();
    }

    userNameInput.addEventListener("input", () => {
        const val = userNameInput.value.trim();
        if (val) {
            localStorage.setItem("zenviaUserName", val);
        }
    });
}

function getEnteredUserName() {
    if (userNameInput && userNameInput.value.trim()) {
        const name = userNameInput.value.trim();
        localStorage.setItem("zenviaUserName", name);
        return name;
    }
    const saved = localStorage.getItem("zenviaUserName");
    if (saved && saved.trim()) return saved.trim();
    const generated = "User " + Math.floor(100 + Math.random() * 900);
    localStorage.setItem("zenviaUserName", generated);
    return generated;
}

/* =========================================
   GENERATE MEETING ID
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

/* =========================================
   SHOW JOIN BOX
========================================= */
function showJoinBox() {
    if (!joinBox) return;
    joinBox.style.display = "block";
    joinBox.classList.add("active");
    setTimeout(() => {
        if (meetingIdInput) {
            meetingIdInput.focus();
            meetingIdInput.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, 100);
}

/* =========================================
   NEW MEETING
========================================= */
if (newMeetingBtn) {
    newMeetingBtn.addEventListener("click", () => {
        const meetingId = generateMeetingId();
        const userName = getEnteredUserName();

        localStorage.setItem("zenviaMeetingId", meetingId);
        localStorage.setItem("zenviaJoinedMeeting", meetingId);

        window.location.href = `meeting.html?id=${encodeURIComponent(meetingId)}&name=${encodeURIComponent(userName)}`;
    });
}

/* =========================================
   JOIN MEETING BUTTON
========================================= */
if (joinMeetingBtn) {
    joinMeetingBtn.addEventListener("click", () => {
        showJoinBox();
    });
}

/* =========================================
   JOIN MEETING HANDLER
========================================= */
function joinMeeting() {
    if (!meetingIdInput) return;
    let inputVal = meetingIdInput.value.trim();

    if (!inputVal) {
        if (joinMessage) {
            joinMessage.textContent = "Please enter a Meeting ID or link.";
            joinMessage.style.color = "#ff6b6b";
        }
        return;
    }

    // Handle full URL pasted (e.g. https://.../meeting.html?id=ZEN-ABC-123456)
    if (inputVal.includes("?id=")) {
        try {
            const urlObj = new URL(inputVal.startsWith("http") ? inputVal : `http://${inputVal}`);
            const extractedId = urlObj.searchParams.get("id");
            if (extractedId) inputVal = extractedId;
        } catch (e) {
            const match = inputVal.match(/[?&]id=([^&]+)/);
            if (match && match[1]) inputVal = match[1];
        }
    }

    let meetingId = inputVal.trim().toUpperCase();

    // Auto-prefix ZEN- if user typed ABC-123456
    if (/^[A-Z]{3}-[0-9]{6}$/.test(meetingId)) {
        meetingId = `ZEN-${meetingId}`;
    }

    if (meetingId.length < 3) {
        if (joinMessage) {
            joinMessage.textContent = "Meeting code is too short.";
            joinMessage.style.color = "#ff6b6b";
        }
        return;
    }

    const userName = getEnteredUserName();
    localStorage.setItem("zenviaJoinedMeeting", meetingId);
    localStorage.setItem("zenviaMeetingId", meetingId);

    window.location.href = `meeting.html?id=${encodeURIComponent(meetingId)}&name=${encodeURIComponent(userName)}`;
}

if (joinBtn) {
    joinBtn.addEventListener("click", joinMeeting);
}

if (meetingIdInput) {
    meetingIdInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            joinMeeting();
        }
    });
}

/* =========================================
   MENU
========================================= */
if (menuBtn) {
    menuBtn.addEventListener("click", () => {
        const choice = window.confirm("Zenvia Video Meetings\n\nClick OK to start a New Meeting\nClick Cancel to close menu");
        if (choice && newMeetingBtn) {
            newMeetingBtn.click();
        }
    });
}

// Button press feedback
document.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("pointerdown", function () {
        this.style.transform = "scale(0.97)";
    });
    btn.addEventListener("pointerup", function () {
        this.style.transform = "";
    });
    btn.addEventListener("pointerleave", function () {
        this.style.transform = "";
    });
});

document.addEventListener("DOMContentLoaded", () => {
    initUserName();
    console.log("Zenvia video calling app ready.");
});
