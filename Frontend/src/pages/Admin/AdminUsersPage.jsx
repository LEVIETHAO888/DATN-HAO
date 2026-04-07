import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { fetchWithAuth } from "@/parts/FetchApiWithAuth";
import { getRoleLabel, normalizeRoleId } from "@/utils/jwt";
import UserInfoModal from "@/components/Admin/UserManagement/UserInfoModal";
import { ChevronLeft, Eye, Plus, Shield, Users } from "lucide-react";

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openInfoModal, setOpenInfoModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/users`, {
          method: "GET",
        });
        const response = await res.json();

        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.listResults)
              ? response.listResults
              : [];

        if (!res.ok) {
          throw new Error(response?.message || "Khong tai duoc danh sach nguoi dung");
        }

        setUsers(list);
      } catch (err) {
        setError(err.message || "Khong the tai danh sach nguoi dung");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const stats = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        const roleId = normalizeRoleId(user?.roleId);
        if (roleId === 1) acc.admin += 1;
        else if (roleId === 2) acc.manager += 1;
        else if (roleId === 3) acc.user += 1;
        return acc;
      },
      { admin: 0, manager: 0, user: 0 }
    );
  }, [users]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#0b0f19] text-white pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center text-gray-400 hover:text-white mb-6 transition"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Ve dashboard
          </button>

          <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(0,139,208,0.22),_transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 md:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Admin Users</p>
                <h1 className="mt-3 text-3xl md:text-5xl font-black tracking-tight">Quan ly nguoi dung va phan quyen</h1>
                <p className="mt-3 max-w-3xl text-gray-300">
                  Theo doi tai khoan, xem thong tin chi tiet va tao moi nguoi dung theo role trong he thong.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/admin/users/create")}
                className="inline-flex items-center gap-2 rounded-xl bg-[#008bd0] hover:bg-[#0070a8] px-5 py-3 font-semibold transition"
              >
                <Plus className="w-5 h-5" />
                Tao nguoi dung
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</div>
          ) : null}

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Tong tai khoan</p>
                  <p className="mt-3 text-3xl font-black text-white">{users.length}</p>
                </div>
                <Users className="w-8 h-8 text-cyan-300" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Manager</p>
                  <p className="mt-3 text-3xl font-black text-white">{stats.manager}</p>
                </div>
                <Shield className="w-8 h-8 text-emerald-300" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Admin</p>
                  <p className="mt-3 text-3xl font-black text-white">{stats.admin}</p>
                </div>
                <Shield className="w-8 h-8 text-amber-300" />
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-[#1c1d1f] shadow-xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Dang tai danh sach nguoi dung...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/40 text-gray-400 uppercase text-xs tracking-wide">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Ten dang nhap</th>
                      <th className="px-4 py-3 font-semibold">Ho ten</th>
                      <th className="px-4 py-3 font-semibold hidden md:table-cell">Email</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold text-right w-24">Xem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((user) => (
                      <tr key={user.id || user.userId} className="hover:bg-white/[0.03]">
                        <td className="px-4 py-3 font-medium">{user.username || "—"}</td>
                        <td className="px-4 py-3 text-gray-300">
                          {[user.firstName, user.lastName].filter(Boolean).join(" ") || "Dang cap nhat"}
                        </td>
                        <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{user.emailAddress || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="inline-block rounded-lg bg-white/10 px-2 py-1 text-xs text-gray-300">
                            {getRoleLabel(user.roleId)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserId(user.id || user.userId);
                              setOpenInfoModal(true);
                            }}
                            className="inline-flex p-2 rounded-lg text-cyan-300 hover:bg-white/10"
                            title="Xem chi tiet"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!users.length ? <div className="p-10 text-center text-gray-500">Chua co nguoi dung nao.</div> : null}
              </div>
            )}
          </div>
        </div>

        <UserInfoModal
          openInfoModal={openInfoModal}
          setOpenInfoModal={setOpenInfoModal}
          userId={selectedUserId}
        />
      </div>
    </Layout>
  );
}
