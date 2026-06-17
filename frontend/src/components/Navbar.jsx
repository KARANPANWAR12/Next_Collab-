import { useEffect, useRef, useState } from "react";
import { Bell, Search, LogOut, User, Settings, X, Check, CheckCheck } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

function Navbar({ searchTerm = "", setSearchTerm = () => {}, onSearchSubmit }) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user")) || {};

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/api/notifications/unread-count");
      setUnreadCount(res.data.count);
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/notifications/");
      setNotifications(res.data);
    } catch {}
  };

  const toggleNotifications = () => {
    if (!showNotifications) fetchNotifications();
    setShowNotifications(!showNotifications);
    setShowProfile(false);
  };

  const markAllRead = async () => {
    try {
      await api.patch("/api/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const typeIcons = {
    message: "💬",
    document: "📄",
    invitation: "✉️",
    member_joined: "👋",
    default: "🔔"
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            NexCollab
          </h1>
        </Link>
      </div>

      {/* Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="w-full bg-slate-900 border border-slate-800 rounded-xl flex items-center px-4 py-2 gap-2">
          <Search size={16} className="text-slate-500 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit?.()}
            placeholder="Search workspaces, docs, messages..."
            className="bg-transparent outline-none text-white text-sm w-full placeholder:text-slate-500"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")}><X size={14} className="text-slate-500" /></button>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
        <button
  aria-label="notifications"
  onClick={toggleNotifications}
            className="relative w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 transition"
          >
            <Bell size={18} className="text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-indigo-400 text-xs hover:text-indigo-300 flex items-center gap-1">
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-6 text-slate-500 text-sm text-center">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`p-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition ${!n.is_read ? "bg-indigo-500/5 border-l-2 border-l-indigo-500" : ""}`}
                    >
                      <div className="flex gap-2">
                        <span className="text-base">{typeIcons[n.type] || typeIcons.default}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium">{n.title}</p>
                          <p className="text-slate-400 text-xs truncate">{n.body}</p>
                          <p className="text-slate-600 text-xs mt-1">
                            {new Date(n.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {!n.is_read && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 hover:bg-slate-800 transition"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: user.avatar_color || "#6366f1" }}
            >
              {user.full_name?.[0]?.toUpperCase() || "U"}
            </div>
            <span className="text-white text-sm font-medium hidden sm:block">{user.full_name || "User"}</span>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <Link to="/profile" onClick={() => setShowProfile(false)}>
                <div className="p-3 hover:bg-slate-800 transition flex items-center gap-2 text-slate-300 text-sm">
                  <User size={16} /> Profile Settings
                </div>
              </Link>
              <button onClick={logout} className="w-full p-3 hover:bg-red-500/10 transition flex items-center gap-2 text-red-400 text-sm">
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
