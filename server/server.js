const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});


/* ==============================
   BASIC SERVER TEST
============================== */

app.get("/", (req, res) => {

    res.send("Zenvia Signaling Server is Running");

});


/* ==============================
   SOCKET CONNECTION
============================== */

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);


    /* ==========================
       JOIN ROOM
    ========================== */

    
socket.on("join-room", async (roomId) => {

    if (typeof roomId !== "string" || !roomId.trim()) {
        socket.emit("room-error", "Invalid Meeting ID");
        return;
    }

    roomId = roomId.trim().toUpperCase();

    await socket.join(roomId);

    const clients = await io.in(roomId).fetchSockets();

    console.log(
        "ROOM CHECK:",
        roomId,
        "| Participants:",
        clients.length,
        "| Socket:",
        socket.id
    );

    socket.emit("room-joined", {
        roomId: roomId,
        participants: clients.length
    });

    socket.to(roomId).emit("user-joined", socket.id);

});



    /* ==========================
       WEBRTC SIGNALING
    ========================== */

    socket.on("offer", (data) => {

        io.to(data.target).emit(
            "offer",
            {
                offer: data.offer,
                sender: socket.id
            }
        );

    });


    socket.on("answer", (data) => {

        io.to(data.target).emit(
            "answer",
            {
                answer: data.answer,
                sender: socket.id
            }
        );

    });


    socket.on("ice-candidate", (data) => {

        io.to(data.target).emit(
            "ice-candidate",
            {
                candidate: data.candidate,
                sender: socket.id
            }
        );

    });


    /* ==========================
       DISCONNECT
    ========================== */

    socket.on("disconnect", () => {

        console.log(
            "User disconnected:",
            socket.id
        );

        socket.broadcast.emit(
            "user-left",
            socket.id
        );

    });

});


/* ==============================
   START SERVER
============================== */

const PORT =
    process.env.PORT || 10000;

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Zenvia server running on port ${PORT}`
        );

    }
);
