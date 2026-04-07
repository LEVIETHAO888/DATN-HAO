import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { ChevronLeft, Film, Pencil, Plus, Trash2 } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

const emptyForm = () => ({
  title: "",
  description: "",
  duration: "",
  genre: "",
  releaseDate: "",
  posterUrl: "",
  trailerUrl: "",
  status: "coming_soon",
  language: "",
  country: "",
  ageRating: "",
  director: "",
  actors: "",
  rating: "",
});

export default function AdminMoviesPage() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("accessToken");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/movies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data === "string" ? data : data?.message || "Không tải được danh sách");
      setMovies(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Lỗi mạng");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
    setMessage("");
  }

  function formatDateInput(d) {
    if (!d) return "";
    if (typeof d === "string") return d.slice(0, 10);
    if (Array.isArray(d) && d.length >= 3) {
      const [y, mo, day] = d;
      return `${y}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    return "";
  }

  function openEdit(m) {
    setEditingId(m.id);
    setForm({
      title: m.title || "",
      description: m.description || "",
      duration: m.duration != null ? String(m.duration) : "",
      genre: m.genre || "",
      releaseDate: formatDateInput(m.releaseDate),
      posterUrl: m.posterUrl || "",
      trailerUrl: m.trailerUrl || "",
      status: m.status || "coming_soon",
      language: m.language || "",
      country: m.country || "",
      ageRating: m.ageRating || m.age || "",
      director: m.director || "",
      actors: m.actors || "",
      rating: m.rating != null ? String(m.rating) : "",
    });
    setModalOpen(true);
    setMessage("");
  }

  function buildPayload() {
    const duration = form.duration.trim() ? parseInt(form.duration, 10) : null;
    const rating = form.rating.trim() ? parseFloat(form.rating) : null;
    return {
      title: form.title.trim(),
      description: form.description.trim() || null,
      duration: Number.isFinite(duration) ? duration : null,
      genre: form.genre.trim() || null,
      releaseDate: form.releaseDate || null,
      posterUrl: form.posterUrl.trim() || null,
      trailerUrl: form.trailerUrl.trim() || null,
      status: form.status || "coming_soon",
      language: form.language.trim() || null,
      country: form.country.trim() || null,
      ageRating: form.ageRating.trim() || null,
      director: form.director.trim() || null,
      actors: form.actors.trim() || null,
      rating: Number.isFinite(rating) ? rating : null,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Vui lòng nhập tên phim.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    const body = buildPayload();
    try {
      const url = editingId ? `${API_BASE}/admin/movies/${editingId}` : `${API_BASE}/admin/movies`;
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || res.statusText);
      }
      setMessage(editingId ? "Đã cập nhật phim." : "Đã thêm phim.");
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Xóa phim "${title}"? Các suất chiếu liên quan cũng sẽ bị xóa.`)) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/movies/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || res.statusText);
      }
      setMessage("Đã xóa phim.");
      await load();
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
              <div className="p-3 rounded-xl bg-[#008bd0]/20 text-[#008bd0]">
                <Film className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Quản lý phim</h1>
                <p className="text-gray-400 text-sm">Thêm, sửa, xóa phim trong hệ thống</p>
              </div>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#008bd0] hover:bg-[#0070a8] px-5 py-2.5 font-semibold transition"
            >
              <Plus className="w-5 h-5" />
              Thêm phim
            </button>
          </div>

          {message ? (
            <div className="mb-4 rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-4 py-3 text-emerald-200 text-sm">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="mb-4 rounded-lg bg-red-500/15 border border-red-500/40 px-4 py-3 text-red-200 text-sm">{error}</div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Đang tải...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/40 text-gray-400 uppercase text-xs tracking-wide">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Tên phim</th>
                      <th className="px-4 py-3 font-semibold hidden md:table-cell">Thể loại</th>
                      <th className="px-4 py-3 font-semibold">Trạng thái</th>
                      <th className="px-4 py-3 font-semibold hidden sm:table-cell">Phút</th>
                      <th className="px-4 py-3 font-semibold text-right w-36">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {movies.map((m) => (
                      <tr key={m.id} className="hover:bg-white/[0.03]">
                        <td className="px-4 py-3 font-medium max-w-[200px] truncate">{m.title}</td>
                        <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{m.genre || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="inline-block rounded-lg px-2 py-0.5 text-xs bg-white/10 text-gray-300">
                            {m.status || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{m.duration ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(m)}
                            className="inline-flex p-2 rounded-lg text-amber-400 hover:bg-white/10 mr-1"
                            title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(m.id, m.title)}
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
                {!movies.length ? (
                  <div className="p-10 text-center text-gray-500">Chưa có phim nào.</div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {modalOpen ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#1c1d1f] shadow-2xl p-6">
              <h2 className="text-xl font-bold mb-4">{editingId ? "Sửa phim" : "Thêm phim mới"}</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block text-xs text-gray-400 uppercase tracking-wide">Tên phim *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none focus:border-[#008bd0]"
                />
                <label className="block text-xs text-gray-400 uppercase tracking-wide">Mô tả</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none focus:border-[#008bd0] resize-y"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Thời lượng (phút)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.duration}
                      onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                      className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Điểm IMDb</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={10}
                      value={form.rating}
                      onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                      className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Thể loại</label>
                    <input
                      value={form.genre}
                      onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
                      className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Ngôn ngữ</label>
                    <input
                      value={form.language}
                      onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                      className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Quoc gia</label>
                    <input
                      value={form.country}
                      onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                      className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Do tuoi</label>
                    <input
                      value={form.ageRating}
                      onChange={(e) => setForm((f) => ({ ...f, ageRating: e.target.value }))}
                      placeholder="Vi du: P, K, T13, T16, T18"
                      className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Đạo diễn</label>
                    <input
                      value={form.director}
                      onChange={(e) => setForm((f) => ({ ...f, director: e.target.value }))}
                      className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Diễn viên</label>
                    <input
                      value={form.actors}
                      onChange={(e) => setForm((f) => ({ ...f, actors: e.target.value }))}
                      placeholder="Ví dụ: Tên A, Tên B, Tên C"
                      className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Ngày khởi chiếu</label>
                  <input
                    type="date"
                    value={form.releaseDate}
                    onChange={(e) => setForm((f) => ({ ...f, releaseDate: e.target.value }))}
                    className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                  >
                    <option value="now_showing">Đang chiếu</option>
                    <option value="coming_soon">Sắp chiếu</option>
                    <option value="ended">Đã kết thúc</option>
                  </select>
                </div>
                <label className="block text-xs text-gray-400 uppercase tracking-wide">URL poster</label>
                <input
                  value={form.posterUrl}
                  onChange={(e) => setForm((f) => ({ ...f, posterUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none text-sm"
                />
                <label className="block text-xs text-gray-400 uppercase tracking-wide">URL trailer</label>
                <input
                  value={form.trailerUrl}
                  onChange={(e) => setForm((f) => ({ ...f, trailerUrl: e.target.value }))}
                  placeholder="https://youtube.com/..."
                  className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none text-sm"
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
                    className="px-5 py-2 rounded-lg bg-[#008bd0] hover:bg-[#0070a8] font-semibold disabled:opacity-50"
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

