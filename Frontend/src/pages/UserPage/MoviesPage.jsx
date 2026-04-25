import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import LayoutMovie from "../../components/LayoutMovie";
import MovieList from "../../components/Movie/MovieList";
import { MapPin, Building2, Ticket as TicketIcon, Play, CalendarDays, ChevronLeft, ChevronDown, ChevronRight, Clock, Film, QrCode, AlertCircle } from "lucide-react";
import { getNextSevenDays, toLocalYmd, isSameLocalDay } from "../../utils/showDate";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

// ── Tab Lịch sử đặt vé ──────────────────────────────────────────────────────
const BookingsTabContent = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrBookingId, setQrBookingId] = useState(null); // Modal QR
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch(`${API_BASE}/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Không thể tải lịch sử đặt vé");
        const data = await res.json();
        setBookings(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || "Đã xảy ra lỗi");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchBookings();
    else setLoading(false);
  }, [token]);

  const statusConfig = {
    PAID:      { label: "Đã thanh toán", cls: "bg-green-500/20 text-green-400 border border-green-500/30" },
    paid:      { label: "Đã thanh toán", cls: "bg-green-500/20 text-green-400 border border-green-500/30" },
    CONFIRMED: { label: "Thành công",    cls: "bg-green-500/20 text-green-400 border border-green-500/30" },
    confirmed: { label: "Thành công",    cls: "bg-green-500/20 text-green-400 border border-green-500/30" },
    SUCCESS:   { label: "Thành công",    cls: "bg-green-500/20 text-green-400 border border-green-500/30" },
    success:   { label: "Thành công",    cls: "bg-green-500/20 text-green-400 border border-green-500/30" },
    COMPLETED: { label: "Thành công",    cls: "bg-green-500/20 text-green-400 border border-green-500/30" },
    completed: { label: "Thành công",    cls: "bg-green-500/20 text-green-400 border border-green-500/30" },
    CANCELLED: { label: "Đã huỷ",       cls: "bg-red-500/20 text-red-400 border border-red-500/30" },
    cancelled: { label: "Đã huỷ",       cls: "bg-red-500/20 text-red-400 border border-red-500/30" },
    FAILED:    { label: "Thất bại",      cls: "bg-red-500/20 text-red-400 border border-red-500/30" },
    failed:    { label: "Thất bại",      cls: "bg-red-500/20 text-red-400 border border-red-500/30" },
    PENDING:   { label: "Chờ thanh toán", cls: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
    pending:   { label: "Chờ thanh toán", cls: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-pulse">
        <TicketIcon className="w-14 h-14 text-[#008bd0]/40 mb-4" />
        <p className="text-gray-400 font-medium">Đang tải lịch sử đặt vé...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-red-400">
        <AlertCircle className="w-14 h-14 mb-4 opacity-60" />
        <p className="font-semibold text-lg">{error}</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <TicketIcon className="w-14 h-14 mb-4 opacity-30" />
        <p className="text-lg font-medium">Vui lòng đăng nhập để xem lịch sử vé.</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <TicketIcon className="w-16 h-16 mb-5 opacity-25" />
        <h3 className="text-2xl font-bold text-white mb-2">Chưa có vé nào</h3>
        <p className="mb-6">Bạn chưa đặt vé nào. Hãy chọn phim và đặt vé ngay!</p>
        <button
          onClick={() => window.location.href = "/movies?tab=movies"}
          className="px-6 py-2.5 bg-gradient-to-r from-[#008bd0] to-[#00bfff] text-white rounded-full font-bold hover:-translate-y-0.5 transition-all shadow-lg shadow-cyan-500/30"
        >
          Xem phim ngay
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <TicketIcon className="w-7 h-7 text-[#008bd0]" />
        <h2 className="text-3xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#008bd0] to-cyan-300">
          Lịch Sử Đặt Vé
        </h2>
        <span className="ml-2 px-3 py-1 bg-[#008bd0]/20 text-[#008bd0] rounded-full text-sm font-bold border border-[#008bd0]/30">
          {bookings.length} vé
        </span>
        <div className="flex-1 h-[2px] bg-gradient-to-r from-[#008bd0]/40 to-transparent" />
      </div>

      {/* Booking list */}
      <div className="space-y-4">
        {bookings.map((b) => {
          const status = statusConfig[b.status] || { label: b.status || "—", cls: "bg-gray-500/20 text-gray-400 border border-gray-500/30" };
          const isPaid = ["PAID","paid","CONFIRMED","confirmed","SUCCESS","success","COMPLETED","completed"].includes(b.status);
          return (
            <div
              key={b.id}
              className="group flex flex-col sm:flex-row gap-4 p-5 bg-[#141922] hover:bg-[#008bd0]/8 border border-white/5 hover:border-[#008bd0]/25 rounded-2xl shadow-md transition-all duration-300"
            >
              {/* Poster / icon */}
              <div className="w-full sm:w-20 h-20 rounded-xl bg-gradient-to-br from-[#008bd0]/25 to-cyan-900/20 flex items-center justify-center shrink-0 border border-white/5">
                {b.showtime?.movie?.thumbnailUrl ? (
                  <img
                    src={b.showtime.movie.thumbnailUrl}
                    alt="poster"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <TicketIcon className="text-[#008bd0] w-8 h-8" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <h3 className="font-bold text-white text-base group-hover:text-[#00bfff] transition-colors truncate">
                    {b.showtime?.movie?.title || `Vé #${b.id}`}
                  </h3>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${status.cls}`}>
                    {status.label}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-400">
                  {b.showtime?.startTime && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#008bd0]" />
                      <span>{new Date(b.showtime.startTime).toLocaleString("vi-VN")}</span>
                    </div>
                  )}
                  {b.showtime?.room?.cinema?.name && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>{b.showtime.room.cinema.name}</span>
                    </div>
                  )}
                  {b.showtime?.room?.name && (
                    <div className="flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-purple-400" />
                      <span>{b.showtime.room.name}</span>
                    </div>
                  )}
                  {b.totalPrice != null && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400 font-bold">
                        {Number(b.totalPrice).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {isPaid && (
                <div className="flex items-center shrink-0">
                  <button
                    onClick={() => setQrBookingId(b.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#008bd0]/10 hover:bg-[#008bd0]/20 border border-[#008bd0]/30 text-[#008bd0] hover:text-cyan-300 rounded-xl text-sm font-semibold transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    Xem QR
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* QR Modal */}
      {qrBookingId && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setQrBookingId(null)}
        >
          <div
            className="bg-[#111827] border border-white/10 rounded-2xl p-6 w-full max-w-xs shadow-2xl flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <QrCode className="w-8 h-8 text-[#008bd0]" />
            <h3 className="text-lg font-bold text-white">Mã QR Vé #{qrBookingId}</h3>
            <img
              src={`${API_BASE}/bookings/${qrBookingId}/qr`}
              alt="QR Code"
              className="w-52 h-52 rounded-xl border-2 border-white/10"
            />
            <p className="text-xs text-gray-500 text-center">Xuất trình mã này tại quầy soát vé</p>
            <button
              onClick={() => setQrBookingId(null)}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm font-semibold transition-all"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CinemaTabContent = () => {
  const navigate = useNavigate();
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(toLocalYmd(new Date()));
  const days = getNextSevenDays();

  const [selectedCinema, setSelectedCinema] = useState(null);
  const [cinemaMovies, setCinemaMovies] = useState([]);
  const [expandedMovieId, setExpandedMovieId] = useState(null);
  const [movieShowtimes, setMovieShowtimes] = useState({});
  const [loadingMovies, setLoadingMovies] = useState(false);

  const handleSelectCinema = async (cinema) => {
    setSelectedCinema(cinema);
    setCinemaMovies([]);
    setExpandedMovieId(null);
    setLoadingMovies(true);
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
      const res = await fetch(`${API_BASE}/movies?cinemaId=${cinema.id}`, { headers });
      const data = await res.json();
      let arr = Array.isArray(data) ? data : (data?.data || []);
      setCinemaMovies(arr);
    } catch (e) {
      console.error("Lỗi lấy phim của rạp", e);
    } finally {
      setLoadingMovies(false);
    }
  };

  const handleToggleMovie = async (movie) => {
    if (expandedMovieId === movie.id) {
       setExpandedMovieId(null);
       return;
    }
    setExpandedMovieId(movie.id);
    if (!movieShowtimes[movie.id]) {
       try {
          const token = localStorage.getItem("accessToken");
          const headers = { "Content-Type": "application/json" };
          if (token) headers["Authorization"] = `Bearer ${token}`;
          const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
          const res = await fetch(`${API_BASE}/movies/${movie.id}/showtimes?cinemaId=${selectedCinema.id}`, { headers });
          const data = await res.json();
          let arr = Array.isArray(data) ? data : (data?.data || []);
          setMovieShowtimes(prev => ({ ...prev, [movie.id]: arr }));
       } catch (e) {
          console.error("Lỗi lấy suất chiếu", e);
       }
    }
  };


  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        
        const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
        const res = await fetch(`${API_BASE}/cinemas`, { headers });
        const data = await res.json();
        
        let arr = [];
        if (Array.isArray(data)) arr = data;
        else if (data && Array.isArray(data.data)) arr = data.data;

        setCinemas(arr);
      } catch (error) {
        console.error("Lỗi khi tải danh sách rạp:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCinemas();
  }, []);

  if (loading) {
     return <div className="text-center py-32 text-gray-400 font-bold animate-pulse">Đang tải cấu trúc hệ thống rạp...</div>;
  }

  if (cinemas.length === 0) {
     return (
        <div className="text-center py-32 text-gray-400 flex flex-col items-center animate-fade-in">
           <Building2 size={64} className="mb-6 text-gray-600 opacity-50" />
           <h3 className="text-2xl font-bold text-white mb-2">Hệ Thống Rạp</h3>
           <p>Hiện chưa có thông tin rạp nào trên hệ thống.</p>
        </div>
     );
  }

  return (
    <div className="space-y-10 animate-fade-in transition-all duration-500">
      <div className="flex items-center space-x-6 mb-8 mt-5">
        <h2 className="text-3xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#008bd0] to-cyan-300">
          HỆ THỐNG RẠP CINEX
        </h2>
        <div className="flex-1 h-[2px] bg-gradient-to-r from-[#008bd0]/50 to-transparent"></div>
      </div>
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#008bd0]" /> Chọn Ngày Chiếu
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-4 select-none scrollbar-hide">
          {days.map((d, idx) => {
            const ymd = toLocalYmd(d);
            const isSelected = selectedDate === ymd;
            const dayOfWeek = d.getDay();
            const isToday = isSameLocalDay(new Date(), ymd);
            const dayLabel = isToday ? "Hôm nay" : dayOfWeek === 0 ? "CN" : `Th ${dayOfWeek + 1}`;
            const dateLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDate(ymd)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-[85px] h-[85px] rounded-2xl border transition-all duration-300 shadow-md ${
                  isSelected 
                    ? "bg-gradient-to-br from-[#008bd0] to-[#00bfff] border-[#00bfff] text-white shadow-[#008bd0]/30 scale-105" 
                    : "bg-[#1c1d1f] border-white/10 text-gray-400 hover:border-[#008bd0]/50 hover:bg-[#252628] hover:text-white"
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-wider mb-1">{dayLabel}</span>
                <span className={`text-2xl font-black ${isSelected ? "text-white" : "text-gray-200"}`}>{dateLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedCinema ? (
        <div className="animate-fade-in">
          <button 
            onClick={() => setSelectedCinema(null)}
            className="flex items-center text-[#008bd0] hover:text-cyan-400 mb-6 transition font-semibold"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Danh sách rạp khác
          </button>
          
          <div className="flex items-center gap-4 mb-8 bg-[#1c1d1f] p-5 rounded-2xl border border-white/5">
            <div className="w-14 h-14 rounded-full bg-[#008bd0]/20 flex items-center justify-center text-[#008bd0]">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{selectedCinema.name}</h2>
              <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4 text-[#008bd0]/70" /> {selectedCinema.location || "Đang cập nhật"}
              </p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Film className="w-6 h-6 text-amber-500" /> Phim đang chiếu tại rạp
          </h3>

          {loadingMovies ? (
             <div className="text-center py-10 text-gray-500 animate-pulse font-medium">Đang tìm vé khả dụng...</div>
          ) : cinemaMovies.length === 0 ? (
             <div className="text-center py-10 bg-[#1c1d1f] rounded-2xl border border-white/5 text-gray-500 italic">Không có phim nào chiếu tại rạp này.</div>
          ) : (
             <div className="space-y-4">
                {cinemaMovies.map(movie => {
                   const isExpanded = expandedMovieId === movie.id;
                   const sTimes = movieShowtimes[movie.id] || [];
                   const dailySTs = sTimes.filter(st => isSameLocalDay(st.startTime, selectedDate));
                   
                   return (
                     <div key={movie.id} className="bg-[#1c1d1f] rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 shadow-md">
                        <button 
                           onClick={() => handleToggleMovie(movie)}
                           className="w-full flex items-center p-4 hover:bg-white/5 transition text-left"
                        >
                           <img 
                              src={movie.thumbnailUrl || movie.posterUrl || "/default.png"} 
                              className="w-16 h-20 object-cover rounded-lg shadow-sm border border-white/10 shrink-0" 
                              alt="poster"
                           />
                           <div className="ml-4 flex-1">
                              <h4 className="text-lg font-bold text-white mb-1 group-hover:text-[#008bd0] transition">{movie.title}</h4>
                              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                <span className="bg-white/10 text-gray-300 px-2 py-0.5 rounded">{movie.duration || "N/A"} phút</span>
                                <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">{movie.genre || "Phim"}</span>
                              </div>
                           </div>
                           <div className="shrink-0 p-2 text-gray-500">
                              {isExpanded ? <ChevronDown className="w-6 h-6 text-[#008bd0]" /> : <ChevronRight className="w-6 h-6" />}
                           </div>
                        </button>
                        
                        {isExpanded && (
                           <div className="p-5 bg-black/40 border-t border-white/5 animate-fade-in">
                              <h5 className="text-sm uppercase tracking-wider text-gray-400 mb-4 font-semibold flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#008bd0]" /> Suất chiếu ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
                              </h5>
                              {sTimes.length === 0 && Array.isArray(movieShowtimes[movie.id]) ? (
                                 <p className="text-sm text-gray-500 italic">Không có suất chiếu nào cho phim này.</p>
                              ) : dailySTs.length === 0 ? (
                                 <p className="text-sm text-gray-500 italic">Chưa có lịch xếp vào ngày này.</p>
                              ) : (
                                 <div className="flex flex-wrap gap-3">
                                   {dailySTs.map(st => {
                                      const sd = new Date(st.startTime);
                                      return (
                                        <button 
                                           key={st.id}
                                           onClick={() => navigate(`/order-ticket?movieId=${movie.id}&cinemaId=${selectedCinema.id}&showDate=${selectedDate}&showtimeId=${st.id}`)}
                                           className="px-5 py-2.5 rounded-xl border border-white/10 bg-[#2a2b2e] hover:bg-[#008bd0] hover:border-[#008bd0] text-gray-300 hover:text-white transition-all shadow-sm hover:shadow-[0_0_15px_rgba(0,139,208,0.4)] flex flex-col items-center group transform hover:-translate-y-0.5"
                                        >
                                           <span className="text-lg font-bold">{sd.toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})}</span>
                                           <span className="text-[10px] uppercase text-gray-500 group-hover:text-cyan-100 mt-1">{st.room?.name || "Tiêu chuẩn"}</span>
                                        </button>
                                      )
                                   })}
                                 </div>
                              )}
                           </div>
                        )}
                     </div>
                   );
                })}
             </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
           {cinemas.map(c => (
              <div 
                key={c.id} 
                onClick={() => handleSelectCinema(c)}
                className="group flex p-6 bg-[#1c1d1f] hover:bg-[#008bd0]/10 border border-white/5 hover:border-[#008bd0]/30 rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#008bd0] to-cyan-500 flex items-center justify-center shrink-0 mr-5 shadow-lg group-hover:scale-110 transition-transform">
                     <Building2 className="text-white w-8 h-8" />
                  </div>
                  <div className="flex flex-col justify-center">
                     <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#00bfff] transition-colors">{c.name}</h3>
                     <div className="flex items-start text-sm text-gray-400 mt-1">
                        <MapPin className="w-4 h-4 mr-1 shrink-0 mt-0.5 text-[#008bd0] opacity-80" />
                        <span>{c.location || "Đang cập nhật địa chỉ"}</span>
                     </div>
                  </div>
              </div>
           ))}
        </div>
      )}
    </div>
  );
};

const MoviesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "movies");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  return (
    <LayoutMovie activeTab={activeTab}>
      <div className="w-full min-h-screen bg-[#060b19] pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10">
          <div>
            {activeTab === "movies" && (
              <div className="space-y-10 animate-fade-in transition-all duration-500">
                {/* Hero Banner Header - Phim Đang Chiếu */}
                <div className="relative w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden mb-12 shadow-2xl shadow-[#008bd0]/10 border border-white/5">
                  <img 
                      src="/banner1.jpg" 
                      alt="Hero Banner" 
                      className="w-full h-full object-cover transition-transform duration-[10s] hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#060b19] via-[#060b19]/90 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060b19] via-transparent to-transparent opacity-80"></div>
                  <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 w-full md:w-2/3">
                    <span className="text-[#008bd0] font-bold tracking-[0.2em] text-xs mb-3 uppercase drop-shadow-lg">Now Showing</span>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight drop-shadow-2xl">
                      Khám Phá Thế Giới <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#008bd0]">Điện Ảnh Đỉnh Cao</span>
                    </h1>
                    <p className="text-gray-300 text-sm md:text-base mb-8 max-w-lg drop-shadow-md">
                      Trải nghiệm những bom tấn mới nhất với chất lượng tuyệt đỉnh. Đặt vé ngay hôm nay để tận hưởng ưu đãi đặc biệt tại CineX!
                    </p>
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-2 bg-gradient-to-r from-[#008bd0] to-[#00bfff] hover:from-[#0070a8] hover:to-[#008bd0] px-8 py-3 rounded-full text-white font-bold transition-all shadow-lg shadow-cyan-500/40 hover:-translate-y-1">
                          <Play fill="currentColor" size={18} />
                          Xem Trailer
                      </button>
                    </div>
                  </div>
                </div>
                
                <MovieList title="Phim Đang Chiếu" isGrid={true} status="now_showing" />
              </div>
            )}
            
            {activeTab === "upcoming" && (
              <div className="space-y-10 animate-fade-in transition-all duration-500">
                {/* Hero Banner Header - Phim Sắp Chiếu */}
                <div className="relative w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden mb-12 shadow-2xl shadow-amber-500/10 border border-white/5">
                  <img 
                      src="/banner1.jpg" 
                      alt="Upcoming Movies" 
                      className="w-full h-full object-cover transition-transform duration-[10s] hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#060b19] via-[#060b19]/90 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060b19] via-transparent to-transparent opacity-80"></div>
                  <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 w-full md:w-2/3">
                    <span className="text-amber-500 font-bold tracking-[0.2em] text-xs mb-3 uppercase drop-shadow-lg">Coming Soon</span>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight drop-shadow-2xl">
                      Chờ Đón Những <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Siêu Phẩm Sắp Ra Mắt</span>
                    </h1>
                    <p className="text-gray-300 text-sm md:text-base mb-8 max-w-lg drop-shadow-md">
                      Cập nhật thông tin, tra cứu lịch chiếu dự kiến và xem trước trailer của những bộ phim đang làm mưa làm gió trên toàn cầu.
                    </p>
                  </div>
                </div>
                
                <MovieList title="Phim Sắp Chiếu" isGrid={true} hideBooking={true} status="coming_soon" />
              </div>
            )}
            
            {activeTab === "cinema" && <CinemaTabContent />}
            
            {activeTab === "bookings" && <BookingsTabContent />}
          </div>
        </div>
      </div>
    </LayoutMovie>
  );
};

export default MoviesPage;
