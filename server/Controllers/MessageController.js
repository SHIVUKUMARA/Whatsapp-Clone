import Message from "../Models/Message.js";

export const insertMessage = async (req, res) => {
  try {
    const data = req.body;
    const newMessage = await Message.create({
      wa_id: data.wa_id,
      name: data.name || "",
      message: data.message || "",
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      status: data.status || "sent",
      meta_msg_id: data.meta_msg_id || `local-${Date.now()}`,
    });

    // Emit via Socket.IO if available
    const io = req.app.locals.io;
    if (io) {
      io.emit("new_message", newMessage); // to all
      io.to(newMessage.wa_id).emit("new_message", newMessage); // to room
    }

    res.status(201).json({ message: "Message saved", data: newMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    const messages = await Message.aggregate([
      { $sort: { timestamp: 1 } },
      {
        $group: {
          _id: "$wa_id",
          messages: { $push: "$$ROOT" },
        },
      },
    ]);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
  
// Update message status
export const updateStatus = async (req, res) => {
    try {
      const { meta_msg_id, status } = req.body;
  
      const updated = await Message.findOneAndUpdate(
        { meta_msg_id },
        { status },
        { new: true }
      );
  
      // Emit update to Socket.IO clients
      const io = req.app.locals.io;
      if (io && updated) {
        io.emit("message_updated", updated);
        if (updated.wa_id) {
          io.to(updated.wa_id).emit("message_updated", updated);
        }
      }
  
      res.json({ message: "Status updated", data: updated });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

export const createConversation = async (req, res) => {
  try {
    const { name, wa_id } = req.body;
    if (!wa_id) {
      return res.status(400).json({ error: "wa_id is required" });
    }

    // Check if conversation already exists
    const existingMessages = await Message.find({ wa_id }).sort({
      timestamp: 1,
    });

    if (existingMessages.length > 0) {
      return res.status(200).json({
        message: "Conversation already exists",
        data: existingMessages,
      });
    }

    // If not exists → create placeholder message
    const newMessage = await Message.create({
      wa_id,
      name: name || wa_id,
      message: "Hi !",
      timestamp: new Date(),
      status: "sent",
      meta_msg_id: `init-${Date.now()}`,
    });

    res.status(201).json({
      message: "New conversation created",
      data: [newMessage],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

