import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Plus, Pencil, Trash2, X, Save, Loader2, ShoppingBag, CheckCircle, XCircle, ChevronLeft } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

const EMPTY_FORM = { name: "", description: "", price: "", imageUrl: "", available: true };

function normalizeComboForm(initial) {
  return {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price: initial?.price != null ? String(initial.price) : "",
    imageUrl: initial?.imageUrl ?? "",
    available: initial?.available ?? true,
  };
}

const ComboModal = ({ open, onClose, onSave, initial }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(initial ? normalizeComboForm(initial) : EMPTY_FORM);
    setError("");
  }, [initial, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Tên combo không được để trống."); return; }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) { setError("Giá phải là số hợp lệ."); return; }

    setSaving(true);
    try {
      await onSave({ ...form, price: Number(form.price) });
      onClose();
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">
            {initial ? "Chỉnh sửa Combo" : "Thêm Combo mới"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-300">Tên combo *</label>
            <input
              name="name" value={form.name} onChange={handleChange}
              placeholder="VD: Combo Đôi - Bắp + 2 Nước"
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#008bd0] transition-all text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-300">Mô tả</label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              placeholder="Mô tả nội dung combo..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#008bd0] transition-all text-sm resize-none"
            />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-300">Giá (VNĐ) *</label>
            <input
              type="number" name="price" value={form.price} onChange={handleChange}
              placeholder="VD: 89000"
              min="0"
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#008bd0] transition-all text-sm"
            />
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-300">URL hình ảnh</label>
            <input
              name="imageUrl" value={form.imageUrl} onChange={handleChange}
              placeholder="https://... hoặc /images/combo.jpg"
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#008bd0] transition-all text-sm"
            />
          </div>

          {/* Available */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="available" checked={form.available} onChange={handleChange} className="w-4 h-4 accent-cyan-500" />
            <span className="text-sm text-gray-300">Hiển thị cho khách hàng</span>
          </label>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 rounded-xl text-sm font-semibold transition-all">
              Hủy
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#008bd0] to-[#00bfff] text-white font-bold rounded-xl text-sm disabled:opacity-60 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-lg shadow-cyan-500/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AdminCombosPage() {
  const navigate = useNavigate();
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem("accessToken");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCombos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/combos`, { headers });
      const data = await res.json();
      setCombos(Array.isArray(data) ? data : []);
    } catch {
      showToast("Không thể tải danh sách combo", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCombos(); }, []);

  const handleSave = async (form) => {
    if (editing) {
      const res = await fetch(`${API_BASE}/combos/${editing.id}`, {
        method: "PUT", headers, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Cập nhật thất bại");
      showToast("Cập nhật combo thành công!");
    } else {
      const res = await fetch(`${API_BASE}/combos`, {
        method: "POST", headers, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Thêm combo thất bại");
      showToast("Thêm combo thành công!");
    }
    await fetchCombos();
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa combo này không?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/combos/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Xóa thất bại");
      showToast("Đã xóa combo thành công!");
      await fetchCombos();
    } catch {
      showToast("Xóa combo thất bại", "error");
    } finally {
      setDeletingId(null);
    }
  };

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

          {/* Toast */}
          {toast && (
            <div className={`fixed top-6 right-6 z-[60] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl font-semibold text-sm transition-all
              ${toast.type === "error" ? "bg-red-500/20 border border-red-500/40 text-red-300" : "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"}`}>
              {toast.type === "error" ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              {toast.msg}
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80 mb-2">Quản trị Admin</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
                <ShoppingBag className="text-[#008bd0] w-8 h-8" />
                Quản Lý Combo
              </h1>
              <p className="text-gray-400 mt-2 text-sm">Thêm, chỉnh sửa và xoá các combo bắp nước bán kèm</p>
            </div>
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#008bd0] to-[#00bfff] text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:-translate-y-0.5 transition-all text-sm"
            >
              <Plus className="w-5 h-5" /> Thêm Combo
            </button>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] shadow-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-500 gap-3">
                <Loader2 className="w-6 h-6 animate-spin" /> Đang tải...
              </div>
            ) : combos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <ShoppingBag className="w-14 h-14 mb-4 opacity-30" />
                <p>Chưa có combo nào. Hãy thêm combo đầu tiên!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/30 text-gray-400 uppercase text-xs tracking-wide">
                    <tr>
                      <th className="px-5 py-4">Combo</th>
                      <th className="px-5 py-4 hidden md:table-cell">Mô tả</th>
                      <th className="px-5 py-4">Giá</th>
                      <th className="px-5 py-4 hidden sm:table-cell">Trạng thái</th>
                      <th className="px-5 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {combos.map((combo) => (
                      <tr key={combo.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {combo.imageUrl ? (
                              <img src={combo.imageUrl} alt={combo.name} className="w-12 h-12 object-cover rounded-xl border border-white/10" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#008bd0]/30 to-cyan-900/30 flex items-center justify-center border border-white/10">
                                <ShoppingBag className="w-5 h-5 text-[#008bd0]" />
                              </div>
                            )}
                            <span className="font-semibold text-white">{combo.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell text-gray-400 max-w-xs truncate">
                          {combo.description || "—"}
                        </td>
                        <td className="px-5 py-4 font-bold text-amber-400">
                          {combo.price != null ? `${Number(combo.price).toLocaleString("vi-VN")}đ` : "—"}
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          {combo.available ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3" /> Hiển thị
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/20">
                              <XCircle className="w-3 h-3" /> Ẩn
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setEditing(combo); setModalOpen(true); }}
                              className="p-2 rounded-lg bg-white/5 hover:bg-[#008bd0]/20 text-gray-400 hover:text-[#00bfff] border border-white/5 hover:border-[#008bd0]/30 transition-all"
                              title="Chỉnh sửa"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(combo.id)}
                              disabled={deletingId === combo.id}
                              className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-all disabled:opacity-50"
                              title="Xóa"
                            >
                              {deletingId === combo.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-center text-gray-600 text-xs mt-6">{combos.length} combo trong hệ thống</p>
        </div>
      </div>

      <ComboModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
      />
    </Layout>
  );
}
