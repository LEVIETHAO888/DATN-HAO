import React, { useEffect, useRef, useState } from "react";
import Layout from "@/components/Layout";
import {
  User, Ticket, Calendar, MapPin, Clock, LogOut,
  Mail, ShieldCheck, KeyRound, X, CheckCircle2, AlertCircle,
  Pencil, Camera, FileText, Loader2
} from "lucide-react";
import { decodeJwtPayload, getUserIdFromToken, getUsernameFromToken, getRoleLabel, getRoleIdFromToken } from "@/utils/jwt";
import useNagivateLoading from "@/hooks/useNagivateLoading";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

const PersonalPage = () => {
  const navigate = useNagivateLoading();
  const token = localStorage.getItem("accessToken");
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Profile data fetched from server
  const [profile, setProfile] = useState(null);

  // States for Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordStatus, setPasswordStatus] = useState({ type: "", message: "" });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // States for Edit Profile Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileBio, setProfileBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [profileStatus, setProfileStatus] = useState({ type: "", message: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef(null);

  // Lấy thông tin từ JWT
  const payload = decodeJwtPayload(token);
  const username = getUsernameFromToken(token);
  const email = payload?.sub || "";
  const roleId = getRoleIdFromToken(token);
  const roleLabel = getRoleLabel(roleId);

  // Fetch profile từ server để lấy avatar, bio
  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.data || data);
        }
      } catch (e) {
        console.error("Lỗi tải hồ sơ:", e);
      }
    };
    fetchProfile();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const fetchBookings = async () => {
      try {
        const res = await fetch(`${API_BASE}/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBookings(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Lỗi tải lịch sử đặt vé:", e);
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchBookings();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userLogin");
    window.location.href = "/login";
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus({ type: "error", message: "Mật khẩu xác nhận không khớp!" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordStatus({ type: "error", message: "Mật khẩu mới phải có ít nhất 6 ký tự!" });
      return;
    }

    setIsChangingPassword(true);
    setPasswordStatus({ type: "", message: "" });

    try {
      const res = await fetch(`${API_BASE}/users/me/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordStatus({ type: "success", message: "Đổi mật khẩu thành công!" });
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordStatus({ type: "", message: "" });
        }, 2000);
      } else {
        setPasswordStatus({ type: "error", message: data.message || "Đã xảy ra lỗi khi đổi mật khẩu" });
      }
    } catch (e) {
      setPasswordStatus({ type: "error", message: "Không thể kết nối đến máy chủ" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Mở modal chỉnh sửa hồ sơ
  const openProfileModal = () => {
    setProfileBio(profile?.bio || "");
    setAvatarFile(null);
    setAvatarPreview(null);
    setProfileStatus({ type: "", message: "" });
    setShowProfileModal(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileStatus({ type: "", message: "" });

    try {
      const formData = new FormData();
      formData.append("bio", profileBio);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await fetch(`${API_BASE}/users/me/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        const updatedProfile = data.data || data;
        setProfile(updatedProfile);

        // Đồng bộ vào localStorage để Header cập nhật avatar ngay
        try {
          const stored = localStorage.getItem("userLogin");
          const current = stored ? JSON.parse(stored) : {};
          localStorage.setItem("userLogin", JSON.stringify({ ...current, ...updatedProfile }));
          // Phát event để Header biết localStorage thay đổi
          window.dispatchEvent(new Event("storage"));
        } catch (_) {}

        setProfileStatus({ type: "success", message: "Cập nhật hồ sơ thành công!" });
        setTimeout(() => {
          setShowProfileModal(false);
          setProfileStatus({ type: "", message: "" });
        }, 1500);
      } else {
        setProfileStatus({ type: "error", message: data.message || "Đã xảy ra lỗi khi cập nhật hồ sơ" });
      }
    } catch (e) {
      setProfileStatus({ type: "error", message: "Không thể kết nối đến máy chủ" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const avatarUrl = profile?.avatar
    ? `${(import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace("/api", "")}${profile.avatar}`
    : null;

  if (!token) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#060b19] text-white">
          <div className="text-center space-y-4">
            <User className="mx-auto w-16 h-16 text-gray-500" />
            <p className="text-xl text-gray-400">Vui lòng đăng nhập để xem trang cá nhân.</p>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 bg-[#008bd0] hover:bg-[#0070a8] text-white rounded-full font-semibold transition-all"
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#060b19] text-white pt-10 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* ── Profile Card ── */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#008bd0]/30 via-[#060b19] to-[#060b19]" />
            <div className="absolute inset-0 bg-[url('/banner1.jpg')] bg-cover bg-center opacity-10" />

            <div className="relative p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative shrink-0 group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover shadow-lg shadow-cyan-500/30 border-4 border-white/10"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#008bd0] to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30 border-4 border-white/10">
                    <span className="text-4xl font-black text-white select-none">
                      {username?.slice(0, 1)?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
                {/* Camera overlay hint */}
                <button
                  onClick={openProfileModal}
                  title="Chỉnh sửa hồ sơ"
                  className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="w-7 h-7 text-white" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-black text-white mb-1">{username || "Người dùng"}</h1>
                <div className="flex flex-col sm:flex-row gap-3 mt-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#008bd0]" />
                    <span>{email || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-300 font-medium">{roleLabel}</span>
                  </div>
                </div>
                {/* Bio */}
                {profile?.bio && (
                  <p className="mt-3 text-sm text-gray-300 italic max-w-md leading-relaxed">
                    <FileText className="inline w-4 h-4 mr-1 text-[#008bd0] -mt-0.5" />
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={openProfileModal}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 rounded-full text-sm font-semibold transition-all"
                >
                  <Pencil className="w-4 h-4" />
                  Chỉnh sửa hồ sơ
                </button>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#008bd0]/10 hover:bg-[#008bd0]/20 border border-[#008bd0]/30 text-[#008bd0] hover:text-cyan-400 rounded-full text-sm font-semibold transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                  Đổi mật khẩu
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-full text-sm font-semibold transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>

          {/* ── Edit Profile Modal ── */}
          {showProfileModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Chỉnh Sửa Hồ Sơ</h2>
                </div>

                {profileStatus.message && (
                  <div className={`p-4 rounded-xl mb-5 flex items-start gap-3 ${profileStatus.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                    {profileStatus.type === "success"
                      ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                      : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />}
                    <p className="text-sm font-medium">{profileStatus.message}</p>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  {/* Avatar picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">Ảnh đại diện</label>
                    <div className="flex items-center gap-5">
                      {/* Preview */}
                      <div className="relative shrink-0">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Preview"
                            className="w-20 h-20 rounded-full object-cover border-2 border-cyan-500/40"
                          />
                        ) : avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar hiện tại"
                            className="w-20 h-20 rounded-full object-cover border-2 border-white/10"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#008bd0] to-cyan-400 flex items-center justify-center border-2 border-white/10">
                            <span className="text-3xl font-black text-white">
                              {username?.slice(0, 1)?.toUpperCase() || "?"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Upload button */}
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2 bg-[#1c1d1f] hover:bg-[#2a2b2f] border border-white/10 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-400 rounded-xl text-sm font-medium transition-all"
                        >
                          <Camera className="w-4 h-4" />
                          Chọn ảnh
                        </button>
                        <p className="text-xs text-gray-500">JPG, PNG, WebP tối đa 5MB</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Giới thiệu bản thân</label>
                    <textarea
                      rows={4}
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      maxLength={300}
                      placeholder="Chia sẻ đôi điều về bạn..."
                      className="w-full bg-[#1c1d1f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none text-sm placeholder:text-gray-600"
                    />
                    <p className="text-xs text-gray-600 text-right mt-1">{profileBio.length}/300</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full bg-gradient-to-r from-cyan-500 to-[#008bd0] hover:from-cyan-600 hover:to-[#0070a8] text-white rounded-xl py-3.5 font-bold transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                  >
                    {isSavingProfile
                      ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...</>
                      : "Lưu Thay Đổi"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── Change Password Modal ── */}
          {showPasswordModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#008bd0]/20 flex items-center justify-center text-[#008bd0]">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Đổi Mật Khẩu</h2>
                </div>

                {passwordStatus.message && (
                  <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${passwordStatus.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                    {passwordStatus.type === "success" ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />}
                    <p className="text-sm font-medium">{passwordStatus.message}</p>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      required
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      className="w-full bg-[#1c1d1f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#008bd0] focus:ring-1 focus:ring-[#008bd0] transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Mật khẩu mới</label>
                    <input
                      type="password"
                      required
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full bg-[#1c1d1f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#008bd0] focus:ring-1 focus:ring-[#008bd0] transition-colors"
                      placeholder="Ít nhất 6 ký tự"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      required
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full bg-[#1c1d1f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#008bd0] focus:ring-1 focus:ring-[#008bd0] transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full bg-gradient-to-r from-[#008bd0] to-[#00bfff] hover:from-[#0070a8] hover:to-[#008bd0] text-white rounded-xl py-3.5 font-bold transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {isChangingPassword ? "Đang xử lý..." : "Cập Nhật Mật Khẩu"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── Bookings ── */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Ticket className="text-[#008bd0] w-6 h-6" />
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">Lịch Sử Đặt Vé</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-[#008bd0]/40 to-transparent" />
            </div>

            {loadingBookings ? (
              <div className="text-center py-14 text-gray-500 animate-pulse">Đang tải lịch sử...</div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-500">
                <Ticket className="w-14 h-14 mb-4 opacity-30" />
                <p className="text-lg">Bạn chưa có lịch sử đặt vé nào.</p>
                <button
                  onClick={() => navigate("/movies")}
                  className="mt-5 px-6 py-2.5 bg-gradient-to-r from-[#008bd0] to-[#00bfff] text-white rounded-full font-bold text-sm hover:-translate-y-0.5 transition-all shadow-lg shadow-cyan-500/30"
                >
                  Xem phim ngay
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="group flex flex-col sm:flex-row gap-4 p-5 bg-[#1c1d1f] hover:bg-[#008bd0]/10 border border-white/5 hover:border-[#008bd0]/30 rounded-2xl shadow transition-all duration-300"
                  >
                    {/* Movie poster placeholder */}
                    <div className="w-full sm:w-16 h-16 rounded-xl bg-gradient-to-br from-[#008bd0]/30 to-cyan-900/30 flex items-center justify-center shrink-0">
                      <Ticket className="text-[#008bd0] w-7 h-7" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="font-bold text-white text-base group-hover:text-[#00bfff] transition-colors">
                          {b.showtime?.movie?.title || `Vé #${b.id}`}
                        </h3>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          b.status === "CANCELLED"
                            ? "bg-red-500/20 text-red-400"
                            : b.status === "PAID"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {b.status === "CANCELLED" ? "Đã huỷ" : b.status === "PAID" ? "Đã thanh toán" : b.status || "Chờ thanh toán"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400 mt-1">
                        {b.showtime?.startTime && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#008bd0]" />
                            <span>{new Date(b.showtime.startTime).toLocaleString("vi-VN")}</span>
                          </div>
                        )}
                        {b.showtime?.room?.cinema?.name && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-red-400" />
                            <span>{b.showtime.room.cinema.name}</span>
                          </div>
                        )}
                        {b.totalPrice && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-400 font-bold">
                              {Number(b.totalPrice).toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default PersonalPage;
