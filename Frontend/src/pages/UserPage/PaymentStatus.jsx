import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Ticket,
  Home,
  RotateCcw,
  ShieldCheck,
  Receipt,
  QrCode,
  Mail,
} from "lucide-react";

// ─── VNPay Logo ────────────────────────────────────────────────
function VNPayLogo({ size = 110 }) {
  return (
    <img
      src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png"
      alt="VNPay"
      width={size}
      height={size * 0.4}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}

// ─── Particle burst (success) ──────────────────────────────────
function SuccessParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 60}%`,
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            background: ["#22c55e", "#16a34a", "#4ade80", "#FFCC00", "#fff"][
              Math.floor(Math.random() * 5)
            ],
            animation: `float-up ${1.5 + Math.random() * 2}s ease-out ${Math.random() * 0.8}s forwards`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes float-up {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-120px) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Info Row ──────────────────────────────────────────────────
function InfoRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-emerald-400" : "text-gray-200"}`}>
        {value || "—"}
      </span>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────
export default function PaymentStatus() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [info, setInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [bookingId, setBookingId] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const query = window.location.search;

      // Không có params → lỗi
      if (!query || !searchParams.get("vnp_ResponseCode")) {
        setStatus("error");
        setErrorMessage("Không tìm thấy thông tin giao dịch.");
        return;
      }

      try {
        const API_BASE =
          window.location.hostname === "localhost"
            ? (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "")
            : "/api";

        const res = await fetch(`${API_BASE}/vnpay/payment-info${query}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        const payload = await res.json().catch(() => null);

        if (!payload) {
          setStatus("error");
          setErrorMessage("Phản hồi từ máy chủ không hợp lệ.");
          return;
        }

        setInfo(payload.data);

        if (payload.status === "success") {
          setStatus("success");
          // Lấy bookingId từ response để fetch QR
          const bid = payload.data?.bookingId;
          if (bid) {
            setBookingId(bid);
            fetchQrCode(bid, API_BASE);
          }
        } else {
          setStatus("error");
          setErrorMessage(payload.message || "Giao dịch thất bại.");
        }
      } catch (err) {
        console.error("Verify error:", err);
        setStatus("error");
        setErrorMessage("Không thể kết nối máy chủ. Vui lòng kiểm tra giao dịch trong lịch sử.");
      }
    };

    const fetchQrCode = async (bid, apiBase) => {
      setQrLoading(true);
      try {
        const res = await fetch(`${apiBase}/bookings/${bid}/qr`);
        if (res.ok) {
          const blob = await res.blob();
          setQrUrl(URL.createObjectURL(blob));
        }
      } catch (e) {
        console.warn("Không tải được QR code:", e);
      } finally {
        setQrLoading(false);
      }
    };

    verify();
  }, []);

  // ── Amount formatting ─────────────────────────────────────────
  const formatAmount = (raw) => {
    if (!raw) return "—";
    const num = Number(raw);
    return isNaN(num) ? raw : num.toLocaleString("vi-VN") + " đ";
  };

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, #0d1829 0%, #080c14 60%)",
      }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow */}
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ${
          status === "success"
            ? "bg-emerald-500/10"
            : status === "error"
            ? "bg-red-500/10"
            : "bg-[#008bd0]/10"
        }`}
      />

      {/* Particles on success */}
      {status === "success" && <SuccessParticles />}

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#0d1525]/90 backdrop-blur-xl rounded-3xl border border-white/8 shadow-2xl overflow-hidden">

          {/* Top status bar */}
          <div
            className={`h-1.5 w-full transition-all duration-700 ${
              status === "success"
                ? "bg-gradient-to-r from-emerald-500 to-green-400"
                : status === "error"
                ? "bg-gradient-to-r from-red-500 to-rose-400"
                : "bg-gradient-to-r from-[#005BAA] to-[#008bd0] animate-pulse"
            }`}
          />

          <div className="px-8 pt-8 pb-6">
            {/* VNPay brand */}
            <div className="flex justify-center mb-6">
              <VNPayLogo size={110} />
            </div>

            {/* ── LOADING ── */}
            {status === "loading" && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-2 border-[#008bd0]/20" />
                  <Loader2 className="w-20 h-20 text-[#008bd0] animate-spin absolute inset-0" />
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white mb-1">Đang xác thực giao dịch</div>
                  <div className="text-sm text-gray-500">Vui lòng không đóng trang này...</div>
                </div>
              </div>
            )}

            {/* ── SUCCESS ── */}
            {status === "success" && (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-14 h-14 text-emerald-400" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" />
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-extrabold text-white mb-1">Thanh toán thành công!</h1>
                  <p className="text-emerald-400 text-sm font-semibold">
                    Giao dịch đã được xác nhận
                  </p>
                </div>
              </div>
            )}

            {/* ── ERROR ── */}
            {status === "error" && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle className="w-14 h-14 text-red-400" />
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-extrabold text-white mb-1">Thanh toán thất bại</h1>
                  <p className="text-red-400 text-sm font-semibold">
                    {errorMessage || "Giao dịch không thể hoàn tất"}
                  </p>
                </div>
              </div>
            )}

            {/* ── Transaction details ── */}
            {info && (
              <div className="mt-6 bg-white/3 rounded-2xl border border-white/6 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Chi tiết giao dịch</span>
                </div>
                <InfoRow label="Mã giao dịch" value={info.txnRef} />
                <InfoRow label="Số tiền" value={formatAmount(info.amount)} highlight />
                <InfoRow
                  label="Trạng thái"
                  value={status === "success" ? "✓ Thành công" : "✗ Thất bại"}
                  highlight={status === "success"}
                />
                {info.paymentId && (
                  <InfoRow label="Mã thanh toán" value={`#${info.paymentId}`} />
                )}
              </div>
            )}

            {/* ── QR Code Section ── */}
            {status === "success" && (
              <div className="mt-6">
                {/* Email sent notice */}
                <div className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 mb-4">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-emerald-400/80 leading-relaxed">
                      Vé điện tử đã xác nhận. Vui lòng xuất trình mã QR bên dưới khi đến rạp.
                    </p>
                    <p className="text-xs text-[#008bd0]/80 mt-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email xác nhận kèm QR đã được gửi đến hộp thư của bạn.
                    </p>
                  </div>
                </div>

                {/* QR Code box */}
                <div className="bg-white/3 border border-white/8 rounded-2xl p-5 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <QrCode className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mã QR vào rạp</span>
                  </div>

                  {qrLoading && (
                    <div className="w-[200px] h-[200px] flex items-center justify-center bg-white/5 rounded-xl">
                      <Loader2 className="w-8 h-8 text-[#008bd0] animate-spin" />
                    </div>
                  )}

                  {!qrLoading && qrUrl && (
                    <div
                      style={{
                        background: "white",
                        padding: "12px",
                        borderRadius: "12px",
                        boxShadow: "0 8px 32px rgba(0,91,170,0.35)",
                      }}
                    >
                      <img
                        src={qrUrl}
                        alt={`QR Code vé #${bookingId}`}
                        width={200}
                        height={200}
                        style={{ display: "block", borderRadius: "6px" }}
                      />
                    </div>
                  )}

                  {!qrLoading && !qrUrl && (
                    <div className="w-[200px] h-[200px] flex flex-col items-center justify-center gap-2 bg-white/3 rounded-xl border border-white/6">
                      <QrCode className="w-10 h-10 text-gray-600" />
                      <span className="text-xs text-gray-600">Không tải được QR</span>
                    </div>
                  )}

                  {bookingId && (
                    <p className="text-xs text-gray-600 mt-1">
                      Mã vé: <span className="text-gray-400 font-mono font-bold">CINEX-TICKET:{bookingId}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {status === "error" && !status.includes("loading") && (
              <div className="mt-4 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <p className="text-xs text-red-400/80 leading-relaxed text-center">
                  Nếu tiền đã bị trừ, vui lòng liên hệ hỗ trợ hoặc kiểm tra lại sau 24 giờ.
                </p>
              </div>
            )}
          </div>

          {/* ── Action buttons ── */}
          {(status === "success" || status === "error") && (
            <div className="px-8 pb-8 flex flex-col gap-3">
              <button
                id="btn-go-home"
                onClick={() => navigate("/")}
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-[#005BAA] to-[#008bd0] text-white hover:from-[#008bd0] hover:to-[#00aaff] transition-all shadow-[0_4px_20px_rgba(0,91,170,0.4)] hover:shadow-[0_4px_30px_rgba(0,139,208,0.5)] hover:scale-[1.01]"
              >
                <Home className="w-4 h-4" /> Về trang chủ
              </button>

              {status === "error" && (
                <button
                  id="btn-retry-payment"
                  onClick={() => navigate("/order-ticket")}
                  className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all border border-white/8"
                >
                  <RotateCcw className="w-4 h-4" /> Đặt vé lại
                </button>
              )}

              {status === "success" && (
                <button
                  id="btn-view-tickets"
                  onClick={() => navigate("/movies")}
                  className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all border border-white/8"
                >
                  <Ticket className="w-4 h-4" /> Xem thêm phim
                </button>
              )}
            </div>
          )}

        </div>

        {/* Powered by */}
        <p className="text-center text-xs text-gray-700 mt-4">
          Thanh toán bảo mật bởi{" "}
          <span className="text-[#005BAA] font-bold">VNPay</span> &nbsp;·&nbsp; CineX © 2026
        </p>
      </div>
    </div>
  );
}
