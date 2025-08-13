import React from "react";
import socket from "../Services/Socket.jsx";

export default function useChatSocket(setConversations) {
  React.useEffect(() => {
    socket.on("new_message", (msg) => {
      setConversations((prev) => {
        const updated = [...prev];
        const chatIndex = updated.findIndex((c) => c._id === msg.wa_id);
        if (chatIndex !== -1) {
          updated[chatIndex].messages.push(msg);
        } else {
          updated.push({ _id: msg.wa_id, messages: [msg] });
        }
        return [...updated];
      });
    });

    socket.on("message_updated", (msg) => {
      setConversations((prev) =>
        prev.map((chat) =>
          chat._id === msg.wa_id
            ? {
                ...chat,
                messages: chat.messages.map((m) =>
                  m.meta_msg_id === msg.meta_msg_id ? msg : m
                )
              }
            : chat
        )
      );
    });

    return () => {
      socket.off("new_message");
      socket.off("message_updated");
    };
  }, [setConversations]);
}
