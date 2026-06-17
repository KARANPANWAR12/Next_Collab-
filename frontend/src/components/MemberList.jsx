import { useState, useEffect } from "react";
import { Users, Crown, Shield, Pencil, Eye, User, Trash2, Copy, RefreshCw, Check } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const ROLES = ["owner", "admin", "editor", "viewer", "member"];
const ROLE_META = {
  owner:  { label: "Owner",  color: "text-amber-400  bg-amber-400/10",  icon: Crown },
  admin:  { label: "Admin",  color: "text-purple-400 bg-purple-400/10", icon: Shield },
  editor: { label: "Editor", color: "text-indigo-400 bg-indigo-400/10", icon: Pencil },
  viewer: { label: "Viewer", color: "text-slate-400  bg-slate-400/10",  icon: Eye },
  member: { label: "Member", color: "text-emerald-400 bg-emerald-400/10",icon: User },
};

function MemberList({ workspace, onlineUsers = [] }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState(workspace?.invite_code || "");
  const [regenLoading, setRegenLoading] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  const myRole = members.find((m) => m.user_id === currentUser.id)?.role;
  const canManage = ["owner", "admin"].includes(myRole);

  useEffect(() => {
    if (!workspace?.id) return;
    fetchMembers();
  }, [workspace?.id]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/workspaces/${workspace.id}/members`);
      setMembers(res.data);
    } catch {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId, newRole) => {
    try {
      await api.patch(`/api/workspaces/${workspace.id}/members/${userId}/role`, { role: newRole });
      setMembers((prev) => prev.map((m) => m.user_id === userId ? { ...m, role: newRole } : m));
      toast.success("Role updated");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update role");
    }
  };

  const removeMember = async (userId, name) => {
    if (!confirm(`Remove ${name} from workspace?`)) return;
    try {
      await api.delete(`/api/workspaces/${workspace.id}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      toast.success(`${name} removed`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to remove member");
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setInviteCopied(true);
    toast.success("Invite code copied!");
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const regenerateCode = async () => {
    if (!confirm("Regenerate invite code? Old code will stop working.")) return;
    try {
      setRegenLoading(true);
      const res = await api.post(`/api/workspaces/${workspace.id}/regenerate-invite`);
      setInviteCode(res.data.invite_code);
      toast.success("New invite code generated");
    } catch {
      toast.error("Failed to regenerate code");
    } finally {
      setRegenLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5">
      {/* Invite Code Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold text-sm mb-3">Invite to Workspace</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5">
            <p className="text-slate-500 text-xs mb-0.5">Invite Code</p>
            <p className="text-indigo-400 font-mono font-bold text-lg tracking-widest">{inviteCode}</p>
          </div>
          <button
            onClick={copyInviteCode}
            className="p-3 rounded-xl bg-slate-800 hover:bg-indigo-500 transition text-slate-400 hover:text-white"
          >
            {inviteCopied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
          </button>
          {canManage && (
            <button
              onClick={regenerateCode}
              disabled={regenLoading}
              className="p-3 rounded-xl bg-slate-800 hover:bg-amber-500 transition text-slate-400 hover:text-white disabled:opacity-50"
              title="Regenerate code"
            >
              <RefreshCw size={18} className={regenLoading ? "animate-spin" : ""} />
            </button>
          )}
        </div>
        <p className="text-slate-600 text-xs mt-2">Share this code so others can join this workspace.</p>
      </div>

      {/* Members List */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-slate-400" />
          <h3 className="text-white font-semibold text-sm">Members ({members.length})</h3>
        </div>

        <div className="space-y-2">
          {members.map((m) => {
            const meta = ROLE_META[m.role] || ROLE_META.member;
            const Icon = meta.icon;
            const isOnline = onlineUsers.includes(m.user_id);
            const isMe = m.user_id === currentUser.id;

            return (
              <div
                key={m.user_id}
                className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition"
              >
                {/* Avatar with online indicator */}
                <div className="relative shrink-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: m.avatar_color || "#6366f1" }}
                  >
                    {m.full_name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                    isOnline ? "bg-emerald-500" : "bg-slate-600"
                  }`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white text-sm font-medium truncate">{m.full_name}</p>
                    {isMe && <span className="text-slate-600 text-xs">(you)</span>}
                  </div>
                  <p className="text-slate-500 text-xs truncate">@{m.username}</p>
                </div>

                {/* Role */}
                {canManage && m.role !== "owner" && !isMe ? (
                  <select
                    value={m.role}
                    onChange={(e) => updateRole(m.user_id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-lg border-0 outline-none font-medium cursor-pointer ${meta.color} bg-opacity-20`}
                    style={{ backgroundColor: "transparent" }}
                  >
                    {ROLES.filter((r) => r !== "owner").map((r) => (
                      <option key={r} value={r} className="bg-slate-800 text-white">
                        {ROLE_META[r].label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium ${meta.color}`}>
                    <Icon size={11} /> {meta.label}
                  </span>
                )}

                {/* Online Status */}
                <span className={`hidden sm:block text-xs ${isOnline ? "text-emerald-400" : "text-slate-600"}`}>
                  {isOnline ? "🟢" : "⚫"}
                </span>

                {/* Remove */}
                {canManage && !isMe && m.role !== "owner" && (
                  <button
                    onClick={() => removeMember(m.user_id, m.full_name)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition"
                    title="Remove member"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MemberList;
