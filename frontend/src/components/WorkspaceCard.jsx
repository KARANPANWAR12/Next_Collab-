import { FolderKanban, Users, Crown, CalendarDays, ArrowRight, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";

function WorkspaceCard({ workspace }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const openWorkspace = () => navigate(`/workspace/${workspace.id}`);

  const copyInviteCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(workspace.invite_code).then(() => {
      setCopied(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const createdDate = workspace.created_at
    ? new Date(workspace.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "Today";

  const gradients = [
    "from-indigo-600 to-purple-600",
    "from-emerald-600 to-teal-600",
    "from-rose-600 to-pink-600",
    "from-amber-600 to-orange-600",
    "from-sky-600 to-blue-600",
  ];
  const gradient = gradients[workspace.id % gradients.length];

  return (
    <div
      onClick={openWorkspace}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && openWorkspace()}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-indigo-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center shadow-lg`}>
          <FolderKanban size={24} className="text-white" />
        </div>
        <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium">
          {workspace.is_public ? "Public" : "Private"}
        </span>
      </div>

      {/* Title */}
      <h2 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-indigo-300 transition">
        {workspace.name}
      </h2>
      <p className="text-slate-500 text-sm mb-4 line-clamp-2 min-h-[40px]">
        {workspace.description || "Collaborative workspace for your team."}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-slate-500 text-xs mb-4">
        <span className="flex items-center gap-1">
          <Users size={13} />
          {workspace.member_count || 1} members
        </span>
        <span className="flex items-center gap-1">
          <CalendarDays size={13} />
          {createdDate}
        </span>
      </div>

      {/* Invite Code */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 mb-4"
      >
        <div>
          <p className="text-slate-600 text-xs">Invite Code</p>
          <p className="text-indigo-400 font-mono font-bold text-sm">{workspace.invite_code}</p>
        </div>
        <button
          onClick={copyInviteCode}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-500 transition text-slate-400 hover:text-white"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>

      {/* Footer */}
      <button
        onClick={(e) => { e.stopPropagation(); openWorkspace(); }}
        className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${gradient} text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition`}
      >
        Open Workspace <ArrowRight size={16} />
      </button>
    </div>
  );
}

export default WorkspaceCard;
