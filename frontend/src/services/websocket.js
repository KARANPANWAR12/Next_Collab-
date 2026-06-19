let socket = null;
let listeners = [];
let reconnectTimer = null;
let currentWorkspaceId = null;
let currentUserId = null;

export const connectWebSocket = (workspaceId, userId) => {
  // Only reuse if same workspace AND user
  if (
    socket &&
    socket.readyState === WebSocket.OPEN &&
    currentWorkspaceId === workspaceId &&
    currentUserId === userId
  ) {
    return;
  }

  // Close any existing connection cleanly – prevent auto-reconnect from old socket
  if (socket) {
    const oldSocket = socket;
    socket = null;                // clear global reference
    oldSocket.onclose = null;     // prevent reconnect timer from firing
    oldSocket.close();
  }

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
    // Auto-reconnect only if we still have a valid workspace/user
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