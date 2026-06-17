import { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import {
  MessageSquare, FileText, Users, Upload, Sparkles,
  Activity, ArrowLeft, Settings, Wifi, WifiOff, ChevronDown
} from "lucide-react";
import api from "../services/api";
import { connectWebSocket, disconnectWebSocket, addWSListener, removeWSListener, getWSStatus } from "../services/websocket";
import ChatPanel from "../components/ChatPanel";
import DocumentEditor from "../components/DocumentEditor";
import MemberList from "../components/MemberList";
import ActivityFeed from "../components/ActivityFeed";
import FileManager from "../components/FileManager";
import AIPanel from "../components/AIPanel";
import toast from "react-hot-toast";

const TABS = [
  { id: "chat",     label: "Chat",     icon: MessageSquare },
  { id: "docs",     label: "Docs",     icon: FileText },
  { id: "members",  label: "Members",  icon: Users },
  { id: "files",    label: "Files",    icon: Upload },
  { id: "ai",       label: "AI",       icon: Sparkles },
  { id: "activity", label: "Activity", icon: Activity },
];

function Workspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read initial tab from URL
  const initialTab =
    searchParams.get("tab") === "documents"
      ? "docs"
      : searchParams.get("tab") || "chat";

  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [wsConnected, setWsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [unreadChat, setUnreadChat] = useState(0);
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  // Keep activeTab in sync with URL changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (!tab) return;
    if (tab === "documents") {
      setActiveTab("docs");
    } else if (["chat", "docs", "members", "files", "ai", "activity"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchWorkspace();
    return () => disconnectWebSocket();
  }, [id]);

  useEffect(() => {
    if (!workspace) return;
    connectWebSocket(Number(id), currentUser.id);

    const handler = (data) => {
      if (data.type === "connection_established") {
        setWsConnected(true);
        setOnlineUsers(data.online_users || []);
      } else if (data.type === "user_left") {
        setOnlineUsers((prev) => prev.filter((uid) => uid !== data.user_id));
      } else if (data.type === "presence") {
        setOnlineUsers((prev) =>
          data.status === "online"
            ? prev.includes(data.user_id) ? prev : [...prev, data.user_id]
            : prev.filter((uid) => uid !== data.user_id)
        );
      } else if (data.type === "chat_message" && activeTab !== "chat") {
        setUnreadChat((n) => n + 1);
      }
    };

    addWSListener(handler);
    return () => removeWSListener(handler);
  }, [workspace, id, activeTab]);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/workspaces/${id}`);
      setWorkspace(res.data);
    } catch {
      toast.error("Workspace not found or access denied");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "chat") setUnreadChat(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl px-4 flex items-center gap-4 sticky top-0 z-40">
        <Link to="/dashboard" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-base truncate">{workspace?.name}</h1>
          {workspace?.description && (
            <p className="text-slate-500 text-xs truncate">{workspace.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Online Users */}
          {onlineUsers.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-400 text-xs">{onlineUsers.length} online</span>
            </div>
          )}
          {/* WS Status */}
          <div className="flex items-center gap-1.5">
            {wsConnected
              ? <Wifi size={14} className="text-emerald-400" />
              : <WifiOff size={14} className="text-slate-500" />
            }
          </div>
          {/* Invite code quick copy */}
          {workspace?.invite_code && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(workspace.invite_code);
                toast.success("Invite code copied!");
              }}
              className="hidden sm:block px-3 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-mono transition"
              title="Copy invite code"
            >
              {workspace.invite_code}
            </button>
          )}
        </div>
      </header>

      {/* Tab bar */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-4 flex items-center gap-1 overflow-x-auto shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition whitespace-nowrap border-b-2 relative ${
                isActive
                  ? "text-indigo-400 border-indigo-500"
                  : "text-slate-500 border-transparent hover:text-slate-300"
              }`}
            >
              <Icon size={15} />
              {tab.label}
              {tab.id === "chat" && unreadChat > 0 && (
                <span className="absolute -top-0 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                  {unreadChat > 9 ? "9+" : unreadChat}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className={`h-full ${activeTab !== "chat" ? "hidden" : ""}`}>
          <div style={{ height: "calc(100vh - 112px)" }}>
            <ChatPanel workspaceId={Number(id)} />
          </div>
        </div>

        <div className={`h-full overflow-hidden ${activeTab !== "docs" ? "hidden" : ""}`}>
          <div style={{ height: "calc(100vh - 112px)" }}>
            <DocumentEditor
              workspaceId={Number(id)}
              onDocumentChange={(doc) => setCurrentDoc(doc)}
            />
          </div>
        </div>

        <div className={`overflow-y-auto ${activeTab !== "members" ? "hidden" : ""}`} style={{ height: "calc(100vh - 112px)" }}>
          <MemberList workspace={workspace} onlineUsers={onlineUsers} />
        </div>

        <div className={`overflow-y-auto ${activeTab !== "files" ? "hidden" : ""}`} style={{ height: "calc(100vh - 112px)" }}>
          <FileManager workspaceId={Number(id)} />
        </div>

        <div className={`h-full overflow-hidden ${activeTab !== "ai" ? "hidden" : ""}`}>
          <div style={{ height: "calc(100vh - 112px)" }}>
            <AIPanel workspaceId={Number(id)} currentDocument={currentDoc} />
          </div>
        </div>

        <div className={`overflow-y-auto ${activeTab !== "activity" ? "hidden" : ""}`} style={{ height: "calc(100vh - 112px)" }}>
          <ActivityFeed workspaceId={Number(id)} />
        </div>
      </div>
    </div>
  );
}

export default Workspace;