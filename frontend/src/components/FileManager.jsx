import { useState, useEffect, useRef } from "react";
import { Upload, File, FileImage, FileText, Trash2, Download, Eye, X, AlertCircle } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const FILE_ICONS = {
  "application/pdf": { icon: FileText, color: "text-red-400", bg: "bg-red-400/10" },
  "image/jpeg":      { icon: FileImage, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  "image/png":       { icon: FileImage, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  "image/gif":       { icon: FileImage, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  "image/webp":      { icon: FileImage, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  default:           { icon: File,      color: "text-indigo-400", bg: "bg-indigo-400/10" },
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function FileManager({ workspaceId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    fetchFiles();
  }, [workspaceId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/files/${workspaceId}`);
      setFiles(res.data);
    } catch {
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file) => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) { toast.error("File too large (max 10MB)"); return; }
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploading(true);
      const res = await api.post(`/api/files/${workspaceId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFiles((prev) => [res.data, ...prev]);
      toast.success(`"${file.name}" uploaded!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const deleteFile = async (fileId, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/api/files/${workspaceId}/${fileId}`);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("File deleted");
    } catch {
      toast.error("Failed to delete file");
    }
  };

  const isImage = (type) => type?.startsWith("image/");
  const isPDF = (type) => type === "application/pdf";

  return (
    <div className="p-5 space-y-5">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragOver ? "border-indigo-500 bg-indigo-500/10" : "border-slate-700 hover:border-slate-600 hover:bg-slate-900"
        }`}
      >
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInput} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
              <Upload size={24} className="text-slate-500" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Drop a file or click to upload</p>
              <p className="text-slate-500 text-xs mt-1">PDF, Images, DOCX, PPTX, XLSX, ZIP, TXT (max 10MB)</p>
            </div>
          </div>
        )}
      </div>

      {/* Files Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <File size={32} className="text-slate-700" />
          <p className="text-slate-500 text-sm">No files uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((f) => {
            const meta = FILE_ICONS[f.file_type] || FILE_ICONS.default;
            const Icon = meta.icon;
            const canDelete = f.uploader_id === currentUser.id;
            return (
              <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                  <Icon size={18} className={meta.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{f.original_name}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{formatSize(f.file_size)}</span>
                    <span>•</span>
                    <span>by {f.uploader?.username}</span>
                    <span>•</span>
                    <span>{new Date(f.created_at).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {(isImage(f.file_type) || isPDF(f.file_type)) && (
                    <button
                      onClick={() => setPreviewFile(f)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-slate-800 transition"
                      title="Preview"
                    >
                      <Eye size={15} />
                    </button>
                  )}
                  <a
                    href={`${API_URL}${f.file_path}`}
                    download={f.original_name}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition"
                    title="Download"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download size={15} />
                  </a>
                  {canDelete && (
                    <button
                      onClick={() => deleteFile(f.id, f.original_name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-white font-semibold text-sm truncate">{previewFile.original_name}</h3>
              <button onClick={() => setPreviewFile(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              {isImage(previewFile.file_type) ? (
                <img
                  src={`${API_URL}${previewFile.file_path}`}
                  alt={previewFile.original_name}
                  className="max-w-full max-h-full rounded-xl object-contain"
                />
              ) : isPDF(previewFile.file_type) ? (
                <iframe
                  src={`${API_URL}${previewFile.file_path}`}
                  className="w-full h-96 rounded-xl border border-slate-800"
                  title={previewFile.original_name}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileManager;
