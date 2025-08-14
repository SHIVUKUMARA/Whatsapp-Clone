// server.js (or Server.js)
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import cors from "cors";
import morgan from "morgan";

import connectDB from "./Config/db.js";
import messageRoutes from "./Routes/MessageRoutes.js";
import Message from "./Models/Message.js"; // ensure path is correct

const app = express();
const server = http.createServer(app);

// configure Socket.IO
const io = new IOServer(server, {
  cors: {
    origin: "*", // change this to your frontend origin in production
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) =>
  res.send("WhatsApp Clone Backend + Socket.IO Running 🚀")
);

app.use("/api/messages", messageRoutes);

// start DB and then start server
await connectDB();

// Attach io to app locals so controllers or other modules can get it if needed
app.locals.io = io;

// When a client connects
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("⛔ Client disconnected:", socket.id);
  });

  // optional: allow client to join rooms per wa_id (chat rooms)
  socket.on("join_chat", (wa_id) => {
    socket.join(wa_id);
    console.log(`Socket ${socket.id} joined room ${wa_id}`);
  });
});

// Setup MongoDB Change Stream to broadcast DB changes in processed_messages
const db = Message.db; // mongoose connection
const collectionName = "processed_messages"; // ensure matches your collection
// Wait for connection to be ready, then open change stream
db.once("open", () => {
  console.log("🔎 Listening to change stream on collection:", collectionName);
  const changeStream = db.collection(collectionName).watch();

  changeStream.on("change", (change) => {
    // change.operationType can be: insert, update, replace, delete, invalidate
    try {
      if (change.operationType === "insert") {
        const fullDoc = change.fullDocument;
        // broadcast new message to all clients
        io.emit("new_message", fullDoc);
        // optionally emit to room of the wa_id:
        if (fullDoc?.wa_id) io.to(fullDoc.wa_id).emit("new_message", fullDoc);
        console.log("📣 Emitted new_message", fullDoc.meta_msg_id);
      } else if (change.operationType === "update") {
        // Use change.updateDescription or fetch doc
        const updatedId = change.documentKey._id;
        // fetch full doc
        Message.findById(updatedId)
          .then((doc) => {
            if (!doc) return;
            io.emit("message_updated", doc);
            if (doc?.wa_id) io.to(doc.wa_id).emit("message_updated", doc);
            console.log("🔁 Emitted message_updated", doc.meta_msg_id);
          })
          .catch((err) => console.error("ChangeStream fetch error:", err));
      }
    } catch (err) {
      console.error("Error processing change stream event:", err);
    }
  });

  changeStream.on("error", (err) => {
    console.error("Change stream error:", err);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`✅ Server + Socket.IO running on port ${PORT}`)
);
