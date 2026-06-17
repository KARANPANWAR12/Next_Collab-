import { useState } from "react";
import { X, FolderKanban } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

function CreateWorkspaceModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Workspace name is required"); return; }
    try {
      setLoading(true);
      const res = await api.post("/api/workspaces/", {
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic,
      });
      onCreated?.(res.data);
      setName(""); setDescription(""); setIsPublic(false);
      onClose();
      toast.success(`Workspace "${res.data.name}" created!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/20">
              <FolderKanban size={18} className="text-indigo-400" />
            </div>
            <h2 className="text-white font-bold text-lg">New Workspace</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-medium">Workspace Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Team, Project Alpha"
              maxLength={50}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this workspace for?"
              rows={3}
              maxLength={200}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition resize-none placeholder:text-slate-600"
            />
          </div>
          <label className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
            <div className={`w-10 h-5 rounded-full transition-colors relative ${isPublic ? "bg-indigo-600" : "bg-slate-700"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <input type="checkbox" hidden checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            <div>
              <p className="text-white text-sm font-medium">Public Workspace</p>
              <p className="text-slate-500 text-xs">Discoverable by all users</p>
            </div>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating…" : "Create Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateWorkspaceModal;
