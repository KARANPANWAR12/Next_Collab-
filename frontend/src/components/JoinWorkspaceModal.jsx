import { useState } from "react";
import { X, Hash, ArrowRight } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

function JoinWorkspaceModal({ isOpen, onClose, onJoined }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    try {
      setLoading(true);
      const res = await api.post("/api/workspaces/join", { invite_code: code.trim().toUpperCase() });
      toast.success(`Joined "${res.data.name}" successfully!`);
      onJoined?.(res.data);
      setCode("");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid invite code");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Hash size={18} className="text-emerald-400" />
            </div>
            <h2 className="text-white font-bold text-lg">Join Workspace</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <p className="text-slate-400 text-sm mb-5">Enter the invite code shared by a workspace member.</p>

        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. ABC12345"
            maxLength={8}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-lg tracking-widest text-center outline-none focus:border-emerald-500 transition placeholder:text-slate-600 placeholder:font-sans placeholder:tracking-normal"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Joining..." : (<><ArrowRight size={16} /> Join Workspace</>)}
          </button>
        </form>
      </div>
    </div>
  );
}

export default JoinWorkspaceModal;
