import React from "react";
import { ListGroup } from "react-bootstrap";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import dayjs from "dayjs";

function ChatList({ conversations, setActiveChat }) {
  // Sort conversations by latest message timestamp (descending)
  const sortedConversations = [...conversations].sort((a, b) => {
    const lastA = a.messages?.[a.messages.length - 1]?.timestamp || 0;
    const lastB = b.messages?.[b.messages.length - 1]?.timestamp || 0;
    return new Date(lastB) - new Date(lastA);
  });

  return (
    <ListGroup variant="flush" className="chat-list">
      {sortedConversations.map((chat) => {
        const lastMsg = chat.messages?.[chat.messages.length - 1];
        const shortMessage =
          lastMsg?.message?.length > 25
            ? lastMsg.message.slice(0, 25) + "..."
            : lastMsg?.message || "";

        return (
          <ListGroup.Item
            key={chat._id}
            action
            onClick={() => setActiveChat(chat._id)}
            className="d-flex align-items-center justify-content-between py-2 px-3"
            style={{ cursor: "pointer", borderBottom: "1px solid #e0e0e0" }}
          >
            {/* Avatar + Chat Name + Last Message */}
            <div className="d-flex align-items-center">
              <AccountCircleIcon
                fontSize="large"
                className="me-3 text-secondary"
              />
              <div>
                <div
                  className="fw-bold text-truncate"
                  style={{ maxWidth: "180px" }}
                >
                  {chat.messages?.[0]?.name || chat._id}
                </div>
                <small
                  className="text-muted"
                  style={{ maxWidth: "180px", display: "block" }}
                >
                  {shortMessage}
                </small>
              </div>
            </div>

            {/* Last message time */}
            {lastMsg && (
              <div className="text-end">
                <small className="text-muted">
                  {dayjs(lastMsg.timestamp).isSame(dayjs(), "day")
                    ? dayjs(lastMsg.timestamp).format("hh:mm A")
                    : dayjs(lastMsg.timestamp).format("MMM D")}
                </small>
              </div>
            )}
          </ListGroup.Item>
        );
      })}
    </ListGroup>
  );
}

export default ChatList;
