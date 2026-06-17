import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, FileText, ListChecks, NotebookPen, Loader2, Bot, User } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const MODES = [
  { id: "summary",       label: "Summary",       icon: FileText,    desc: "Condense to key insights" },
  { id: "action_points", label: "Action Items",  icon: ListChecks,  desc: "Extract tasks & next steps" },
  { id: "meeting_notes", label: "Meeting Notes", icon: NotebookPen, desc: "Format as structured notes" },
];

function RenderMarkdown({ text }) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)/gm, '<h3 class="text-white font-bold text-sm mt-2 mb-1">$1</h3>')
    .replace(/^## (.+)/gm, '<h2 class="text-white font-bold mt-3 mb-1">$1</h2>')
    .replace(/^• (.+)/gm, '<li class="ml-4 text-slate-300">$1</li>')
    .replace(/^\d+\. (.+)/gm, '<li class="ml-4 text-slate-300 list-decimal">$1</li>')
    .replace(/^> (.+)/gm, '<blockquote class="border-l-2 border-indigo-500 pl-3 text-slate-400 italic text-sm">$1</blockquote>')
    .replace(/\n/g, "<br/>");
  return <div className="text-sm text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
}

function AIPanel({ workspaceId, currentDocument }) {
  const [mode, setMode] = useState("chat");
  const [docContent, setDocContent] = useState("");
  const [docMode, setDocMode] = useState("summary");
  const [result, setResult] = useState("");
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "ai", content: "Hi! I'm your NexCollab AI assistant. Ask me anything about your workspace, or paste content for analysis." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (currentDocument?.content) setDocContent(currentDocument.content);
  }, [currentDocument]);

  const analyzeDocument = async () => {
    if (!docContent.trim()) { toast.error("Paste some content to analyze"); return; }
    try {
      setLoadingDoc(true);
      setResult("");
      const res = await api.post(`/api/ai/summarize?workspace_id=${workspaceId}`, {
        content: docContent,
        mode: docMode,
      });
      setResult(res.data.summary);
    } catch (err) {
      toast.error(err.response?.data?.detail || "AI analysis failed");
    } finally {
      setLoadingDoc(false);
    }
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || loadingChat) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: msg }]);
    try {
      setLoadingChat(true);
      const res = await api.post(`/api/ai/chat?workspace_id=${workspaceId}`, {
        message: msg,
        context: currentDocument ? `Working on document: "${currentDocument.title}"` : "",
      });
      setChatMessages((prev) => [...prev, { role: "ai", content: res.data.response }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "ai", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-purple-500/20">
            <Sparkles size={16} className="text-purple-400" />
          </div>
          <span className="text-white font-semibold">AI Assistant</span>
          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">Beta</span>
        </div>
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {["chat", "analyze"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                mode === m ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white" : "text-slate-500 hover:text-white"
              }`}
            >
              {m === "chat" ? "💬 Chat" : "📄 Analyze Doc"}
            </button>
          ))}
        </div>
      </div>

      {/* Chat mode */}
      {mode === "chat" && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "ai" ? "bg-purple-500/20" : "bg-indigo-500"
                }`}>
                  {msg.role === "ai" ? <Bot size={14} className="text-purple-400" /> : <User size={14} className="text-white" />}
                </div>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  msg.role === "ai" ? "bg-slate-800 text-slate-200" : "bg-gradient-to-br from-indigo-600 to-purple-600 text-white"
                }`}>
                  {msg.role === "ai" ? <RenderMarkdown text={msg.content} /> : msg.content}
                </div>
              </div>
            ))}
            {loadingChat && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Bot size={14} className="text-purple-400" />
                </div>
                <div className="bg-slate-800 px-4 py-2.5 rounded-xl">
                  <Loader2 size={14} className="text-purple-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
          <div className="p-3 border-t border-slate-800 shrink-0">
            <form onSubmit={sendChatMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask AI anything…"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-500 outline-none focus:border-purple-500 transition"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || loadingChat}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center hover:opacity-90 transition disabled:opacity-40"
              >
                <Send size={16} className="text-white" />
              </button>
            </form>
          </div>
        </>
      )}

      {/* Analyze mode */}
      {mode === "analyze" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Mode Selector */}
          <div className="space-y-1.5">
            <p className="text-slate-400 text-xs font-medium">Analysis Mode</p>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setDocMode(m.id)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition ${
                      docMode === m.id
                        ? "border-purple-500 bg-purple-500/10 text-purple-300"
                        : "border-slate-800 bg-slate-900 text-slate-500 hover:border-slate-700"
                    }`}
                  >
                    <Icon size={14} />
                    <span className="text-xs font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Input */}
          <div className="space-y-1.5">
            <p className="text-slate-400 text-xs font-medium">Content to Analyze</p>
            <textarea
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="Paste document content or text to analyze…"
              rows={6}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 outline-none focus:border-purple-500 transition resize-none"
            />
          </div>

          {currentDocument && (
            <button
              onClick={() => setDocContent(currentDocument.content)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition"
            >
              ↑ Load current document
            </button>
          )}

          <button
            onClick={analyzeDocument}
            disabled={loadingDoc || !docContent.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loadingDoc ? <><Loader2 size={16} className="animate-spin" /> Analyzing…</> : <><Sparkles size={16} /> Analyze</>}
          </button>

          {/* Result */}
          {result && (
            <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-purple-400" />
                <span className="text-purple-400 text-xs font-semibold">AI Result</span>
              </div>
              <RenderMarkdown text={result} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AIPanel;
