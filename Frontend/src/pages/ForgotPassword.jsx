import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, Loader2, ShieldAlert } from "lucide-react";
import useNagivateLoading from "@/hooks/useNagivateLoading";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

const STEPS = {
  EMAIL: 1,
  NEW_PASSWORD: 2,
  SUCCESS: 3,
};

const ForgotPassword = () => {
  const navigate = useNagivateLoading();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Bước 1: Kiểm tra email
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Vui lòng nhập email."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.exists) {
        setStep(STEPS.NEW_PASSWORD);
      } else {
        setError(data.message || "Email không tồn tại trong hệ thống.");
      }
    } catch {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Đặt mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự."); return; }
    if (newPassword !== confirmPassword) { setError("Mật khẩu xác nhận không khớp."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(STEPS.SUCCESS);
      } else {
        setError(data.message || "Đặt lại mật khẩu thất bại.");
      }
    } catch {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="w-full min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background */}
      <img src="/banner5.jpg" className="absolute inset-0 w-full h-full object-cover" alt="bg" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#060b19]/95 via-[#0a1628]/90 to-[#060b19]/85" />

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#008bd0]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" className="h-12 drop-shadow-[0_0_20px_rgba(0,139,208,0.8)]" alt="logo" />
            <span className="text-3xl font-black text-white tracking-wider">CineX</span>
          </div>
        </div>

        <div className="bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/60">

          {/* Step indicator */}
          {step !== STEPS.SUCCESS && (
            <div className="flex items-center justify-center gap-2 mb-8">
              {[STEPS.EMAIL, STEPS.NEW_PASSWORD].map((s) => (
                <React.Fragment key={s}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                    ${step >= s
                      ? "bg-[#008bd0] border-[#008bd0] text-white shadow-lg shadow-cyan-500/30"
                      : "bg-transparent border-white/20 text-white/30"}`}
                  >
                    {s}
                  </div>
                  {s < STEPS.NEW_PASSWORD && (
                    <div className={`h-0.5 w-12 rounded transition-all duration-500 ${step > s ? "bg-[#008bd0]" : "bg-white/10"}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* STEP 1: Email */}
            {step === STEPS.EMAIL && (
              <motion.form
                key="email"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                onSubmit={handleCheckEmail}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-14 h-14 bg-[#008bd0]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#008bd0]/30">
                    <Mail className="w-7 h-7 text-[#008bd0]" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">Quên Mật Khẩu?</h2>
                  <p className="text-gray-400 text-sm">Nhập email đăng ký để tiếp tục đặt lại mật khẩu</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Địa chỉ Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-[#008bd0] focus:ring-1 focus:ring-[#008bd0]/50 transition-all placeholder:text-gray-600"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#008bd0] to-[#00bfff] hover:from-[#0070a8] hover:to-[#008bd0] text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Tiếp Tục"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
                </button>
              </motion.form>
            )}

            {/* STEP 2: Mật khẩu mới */}
            {step === STEPS.NEW_PASSWORD && (
              <motion.form
                key="password"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                onSubmit={handleResetPassword}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                    <Lock className="w-7 h-7 text-amber-400" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">Mật Khẩu Mới</h2>
                  <p className="text-gray-400 text-sm">
                    Tài khoản: <span className="text-[#008bd0] font-semibold">{email}</span>
                  </p>
                </div>

                {/* New password */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Mật khẩu mới</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-12 py-3 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all placeholder:text-gray-600"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-12 py-3 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all placeholder:text-gray-600"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Đặt Lại Mật Khẩu"}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(STEPS.EMAIL); setError(""); }}
                  className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Thay đổi email
                </button>
              </motion.form>
            )}

            {/* STEP 3: Thành công */}
            {step === STEPS.SUCCESS && (
              <motion.div
                key="success"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="text-center space-y-6 py-4"
              >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/40">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white mb-2">Thành Công!</h2>
                  <p className="text-gray-400 text-sm">
                    Mật khẩu của tài khoản <span className="text-[#008bd0] font-semibold">{email}</span> đã được cập nhật.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/20 hover:-translate-y-0.5"
                >
                  Đăng Nhập Ngay
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">© 2026 CineX. All rights reserved.</p>
      </div>
    </div>
  );
};

export default ForgotPassword;
