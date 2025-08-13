import React, { useState } from "react";
import dayjs from "dayjs";
import { Form, Button, InputGroup, Image } from "react-bootstrap";
import { sendMessage } from "../../Services/api";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import useMediaQuery from "@mui/material/useMediaQuery";

export default function ChatWindow({ chat, onBack }) {
  const [newMessage, setNewMessage] = useState("");
  const isMobile = useMediaQuery("(max-width:768px)"); // detect mobile

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await sendMessage({
      wa_id: chat._id,
      name: chat.messages?.[0]?.name || "Unknown",
      message: newMessage,
      timestamp: new Date(),
      status: "sent",
      meta_msg_id: `local-${Date.now()}`,
    });

    setNewMessage("");
  };

  return (
    <div className="d-flex flex-column w-100 h-100">
      {/* Header */}
      <div className="border-bottom p-3 bg-success text-white d-flex align-items-center">
        {onBack && (
          <Button
            variant="link"
            className="text-white me-2 p-0"
            onClick={onBack}
          >
            {isMobile ? <ArrowBackIcon /> : "← Back"}
          </Button>
        )}

        {/* Profile Image */}
        <AccountCircleIcon
          fontSize="large"
          sx={{ color: "white" }}
          className="me-3"
        />

        {/* Name */}
        <h6 className="mb-0">{chat?.messages?.[0]?.name || chat._id}</h6>
      </div>

      {/* Messages */}
      <div className="flex-grow-1 p-3 d-flex flex-column overflow-auto bg-light">
        {chat?.messages?.map((msg, idx) => {
          const isSent = msg.status === "sent";
          const msgClasses = isSent
            ? "bg-success text-white ms-auto"
            : "bg-white me-auto";

          return (
            <div
              key={idx}
              className={`p-2 mb-2 rounded shadow-sm ${msgClasses}`}
              style={{
                maxWidth: isSent ? "75%" : "100%",
                wordBreak: "break-word",
              }}
            >
              <div>{msg.message}</div>
              <small
                className={isSent ? "text-light" : "text-muted"}
                style={{ fontSize: "0.75rem" }}
              >
                {dayjs(msg.timestamp).format("MMM D, hh:mm A")}{" "}
                {msg.status && `(${msg.status})`}
              </small>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <Form onSubmit={handleSend} className="p-2 border-top bg-white">
        <InputGroup>
          <Form.Control
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button type="submit" variant="success">
            Send
          </Button>
        </InputGroup>
      </Form>
    </div>
  );
}
