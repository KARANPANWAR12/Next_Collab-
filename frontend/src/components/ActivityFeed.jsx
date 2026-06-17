import { useState, useEffect } from "react";
import { Activity, FileText, MessageSquare, Users, FolderKanban, Upload, Trash2, RefreshCw } from "lucide-react";
import api from "../services/api";

const ACTION_CONFIG = {
  created_workspace: { icon: FolderKanban, color: "text-indigo-400 bg-indigo-400/10", label: "created workspace" },
  joined_workspace:  { icon: Users,        color: "text-emerald-400 bg-emerald-400/10", label: "joined workspace" },
  created_document:  { icon: FileText,     color: "text-blue-400 bg-blue-400/10",    label: "created document" },
  edited_document:   { icon: FileText,     color: "text-amber-400 bg-amber-400/10",  label: "edited document" },
  deleted_document:  { icon: Trash2,       color: "text-red-400 bg-red-400/10",      label: "deleted document" },
  uploaded_file:     { icon: Upload,       color: "text-purple-400 bg-purple-400/10",label: "uploaded file" },
  removed_member:    { icon: Users,        color: "text-rose-400 bg-rose-400/10",    label: "removed member" },
  default:           { icon: Activity,     color: "text-slate-400 bg-slate-400/10",  label: "performed action" },
};

function timeAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return then.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function ActivityFeed({ workspaceId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/workspaces/${workspaceId}/activity?limit=30`);
      setLogs(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="p-5 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-800 rounded w-3/4" />
              <div className="h-2.5 bg-slate-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-slate-400" />
          <h3 className="text-white font-semibold text-sm">Activity Feed</h3>
        </div>
        <button
          onClick={fetchLogs}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <Activity size={32} className="text-slate-700" />
          <p className="text-slate-500 text-sm">No activity yet</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-800" />
          <div className="space-y-4">
            {logs.map((log, idx) => {
              const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.default;
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="flex gap-3 relative">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 ${cfg.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 min-w-0">
                    <div className="flex items-start gap-1.5 flex-wrap">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                        style={{ backgroundColor: log.user?.avatar_color || "#6366f1" }}
                      >
                        {(log.user?.full_name || "U")[0].toUpperCase()}
                      </div>
                      <span className="text-white font-medium text-xs">{log.user?.full_name}</span>
                      <span className="text-slate-400 text-xs">{cfg.label}</span>
                      {log.entity_name && (
                        <span className="text-indigo-300 text-xs font-medium truncate">"{log.entity_name}"</span>
                      )}
                    </div>
                    <p className="text-slate-600 text-xs mt-1">{timeAgo(log.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityFeed;
