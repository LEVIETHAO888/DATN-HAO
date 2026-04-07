import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import {
  CalendarClock,
  ChevronRight,
  Clapperboard,
  Film,
  MonitorPlay,
  Shield,
  Ticket,
  UserCog,
} from "lucide-react";
import { getRoleIdFromToken, isSystemAdmin } from "@/utils/jwt";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

function formatMovieStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();

  switch (normalized) {
    case "now_showing":
      return "Dang chieu";
    case "coming_soon":
      return "Sap chieu";
    case "ended":
      return "Da ket thuc";
    default:
      return "Khong xac dinh";
  }
}

function formatShowtime(value) {
  if (!value) return "Chua co lich";

  try {
    return new Date(value).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function StatCard({ icon: Icon, label, value, tone }) {
  const tones = {
    blue: "from-[#008bd0]/25 to-transparent text-[#4fc3ff] border-[#008bd0]/30",
    amber: "from-amber-500/20 to-transparent text-amber-300 border-amber-500/30",
    emerald: "from-emerald-500/20 to-transparent text-emerald-300 border-emerald-500/30",
    violet: "from-cyan-500/20 to-transparent text-cyan-300 border-cyan-500/30",
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${tones[tone]} bg-[#1c1d1f] p-5 shadow-xl`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400">{label}</p>
          <p className="mt-3 text-3xl font-black text-white">{value}</p>
        </div>
        <div className="rounded-2xl bg-white/8 p-3">
          <Icon className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");
  const roleId = getRoleIdFromToken(token);
  const canManageUsers = isSystemAdmin(roleId);
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [movieRes, showtimeRes, roomRes] = await Promise.all([
          fetch(`${API_BASE}/movies`, { headers }),
          fetch(`${API_BASE}/admin/showtimes`, { headers }),
          fetch(`${API_BASE}/rooms`, { headers }),
        ]);

        const [movieData, showtimeData, roomData] = await Promise.all([
          movieRes.json(),
          showtimeRes.json(),
          roomRes.json(),
        ]);

        if (!movieRes.ok) throw new Error(movieData?.message || "Khong tai duoc danh sach phim");
        if (!showtimeRes.ok) throw new Error(showtimeData?.message || "Khong tai duoc lich chieu");
        if (!roomRes.ok) throw new Error(roomData?.message || "Khong tai duoc danh sach phong");

        setMovies(Array.isArray(movieData) ? movieData : []);
        setShowtimes(Array.isArray(showtimeData) ? showtimeData : []);
        setRooms(Array.isArray(roomData) ? roomData : []);
      } catch (err) {
        setError(err.message || "Khong the tai dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [token]);

  const stats = useMemo(() => {
    const statusCount = movies.reduce(
      (acc, movie) => {
        const key = String(movie.status || "").toLowerCase();
        if (key === "now_showing") acc.nowShowing += 1;
        else if (key === "coming_soon") acc.comingSoon += 1;
        else if (key === "ended") acc.ended += 1;
        return acc;
      },
      { nowShowing: 0, comingSoon: 0, ended: 0 }
    );

    const upcomingShowtimes = [...showtimes]
      .filter((item) => item?.startTime)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, 5);

    return { ...statusCount, upcomingShowtimes };
  }, [movies, showtimes]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#0b0f19] text-white pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(0,139,208,0.22),_transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 md:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Admin Dashboard</p>
                <h1 className="mt-3 text-3xl md:text-5xl font-black tracking-tight">Tong quan quan tri PhimNet</h1>
                <p className="mt-3 max-w-3xl text-gray-300">
                  Theo doi nhanh tinh hinh phim, lich chieu va du lieu van hanh de dieu huong tac vu quan tri trong mot man hinh.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/admin/movies")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#008bd0] hover:bg-[#0070a8] px-5 py-3 font-semibold transition"
                >
                  <Film className="w-5 h-5" />
                  Quan ly phim
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/showtimes")}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-3 font-semibold text-black transition"
                >
                  <CalendarClock className="w-5 h-5" />
                  Quan ly lich chieu
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</div>
          ) : null}

          {loading ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#1c1d1f] p-12 text-center text-gray-400">Dang tai dashboard...</div>
          ) : (
            <>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard icon={Clapperboard} label="Tong phim" value={movies.length} tone="blue" />
                <StatCard icon={MonitorPlay} label="Dang chieu" value={stats.nowShowing} tone="emerald" />
                <StatCard icon={Ticket} label="Sap chieu" value={stats.comingSoon} tone="amber" />
                <StatCard icon={CalendarClock} label="Tong suat chieu" value={showtimes.length} tone="violet" />
              </div>

              <div className="mt-8 grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] shadow-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div>
                      <h2 className="text-xl font-bold">Lich chieu sap toi</h2>
                      <p className="text-sm text-gray-400 mt-1">5 suat chieu gan nhat de admin theo doi nhanh</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/admin/showtimes")}
                      className="inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200 transition"
                    >
                      Xem tat ca
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="divide-y divide-white/5">
                    {stats.upcomingShowtimes.length ? (
                      stats.upcomingShowtimes.map((showtime) => (
                        <div key={showtime.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-white/[0.03]">
                          <div>
                            <div className="font-semibold text-white">{showtime.movie?.title || `Phim #${showtime.movie?.id || "?"}`}</div>
                            <div className="text-sm text-gray-400 mt-1">
                              {showtime.room?.cinema?.name || "Rap"} - {showtime.room?.name || "Phong"}
                            </div>
                          </div>
                          <div className="text-left md:text-right">
                            <div className="text-cyan-300 font-semibold">{formatShowtime(showtime.startTime)}</div>
                            <div className="text-sm text-amber-300 mt-1">
                              {showtime.price != null ? `${Number(showtime.price).toLocaleString("vi-VN")} d` : "Chua co gia"}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-5 py-10 text-center text-gray-500">Chua co suat chieu nao.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] shadow-xl p-5">
                    <h2 className="text-xl font-bold">Tinh trang phim</h2>
                    <div className="mt-4 space-y-3">
                      {[
                        { label: "Dang chieu", value: stats.nowShowing, color: "bg-emerald-400" },
                        { label: "Sap chieu", value: stats.comingSoon, color: "bg-amber-400" },
                        { label: "Da ket thuc", value: stats.ended, color: "bg-gray-400" },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl bg-white/[0.03] px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`h-2.5 w-2.5 rounded-full ${item.color}`}></span>
                            <span className="text-gray-300">{item.label}</span>
                          </div>
                          <span className="text-lg font-bold text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] shadow-xl p-5">
                    <h2 className="text-xl font-bold">Nhanh tay thao tac</h2>
                    <div className="mt-4 grid grid-cols-1 gap-3">
                      {[
                        {
                          title: "Quan ly phim",
                          desc: "Them, sua thong tin phim, trailer, dao dien va dien vien.",
                          path: "/admin/movies",
                          icon: Film,
                        },
                        {
                          title: "Quan ly lich chieu",
                          desc: "Theo doi suat chieu, phong chieu va gia ve.",
                          path: "/admin/showtimes",
                          icon: CalendarClock,
                        },
                        ...(canManageUsers
                          ? [
                              {
                                title: "Quan ly nguoi dung",
                                desc: "Xem danh sach tai khoan, role va tao nguoi dung moi.",
                                path: "/admin/users",
                                icon: UserCog,
                              },
                            ]
                          : []),
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.path}
                            type="button"
                            onClick={() => navigate(item.path)}
                            className="text-left rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] px-4 py-4 transition"
                          >
                            <div className="flex items-start gap-3">
                              <div className="rounded-xl bg-white/8 p-3 text-cyan-300">
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-semibold text-white">{item.title}</div>
                                <div className="text-sm text-gray-400 mt-1">{item.desc}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] shadow-xl p-5">
                    <h2 className="text-xl font-bold">He thong</h2>
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
                      <span className="text-gray-300">So phong chieu</span>
                      <span className="font-bold text-white">{rooms.length}</span>
                    </div>
                    {canManageUsers ? (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
                        <span className="text-gray-300">Quyen he thong</span>
                        <span className="inline-flex items-center gap-2 font-bold text-amber-300">
                          <Shield className="w-4 h-4" />
                          Admin
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-[#1c1d1f] shadow-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <h2 className="text-xl font-bold">Danh sach phim gan day</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-black/30 text-gray-400 uppercase text-xs tracking-wide">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Ten phim</th>
                        <th className="px-5 py-3 font-semibold hidden md:table-cell">Trang thai</th>
                        <th className="px-5 py-3 font-semibold hidden lg:table-cell">The loai</th>
                        <th className="px-5 py-3 font-semibold hidden md:table-cell">Dao dien</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {movies.slice(0, 6).map((movie) => (
                        <tr key={movie.id} className="hover:bg-white/[0.03]">
                          <td className="px-5 py-3 font-medium">{movie.title}</td>
                          <td className="px-5 py-3 hidden md:table-cell">
                            <span className="inline-block rounded-lg bg-white/10 px-2 py-1 text-xs text-gray-300">
                              {formatMovieStatus(movie.status)}
                            </span>
                          </td>
                          <td className="px-5 py-3 hidden lg:table-cell text-gray-400">{movie.genre || "Dang cap nhat"}</td>
                          <td className="px-5 py-3 hidden md:table-cell text-gray-400">{movie.director || "Dang cap nhat"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!movies.length ? <div className="px-5 py-10 text-center text-gray-500">Chua co phim nao.</div> : null}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
