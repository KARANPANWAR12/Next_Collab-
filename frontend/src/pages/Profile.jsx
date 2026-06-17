import { useState } from "react";
import { User, Lock, Palette, Save, ArrowLeft, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
  "#10b981", "#0ea5e9", "#f59e0b", "#ef4444",
  "#14b8a6", "#a855f7", "#f43f5e", "#3b82f6",
];

function Profile() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const [user, setUser] = useState(storedUser);
  const [fullName, setFullName] = useState(storedUser.full_name || "");
  const [bio, setBio] = useState(storedUser.bio || "");
  const [avatarColor, setAvatarColor] = useState(storedUser.avatar_color || "#6366f1");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      const res = await api.patch("/api/auth/profile", {
        full_name: fullName,
        bio,
        avatar_color: avatarColor,
      });
      const updatedUser = { ...storedUser, ...res.data };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) { toast.error("Fill in all fields"); return; }
    if (newPassword !== confirmPassword) { toast.error("New passwords don't match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    try {
      setSavingPassword(true);
      await api.post("/api/auth/change-password", { current_password: currentPassword, new_password: newPassword });
      toast.success("Password changed successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl px-6 flex items-center gap-4 sticky top-0 z-40">
        <Link to="/dashboard" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-white font-bold">Profile & Settings</h1>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        {/* Avatar Preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4 shadow-2xl"
            style={{ backgroundColor: avatarColor }}
          >
            {(fullName || user.full_name || "U")[0].toUpperCase()}
          </div>
          <p className="text-white font-bold text-xl">{fullName || user.full_name}</p>
          <p className="text-slate-400 text-sm">@{user.username}</p>
          <p className="text-slate-500 text-xs mt-1">{user.email}</p>
        </div>

        {/* Profile Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20"><User size={16} className="text-indigo-400" /></div>
            <h2 className="text-white font-semibold">Profile Information</h2>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 text-xs font-medium">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 text-xs font-medium">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell your team about yourself…"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition resize-none placeholder:text-slate-600"
            />
          </div>

          {/* Avatar Color */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Palette size={14} className="text-slate-400" />
              <label className="text-slate-400 text-xs font-medium">Avatar Color</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setAvatarColor(color)}
                  className="w-9 h-9 rounded-full transition-all hover:scale-110 relative"
                  style={{ backgroundColor: color }}
                >
                  {avatarColor === color && (
                    <CheckCircle size={16} className="absolute -top-1 -right-1 text-white bg-slate-900 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            <Save size={16} /> {savingProfile ? "Saving…" : "Save Profile"}
          </button>
        </div>

        {/* Change Password */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20"><Lock size={16} className="text-amber-400" /></div>
            <h2 className="text-white font-semibold">Change Password</h2>
          </div>

          {[
            { label: "Current Password", value: currentPassword, setter: setCurrentPassword, placeholder: "Enter current password" },
            { label: "New Password",     value: newPassword,     setter: setNewPassword,     placeholder: "Min. 6 characters" },
            { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword, placeholder: "Repeat new password" },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label} className="space-y-1">
              <label className="text-slate-400 text-xs font-medium">{label}</label>
              <input
                type="password"
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500 transition placeholder:text-slate-600"
              />
            </div>
          ))}

          <button
            onClick={changePassword}
            disabled={savingPassword}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            <Lock size={16} /> {savingPassword ? "Updating…" : "Update Password"}
          </button>
        </div>

        {/* Account Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-3">Account Details</h2>
          <div className="space-y-2">
            {[
              { label: "Email", value: user.email },
              { label: "Username", value: `@${user.username}` },
              { label: "Member Since", value: user.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                <span className="text-slate-400 text-sm">{label}</span>
                <span className="text-white text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
