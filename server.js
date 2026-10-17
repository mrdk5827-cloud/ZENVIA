const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// In-memory store for rooms and participants
// roomId -> Map<socketId, { socketId, userName, isHost, micOn, cameraOn, isScreenSharing, joinedAt }>
const activeRooms = new Map();

// Serve static frontend files with optimal caching
app.use(express.static(path.join(__dirname), {
    maxAge: "1h",
    etag: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache");
        } else {
            res.setHeader("Cache-Control", "public, max-age=3600");
        }
    }
}));

// API routes
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        activeRooms: activeRooms.size,
        timestamp: new Date().toISOString()
    });
});

app.get("/api/room/:roomId", (req, res) => {
    const roomId = (req.params.roomId || "").trim().toUpperCase();
    const room = activeRooms.get(roomId);
    if (!room) {
        return res.json({ exists: false, count: 0 });
    }
    return res.json({
        exists: true,
        count: room.size,
        participants: Array.from(room.values()).map(p => ({
            name: p.userName,
            isHost: p.isHost
        }))
    });
});

// Direct meeting URL route support
app.get("/meeting", (req, res) => {
    res.sendFile(path.join(__dirname, "meeting.html"));
});

/* =========================================
   SOCKET.IO SIGNALING & COLLABORATION
========================================= */
io.on("connection", (socket) => {
    console.log(`[Socket Connected] ID: ${socket.id}`);
    let currentRoomId = null;

    // Join room event
    socket.on("join-room", async (data) => {
        let roomId = "";
        let userName = "Guest";

        if (typeof data === "string") {
            roomId = data.trim().toUpperCase();
        } else if (data && typeof data === "object") {
            roomId = (data.roomId || "").trim().toUpperCase();
            if (data.userName && data.userName.trim()) {
                userName = data.userName.trim().slice(0, 25);
            }
        }

        if (!roomId) {
            socket.emit("room-error", "Invalid Meeting ID");
            return;
        }

        currentRoomId = roomId;
        await socket.join(roomId);

        if (!activeRooms.has(roomId)) {
            activeRooms.set(roomId, new Map());
        }

        const roomMap = activeRooms.get(roomId);
        const isHost = roomMap.size === 0;

        const participantInfo = {
            socketId: socket.id,
            userName: userName,
            isHost: isHost,
            micOn: true,
            cameraOn: true,
            isScreenSharing: false,
            joinedAt: Date.now()
        };

        // Existing participants in the room
        const existingParticipants = Array.from(roomMap.values());

        // Add current user to room
        roomMap.set(socket.id, participantInfo);

        console.log(`[Join Room] ${userName} (${socket.id}) joined ${roomId}. Total: ${roomMap.size}`);

        // Send existing participants to the new user
        socket.emit("room-joined", {
            roomId: roomId,
            isHost: isHost,
            participants: existingParticipants,
            totalCount: roomMap.size
        });

        // Notify other participants in the room that a new user joined
        socket.to(roomId).emit("user-joined", {
            socketId: socket.id,
            userName: userName,
            isHost: isHost,
            micOn: true,
            cameraOn: true,
            totalCount: roomMap.size
        });
    });

    // WebRTC Offer
    socket.on("offer", (data) => {
        if (!data || !data.target) return;
        io.to(data.target).emit("offer", {
            offer: data.offer,
            sender: socket.id,
            senderName: data.senderName || "Participant"
        });
    });

    // WebRTC Answer
    socket.on("answer", (data) => {
        if (!data || !data.target) return;
        io.to(data.target).emit("answer", {
            answer: data.answer,
            sender: socket.id
        });
    });

    // WebRTC ICE Candidate
    socket.on("ice-candidate", (data) => {
        if (!data || !data.target) return;
        io.to(data.target).emit("ice-candidate", {
            candidate: data.candidate,
            sender: socket.id
        });
    });

    // User Media State (Mute/Video toggle)
    socket.on("user-media-state", (data) => {
        if (!currentRoomId || !activeRooms.has(currentRoomId)) return;
        const roomMap = activeRooms.get(currentRoomId);
        const participant = roomMap.get(socket.id);
        if (participant && data) {
            if (typeof data.micOn === "boolean") participant.micOn = data.micOn;
            if (typeof data.cameraOn === "boolean") participant.cameraOn = data.cameraOn;
            if (typeof data.isScreenSharing === "boolean") participant.isScreenSharing = data.isScreenSharing;
            
            socket.to(currentRoomId).emit("user-media-state-changed", {
                socketId: socket.id,
                ...data
            });
        }
    });

    // Chat Message
    socket.on("chat-message", (data) => {
        if (!currentRoomId || !data) return;
        const text = (data.text || "").trim();
        if (!text) return;

        const senderName = data.senderName || "Participant";
        const messagePayload = {
            id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
            senderId: socket.id,
            senderName: senderName,
            text: text,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        // Broadcast to all participants in the room, including sender
        io.to(currentRoomId).emit("chat-message", messagePayload);
    });

    // Send Reaction / Emoji
    socket.on("send-reaction", (data) => {
        if (!currentRoomId || !data || !data.emoji) return;
        io.to(currentRoomId).emit("reaction-received", {
            emoji: data.emoji,
            senderName: data.senderName || "Participant"
        });
    });

    // Clean disconnect handler
    const handleLeave = () => {
        if (!currentRoomId || !activeRooms.has(currentRoomId)) return;
        const roomMap = activeRooms.get(currentRoomId);
        const participant = roomMap.get(socket.id);
        const userName = participant ? participant.userName : "A user";

        roomMap.delete(socket.id);
        const remainingCount = roomMap.size;

        console.log(`[User Left] ${userName} (${socket.id}) left ${currentRoomId}. Remaining: ${remainingCount}`);

        socket.to(currentRoomId).emit("user-left", {
            socketId: socket.id,
            userName: userName,
            totalCount: remainingCount
        });

        if (remainingCount === 0) {
            activeRooms.delete(currentRoomId);
            console.log(`[Room Deleted] ${currentRoomId} is now empty and removed.`);
        }
        currentRoomId = null;
    };

    socket.on("leave-room", handleLeave);
    socket.on("disconnect", handleLeave);
});

const PORT = process.env.APP_PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`===========================================`);
    console.log(`  Zenvia Video Meeting Server Running`);
    console.log(`  URL: http://0.0.0.0:${PORT}`);
    console.log(`===========================================`);
});
