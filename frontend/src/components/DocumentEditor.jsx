import { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText, Plus, Save, Trash2, Bold, Italic, Underline,
  List, AlignLeft, Heading, Code, Link2, History, X, RotateCcw,
  ChevronDown, ChevronRight, Clock
} from "lucide-react";
import api from "../services/api";
import { sendWSMessage, addWSListener, removeWSListener } from "../services/websocket";
import toast from "react-hot-toast";

const TAG_COLORS = ["bg-indigo-500/20 text-indigo-300", "bg-emerald-500/20 text-emerald-300", "bg-amber-500/20 text-amber-300", "bg-rose-500/20 text-rose-300"];

function DocumentEditor({ workspaceId, onDocumentChange }) {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);
  const [creating, setCreating] = useState(false);
  const editorRef = useRef(null);
  const autoSaveTimer = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  useEffect(() => { fetchDocs(); }, [workspaceId]);

  const handleWSMessage = useCallback((data) => {
    if (data.type === "document_update" && data.document_id === selectedDoc?.id) {
      if (data.user_id !== currentUser.id) {
        setContent(data.content);
        if (editorRef.current && data.content !== editorRef.current.innerHTML) {
          const sel = window.getSelection();
          const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
          editorRef.current.innerHTML = data.content;
          if (range) try { sel.removeAllRanges(); sel.addRange(range); } catch {}
        }
        if (data.title) setTitle(data.title);
      }
    }
  }, [selectedDoc?.id, currentUser.id]);

  useEffect(() => {
    addWSListener(handleWSMessage);
    return () => removeWSListener(handleWSMessage);
  }, [handleWSMessage]);

  const fetchDocs = async () => {
    try {
      const res = await api.get(`/api/documents/${workspaceId}`);
      setDocs(res.data);
    } catch {}
  };

  const selectDoc = (doc) => {
    setSelectedDoc(doc);
    setTitle(doc.title);
    setContent(doc.content || "");
    setShowVersions(false);
    onDocumentChange?.(doc);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = doc.content || "";
    }, 0);
  };

  const createDoc = async () => {
    try {
      setCreating(true);
      const res = await api.post(`/api/documents/${workspaceId}`, {
        title: "Untitled Document",
        content: "",
        doc_type: "note",
        tags: []
      });
      setDocs((prev) => [res.data, ...prev]);
      selectDoc(res.data);
      toast.success("Document created");
    } catch {
      toast.error("Failed to create document");
    } finally {
      setCreating(false);
    }
  };

  const saveDoc = async (docId, titleVal, contentVal) => {
    if (!docId) return;
    try {
      setSaving(true);
      const res = await api.patch(`/api/documents/doc/${docId}`, {
        title: titleVal,
        content: contentVal,
      });
      setDocs((prev) => prev.map((d) => d.id === docId ? res.data : d));
      setLastSaved(new Date());
      sendWSMessage({
        type: "document_update",
        document_id: docId,
        content: contentVal,
        title: titleVal,
        username: currentUser.username
      });
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Auto-save after 2s of inactivity
  const triggerAutoSave = (t, c) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveDoc(selectedDoc?.id, t, c), 2000);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutoSave(val, content);
  };

  const handleEditorInput = () => {
    const c = editorRef.current?.innerHTML || "";
    setContent(c);

    // --- FIX: broadcast immediately to others ---
    if (selectedDoc?.id) {
      sendWSMessage({
        type: "document_update",
        document_id: selectedDoc.id,
        content: c,
        title,
        username: currentUser.username,
      });
    }

    // Keep auto-save for persistence
    triggerAutoSave(title, c);
  };

  const deleteDoc = async (docId) => {
    if (!confirm("Delete this document?")) return;
    try {
      await api.delete(`/api/documents/doc/${docId}`);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      if (selectedDoc?.id === docId) { setSelectedDoc(null); setTitle(""); setContent(""); }
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const fetchVersions = async () => {
    if (!selectedDoc) return;
    try {
      const res = await api.get(`/api/documents/doc/${selectedDoc.id}/versions`);
      setVersions(res.data);
      setShowVersions(true);
    } catch {
      toast.error("Failed to load versions");
    }
  };

  const restoreVersion = async (versionId) => {
    if (!confirm("Restore this version? Current content will be saved as a new version.")) return;
    try {
      const res = await api.post(`/api/documents/doc/${selectedDoc.id}/restore/${versionId}`);
      selectDoc(res.data);
      setDocs((prev) => prev.map((d) => d.id === res.data.id ? res.data : d));
      setShowVersions(false);
      toast.success("Version restored");
    } catch {
      toast.error("Failed to restore");
    }
  };

  // Rich Text Commands
  const execCmd = (cmd, value = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    handleEditorInput();
  };

  const toolbar = [
    { icon: Bold, cmd: "bold", title: "Bold (Ctrl+B)" },
    { icon: Italic, cmd: "italic", title: "Italic (Ctrl+I)" },
    { icon: Underline, cmd: "underline", title: "Underline (Ctrl+U)" },
    null,
    { icon: Heading, cmd: "formatBlock", value: "<h2>", title: "Heading" },
    { icon: AlignLeft, cmd: "formatBlock", value: "<p>", title: "Paragraph" },
    null,
    { icon: List, cmd: "insertUnorderedList", title: "Bullet List" },
    { icon: Code, cmd: "formatBlock", value: "<pre>", title: "Code Block" },
  ];

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      saveDoc(selectedDoc?.id, title, content);
    }
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertText", false, "    ");
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar - Doc List */}
      <div className="w-56 shrink-0 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="p-3 border-b border-slate-800">
          <button
            onClick={createDoc}
            disabled={creating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            <Plus size={14} /> New Document
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {docs.length === 0 ? (
            <p className="text-slate-600 text-xs text-center py-6">No documents yet</p>
          ) : (
            docs.map((doc) => (
              <div
                key={doc.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition ${
                  selectedDoc?.id === doc.id ? "bg-indigo-500/20 border border-indigo-500/40" : "hover:bg-slate-800"
                }`}
                onClick={() => selectDoc(doc)}
              >
                <FileText size={13} className={selectedDoc?.id === doc.id ? "text-indigo-400" : "text-slate-500"} />
                <span className={`flex-1 text-xs truncate ${selectedDoc?.id === doc.id ? "text-indigo-300 font-medium" : "text-slate-400"}`}>
                  {doc.title}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-600 hover:text-red-400 transition"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedDoc ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <FileText size={28} className="text-slate-600" />
            </div>
            <div>
              <p className="text-slate-300 font-medium">No document selected</p>
              <p className="text-slate-600 text-sm mt-1">Select a document or create a new one</p>
            </div>
            <button onClick={createDoc} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold">
              <Plus size={16} /> New Document
            </button>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800 bg-slate-900/50 flex-wrap shrink-0">
              {toolbar.map((item, i) => {
                if (item === null) return <div key={`sep-${i}`} className="w-px h-5 bg-slate-700 mx-1" />;
                const Icon = item.icon;
                return (
                  <button
                    key={item.cmd + (item.value || "")}
                    onClick={() => execCmd(item.cmd, item.value)}
                    title={item.title}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <Icon size={15} />
                  </button>
                );
              })}
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                {lastSaved && (
                  <span className="text-slate-600 text-xs flex items-center gap-1">
                    <Clock size={11} /> Saved {lastSaved.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                {saving && <span className="text-indigo-400 text-xs">Saving…</span>}
                <button
                  onClick={fetchVersions}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition"
                >
                  <History size={13} /> v{selectedDoc.version}
                </button>
                <button
                  onClick={() => saveDoc(selectedDoc.id, title, content)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition"
                >
                  <Save size={13} /> Save
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="px-8 pt-6 pb-2">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Document title…"
                className="w-full text-3xl font-bold text-white bg-transparent outline-none placeholder:text-slate-700"
              />
              <div className="flex items-center gap-2 mt-2 text-slate-600 text-xs">
                <span>by {selectedDoc.creator?.full_name}</span>
                <span>•</span>
                <span>{new Date(selectedDoc.updated_at).toLocaleDateString("en-IN")}</span>
                <span>•</span>
                <span>v{selectedDoc.version}</span>
              </div>
            </div>

            {/* Editable Content */}
            <div className="flex-1 overflow-y-auto px-8 py-4">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onKeyDown={handleKeyDown}
                data-placeholder="Start writing here…"
                className="min-h-full outline-none text-slate-200 leading-8 text-base
                  [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-3 [&_h1]:mt-4
                  [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mb-2 [&_h2]:mt-3
                  [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mb-1.5 [&_h3]:mt-2
                  [&_p]:mb-2 [&_ul]:pl-6 [&_ul]:mb-2 [&_ul_li]:list-disc [&_ul_li]:mb-1
                  [&_ol]:pl-6 [&_ol]:mb-2 [&_ol_li]:list-decimal [&_ol_li]:mb-1
                  [&_pre]:bg-slate-900 [&_pre]:border [&_pre]:border-slate-700 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:my-3 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:overflow-x-auto
                  [&_strong]:font-bold [&_strong]:text-white [&_em]:italic [&_em]:text-slate-300
                  empty:before:content-[attr(data-placeholder)] empty:before:text-slate-700 empty:before:pointer-events-none"
              />
            </div>

            {/* Version History Panel */}
            {showVersions && (
              <div className="border-t border-slate-800 bg-slate-900 max-h-48 overflow-y-auto shrink-0">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                  <span className="text-white text-xs font-semibold flex items-center gap-1.5"><History size={13} /> Version History</span>
                  <button onClick={() => setShowVersions(false)} className="text-slate-500 hover:text-white transition"><X size={14} /></button>
                </div>
                {versions.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-4">No previous versions</p>
                ) : (
                  versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 hover:bg-slate-800 transition">
                      <div>
                        <p className="text-white text-xs font-medium">v{v.version_number} – {v.title}</p>
                        <p className="text-slate-500 text-xs">
                          by {v.editor?.username} • {new Date(v.created_at).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <button
                        onClick={() => restoreVersion(v.id)}
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-slate-700 transition"
                      >
                        <RotateCcw size={11} /> Restore
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DocumentEditor;