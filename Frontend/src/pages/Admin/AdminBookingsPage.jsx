import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { fetchWithAuth } from "@/parts/FetchApiWithAuth";
import { ChevronLeft, Ticket, DollarSign, LayoutDashboard, CalendarFold, Trash2, ShieldCheck, XCircle, Film } from "lucide-react";

async function parseResponseBody(response) {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export default function AdminBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/admin/bookings`, {
        method: "GET",
      });
      const response = await parseResponseBody(res);
      if (!res.ok) {
        if (res.status === 403) throw new Error("Bạn không có quyền truy cập trang quản lý vé.");
        throw new Error((response && response.message) || "Không tải được danh sách vé");
      }
      const list = Array.isArray(response) ? response : [];
      const sortedList = list.sort((a, b) => b.id - a.id);
      setBookings(sortedList);
    } catch (err) {
      if (err.message === "TokenExpiredError") {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else if (err.message === "ForbiddenError") {
        setError("Bạn không có quyền truy cập trang quản lý vé.");
      } else {
        setError(err.message || "Không thể tải danh sách vé");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn vé này không?")) return;
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/admin/bookings/${id}/cancel`, {
        method: "PUT",
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
      } else {
        alert("Có lỗi xảy ra khi hủy vé.");
      }
    } catch (err) {
      alert("Không thể hủy vé: " + err.message);
    }
  };

  const uniqueMovies = useMemo(() => {
    const movieMap = new Map();
    bookings.forEach(b => {
      if (b.showtime?.movie) {
        movieMap.set(b.showtime.movie.id, b.showtime.movie.title);
      }
    });
    return Array.from(movieMap.entries()).map(([id, title]) => ({ id, title }));
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (selectedMovieId === "all") return bookings;
    return bookings.filter(b => b.showtime?.movie?.id === Number(selectedMovieId));
  }, [bookings, selectedMovieId]);

  const stats = useMemo(() => {
    return filteredBookings.reduce(
      (acc, booking) => {
        const isSuccess = ["completed", "success", "confirmed", "CONFIRMED", "PAID", "paid"].includes(booking.status);
        const isFailed = ["cancelled", "failed", "CANCELLED", "FAILED"].includes(booking.status);

        if (isSuccess) {
          acc.success += 1;
          acc.revenue += booking.totalPrice || 0;
        } else if (isFailed) {
          acc.cancelled += 1;
        } else {
          acc.pending += 1;
        }
        return acc;
      },
      { success: 0, pending: 0, cancelled: 0, revenue: 0 }
    );
  }, [filteredBookings]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "success":
      case "SUCCESS":
      case "completed":
      case "COMPLETED":
      case "confirmed":
      case "CONFIRMED":
      case "paid":
      case "PAID":
        return <span className="inline-block rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400"><ShieldCheck className="inline-block w-3 h-3 mr-1"/>Thành công</span>;
      case "pending":
      case "PENDING":
        return <span className="inline-block rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400"><CalendarFold className="inline-block w-3 h-3 mr-1"/>Chờ xử lý</span>;
      case "cancelled":
      case "CANCELLED":
      case "failed":
      case "FAILED":
        return <span className="inline-block rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400"><XCircle className="inline-block w-3 h-3 mr-1"/>Hủy / Lỗi</span>;
      default:
        return <span className="inline-block rounded-lg border border-gray-500/30 bg-gray-500/10 px-2.5 py-1 text-xs font-semibold text-gray-400">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString("vi-VN");
    } catch {
      return dateString;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#0b0f19] text-white pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center text-gray-400 hover:text-white mb-6 transition"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Về dashboard
          </button>

          <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(244,63,94,0.15),_transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 md:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-rose-400/80">Admin Doanh Thu</p>
                <h1 className="mt-3 text-3xl md:text-5xl font-black tracking-tight">Quản lý vé & Doanh thu</h1>
                <p className="mt-3 max-w-3xl text-gray-300">
                  Theo dõi danh sách các đơn đặt vé, trạng thái giao dịch và tổng kết doanh thu toàn hệ thống.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="bg-[#1c1d1f] border border-white/10 rounded-2xl px-4 py-4 flex items-center h-full">
                  <Film className="w-5 h-5 text-cyan-400 mr-2" />
                  <select
                    value={selectedMovieId}
                    onChange={(e) => setSelectedMovieId(e.target.value)}
                    className="bg-transparent text-white focus:outline-none cursor-pointer w-full"
                  >
                    <option value="all">Tất cả phim</option>
                    {uniqueMovies.map(m => (
                      <option key={m.id} value={m.id} className="bg-[#1c1d1f] text-white">
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4 backdrop-blur-md">
                  <div className="text-sm text-gray-400 uppercase tracking-widest mb-1">Tổng doanh thu</div>
                  <div className="text-3xl font-black text-rose-400">
                    {stats.revenue.toLocaleString("vi-VN")} <span className="text-xl">VNĐ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</div>
          ) : null}

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Tổng Đơn</p>
                  <p className="mt-3 text-3xl font-black text-white">{filteredBookings.length}</p>
                </div>
                <LayoutDashboard className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Thành công</p>
                  <p className="mt-3 text-3xl font-black text-white">{stats.success}</p>
                </div>
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Chờ xử lý</p>
                  <p className="mt-3 text-3xl font-black text-white">{stats.pending}</p>
                </div>
                <CalendarFold className="w-8 h-8 text-amber-400" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Bị hủy</p>
                  <p className="mt-3 text-3xl font-black text-white">{stats.cancelled}</p>
                </div>
                <Trash2 className="w-8 h-8 text-rose-400" />
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-[#1c1d1f] shadow-xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Đang tải danh sách giao dịch...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/40 text-gray-400 uppercase text-xs tracking-wide">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                      <th className="px-4 py-3 font-semibold">Mã Đơn</th>
                      <th className="px-4 py-3 font-semibold">Tên đăng nhập</th>
                      <th className="px-4 py-3 font-semibold">Phim</th>
                      <th className="px-4 py-3 font-semibold">Trạng thái</th>
                      <th className="px-4 py-3 font-semibold text-right">Tổng thanh toán</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-white/[0.03]">
                        <td className="px-4 py-3 text-gray-400">
                          {formatDate(b.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-medium text-cyan-300">#{b.id}</td>
                        <td className="px-4 py-3 text-gray-300">
                          {b.user?.username || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-white">{b.showtime?.movie?.title || "—"}</span>
                          <div className="text-xs text-gray-400 mt-1">
                            {b.showtime?.room?.cinema?.name} - {b.showtime?.room?.name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(b.status)}
                            {b.status === "pending" && (
                              <button
                                onClick={() => handleCancel(b.id)}
                                title="Hủy vé"
                                className="text-gray-400 hover:text-rose-400 focus:outline-none transition-transform hover:scale-110 active:scale-95"
                              >
                                <XCircle className="w-5 h-5 shadow-sm" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-rose-400">
                          {Number(b.totalPrice || 0).toLocaleString("vi-VN")} đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredBookings.length ? <div className="p-10 text-center text-gray-500">Chưa có giao dịch nào.</div> : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
