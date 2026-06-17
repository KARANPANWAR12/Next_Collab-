let socket = null;
let listeners = [];
let reconnectTimer = null;
let currentWorkspaceId = null;
let currentUserId = null;

export const connectWebSocket = (workspaceId, userId) => {
  if (socket && socket.readyState === WebSocket.OPEN) return;
  currentWorkspaceId = workspaceId;
  currentUserId = userId;
  const wsUrl = import.meta.env.VITE_WS_URL || "wss://nexcollab-backend.onrender.com";
  socket = new WebSocket(`${wsUrl}/ws/${workspaceId}/${userId}`);

  socket.onopen = () => {
    console.log("✅ WebSocket Connected");
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      listeners.forEach((cb) => cb(data));
    } catch (e) {
      console.error("WS parse error:", e);
    }
  };

  socket.onclose = () => {
    console.log("❌ WebSocket Disconnected");
    socket = null;
    // Auto-reconnect after 3s
    if (currentWorkspaceId && currentUserId) {
      reconnectTimer = setTimeout(() => {
        connectWebSocket(currentWorkspaceId, currentUserId);
      }, 3000);
    }
  };

  socket.onerror = (error) => {
    console.error("❌ WebSocket Error:", error);
  };
};

export const sendWSMessage = (data) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
    return true;
  }
  return false;
};

export const addWSListener = (callback) => {
  if (!listeners.includes(callback)) {
    listeners.push(callback);
  }
};

export const removeWSListener = (callback) => {
  listeners = listeners.filter((cb) => cb !== callback);
};

export const disconnectWebSocket = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  currentWorkspaceId = null;
  currentUserId = null;
  if (socket) {
    socket.close();
    socket = null;
  }
  listeners = [];
};

export const getWSStatus = () => {
  if (!socket) return "disconnected";
  switch (socket.readyState) {
    case WebSocket.CONNECTING: return "connecting";
    case WebSocket.OPEN: return "connected";
    case WebSocket.CLOSING: return "closing";
    case WebSocket.CLOSED: return "disconnected";
    default: return "unknown";
  }
};
