import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Building2, ChevronLeft, MapPin } from "lucide-react";
import { toLocalYmd } from "@/utils/showDate";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

export default function SelectCinemaPage() {
  const navigate = useNavigate();
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API_BASE}/cinemas`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(typeof data === "string" ? data : data?.message || "Không tải được danh sách rạp");
        }
        setCinemas(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || "Lỗi kết nối");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  function chooseCinema(c) {
    const sd = toLocalYmd(new Date());
    navigate(`/social/home?cinemaId=${c.id}&showDate=${encodeURIComponent(sd)}`);
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#0b0f19] text-white pt-24 pb-20 px-4 md:px-10">
        <div className="max-w-5xl mx-auto">
          <button
            type="button"
            onClick={() => navigate("/social/home")}
            className="flex items-center text-gray-400 hover:text-white mb-8 transition"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Về trang chủ
          </button>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-[#008bd0]/15 text-[#008bd0] mb-4">
              <Building2 className="w-12 h-12" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Chọn rạp chiếu phim</h1>
            <p className="text-gray-400 mt-2 max-w-xl mx-auto">
              Chọn rạp để xem phim và suất chiếu tại đúng địa điểm bạn muốn.
            </p>
          </div>

          {error ? (
            <div className="rounded-xl bg-red-500/15 border border-red-500/40 px-4 py-3 text-red-200 text-center mb-6">{error}</div>
          ) : null}

          {loading ? (
            <div className="text-center text-gray-400 py-20">Đang tải danh sách rạp...</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
              {cinemas.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => chooseCinema(c)}
                  className="text-left rounded-2xl border border-white/10 bg-[#1c1d1f] p-6 hover:border-[#008bd0]/50 hover:bg-[#252628] transition-all duration-200 shadow-lg hover:shadow-[#008bd0]/10 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#008bd0]/20 text-[#008bd0] group-hover:bg-[#008bd0]/30 transition-colors">
                      <MapPin className="w-7 h-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-bold text-white group-hover:text-[#008bd0] transition-colors">{c.name}</h2>
                      <p className="text-gray-400 text-sm mt-2 flex items-start gap-2">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5 opacity-60" />
                        <span>{c.location || "Đang cập nhật địa chỉ"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-sm font-semibold text-[#008bd0] opacity-90 group-hover:opacity-100">
                    Xem phim tại rạp này →
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && !cinemas.length && !error ? (
            <div className="text-center rounded-2xl border border-white/10 bg-[#1c1d1f] py-16 text-gray-500">
              Chưa có rạp trong hệ thống. Vui lòng liên hệ quản trị viên.
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
