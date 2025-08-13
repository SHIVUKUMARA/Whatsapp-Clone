import React, { useState, useEffect } from "react";
import { Row, Col, Button, Modal, Form } from "react-bootstrap";
import ChatList from "../Components/Chat/ChatList";
import ChatWindow from "../Components/Chat/ChatWindow";
import { getConversations, createConversation } from "../Services/api";
import AddIcon from "@mui/icons-material/Add";
import socket from "../Services/Socket";

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newWaId, setNewWaId] = useState("");
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  useEffect(() => {
    loadConversations();

    socket.on("new_message", (message) => {
      setConversations((prev) => {
        let updated = [...prev];
        const idx = updated.findIndex((c) => c._id === message.wa_id);

        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            messages: [...updated[idx].messages, message],
          };
        } else {
          updated.unshift({
            _id: message.wa_id,
            messages: [message],
          });
        }
        return [...updated];
      });
    });

    return () => {
      socket.off("new_message");
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadConversations = async () => {
    const data = await getConversations();
    setConversations(data);
  };

  const handleNewChat = async () => {
    if (!newName || !newWaId) return;
    await createConversation({ name: newName, wa_id: newWaId });
    setShowModal(false);
    setNewName("");
    setNewWaId("");
    loadConversations();
  };

  const currentChat = conversations.find((c) => c._id === activeChatId);

  const handleBack = () => {
    setActiveChatId(null);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <Row className="g-0" style={{ height: "100%", margin: 0 }}>
        {/* Chat List */}
        {(!isMobileView || !currentChat) && (
          <Col
            md={4}
            style={{
              minWidth: isMobileView ? "100%" : "250px",
              flex: "0 0 auto",
              backgroundColor: "#f8f9fa",
              borderRight: "1px solid #dee2e6",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-success text-white">
              <h5 className="mb-0">WhatsApp Clone</h5>
              <Button variant="light" size="sm" onClick={() => setShowModal(true)}>
                <AddIcon />
              </Button>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              <ChatList conversations={conversations} setActiveChat={setActiveChatId} />
            </div>
          </Col>
        )}

        {/* Chat Window */}
        {(!isMobileView || currentChat) && (
          <Col style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {currentChat ? (
              <ChatWindow chat={currentChat} onBack={isMobileView ? handleBack : null} />
            ) : (
              !isMobileView && (
                <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                  Select a chat to start messaging
                </div>
              )
            )}
          </Col>
        )}
      </Row>

      {/* New Chat Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Start New Chat</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Contact Name</Form.Label>
              <Form.Control
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mt-2">
              <Form.Label>WhatsApp ID</Form.Label>
              <Form.Control
                value={newWaId}
                onChange={(e) => setNewWaId(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleNewChat}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
