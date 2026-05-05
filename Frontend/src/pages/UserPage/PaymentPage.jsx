import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import {
  ChevronLeft,
  Ticket,
  CreditCard,
  Popcorn,
  Building2,
  Calendar as CalIcon,
  Receipt,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Zap,
  Clock,
  Tag,
  X,
} from "lucide-react";
import useNagivateLoading from "@/hooks/useNagivateLoading";

// ──────────────────────────────────────────────────────────────────
// VNPAY LOGO (dùng ảnh chính thức)
// ──────────────────────────────────────────────────────────────────
function VNPayLogo({ size = 80 }) {
  const [imgError, setImgError] = React.useState(false);

  if (imgError) {
    // Fallback styled text nếu ảnh lỗi
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 2,
          background: "#005BAA",
          borderRadius: 6,
          padding: "4px 12px",
          height: size * 0.4,
        }}
      >
        <span style={{ color: "#FFCC00", fontWeight: 900, fontSize: size * 0.22, fontFamily: "Arial, sans-serif" }}>
          VN
        </span>
        <span style={{ color: "#fff", fontWeight: 900, fontSize: size * 0.22, fontFamily: "Arial, sans-serif" }}>
          PAY
        </span>
      </div>
    );
  }

  return (
    <img
      src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png"
      alt="VNPay"
      onError={() => setImgError(true)}
      style={{ height: size * 0.4, width: "auto", objectFit: "contain" }}
    />
  );
}

// ──────────────────────────────────────────────────────────────────
// PAYMENT STEP INDICATOR
// ──────────────────────────────────────────────────────────────────
function StepIndicator({ current = 3 }) {
  const steps = ["Chọn ghế", "Chọn combo", "Thanh toán"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "bg-[#008bd0] text-white ring-4 ring-[#008bd0]/30"
                    : "bg-white/10 text-gray-500"
                }`}
              >
                {done ? <CheckCircle2 className="w-5 h-5" /> : idx}
              </div>
              <span
                className={`text-xs font-semibold whitespace-nowrap ${
                  active ? "text-[#008bd0]" : done ? "text-emerald-400" : "text-gray-600"
                }`}
              >
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all ${
                  done ? "bg-emerald-500" : "bg-white/10"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────
export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigateLoading = useNagivateLoading();
  const state = location.state;

  const [isPaying, setIsPaying] = useState(false);
  const [payStep, setPayStep] = useState("idle"); // idle | booking | payment | redirecting

  // ── Promotion code state ─────────────────────────────────────────
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null); // { title, discountPercentage, code }
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  // Guard: Kiểm tra state hợp lệ
  if (
    !state ||
    !state.showtime ||
    !Array.isArray(state.seatIds) ||
    state.seatIds.length === 0
  ) {
    navigate("/order-ticket", { replace: true });
    return null;
  }

  const {
    movieTitle,
    moviePoster,
    cinemaName,
    showtime,
    seatIds,
    seatLabels,
    combos = [],
    ticketTotal = 0,
    comboTotal = 0,
    grandTotal: originalGrandTotal = 0,
  } = state;

  // Tính tổng tiền sau giảm giá
  const discountAmount = appliedPromo
    ? Math.round((originalGrandTotal * appliedPromo.discountPercentage) / 100)
    : 0;
  const grandTotal = Math.max(0, originalGrandTotal - discountAmount);

  // ── Xử lý áp dụng mã khuyến mãi ────────────────────────────────
  const handleApplyCode = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoLoading(true);
    setPromoError("");
    setAppliedPromo(null);
    try {
      const API_BASE = (
        import.meta.env.VITE_API_URL || "http://localhost:8080/api"
      ).replace(/\/$/, "");
      const res = await fetch(`${API_BASE}/promotions/validate?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const promo = await res.json();
        setAppliedPromo(promo);
        setPromoError("");
      } else {
        setPromoError("Mã không hợp lệ hoặc đã hết hạn.");
      }
    } catch {
      setPromoError("Không thể kết nối server.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  };

  const showtimeDate = showtime?.startTime ? new Date(showtime.startTime) : null;
  const seatCount = seatIds.length;

  // ──────────────────────────────────────────────────────────────────
  // HANDLE PAY: Tạo booking → payment → lấy VNPay URL → redirect
  // ──────────────────────────────────────────────────────────────────
  const handlePay = async () => {
    setIsPaying(true);
    setPayStep("booking");

    try {
      const token = localStorage.getItem("accessToken");
      const API_BASE = (
        import.meta.env.VITE_API_URL || "http://localhost:8080/api"
      ).replace(/\/$/, "");

      // ── STEP 1: Tạo Booking ──────────────────────────────────────
      const bookingRes = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          showtimeId: Number(showtime.id),
          seatIds: seatIds,
          combos: combos.map(c => ({
            comboId: Number(c.id),
            quantity: Number(c.qty)
          })),
          promotionCode: appliedPromo ? appliedPromo.code : null,
        }),
      });

      const bookingPayload = await bookingRes.json().catch(() => ({}));
      if (!bookingRes.ok) {
        alert("Lỗi tạo vé: " + (bookingPayload.message || "Không thể khởi tạo đặt chỗ"));
        return;
      }

      let booking = bookingPayload?.data ?? bookingPayload;
      const bookingId = booking?.id;

      if (!bookingId) {
        alert("Không lấy được mã đặt chỗ. Vui lòng thử lại!");
        return;
      }

      // ── STEP 2: Tạo Payment record ──────────────────────────────
      setPayStep("payment");
      const paymentRes = await fetch(
        `${API_BASE}/payments/booking/${bookingId}?method=vnpay`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const paymentPayload = await paymentRes.json().catch(() => ({}));
      if (!paymentRes.ok) {
        alert("Lỗi tạo phiên thanh toán: " + (paymentPayload.message || "Lỗi không xác định"));
        return;
      }

      const paymentId =
        paymentPayload?.data?.id ?? paymentPayload?.id;

      if (!paymentId) {
        alert("Không lấy được mã thanh toán. Vui lòng thử lại!");
        return;
      }

      // ── STEP 3: Lấy VNPay URL ────────────────────────────────────
      setPayStep("redirecting");
      const vnpayRes = await fetch(
        `${API_BASE}/vnpay/create-url?amount=${grandTotal}&paymentId=${paymentId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!vnpayRes.ok) {
        alert("Không thể kết nối VNPay. Vui lòng thử lại!");
        return;
      }

      const vnpayUrl = await vnpayRes.text();

      if (!vnpayUrl || !vnpayUrl.startsWith("http")) {
        alert("URL VNPay không hợp lệ. Vui lòng liên hệ hỗ trợ!");
        return;
      }

      // ── STEP 4: Redirect tới VNPay ────────────────────────────────
      window.location.href = vnpayUrl;
    } catch (err) {
      console.error("VNPay payment error:", err);
      alert("Lỗi kết nối! Vui lòng kiểm tra mạng và thử lại.");
    } finally {
      setIsPaying(false);
      setPayStep("idle");
    }
  };

  // ──────────────────────────────────────────────────────────────────
  // STEP LABEL helper
  // ──────────────────────────────────────────────────────────────────
  const getStepLabel = () => {
    switch (payStep) {
      case "booking":     return "Đang tạo đặt chỗ...";
      case "payment":     return "Đang khởi tạo thanh toán...";
      case "redirecting": return "Đang kết nối VNPay...";
      default:            return `Thanh toán ${grandTotal.toLocaleString("vi-VN")} đ qua VNPay`;
    }
  };

  // ──────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="min-h-screen bg-[#080c14] text-white pt-24 pb-20 px-4 md:px-10 flex justify-center">
        <div className="max-w-[1200px] w-full">

          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-400 font-semibold hover:text-white transition mb-6 group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Quay lại
          </button>

          {/* Step indicator */}
          <StepIndicator current={3} />

          <div className="flex flex-col lg:flex-row gap-8">

            {/* ═══════════════════════════════════════
                CỘT TRÁI: Chi tiết đơn hàng
            ═══════════════════════════════════════ */}
            <div className="flex-1 space-y-5">

              {/* Movie info card */}
              <div className="relative bg-gradient-to-br from-[#131827] to-[#0d1120] rounded-2xl border border-white/8 shadow-2xl overflow-hidden">
                {/* Glow accent */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#008bd0]/60 to-transparent" />

                <div className="p-6">
                  <h2 className="text-base font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#008bd0]" /> Thông tin đặt vé
                  </h2>

                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="relative shrink-0">
                      <img
                        src={moviePoster || "/default.png"}
                        className="w-24 h-36 object-cover rounded-xl shadow-lg border border-white/10"
                        alt={movieTitle}
                      />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#008bd0] rounded-full flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Phim</div>
                        <h3 className="text-2xl font-extrabold text-white leading-tight">{movieTitle || "—"}</h3>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 bg-white/4 rounded-xl px-4 py-3">
                          <Building2 className="w-4 h-4 text-[#008bd0] shrink-0" />
                          <div>
                            <div className="text-xs text-gray-500">Rạp chiếu</div>
                            <div className="font-semibold text-sm text-white">{cinemaName || "CineX"}</div>
                            {state.roomName && (
                              <div className="text-xs text-emerald-400">{state.roomName}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 bg-white/4 rounded-xl px-4 py-3">
                          <CalIcon className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <div className="text-xs text-gray-500">Suất chiếu</div>
                            <div className="font-semibold text-sm text-white">
                              {showtimeDate
                                ? showtimeDate.toLocaleString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })
                                : "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items breakdown */}
              <div className="bg-gradient-to-br from-[#131827] to-[#0d1120] rounded-2xl border border-white/8 shadow-2xl p-6">
                <h2 className="text-base font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-emerald-400" /> Hạng mục đặt chỗ
                </h2>

                <div className="space-y-3">
                  {/* Vé */}
                  <div className="flex items-center gap-4 bg-white/[0.03] hover:bg-white/[0.06] transition rounded-xl px-4 py-3.5 border border-white/5">
                    <div className="w-11 h-11 rounded-xl bg-[#008bd0]/10 flex items-center justify-center shrink-0">
                      <Ticket className="w-5 h-5 text-[#008bd0]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white">{seatCount} vé xem phim</div>
                      <div className="text-xs text-emerald-400 mt-0.5 truncate">
                        Ghế: {seatLabels || seatIds.join(", ")}
                      </div>
                    </div>
                    <div className="font-bold text-white shrink-0">
                      {ticketTotal.toLocaleString("vi-VN")} <span className="text-gray-400 text-sm">đ</span>
                    </div>
                  </div>

                  {/* Combos */}
                  {combos.map((cb, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 bg-white/[0.03] hover:bg-white/[0.06] transition rounded-xl px-4 py-3.5 border border-white/5"
                    >
                      <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Popcorn className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white">{cb.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Số lượng: {cb.qty}</div>
                      </div>
                      <div className="font-bold text-white shrink-0">
                        {(cb.price * cb.qty).toLocaleString("vi-VN")}{" "}
                        <span className="text-gray-400 text-sm">đ</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security notice */}
              <div className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-5 py-4">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-400/80 leading-relaxed">
                  Giao dịch của bạn được mã hóa bằng SSL 256-bit và bảo vệ bởi cổng thanh toán VNPay.
                  Vé sẽ được xác nhận ngay sau khi thanh toán thành công và <strong>không thể hoàn/hủy</strong>.
                </p>
              </div>
            </div>

            {/* ═══════════════════════════════════════
                CỘT PHẢI: Hóa đơn & Nút thanh toán
            ═══════════════════════════════════════ */}
            <div className="w-full lg:w-[400px] shrink-0">
              <div className="sticky top-24 bg-gradient-to-b from-[#131827] to-[#0d1120] rounded-2xl border border-white/8 shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="relative px-7 py-6 border-b border-white/8 text-center">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-1">Hóa đơn</div>
                  <div className="text-lg font-extrabold text-white">{movieTitle}</div>
                </div>

                {/* Line items */}
                <div className="px-7 py-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tiền vé ({seatCount} ghế)</span>
                    <span className="font-semibold text-white">{ticketTotal.toLocaleString("vi-VN")} đ</span>
                  </div>
                  {comboTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Đồ ăn & Nước ({combos.length} món)</span>
                      <span className="font-semibold text-white">{comboTotal.toLocaleString("vi-VN")} đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Phí dịch vụ</span>
                    <span className="text-emerald-400 font-semibold">Miễn phí</span>
                  </div>

                  {/* Dòng giảm giá nếu có promo */}
                  {appliedPromo && discountAmount > 0 && (
                    <div className="flex justify-between text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        Giảm {appliedPromo.discountPercentage}% ({appliedPromo.title})
                      </span>
                      <span className="font-bold text-emerald-400">-{discountAmount.toLocaleString("vi-VN")} đ</span>
                    </div>
                  )}

                  {/* Promotion code input */}
                  <div className="pt-2">
                    {!appliedPromo ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                            <input
                              id="promo-code-input"
                              type="text"
                              value={promoInput}
                              onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                              onKeyDown={e => e.key === "Enter" && handleApplyCode()}
                              placeholder="Nhập mã ưu đãi"
                              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#008bd0]/60 transition"
                            />
                          </div>
                          <button
                            id="btn-apply-promo"
                            onClick={handleApplyCode}
                            disabled={promoLoading || !promoInput.trim()}
                            className="px-4 py-2 rounded-lg text-sm font-bold bg-white/8 border border-white/10 text-gray-300 hover:bg-[#008bd0]/20 hover:border-[#008bd0]/40 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {promoLoading ? (
                              <div className="w-4 h-4 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin" />
                            ) : "Áp dụng"}
                          </button>
                        </div>
                        {promoError && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <X className="w-3 h-3" />{promoError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-emerald-500/8 border border-emerald-500/25 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{appliedPromo.code}</span>
                          <span className="text-xs text-emerald-400/60">đã áp dụng</span>
                        </div>
                        <button
                          onClick={handleRemovePromo}
                          className="text-gray-500 hover:text-red-400 transition"
                          title="Xóa mã"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="pt-4 border-t border-dashed border-white/10">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-widest">Tổng cộng</div>
                        <div className="text-xs text-gray-600 mt-0.5">Đã bao gồm VAT</div>
                      </div>
                      <div className="text-right">
                        {appliedPromo && discountAmount > 0 && (
                          <div className="text-sm text-gray-500 line-through mb-0.5">
                            {originalGrandTotal.toLocaleString("vi-VN")} đ
                          </div>
                        )}
                        <div className="text-4xl font-black text-white tracking-tight leading-none">
                          {grandTotal.toLocaleString("vi-VN")}
                        </div>
                        <div className="text-[#008bd0] font-bold text-lg">đồng</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VNPay section */}
                <div className="px-7 pb-3">
                  <div className="bg-[#005BAA]/10 border border-[#005BAA]/30 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Phương thức</span>
                      <VNPayLogo size={80} />
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { icon: <Lock className="w-3.5 h-3.5" />, text: "Thanh toán bảo mật SSL" },
                        { icon: <Clock className="w-3.5 h-3.5" />, text: "Giới hạn 15 phút để hoàn tất" },
                        { icon: <CheckCircle2 className="w-3.5 h-3.5" />, text: "Hỗ trợ tất cả ngân hàng Việt Nam" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-gray-400 text-xs">
                          <span className="text-[#4da6e0]">{item.icon}</span>
                          {item.text}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pay button */}
                  <button
                    id="btn-vnpay-pay"
                    onClick={handlePay}
                    disabled={isPaying}
                    className={`w-full py-4 rounded-xl flex flex-col items-center justify-center gap-1 font-extrabold text-base uppercase transition-all duration-300 relative overflow-hidden ${
                      isPaying
                        ? "bg-[#1a2236] text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#005BAA] to-[#008bd0] hover:from-[#008bd0] hover:to-[#00aaff] text-white shadow-[0_8px_30px_rgba(0,91,170,0.5)] hover:shadow-[0_8px_40px_rgba(0,139,208,0.6)] hover:scale-[1.02] active:scale-[0.99]"
                    }`}
                  >
                    {isPaying ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-[#4da6e0]/30 border-t-[#4da6e0] rounded-full animate-spin" />
                          <span className="text-[#4da6e0] text-sm font-bold normal-case">{getStepLabel()}</span>
                        </div>
                        <div className="flex gap-1.5 mt-1">
                          {["booking","payment","redirecting"].map((s, i) => (
                            <div
                              key={i}
                              className={`h-1 w-8 rounded-full transition-all ${
                                ["booking","payment","redirecting"].indexOf(payStep) >= i
                                  ? "bg-[#008bd0]"
                                  : "bg-white/10"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Thanh toán VNPay
                        </div>
                        <div className="text-[#FFCC00] text-xs font-bold normal-case opacity-90">
                          {grandTotal.toLocaleString("vi-VN")} đồng
                          {appliedPromo && <span className="ml-1 text-emerald-300 text-[10px]">(-{appliedPromo.discountPercentage}%)</span>}
                        </div>
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-600 mt-4 leading-relaxed">
                    Bằng cách thanh toán, bạn đồng ý với{" "}
                    <span className="text-[#4da6e0] cursor-pointer">Điều khoản dịch vụ</span> của CineX
                  </p>
                </div>

                <div className="px-7 pb-6">
                  <div className="border-t border-white/5 pt-5 flex items-center justify-center gap-6 opacity-40">
                    {["JCB", "VISA", "MASTER", "ATM"].map((b) => (
                      <span key={b} className="text-xs font-bold text-gray-400 border border-gray-600 px-2 py-0.5 rounded">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
