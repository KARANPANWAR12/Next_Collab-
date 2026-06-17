import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  Hash,
  X,
  Loader2,
  MessageSquare,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import WorkspaceCard from "../components/WorkspaceCard";
import CreateWorkspaceModal from "../components/CreateWorkspaceModal";
import JoinWorkspaceModal from "../components/JoinWorkspaceModal";
import api from "../services/api";
import toast from "react-hot-toast";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 ${
        onClick
          ? "cursor-pointer hover:border-indigo-500 hover:bg-slate-800 hover:-translate-y-1"
          : ""
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
      >
        <Icon size={22} className="text-white" />
      </div>

      <div>
        <p className="text-slate-400 text-xs font-medium">{label}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function Dashboard() {
  const [workspaces, setWorkspaces] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);

      const [wsRes, analyticsRes, unreadRes] =
        await Promise.all([
          api.get("/api/workspaces/"),
          api.get("/api/search/analytics").catch(() => ({
            data: null,
          })),
          api
            .get("/api/notifications/unread-count")
            .catch(() => ({
              data: { count: 0 },
            })),
        ]);

      setWorkspaces(wsRes.data);
      setAnalytics(analyticsRes.data);
      setUnreadCount(unreadRes.data.count);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const handleFocus = () => {
      fetchAll();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchAll]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setSearching(true);

      const res = await api.get(
        `/api/search/?q=${encodeURIComponent(searchTerm)}`
      );

      setSearchResults(res.data);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults(null);
  };

  const handleWorkspaceCreated = (ws) => {
    setWorkspaces((prev) => [ws, ...prev]);
    navigate(`/workspace/${ws.id}`);
  };

  const handleWorkspaceJoined = (ws) => {
    setWorkspaces((prev) => {
      if (prev.find((w) => w.id === ws.id)) return prev;
      return [ws, ...prev];
    });

    fetchAll();
  };

  const getResultIcon = (type) =>
    ({
      workspace: "🏢",
      document: "📄",
      message: "💬",
    }[type] || "🔍");

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearchSubmit={handleSearch}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back,{" "}
              {user.full_name?.split(" ")[0] || "there"} 👋
            </h1>

            <p className="text-slate-400 mt-1 text-sm">
              Manage your collaborative workspaces
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowJoin(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-medium hover:bg-slate-700 transition"
            >
              <Hash size={16} />
              Join
            </button>

            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-indigo-500/20"
            >
              <Plus size={16} />
              New Workspace
            </button>
          </div>
        </div>

        {/* Analytics */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={FolderKanban}
              label="Workspaces"
              value={analytics.totals.workspaces}
              color="bg-indigo-600"
              onClick={() =>
                document
                  .getElementById("workspace-section")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            />

            <StatCard
              icon={FileText}
              label="Documents"
              value={analytics.totals.documents}
              color="bg-emerald-600"
              onClick={() =>
                workspaces.length > 0 &&
                navigate(`/workspace/${workspaces[0].id}?tab=documents`)
              }
            />

            <StatCard
              icon={MessageSquare}
              label="Unread Messages"
              value={unreadCount}
              color="bg-amber-600"
              onClick={() =>
                workspaces.length > 0 &&
                navigate(`/workspace/${workspaces[0].id}?tab=chat`)
              }
            />

            <StatCard
              icon={Users}
              label="Members"
              value={analytics.totals.members}
              color="bg-rose-600"
              onClick={() =>
                workspaces.length > 0 &&
                navigate(`/workspace/${workspaces[0].id}?tab=members`)
              }
            />
          </div>
        )}

        {/* Search Results */}
        {searchResults && (
          <div className="mb-8 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
              <h2 className="text-white font-semibold text-sm">
                Search Results for "
                {searchResults.query}" (
                {searchResults.total})
              </h2>

              <button
                onClick={clearSearch}
                className="text-slate-500 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {searching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  size={24}
                  className="animate-spin text-indigo-400"
                />
              </div>
            ) : searchResults.results.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">
                No results found
              </p>
            ) : (
              <div className="divide-y divide-slate-800">
                {searchResults.results.map((r, i) => (
                  <div
                    key={i}
                    onClick={() =>
                      r.workspace_id &&
                      navigate(
                        `/workspace/${r.workspace_id}`
                      )
                    }
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-800 cursor-pointer transition"
                  >
                    <span className="text-xl">
                      {getResultIcon(r.type)}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {r.title}
                      </p>

                      {r.description && (
                        <p className="text-slate-500 text-xs truncate">
                          {r.description}
                        </p>
                      )}
                    </div>

                    <span className="text-xs text-slate-600 capitalize bg-slate-800 px-2 py-0.5 rounded-full">
                      {r.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Workspaces */}
        <div
          id="workspace-section"
          className="flex items-center justify-between mb-5"
        >
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard
              size={20}
              className="text-indigo-400"
            />
            Your Workspaces

            <span className="text-slate-600 text-base font-normal">
              ({workspaces.length})
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-56 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <FolderKanban
                size={36}
                className="text-slate-600"
              />
            </div>

            <p className="text-slate-300 font-semibold text-lg">
              No workspaces yet
            </p>

            <p className="text-slate-600 text-sm mt-1 mb-6">
              Create one or join with an invite code
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowJoin(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition"
              >
                Join with Code
              </button>

              <button
                onClick={() => setShowCreate(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition"
              >
                Create Workspace
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((ws) => (
              <WorkspaceCard
                key={ws.id}
                workspace={ws}
              />
            ))}
          </div>
        )}
      </div>

      <CreateWorkspaceModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleWorkspaceCreated}
      />

      <JoinWorkspaceModal
        isOpen={showJoin}
        onClose={() => setShowJoin(false)}
        onJoined={handleWorkspaceJoined}
      />
    </div>
  );
}

export default Dashboard;