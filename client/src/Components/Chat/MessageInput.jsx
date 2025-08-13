import React, { useState } from "react";
import { InputGroup, FormControl, Button } from "react-bootstrap";
import SendIcon from "@mui/icons-material/Send";
import { sendMessage } from "../../Services/api.jsx";

function MessageInput({ wa_id, setMessages }) {
  const [text, setText] = useState("");

  const handleSend = async () => {
    if (!text.trim()) return;
    const newMsg = {
      wa_id,
      name: "You",
      message: text,
      meta_msg_id: `local-${Date.now()}`
    };
    await sendMessage(newMsg);
    setMessages((prev) => [...prev, newMsg]);
    setText("");
  };

  return (
    <InputGroup>
      <FormControl
        placeholder="Type a message"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
      <Button variant="primary" onClick={handleSend}>
        <SendIcon />
      </Button>
    </InputGroup>
  );
}

export default MessageInput;
