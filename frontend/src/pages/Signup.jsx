import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";   // ✅ Use context
import toast from "react-hot-toast";

function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();   // ✅ Use context signup
  const [form, setForm] = useState({ full_name: "", username: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.username || !form.email || !form.password) {
      toast.error("All fields are required");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      setLoading(true);
      const data = await signup(form);   // ✅ Context handles localStorage + state
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              NexCollab
            </h1>
          </div>
          <h2 className="text-white text-xl font-bold">Create your account</h2>
          <p className="text-slate-400 text-sm mt-1">Join the collaboration platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4 shadow-2xl">
          {[
            { key: "full_name", label: "Full Name", placeholder: "John Doe", type: "text" },
            { key: "username",  label: "Username",  placeholder: "johndoe", type: "text" },
            { key: "email",     label: "Email",     placeholder: "you@example.com", type: "email" },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-slate-400 text-xs font-medium">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={set(key)}
                placeholder={placeholder}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-medium">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                placeholder="Min. 6 characters"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 pr-11 text-white text-sm outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-slate-500 hover:text-white transition">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 mt-2"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
          <p className="text-center text-slate-500 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;