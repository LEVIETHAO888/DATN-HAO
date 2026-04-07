import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { CalendarClock, ChevronLeft, Pencil, Plus, Trash2 } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

function toDatetimeLocalValue(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const s = value.replace(" ", "T");
    return s.length >= 16 ? s.slice(0, 16) : s;
  }
  if (Array.isArray(value) && value.length >= 6) {
    const [y, mo, d, h, mi] = value;
    return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
  }
  return "";
}

function formatVnDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}


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
      return status || "Khong xac dinh";
  }
}

const emptyForm = () => ({
  movieId: "",
  roomId: "",
  startTime: "",
  endTime: "",
  price: "",
});

export default function AdminShowtimesPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [stRes, mvRes, rmRes] = await Promise.all([
        fetch(`${API_BASE}/admin/showtimes`, { headers }),
        fetch(`${API_BASE}/movies`, { headers }),
        fetch(`${API_BASE}/rooms`, { headers }),
      ]);
      const stData = await stRes.json();
      const mvData = await mvRes.json();
      const rmData = await rmRes.json();
      if (!stRes.ok) throw new Error(typeof stData === "string" ? stData : stData?.message || "Không tải lịch chiếu");
      if (!mvRes.ok) throw new Error("Không tải danh sách phim");
      if (!rmRes.ok) throw new Error("Không tải danh sách phòng");
      setShowtimes(Array.isArray(stData) ? stData : []);
      setMovies(Array.isArray(mvData) ? mvData : []);
      setRooms(Array.isArray(rmData) ? rmData : []);
    } catch (e) {
      setError(e.message || "Lỗi mạng");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function roomLabel(r) {
    const cname = r.cinema?.name || "Rạp";
    return `${cname} — ${r.name || "Phòng"}`;
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
    setMessage("");
  }

  function openEdit(st) {
    setEditingId(st.id);
    setForm({
      movieId: st.movie?.id != null ? String(st.movie.id) : "",
      roomId: st.room?.id != null ? String(st.room.id) : "",
      startTime: toDatetimeLocalValue(st.startTime),
      endTime: toDatetimeLocalValue(st.endTime),
      price: st.price != null ? String(st.price) : "",
    });
    setModalOpen(true);
    setMessage("");
  }

  function buildPayload() {
    const movieId = parseInt(form.movieId, 10);
    const roomId = parseInt(form.roomId, 10);
    const price = parseFloat(form.price);
    if (!Number.isFinite(movieId) || !Number.isFinite(roomId)) {
      throw new Error("Chọn phim và phòng chiếu.");
    }
    if (!form.startTime) {
      throw new Error("Chọn giờ bắt đầu.");
    }
    if (!Number.isFinite(price) || price < 0) {
      throw new Error("Nhập giá vé hợp lệ.");
    }
    const startTime = form.startTime.length === 16 ? `${form.startTime}:00` : form.startTime;
    const endTime = form.endTime
      ? form.endTime.length === 16
        ? `${form.endTime}:00`
        : form.endTime
      : null;
    return {
      movieId,
      roomId,
      startTime,
      endTime,
      price,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    let body;
    try {
      body = buildPayload();
    } catch (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    try {
      const url = editingId ? `${API_BASE}/admin/showtimes/${editingId}` : `${API_BASE}/admin/showtimes`;
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || res.statusText);
      setMessage(editingId ? "Đã cập nhật suất chiếu." : "Đã thêm suất chiếu.");
      setModalOpen(false);
      await loadAll();
    } catch (err) {
      setError(err.message || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Xóa suất chiếu này? (Các đặt vé liên quan có thể bị ảnh hưởng theo cấu hình DB.)")) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/showtimes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || res.statusText);
      }
      setMessage("Đã xóa suất chiếu.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Không xóa được");
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#0b0f19] text-white pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center text-gray-400 hover:text-white mb-6 transition"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Về dashboard
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
                <CalendarClock className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Quản lý lịch chiếu</h1>
                <p className="text-gray-400 text-sm">Thêm, sửa, xóa suất chiếu theo phim và phòng</p>
              </div>
            </div>
            <button
              type="button"
              onClick={openCreate}
              disabled={!movies.length || !rooms.length}
              title={!movies.length || !rooms.length ? "Cần có phim và phòng trong hệ thống" : ""}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black px-5 py-2.5 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Thêm suất
            </button>
          </div>

          {message ? (
            <div className="mb-4 rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-4 py-3 text-emerald-200 text-sm">{message}</div>
          ) : null}
          {error ? (
            <div className="mb-4 rounded-lg bg-red-500/15 border border-red-500/40 px-4 py-3 text-red-200 text-sm">{error}</div>
          ) : null}

          {!movies.length ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100 text-sm mb-4">
              Chưa có phim. Hãy thêm phim tại trang Quản trị phim trước.
            </div>
          ) : null}
          {!rooms.length ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100 text-sm mb-4">
              Chưa có phòng chiếu trong cơ sở dữ liệu. Chạy script SQL seed (bảng cinemas, rooms) hoặc thêm phòng qua DB.
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Đang tải...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/40 text-gray-400 uppercase text-xs tracking-wide">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Phim</th>
                      <th className="px-4 py-3 font-semibold hidden md:table-cell">Trang thai</th>
                      <th className="px-4 py-3 font-semibold hidden lg:table-cell">Phòng</th>
                      <th className="px-4 py-3 font-semibold">Bắt đầu</th>
                      <th className="px-4 py-3 font-semibold hidden md:table-cell">Kết thúc</th>
                      <th className="px-4 py-3 font-semibold">Giá vé</th>
                      <th className="px-4 py-3 font-semibold text-right w-32">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {showtimes.map((st) => (
                      <tr key={st.id} className="hover:bg-white/[0.03]">
                        <td className="px-4 py-3 font-medium max-w-[180px] truncate">{st.movie?.title || `#${st.movie?.id}`}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="inline-block rounded-lg px-2 py-0.5 text-xs bg-white/10 text-gray-300">
                            {formatMovieStatus(st.movie?.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300 hidden lg:table-cell max-w-[200px] truncate">
                          {st.room ? roomLabel(st.room) : "—"}
                        </td>
                        <td className="px-4 py-3 text-[#008bd0] whitespace-nowrap">{formatVnDateTime(st.startTime)}</td>
                        <td className="px-4 py-3 text-gray-400 hidden md:table-cell whitespace-nowrap">
                          {formatVnDateTime(st.endTime)}
                        </td>
                        <td className="px-4 py-3 text-amber-400 font-semibold">
                          {st.price != null ? Number(st.price).toLocaleString("vi-VN") : "—"} đ
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(st)}
                            className="inline-flex p-2 rounded-lg text-amber-400 hover:bg-white/10 mr-1"
                            title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(st.id)}
                            className="inline-flex p-2 rounded-lg text-red-400 hover:bg-white/10"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!showtimes.length ? (
                  <div className="p-10 text-center text-gray-500">Chưa có suất chiếu nào.</div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {modalOpen ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#1c1d1f] shadow-2xl p-6">
              <h2 className="text-xl font-bold mb-4">{editingId ? "Sửa suất chiếu" : "Thêm suất chiếu"}</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block text-xs text-gray-400 uppercase tracking-wide">Phim *</label>
                <select
                  required
                  value={form.movieId}
                  onChange={(e) => setForm((f) => ({ ...f, movieId: e.target.value }))}
                  className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                >
                  <option value="">— Chọn phim —</option>
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({formatMovieStatus(m.status)})
                    </option>
                  ))}
                </select>
                <label className="block text-xs text-gray-400 uppercase tracking-wide">Phòng *</label>
                <select
                  required
                  value={form.roomId}
                  onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
                  className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                >
                  <option value="">— Chọn phòng —</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {roomLabel(r)}
                    </option>
                  ))}
                </select>
                <label className="block text-xs text-gray-400 uppercase tracking-wide">Giờ bắt đầu *</label>
                <input
                  type="datetime-local"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                />
                <label className="block text-xs text-gray-400 uppercase tracking-wide">Giờ kết thúc (tuỳ chọn)</label>
                <input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                />
                <label className="block text-xs text-gray-400 uppercase tracking-wide">Giá vé (VNĐ) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={1000}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                />
                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold disabled:opacity-50"
                  >
                    {saving ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}

