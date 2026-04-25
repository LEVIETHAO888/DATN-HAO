import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Building2, ChevronLeft, DoorOpen, Pencil, Plus, Trash2 } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

async function parseResponseBody(response) {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

const emptyForm = () => ({
  name: "",
  location: "",
});

const emptyRoomForm = () => ({
  cinemaId: "",
  name: "",
  totalSeats: "",
});

export default function AdminCinemasPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");
  const [cinemas, setCinemas] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingRoom, setSavingRoom] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [roomMessage, setRoomMessage] = useState("");
  const [roomError, setRoomError] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [roomForm, setRoomForm] = useState(emptyRoomForm());
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [cinemaRes, roomRes] = await Promise.all([
        fetch(`${API_BASE}/cinemas`, { headers }),
        fetch(`${API_BASE}/rooms`, { headers }),
      ]);
      const [cinemaBody, roomBody] = await Promise.all([parseResponseBody(cinemaRes), parseResponseBody(roomRes)]);
      if (!cinemaRes.ok) {
        throw new Error(
          typeof cinemaBody === "string" ? cinemaBody : cinemaBody?.message || "Không tải được danh sách rạp"
        );
      }
      if (!roomRes.ok) {
        throw new Error(typeof roomBody === "string" ? roomBody : roomBody?.message || "Không tải được danh sách phòng");
      }
      setCinemas(Array.isArray(cinemaBody) ? cinemaBody : []);
      setRooms(Array.isArray(roomBody) ? roomBody : []);
      if (Array.isArray(cinemaBody) && cinemaBody.length && !roomForm.cinemaId) {
        setRoomForm((prev) => ({ ...prev, cinemaId: String(cinemaBody[0].id) }));
      }
    } catch (e) {
      setError(e.message || "Lỗi mạng");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(cinema) {
    setEditingId(cinema.id);
    setForm({
      name: cinema.name || "",
      location: cinema.location || "",
    });
    setError("");
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Vui lòng nhập tên rạp.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    setRoomError("");
    try {
      const res = await fetch(
        editingId ? `${API_BASE}/admin/cinemas/${editingId}` : `${API_BASE}/admin/cinemas`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            location: form.location.trim() || null,
          }),
        }
      );
      const body = await parseResponseBody(res);
      if (!res.ok) {
        throw new Error(typeof body === "string" ? body : body?.message || "Không thể lưu rạp");
      }
      setMessage(editingId ? "Đã cập nhật rạp chiếu phim." : "Đã thêm rạp chiếu phim.");
      setForm(emptyForm());
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e.message || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cinema) {
    if (!window.confirm(`Xóa rạp "${cinema.name}"?`)) return;
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/admin/cinemas/${cinema.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const body = await parseResponseBody(res);
      if (!res.ok) {
        throw new Error(typeof body === "string" ? body : body?.message || "Không thể xóa rạp");
      }
      if (editingId === cinema.id) {
        cancelEdit();
      }
      setMessage("Đã xóa rạp chiếu phim.");
      await load();
    } catch (e) {
      setError(e.message || "Thao tác thất bại");
    }
  }

  async function handleCreateRoom(e) {
    e.preventDefault();
    const cinemaId = parseInt(roomForm.cinemaId, 10);
    const totalSeats = parseInt(roomForm.totalSeats, 10);
    if (!Number.isFinite(cinemaId)) {
      setRoomError("Vui lòng chọn rạp.");
      return;
    }
    if (!roomForm.name.trim()) {
      setRoomError("Vui lòng nhập tên phòng.");
      return;
    }
    if (!Number.isFinite(totalSeats) || totalSeats <= 0) {
      setRoomError("Số ghế phải lớn hơn 0.");
      return;
    }
    setSavingRoom(true);
    setRoomError("");
    setRoomMessage("");
    try {
      const res = await fetch(`${API_BASE}/admin/rooms`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cinemaId,
          name: roomForm.name.trim(),
          totalSeats,
        }),
      });
      const body = await parseResponseBody(res);
      if (!res.ok) {
        throw new Error(typeof body === "string" ? body : body?.message || "Không thể tạo phòng");
      }
      setRoomMessage("Đã tạo phòng chiếu.");
      setRoomForm((prev) => ({ ...prev, name: "", totalSeats: "" }));
      await load();
    } catch (e) {
      setRoomError(e.message || "Thao tác thất bại");
    } finally {
      setSavingRoom(false);
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

          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-300">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Thêm rạp chiếu phim</h1>
              <p className="text-gray-400 text-sm">Tạo mới rạp để dùng cho phòng chiếu và lịch chiếu</p>
            </div>
          </div>

          {message ? (
            <div className="mb-4 rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-4 py-3 text-emerald-200 text-sm">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="mb-4 rounded-lg bg-red-500/15 border border-red-500/40 px-4 py-3 text-red-200 text-sm">{error}</div>
          ) : null}

          <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
            <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] p-6 shadow-xl">
              <h2 className="text-lg font-bold mb-4">{editingId ? "Chỉnh sửa rạp" : "Thông tin rạp mới"}</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block text-xs text-gray-400 uppercase tracking-wide">Tên rạp *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ví dụ: CineX Landmark 81"
                  className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                />
                <label className="block text-xs text-gray-400 uppercase tracking-wide">Địa chỉ</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Ví dụ: 208 Nguyen Huu Canh, Binh Thanh, TP.HCM"
                  className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                />

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black px-5 py-2.5 font-semibold transition disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                  {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm rạp"}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="mt-2 ml-2 inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-2.5 font-semibold hover:bg-white/10 transition"
                  >
                    Hủy chỉnh sửa
                  </button>
                ) : null}
              </form>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] overflow-hidden shadow-xl">
              <div className="px-5 py-4 border-b border-white/10">
                <h2 className="text-lg font-bold">Danh sách rạp hiện có</h2>
              </div>
              {loading ? (
                <div className="p-10 text-center text-gray-400">Đang tải...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-black/40 text-gray-400 uppercase text-xs tracking-wide">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Tên rạp</th>
                        <th className="px-5 py-3 font-semibold">Địa chỉ</th>
                        <th className="px-5 py-3 font-semibold text-right w-32">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {cinemas.map((cinema) => (
                        <tr key={cinema.id} className="hover:bg-white/[0.03]">
                          <td className="px-5 py-3 font-medium">{cinema.name || "—"}</td>
                          <td className="px-5 py-3 text-gray-400">{cinema.location || "Đang cập nhật"}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => openEdit(cinema)}
                              className="inline-flex p-2 rounded-lg text-amber-400 hover:bg-white/10 mr-1"
                              title="Sửa"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(cinema)}
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
                  {!cinemas.length ? <div className="p-10 text-center text-gray-500">Chưa có rạp nào.</div> : null}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
            <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <DoorOpen className="w-5 h-5 text-cyan-300" />
                <h2 className="text-lg font-bold">Tạo phòng chiếu</h2>
              </div>
              {roomMessage ? (
                <div className="mb-4 rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-4 py-3 text-emerald-200 text-sm">
                  {roomMessage}
                </div>
              ) : null}
              {roomError ? (
                <div className="mb-4 rounded-lg bg-red-500/15 border border-red-500/40 px-4 py-3 text-red-200 text-sm">{roomError}</div>
              ) : null}

              <form onSubmit={handleCreateRoom} className="space-y-3">
                <label className="block text-xs text-gray-400 uppercase tracking-wide">Rạp *</label>
                <select
                  required
                  value={roomForm.cinemaId}
                  onChange={(e) => setRoomForm((f) => ({ ...f, cinemaId: e.target.value }))}
                  className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                >
                  <option value="">— Chọn rạp —</option>
                  {cinemas.map((cinema) => (
                    <option key={cinema.id} value={cinema.id}>
                      {cinema.name}
                    </option>
                  ))}
                </select>

                <label className="block text-xs text-gray-400 uppercase tracking-wide">Tên phòng *</label>
                <input
                  required
                  value={roomForm.name}
                  onChange={(e) => setRoomForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ví dụ: Phòng 1"
                  className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                />

                <label className="block text-xs text-gray-400 uppercase tracking-wide">Tổng số ghế *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={roomForm.totalSeats}
                  onChange={(e) => setRoomForm((f) => ({ ...f, totalSeats: e.target.value }))}
                  placeholder="Ví dụ: 120"
                  className="w-full rounded-lg bg-[#3a3b3c] border border-white/10 px-3 py-2 outline-none"
                />

                <button
                  type="submit"
                  disabled={savingRoom || !cinemas.length}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black px-5 py-2.5 font-semibold transition disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                  {savingRoom ? "Đang lưu..." : "Tạo phòng"}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] overflow-hidden shadow-xl">
              <div className="px-5 py-4 border-b border-white/10">
                <h2 className="text-lg font-bold">Danh sách phòng chiếu</h2>
              </div>
              {loading ? (
                <div className="p-10 text-center text-gray-400">Đang tải...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-black/40 text-gray-400 uppercase text-xs tracking-wide">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Rạp</th>
                        <th className="px-5 py-3 font-semibold">Phòng</th>
                        <th className="px-5 py-3 font-semibold">Số ghế</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {rooms.map((room) => (
                        <tr key={room.id} className="hover:bg-white/[0.03]">
                          <td className="px-5 py-3 text-gray-300">{room.cinema?.name || "—"}</td>
                          <td className="px-5 py-3 font-medium">{room.name || "—"}</td>
                          <td className="px-5 py-3 text-gray-400">{room.totalSeats ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!rooms.length ? <div className="p-10 text-center text-gray-500">Chưa có phòng chiếu nào.</div> : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
