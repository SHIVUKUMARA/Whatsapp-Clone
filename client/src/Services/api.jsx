import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Get all conversations
export const getConversations = async () => {
  const res = await axios.get(`${API_BASE}/conversations`);
  return res.data;
};

// Send a new message
export const sendMessage = async (message) => {
  const res = await axios.post(`${API_BASE}/new`, message);
  return res.data;
};

// Update status of a message
export const updateStatus = async (meta_msg_id, status) => {
  const res = await axios.put(`${API_BASE}/status`, { meta_msg_id, status });
  return res.data;
};

// Create a new conversation (placeholder message)
export const createConversation = async (conversation) => {
  const res = await axios.post(`${API_BASE}/conversation`, conversation);
  return res.data;
};
