import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import {
  ChevronLeft,
  CreditCard,
  Minus,
  Plus,
  Popcorn,
  CupSoda,
  Ticket,
} from "lucide-react";
import useNagivateLoading from "@/hooks/useNagivateLoading";

const COMBO_1 = {
  id: "combo1",
  name: "Combo 1 — Bắp & nước",
  description: "1 bắp vừa + 1 nước ngọt size M",
  price: 89000,
  icon: Popcorn,
};

const COMBO_2 = {
  id: "combo2",
  name: "Combo 2 — Nước",
  description: "2 ly nước ngọt size M",
  price: 55000,
  icon: CupSoda,
};

export default function OrderCombo() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigateLoading = useNagivateLoading();
  const state = location.state;

  const [qty1, setQty1] = useState(0);
  const [qty2, setQty2] = useState(0);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (
      !state?.showtime?.id ||
      !Array.isArray(state.seatIds) ||
      state.seatIds.length === 0
    ) {
      const mid = state?.movieId;
      navigate(mid ? `/order-ticket?movieId=${mid}` : "/social/home", {
        replace: true,
      });
    }
  }, [state, navigate]);

  const ticketUnit =
    state?.showtime?.price != null ? Number(state.showtime.price) : 0;
  const seatCount = state?.seatIds?.length ?? 0;
  const ticketTotal = ticketUnit * seatCount;
  const comboTotal = qty1 * COMBO_1.price + qty2 * COMBO_2.price;
  const grandTotal = ticketTotal + comboTotal;

  const showtimeDate = useMemo(() => {
    if (!state?.showtime?.startTime) return null;
    return new Date(state.showtime.startTime);
  }, [state?.showtime?.startTime]);

  const bump = (setter, delta, max = 10) => {
    setter((q) => Math.min(max, Math.max(0, q + delta)));
  };

  const handlePay = async () => {
    if (!state?.showtime?.id || !state?.seatIds?.length) return;

    setIsPaying(true);
    try {
      const token = localStorage.getItem("accessToken");
      const API_BASE = (
        import.meta.env.VITE_API_URL || "http://localhost:8080/api"
      ).replace(/\/$/, "");

      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          showtimeId: Number(state.showtime.id),
          seatIds: state.seatIds,
        }),
      });

      const bookingPayload = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert("Có lỗi: " + (bookingPayload.message || "Không thể đặt vé"));
        return;
      }

      let booking = bookingPayload;
      if (bookingPayload?.data) booking = bookingPayload.data;
      const bookingId = booking?.id;
      if (bookingId == null) {
        alert(
          "Đặt vé thành công nhưng không nhận được mã đơn. Vui lòng kiểm tra mục vé của tôi."
        );
        window.location.href = "/social/home";
        return;
      }

      const payRes = await fetch(
        `${API_BASE}/payments/booking/${bookingId}?method=vnpay`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const payPayload = await payRes.json().catch(() => ({}));

      if (!payRes.ok) {
        alert(
          "Đã giữ chỗ nhưng tạo thanh toán thất bại: " +
            (payPayload.message || payRes.statusText || "Lỗi không xác định")
        );
        window.location.href = "/social/home";
        return;
      }

      const comboMsg =
        qty1 + qty2 > 0
          ? `\nCombo đã chọn sẽ nhận tại quầy khi vào rạp (demo: chưa cộng vào cổng VNPay).`
          : "";
      alert(
        "Đặt vé thành công!\nĐã tạo phiếu thanh toán VNPay (chờ xử lý)." +
          comboMsg
      );
      window.location.href = "/social/home";
    } catch (e) {
      alert("Lỗi kết nối khi đặt vé");
    } finally {
      setIsPaying(false);
    }
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

  const ComboRow = ({ combo, qty, setQty }) => {
    const Icon = combo.icon;
    return (
      <div className="rounded-2xl border border-white/10 bg-[#1c1d1f] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#008bd0]/20 text-[#008bd0]">
          <Icon className="h-7 w-7" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white">{combo.name}</h3>
          <p className="text-sm text-gray-400 mt-1">{combo.description}</p>
          <p className="text-amber-400 font-extrabold mt-2">
            {combo.price.toLocaleString("vi-VN")} đ
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            aria-label="Giảm"
            onClick={() => bump(setQty, -1)}
            disabled={qty <= 0}
            className="h-11 w-11 rounded-xl border border-white/15 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <Minus className="h-5 w-5" />
          </button>
          <span className="w-8 text-center font-bold text-xl tabular-nums">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Tăng"
            onClick={() => bump(setQty, 1)}
            disabled={qty >= 10}
            className="h-11 w-11 rounded-xl border border-white/15 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#0b0f19] text-white pt-24 pb-20 px-4 md:px-10 flex justify-center">
        <div className="max-w-[1100px] w-full flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-8">
            <button
              type="button"
              onClick={() =>
                navigateLoading(`/order-ticket?movieId=${state.movieId}`)
              }
              className="flex items-center text-gray-400 font-semibold hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5 mr-1" /> Quay lại chọn ghế
            </button>

            <div className="flex gap-4 items-center bg-[#1c1d1f] p-5 rounded-2xl border border-white/5">
              <img
                src={
                  state.moviePoster ||
                  state.posterUrl ||
                  "/default.png"
                }
                alt=""
                className="w-20 h-28 object-cover rounded-xl border border-white/10"
              />
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                  Bước 2 — Combo
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

            <div>
              <h2 className="text-xl font-bold mb-4 text-white">
                Chọn combo (tùy chọn)
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Thêm bắp nước cho buổi xem phim. Bạn có thể bỏ qua nếu không
                cần.
              </p>
              <div className="space-y-4">
                <ComboRow combo={COMBO_1} qty={qty1} setQty={setQty1} />
                <ComboRow combo={COMBO_2} qty={qty2} setQty={setQty2} />
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[380px] shrink-0">
            <div className="bg-[#1c1d1f] rounded-2xl border border-white/5 shadow-2xl flex flex-col sticky top-24">
              <div className="p-7 border-b border-white/5">
                <h2 className="text-2xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                  Tóm tắt
                </h2>
              </div>
              <div className="p-7 space-y-5 flex-1">
                <div className="border-b border-dashed border-white/10 pb-4">
                  <span className="text-gray-500 text-xs font-semibold uppercase">
                    Ghế
                  </span>
                  <p className="font-bold text-green-400 mt-1 break-words">
                    {state.seatLabels || state.seatIds.join(", ")}
                  </p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Vé × {seatCount}</span>
                  <span className="font-semibold">
                    {ticketTotal.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                {qty1 > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      {COMBO_1.name} × {qty1}
                    </span>
                    <span className="font-semibold">
                      {(qty1 * COMBO_1.price).toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                )}
                {qty2 > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      {COMBO_2.name} × {qty2}
                    </span>
                    <span className="font-semibold">
                      {(qty2 * COMBO_2.price).toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-4 border-t border-white/10">
                  <span className="text-gray-400 font-bold uppercase text-sm">
                    Tạm tính
                  </span>
                  <span className="text-3xl font-extrabold text-amber-500">
                    {grandTotal.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <div className="rounded-xl border border-[#008bd0]/40 bg-[#008bd0]/10 px-4 py-3 flex gap-3">
                  <CreditCard className="h-5 w-5 text-[#008bd0] shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Thanh toán vé qua VNPay (demo). Tiền combo hiển thị để bạn
                    theo dõi; tích hợp POS có thể bổ sung sau.
                  </p>
                </div>
              </div>
              <div className="p-6 bg-black/40 rounded-b-2xl border-t border-white/5">
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={isPaying}
                  className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-extrabold text-lg uppercase transition-all duration-300
                    ${
                      isPaying
                        ? "bg-[#2a2b2e] text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-[0_10px_25px_rgba(245,158,11,0.4)] hover:scale-[1.02]"
                    }
                  `}
                >
                  {isPaying ? (
                    "Đang xử lý..."
                  ) : (
                    <>
                      <Ticket className="w-6 h-6" />
                      Thanh toán VNPay
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
