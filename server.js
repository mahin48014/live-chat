// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Allow serving frontend from "public"
app.use(express.static("public"));

// Create Socket.IO server
const io = new Server(server, {
  // allow CORS in dev; tighten in production
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// in-memory history (for demo). Replace with DB for production.
const MESSAGE_HISTORY_LIMIT = 200;
let history = [];

io.on("connection", (socket) => {
  console.log("user connected:", socket.id);

  // send recent history to the newly connected client
  socket.emit("history", history);

  // join room (optional)
  socket.on("join", (name) => {
    socket.data.name = name || "Anonymous";
    io.emit("user-joined", { id: socket.id, name: socket.data.name });
  });

  // receive message from client
  socket.on("message", (msg) => {
    // sanitize and structure (server-side)
    const message = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 9),
      name: socket.data.name || "Anonymous",
      text: String(msg).slice(0, 2000), // limit length
      ts: Date.now()
    };

    // store to history
    history.push(message);
    if (history.length > MESSAGE_HISTORY_LIMIT) history.shift();

    // broadcast to everyone
    io.emit("message", message);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
    io.emit("user-left", { id: socket.id, name: socket.data.name });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});