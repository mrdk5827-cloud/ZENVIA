# Zenvia - Real-Time Video Calling & Meetings

Zenvia is a modern, real-time video conferencing web application built with WebRTC, Socket.IO, Express, and HTML5/CSS3.

## Features

- **Real-Time Video & Audio**: Low-latency peer-to-peer audio/video streaming powered by WebRTC.
- **Integrated Signaling Server**: High-speed local Socket.IO signaling with room management and participant tracking.
- **Active Speaker Detection**: Visual audio glow around speaking participants.
- **Virtual Video Fallback**: If a webcam is unavailable or permissions are denied, automatically falls back to an animated Virtual Camera avatar so meetings never crash.
- **Interactive Test Partner (AI Demo Call)**: 1-click test partner ("Priya Sharma") to test two-way video, audio visualizers, and chat responses without requiring a second participant.
- **Live In-Call Chat**: Real-time room messaging with audio notification chimes and unread counters.
- **Screen Sharing**: 1-click screen, window, or browser tab sharing with WebRTC track replacement.
- **Emoji Reactions & Hand Raise**: Floating animated emoji reactions (`👍`, `❤️`, `👏`, `🎉`, `💡`, `😂`, `🔥`) and raise hand indicator (`✋`).
- **Meeting ID & Direct Link Sharing**: Automatic link copying and native Web Share API support.
- **Picture-in-Picture (PiP)**: Keep video playing while multitasking.

## Running the Application

```bash
npm install
npm run dev
```

Server runs on `http://0.0.0.0:3000`.
