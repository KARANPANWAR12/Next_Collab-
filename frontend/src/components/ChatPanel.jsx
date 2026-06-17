import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Smile, Hash, Wifi, WifiOff } from "lucide-react";
import api from "../services/api";
import { connectWebSocket, sendWSMessage, addWSListener, removeWSListener, getWSStatus } from "../services/websocket";
import toast from "react-hot-toast";

function ChatPanel({ workspaceId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [wsStatus, setWsStatus] = useState("connecting");
  const bottomRef = useRef(null);
  const typingTimeouts = useRef({});
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  // Fetch history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/api/messages/${workspaceId}?limit=50`);
        setMessages(res.data);
      } catch {
        toast.error("Failed to load messages");
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [workspaceId]);

  // WebSocket listener
  const handleWSMessage = useCallback((data) => {
    if (data.type === "chat_message") {
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.id)) return prev;
        return [...prev, {
          id: data.id,
          content: data.content,
          workspace_id: workspaceId,
          sender_id: data.user_id,
          is_ai: false,
          created_at: data.timestamp,
          sender: {
            id: data.user_id,
            username: data.username,
            full_name: data.full_name,
            avatar_color: data.avatar_color
          }
        }];
      });
    } else if (data.type === "typing") {
      const { user_id, username, is_typing } = data;
      if (user_id === currentUser.id) return;
      setTypingUsers((prev) => {
        if (is_typing) {
          if (prev.find((u) => u.user_id === user_id)) return prev;
          return [...prev, { user_id, username }];
        }
        return prev.filter((u) => u.user_id !== user_id);
      });
    } else if (data.type === "connection_established") {
      setOnlineUsers(data.online_users || []);
      setWsStatus("connected");
    } else if (data.type === "user_left") {
      setOnlineUsers((prev) => prev.filter((id) => id !== data.user_id));
      setTypingUsers((prev) => prev.filter((u) => u.user_id !== data.user_id));
    } else if (data.type === "presence") {
      setOnlineUsers((prev) =>
        data.status === "online"
          ? prev.includes(data.user_id) ? prev : [...prev, data.user_id]
          : prev.filter((id) => id !== data.user_id)
      );
    }
  }, [workspaceId, currentUser.id]);

  useEffect(() => {
    addWSListener(handleWSMessage);
    const checkStatus = setInterval(() => {
      setWsStatus(getWSStatus());
    }, 2000);
    return () => {
      removeWSListener(handleWSMessage);
      clearInterval(checkStatus);
    };
  }, [handleWSMessage]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    // Stop typing indicator
    sendWSMessage({ type: "typing", username: currentUser.username, is_typing: false });

    const sent = sendWSMessage({
      type: "chat_message",
      content,
      workspace_id: workspaceId,
    });

    if (!sent) {
      // Fallback to REST
      try {
        const res = await api.post(`/api/messages/${workspaceId}`, { content });
        setMessages((prev) => [...prev, res.data]);
      } catch {
        toast.error("Failed to send message");
        setInput(content);
      }
    }
    setSending(false);
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    sendWSMessage({ type: "typing", username: currentUser.username, is_typing: true });
    if (typingTimeouts.current.self) clearTimeout(typingTimeouts.current.self);
    typingTimeouts.current.self = setTimeout(() => {
      sendWSMessage({ type: "typing", username: currentUser.username, is_typing: false });
    }, 2000);
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  // Group messages by sender + time proximity
  const groupMessages = () => {
    const groups = [];
    let lastDate = null;
    messages.forEach((msg, i) => {
      const msgDate = formatDate(msg.created_at);
      if (msgDate !== lastDate) {
        groups.push({ type: "date", label: msgDate });
        lastDate = msgDate;
      }
      const prev = messages[i - 1];
      const sameAuthor = prev && prev.sender_id === msg.sender_id;
      const close = prev && (new Date(msg.created_at) - new Date(prev.created_at)) < 60000;
      groups.push({ type: "message", data: msg, compact: sameAuthor && close });
    });
    return groups;
  };

  const groups = groupMessages();

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-2">
          <Hash size={18} className="text-indigo-400" />
          <span className="text-white font-semibold">Team Chat</span>
          {onlineUsers.length > 0 && (
            <span className="text-emerald-400 text-xs bg-emerald-400/10 px-2 py-0.5 rounded-full">
              {onlineUsers.length} online
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {wsStatus === "connected"
            ? <><Wifi size={14} className="text-emerald-400" /><span className="text-emerald-400 text-xs">Live</span></>
            : <><WifiOff size={14} className="text-slate-500" /><span className="text-slate-500 text-xs">Reconnecting…</span></>
          }
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Hash size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">No messages yet</p>
            <p className="text-slate-600 text-sm">Start the conversation!</p>
          </div>
        ) : (
          groups.map((item, idx) => {
            if (item.type === "date") {
              return (
                <div key={`date-${idx}`} className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-slate-600 text-xs">{item.label}</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>
              );
            }
            const msg = item.data;
            const isMine = msg.sender_id === currentUser.id;
            return (
              <div key={msg.id} className={`flex gap-3 ${item.compact ? "mt-0.5" : "mt-3"} ${isMine ? "flex-row-reverse" : ""}`}>
                {!item.compact ? (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5"
                    style={{ backgroundColor: msg.sender?.avatar_color || "#6366f1" }}
                  >
                    {(msg.sender?.full_name || msg.sender?.username || "U")[0].toUpperCase()}
                  </div>
                ) : (
                  <div className="w-8 shrink-0" />
                )}
                <div className={`max-w-[72%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                  {!item.compact && (
                    <div className={`flex items-baseline gap-2 mb-1 ${isMine ? "flex-row-reverse" : ""}`}>
                      <span className="text-white text-xs font-semibold">
                        {isMine ? "You" : (msg.sender?.full_name || msg.sender?.username)}
                      </span>
                      <span className="text-slate-600 text-xs">{formatTime(msg.created_at)}</span>
                    </div>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                    isMine
                      ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-sm"
                      : "bg-slate-800 text-slate-200 rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                  {item.compact && (
                    <span className="text-slate-700 text-xs mt-0.5 px-1">{formatTime(msg.created_at)}</span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-3 mt-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
              <span className="text-slate-400 text-xs">...</span>
            </div>
            <div className="bg-slate-800 px-4 py-2 rounded-2xl rounded-tl-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-xs">
                  {typingUsers.map((u) => u.username).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing
                </span>
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/50 shrink-0">
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{ backgroundColor: currentUser.avatar_color || "#6366f1" }}
          >
            {(currentUser.full_name || "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 flex items-center bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 gap-3 focus-within:border-indigo-500 transition">
            <input
              type="text"
              value={input}
              onChange={handleTyping}
              placeholder="Type a message…"
              className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-slate-500"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={16} className="text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatPanel;
