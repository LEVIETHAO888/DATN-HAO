import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import {
  ChevronLeft,
  CreditCard,
  Minus,
  Plus,
  Popcorn,
  Ticket,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import useNagivateLoading from "@/hooks/useNagivateLoading";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

export default function OrderCombo() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigateLoading = useNagivateLoading();
  const state = location.state;

  // ── Combo data từ API ──
  const [combos, setCombos] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(true);
  // qty map: { [comboId]: number }
  const [qtyMap, setQtyMap] = useState({});
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (
      !state?.showtime?.id ||
      !Array.isArray(state.seatIds) ||
      state.seatIds.length === 0
    ) {
      const mid = state?.movieId;
      navigate(mid ? `/order-ticket?movieId=${mid}` : "/", { replace: true });
    }
  }, [state, navigate]);

  // Fetch combos từ backend
  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/combos`, { headers });
        if (!res.ok) {
          console.warn("Không tải được combo, status:", res.status);
          setLoadingCombos(false);
          return;
        }
        const text = await res.text();
        if (!text) { setLoadingCombos(false); return; }
        const data = JSON.parse(text);
        const list = Array.isArray(data) ? data.filter(c => c.available) : [];
        setCombos(list);
        const init = {};
        list.forEach(c => { init[c.id] = 0; });
        setQtyMap(init);
      } catch (e) {
        console.error("Lỗi tải combo:", e);
      } finally {
        setLoadingCombos(false);
      }
    };
    fetchCombos();
  }, []);

  const ticketUnit = state?.showtime?.price != null ? Number(state.showtime.price) : 0;
  const seatCount = state?.seatIds?.length ?? 0;
  const ticketTotal = ticketUnit * seatCount;

  const comboTotal = useMemo(() =>
    combos.reduce((sum, c) => sum + (qtyMap[c.id] || 0) * Number(c.price), 0),
    [combos, qtyMap]
  );

  const grandTotal = ticketTotal + comboTotal;

  const showtimeDate = useMemo(() => {
    if (!state?.showtime?.startTime) return null;
    return new Date(state.showtime.startTime);
  }, [state?.showtime?.startTime]);

  const bump = (comboId, delta) => {
    setQtyMap(prev => ({
      ...prev,
      [comboId]: Math.min(10, Math.max(0, (prev[comboId] || 0) + delta)),
    }));
  };

  const handlePay = () => {
    if (!state?.showtime?.id || !state?.seatIds?.length) return;
    
    // Lấy danh sách combo đã chọn
    const selectedCombos = combos
      .filter(c => (qtyMap[c.id] || 0) > 0)
      .map(c => ({
        id: c.id,
        name: c.name,
        price: c.price,
        qty: qtyMap[c.id]
      }));

    // Chuyển hướng sang trang thanh toán PaymentPage kèm state
    navigateLoading("/payment", {
      state: {
        ...state,
        combos: selectedCombos,
        ticketTotal,
        comboTotal,
        grandTotal
      }
    });
  };

  if (!state?.showtime?.id || !state?.seatIds?.length) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0b0f19] flex justify-center items-center text-white">
          Đang chuyển hướng...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#0b0f19] text-white pt-24 pb-20 px-4 md:px-10 flex justify-center">
        <div className="max-w-[1100px] w-full flex flex-col lg:flex-row gap-8">

          {/* ── Left Panel ── */}
          <div className="flex-1 space-y-8">
            <button
              type="button"
              onClick={() => navigateLoading(`/order-ticket?movieId=${state.movieId}`)}
              className="flex items-center text-gray-400 font-semibold hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5 mr-1" /> Quay lại chọn ghế
            </button>

            {/* Movie info header */}
            <div className="flex gap-4 items-center bg-[#1c1d1f] p-5 rounded-2xl border border-white/5">
              <img
                src={state.moviePoster || state.posterUrl || "/default.png"}
                alt=""
                className="w-20 h-28 object-cover rounded-xl border border-white/10"
              />
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                  Bước 2 — Chọn Combo
                </p>
                <h1 className="text-2xl font-extrabold text-white mt-1">
                  {state.movieTitle || "Suất chiếu"}
                </h1>
                {showtimeDate && (
                  <p className="text-[#008bd0] font-semibold mt-2">
                    {showtimeDate.toLocaleString("vi-VN", {
                      weekday: "long",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Combo list */}
            <div>
              <h2 className="text-xl font-bold mb-2 text-white">Combo bắp nước (tùy chọn)</h2>
              <p className="text-gray-400 text-sm mb-6">Thêm bắp nước cho buổi xem phim. Bạn có thể bỏ qua nếu không cần.</p>

              {loadingCombos ? (
                <div className="flex items-center justify-center py-14 text-gray-500 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Đang tải danh sách combo...</span>
                </div>
              ) : combos.length === 0 ? (
                <div className="flex flex-col items-center py-14 text-gray-500">
                  <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
                  <p>Hiện chưa có combo nào.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {combos.map(combo => (
                    <div key={combo.id} className="rounded-2xl border border-white/10 bg-[#1c1d1f] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Icon / Image */}
                      {combo.imageUrl ? (
                        <img src={combo.imageUrl} alt={combo.name} className="w-16 h-16 object-cover rounded-xl border border-white/10 shrink-0" />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#008bd0]/20 text-[#008bd0]">
                          <Popcorn className="h-7 w-7" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white">{combo.name}</h3>
                        {combo.description && (
                          <p className="text-sm text-gray-400 mt-1">{combo.description}</p>
                        )}
                        <p className="text-amber-400 font-extrabold mt-2">
                          {Number(combo.price).toLocaleString("vi-VN")}đ
                        </p>
                      </div>

                      {/* Qty control */}
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => bump(combo.id, -1)}
                          disabled={(qtyMap[combo.id] || 0) <= 0}
                          className="h-11 w-11 rounded-xl border border-white/15 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                        <span className="w-8 text-center font-bold text-xl tabular-nums">
                          {qtyMap[combo.id] || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => bump(combo.id, 1)}
                          disabled={(qtyMap[combo.id] || 0) >= 10}
                          className="h-11 w-11 rounded-xl border border-white/15 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Panel: Summary ── */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="bg-[#1c1d1f] rounded-2xl border border-white/5 shadow-2xl flex flex-col sticky top-24">
              <div className="p-7 border-b border-white/5">
                <h2 className="text-2xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                  Tóm tắt
                </h2>
              </div>
              <div className="p-7 space-y-4 flex-1">
                {/* Seats */}
                <div className="border-b border-dashed border-white/10 pb-4">
                  <span className="text-gray-500 text-xs font-semibold uppercase">Ghế đã chọn</span>
                  <p className="font-bold text-green-400 mt-1 break-words">
                    {state.seatLabels || state.seatIds.join(", ")}
                  </p>
                </div>

                {/* Ticket row */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Vé × {seatCount}</span>
                  <span className="font-semibold">{ticketTotal.toLocaleString("vi-VN")}đ</span>
                </div>

                {/* Combo rows */}
                {combos.filter(c => (qtyMap[c.id] || 0) > 0).map(c => (
                  <div key={c.id} className="flex justify-between text-sm">
                    <span className="text-gray-400">{c.name} × {qtyMap[c.id]}</span>
                    <span className="font-semibold">{(qtyMap[c.id] * Number(c.price)).toLocaleString("vi-VN")}đ</span>
                  </div>
                ))}

                {/* Grand total */}
                <div className="flex justify-between items-end pt-4 border-t border-white/10">
                  <span className="text-gray-400 font-bold uppercase text-sm">Tạm tính</span>
                  <span className="text-3xl font-extrabold text-amber-500">
                    {grandTotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                <div className="rounded-xl border border-[#008bd0]/40 bg-[#008bd0]/10 px-4 py-3 flex gap-3">
                  <CreditCard className="h-5 w-5 text-[#008bd0] shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Thanh toán vé qua VNPay (demo). Combo sẽ được nhận tại quầy khi vào rạp.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-black/40 rounded-b-2xl border-t border-white/5">
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={isPaying}
                  className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-extrabold text-lg uppercase transition-all duration-300
                    ${isPaying
                      ? "bg-[#2a2b2e] text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-[0_10px_25px_rgba(245,158,11,0.4)] hover:scale-[1.02]"
                    }`}
                >
                  {isPaying ? "Đang chuyển trang..." : (
                    <>
                      <Ticket className="w-6 h-6" />
                      Tiếp tục thanh toán
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
