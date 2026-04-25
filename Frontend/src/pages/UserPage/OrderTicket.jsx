/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Calendar, Clock, MonitorPlay, Armchair, ChevronLeft, CreditCard, ArrowRight, Film, Star } from "lucide-react";
import useNagivateLoading from "@/hooks/useNagivateLoading";
import { isSameLocalDay } from "@/utils/showDate";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

export default function OrderTicket() {
  const [searchParams] = useSearchParams();
  const movieId = searchParams.get("movieId");
  const cinemaId = searchParams.get("cinemaId");
  const showDate = searchParams.get("showDate");
  const initialShowtimeId = searchParams.get("showtimeId");
  const navigate = useNavigate();
  const navigateLoading = useNagivateLoading();

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [seatMap, setSeatMap] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);

  // --- NOW SHOWING movies (only used when no movieId in URL) ---
  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);

  useEffect(() => {
    if (movieId) return; // already have a movie selected
    const fetchNowShowing = async () => {
      setLoadingMovies(true);
      try {
        const token = localStorage.getItem("accessToken");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/movies?status=now_showing`, { headers });
        const data = await res.json();
        setNowShowingMovies(Array.isArray(data) ? data : (data?.data || []));
      } catch (e) {
        console.error("Lỗi tải phim đang chiếu:", e);
      } finally {
        setLoadingMovies(false);
      }
    };
    fetchNowShowing();
  }, [movieId]);

  useEffect(() => {
    if (!selectedShowtime?.id) {
       setSeatMap([]);
       return;
    }
    
    let isCancelled = false;
    const fetchSeats = async () => {
       setLoadingSeats(true);
       try {
          const token = localStorage.getItem("accessToken");
          const headers = { "Content-Type": "application/json" };
          if (token) headers["Authorization"] = `Bearer ${token}`;
          const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
          
          const res = await fetch(`${API_BASE}/showtimes/${selectedShowtime.id}/seats`, { headers });
          const jsData = await res.json();
          let apiSeats = jsData;
          if (jsData && jsData.data) apiSeats = jsData.data;
          if (!Array.isArray(apiSeats)) apiSeats = [];

          if (isCancelled) return;

          const sMap = {};
          apiSeats.forEach(seat => {
              // Row label e.g., 'A' from 'A1'
              let rLabel = '?';
              if (seat.seatNumber && seat.seatNumber.length > 0) {
                 rLabel = seat.seatNumber.charAt(0).toUpperCase();
              }
              if (!sMap[rLabel]) sMap[rLabel] = [];
              sMap[rLabel].push({
                 id: seat.id,
                 label: seat.seatNumber,
                 // handle both boolean naming conventions
                 status: (seat.booked === true || seat.isBooked === true) ? "booked" : "available",
                 type: seat.type || "NORMAL"
              });
          });

          const formattedGrid = Object.keys(sMap).sort().map(rowLab => ({
              rowLabel: rowLab,
              seats: sMap[rowLab].sort((a,b) => {
                 const nA = parseInt(a.label.substring(1)) || 0;
                 const nB = parseInt(b.label.substring(1)) || 0;
                 return nA - nB;
              })
          }));
          setSeatMap(formattedGrid);
       } catch(e) {
          console.error("Lỗi tải sơ đồ ghế: ", e);
       } finally {
          if (!isCancelled) setLoadingSeats(false);
       }
    };
    fetchSeats();
    return () => { isCancelled = true; };
  }, [selectedShowtime]);

  useEffect(() => {
    const fetchContext = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("accessToken");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        
        const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

        if (!movieId) {
          setError("Vui lòng chọn phim trước khi đặt vé.");
          setLoading(false);
          return;
        }

        // Fetch Movie
        const rMovie = await fetch(`${API_BASE}/movies/${movieId}`, { headers });
        const dMovie = await rMovie.json();
        let mMovie = dMovie;
        if (dMovie && dMovie.data) mMovie = dMovie.data;
        setMovie(mMovie);

        const showtimesUrl =
          `${API_BASE}/movies/${movieId}/showtimes` +
          (cinemaId ? `?cinemaId=${encodeURIComponent(cinemaId)}` : "");
        const rShow = await fetch(showtimesUrl, { headers });
        const dShow = await rShow.json();
        let mShow = dShow;
        if (dShow && dShow.data) mShow = dShow.data;
        
        let list = [];
        if (Array.isArray(mShow)) {
          list = mShow;
        }
        if (showDate) {
          list = list.filter((st) => isSameLocalDay(st.startTime, showDate));
        }
        setShowtimes(list);

        if (initialShowtimeId) {
           const found = list.find(s => String(s.id) === String(initialShowtimeId));
           if (found) {
              setSelectedShowtime(found);
           }
        }

      } catch (e) {
         setError("Có lỗi khi kết nối với máy chủ.");
         console.error(e);
      } finally {
         setLoading(false);
      }
    };

    fetchContext();
  }, [movieId, cinemaId, showDate]);

  useEffect(() => {
    if (!initialShowtimeId) {
      setSelectedShowtime(null);
    }
    setSelectedSeats([]);
  }, [movieId, cinemaId, showDate, initialShowtimeId]);

  const toggleSeat = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(prev => prev.filter(id => id !== seatId));
    } else {
      setSelectedSeats(prev => [...prev, seatId]);
    }
  };

  const handleContinueToCombo = () => {
    if (!selectedShowtime || selectedSeats.length === 0) return;
    const seatLabels = selectedSeats
      .map((id) => {
        for (const row of seatMap) {
          const found = row.seats.find((s) => s.id === id);
          if (found) return found.label;
        }
        return id;
      })
      .join(", ");
    navigate("/order-combo", {
      state: {
        movieId,
        movieTitle: movie.title,
        moviePoster: movie.posterUrl || movie.thumbnailUrl,
        showtime: selectedShowtime,
        seatIds: selectedSeats,
        seatLabels,
      },
    });
  };

  // ── Show movie picker when no movieId ──
  if (!movieId) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0b0f19] text-white pt-24 pb-16 px-4 md:px-10">
          <div className="max-w-6xl mx-auto">
            <div className="mb-10">
              <p className="text-sm uppercase tracking-[0.3em] text-[#008bd0]/80 mb-2">Mua vé ngay</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">Chọn Phim <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#008bd0] to-cyan-300">Đang Chiếu</span></h1>
              <p className="mt-3 text-gray-400">Chọn một bộ phim bạn muốn xem để tiếp tục đặt vé.</p>
            </div>

            {loadingMovies ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-[#1c1d1f] animate-pulse" style={{ height: 320 }} />
                ))}
              </div>
            ) : nowShowingMovies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-gray-500">
                <Film className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-xl font-semibold">Hiện chưa có phim nào đang chiếu.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {nowShowingMovies.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => navigate(`/order-ticket?movieId=${m.id}`)}
                    className="group relative rounded-2xl overflow-hidden border border-white/5 bg-[#1c1d1f] cursor-pointer hover:border-[#008bd0]/50 hover:shadow-[0_0_30px_rgba(0,139,208,0.2)] transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Poster */}
                    <div className="relative aspect-[2/3] overflow-hidden">
                      <img
                        src={m.posterUrl || m.thumbnailUrl || "/default.png"}
                        alt={m.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      {/* Age badge */}
                      {m.ageLimit && (
                        <span className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded">{m.ageLimit}</span>
                      )}
                      {/* Rating */}
                      {m.rating && (
                        <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-lg backdrop-blur-sm">
                          <Star className="w-3 h-3 fill-amber-400" />{Number(m.rating).toFixed(1)}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 group-hover:text-[#00bfff] transition-colors mb-1.5">{m.title}</h3>
                      <div className="flex flex-wrap gap-1">
                        {m.genre && <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">{m.genre}</span>}
                        {m.duration && <span className="text-[10px] bg-white/10 text-gray-400 px-2 py-0.5 rounded-full flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{m.duration}p</span>}
                      </div>
                    </div>

                    {/* Hover CTA */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#008bd0]/20 backdrop-blur-[1px]">
                      <div className="bg-[#008bd0] text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" /> Chọn suất chiếu
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // movieId is present — show loading / error states for the ticket selection flow
  if (loading) {
    return <Layout><div className="min-h-screen bg-[#0b0f19] flex justify-center items-center text-white text-xl font-bold">Đang tải biểu đồ lịch chiếu...</div></Layout>;
  }

  if (error || !movie) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-center items-center text-white gap-4">
          <div className="text-xl font-bold text-red-400">{error || "Không tìm thấy phim"}</div>
          <button onClick={() => navigateLoading("/")} className="px-6 py-2 bg-[#008bd0] hover:bg-[#0070a8] font-bold rounded-lg transition-colors">Quay lại Trang Chủ</button>
        </div>
      </Layout>
    );
  }

  const totalPrice = selectedShowtime ? selectedShowtime.price * selectedSeats.length : 0;
  // Format labels nicely
  const selectedSeatLabels = selectedSeats.map(id => {
      for (const row of seatMap) {
         const found = row.seats.find(s => s.id === id);
         if (found) return found.label;
      }
      return id;
  }).join(", ");

  return (
    <Layout>
      <div className="min-h-screen bg-[#0b0f19] text-white pt-24 pb-20 px-4 md:px-10 flex justify-center">
         <div className="max-w-[1300px] w-full flex flex-col xl:flex-row gap-8">
            
            {/* Lõi Chọn Ghế + Thông tin */}
            <div className="flex-1 space-y-8">
               
               {/* BANNER PHIM */}
               <div>
                 <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 font-semibold hover:text-white mb-4 transition">
                    <ChevronLeft className="w-5 h-5 mr-1" /> Quay lại chọn phim
                 </button>
                 <div className="flex gap-5 items-center bg-[#1c1d1f] p-5 rounded-2xl border border-white/5 shadow-2xl">
                    <img src={movie.posterUrl || movie.thumbnailUrl || "/default.png"} className="w-24 h-32 lg:w-28 lg:h-36 object-cover rounded-xl shadow-lg border border-white/10" />
                    <div>
                       <h1 className="text-2xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 uppercase mb-3">{movie.title}</h1>
                       <div className="text-gray-300 text-sm font-semibold flex flex-wrap gap-4">
                         <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-lg"><Clock className="w-4 h-4 text-amber-500"/> {movie.duration || "120"} Phút</span>
                         <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-lg text-green-400">{movie.language || "Phụ đề / Lồng tiếng"}</span>
                         <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-lg text-blue-400">{movie.genre || "Đang cập nhật"}</span>
                       </div>
                    </div>
                 </div>
               </div>

               {/* CHỌN SUẤT CHIẾU */}
               <div className="bg-[#1c1d1f] p-6 rounded-2xl border border-white/5 shadow-2xl">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white"><Calendar className="text-[#008bd0] w-6 h-6"/> Lịch chiếu khả dụng</h2>
                  {showtimes.length === 0 ? (
                     <div className="text-gray-500 italic p-4 bg-black/20 rounded-xl">Phim này hiện tại chưa có suất chiếu nào sắp tới.</div>
                  ) : (
                     <div className="flex flex-wrap gap-3">
                        {showtimes.map(st => {
                           const stDate = new Date(st.startTime);
                           const isSelected = selectedShowtime?.id === st.id;
                           return (
                              <button 
                                key={st.id}
                                onClick={() => { setSelectedShowtime(st); setSelectedSeats([]); }}
                                className={`px-5 py-3 rounded-xl border flex flex-col items-center min-w-[110px] transition-all duration-300
                                   ${isSelected ? "bg-[#008bd0] border-[#008bd0] text-white shadow-[0_5px_15px_rgba(0,139,208,0.4)] scale-[1.03]" : "bg-[#2a2b2e] border-white/5 hover:border-white/30 text-gray-300"}
                                `}
                              >
                                 <span className="text-xs mb-1 font-semibold opacity-80">{stDate.toLocaleDateString("vi-VN", { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
                                 <span className="text-xl font-extrabold">{stDate.toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})}</span>
                              </button>
                           );
                        })}
                     </div>
                  )}
               </div>

               {/* SƠ ĐỒ LƯỚI GHẾ NGỒI */}
               {selectedShowtime && (
               <div className="bg-[#1c1d1f] p-6 rounded-2xl border border-white/5 shadow-2xl flex flex-col items-center overflow-hidden relative">
                  {loadingSeats && (
                    <div className="absolute inset-0 bg-[#1c1d1f]/80 backdrop-blur-sm z-20 flex justify-center items-center rounded-2xl">
                       <div className="text-white font-bold text-lg animate-pulse">Đang truy xuất sơ đồ ghế...</div>
                    </div>
                  )}
                  <h2 className="text-xl font-bold mb-8 flex items-center gap-2 self-start"><Armchair className="text-green-500 w-6 h-6"/> Sơ đồ phòng chiếu</h2>
                  
                  {/* Theater Screen Graphics */}
                  <div className="w-[85%] max-w-[550px] mb-14 flex flex-col items-center relative">
                     <div className="w-full h-10 bg-gradient-to-b from-white/20 to-transparent flex items-start justify-center rounded-t-[50%] border-t-4 border-white/40 shadow-[0_-15px_30px_rgba(255,255,255,0.05)]"></div>
                     <div className="absolute top-8 text-gray-400 font-bold text-sm tracking-[0.2em] flex items-center gap-2 opacity-60">
                        <MonitorPlay className="w-5 h-5"/> MÀN HÌNH CHÍNH
                     </div>
                  </div>

                  {/* Seat Grid Map */}
                  <div className="w-full overflow-x-auto pb-4 flex justify-center custom-scrollbar">
                    <div className="flex flex-col gap-3.5 min-w-[max-content] pb-2 px-4">
                      {seatMap.map((row) => (
                         <div key={row.rowLabel} className="flex gap-4 items-center">
                            <div className="w-8 text-center text-gray-500 font-bold text-lg">{row.rowLabel}</div>
                            <div className="flex gap-2.5">
                               {row.seats.map(seat => {
                                  const isSelected = selectedSeats.includes(seat.id);
                                  const isBooked = seat.status === "booked";
                                  
                                  let bgClass = "bg-[#2a2b2e] hover:bg-gray-500 border border-white/10 text-gray-300"; // Available
                                  if (isBooked) bgClass = "bg-[#141517] border-white/5 opacity-40 cursor-not-allowed text-transparent";
                                  if (isSelected) bgClass = "bg-green-500 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)] font-bold text-white scale-110";

                                  return (
                                    <button 
                                      key={seat.id}
                                      disabled={isBooked}
                                      onClick={() => toggleSeat(seat.id)}
                                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-t-xl rounded-b-md flex items-center justify-center text-xs sm:text-sm transition-all duration-200 ${bgClass}`}
                                    >
                                      {seat.label.substring(1)}
                                    </button>
                                  );
                               })}
                            </div>
                            <div className="w-8 text-center text-gray-500 font-bold text-lg">{row.rowLabel}</div>
                         </div>
                      ))}
                    </div>
                  </div>

                  {/* Legends */}
                  <div className="flex gap-8 mt-10 p-5 bg-black/40 rounded-xl justify-center w-full max-w-[600px] border border-white/5">
                     <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-t-lg rounded-b-sm bg-[#2a2b2e] border border-white/10"></div>
                        <span className="text-sm font-semibold text-gray-300">Ghế trống</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-t-lg rounded-b-sm bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                        <span className="text-sm font-semibold text-white">Đang chọn</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-t-lg rounded-b-sm bg-[#141517] opacity-60"></div>
                        <span className="text-sm font-semibold text-gray-500">Đã bán</span>
                     </div>
                  </div>
               </div>
               )}
            </div>

            {/* BẢNG TÓM TẮT & THANH TOÁN */}
            <div className="w-full xl:w-[380px] shrink-0">
               <div className="bg-[#1c1d1f] rounded-2xl border border-white/5 shadow-2xl flex flex-col h-full sticky top-24">
                  <div className="p-7 border-b border-white/5">
                     <h2 className="text-2xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Đơn hàng</h2>
                  </div>
                  
                  <div className="p-7 flex-1 space-y-6">
                     <div className="flex flex-col border-b border-dashed border-white/10 pb-5">
                        <span className="text-gray-500 text-sm font-semibold tracking-wide uppercase mb-1">Rạp chiếu</span>
                        <span className="font-bold text-white text-xl">{selectedShowtime ? (selectedShowtime.room?.cinema?.name || "Rạp PhimNet") : "Chưa xác định"}</span>
                        <span className="text-gray-400 text-sm mt-1">{selectedShowtime ? (selectedShowtime.room?.name || "Phòng chiếu tiêu chuẩn") : ""}</span>
                     </div>
                     
                     <div className="flex flex-col border-b border-dashed border-white/10 pb-5">
                        <span className="text-gray-500 text-sm font-semibold tracking-wide uppercase mb-1">Thời gian</span>
                        {selectedShowtime ? (
                           <>
                             <span className="font-bold text-[#008bd0] text-2xl mb-1">
                                {new Date(selectedShowtime.startTime).toLocaleString("vi-VN", {hour: '2-digit', minute:'2-digit'})}
                             </span>
                             <span className="font-semibold text-gray-300 text-base">
                                {new Date(selectedShowtime.startTime).toLocaleString("vi-VN", {day: '2-digit', month: '2-digit', year: 'numeric'})}
                             </span>
                           </>
                        ) : (
                           <span className="text-gray-600 font-semibold italic">Chưa xác định</span>
                        )}
                     </div>

                     <div className="flex flex-col border-b border-dashed border-white/10 pb-5">
                        <span className="text-gray-500 text-sm font-semibold tracking-wide uppercase mb-1">Ghế đã chọn ({selectedSeats.length})</span>
                        {selectedSeats.length > 0 ? (
                           <span className="font-bold text-green-400 break-words text-xl leading-relaxed">
                              {selectedSeatLabels}
                           </span>
                        ) : (
                           <span className="text-gray-600 font-semibold italic">Chưa chọn ghế</span>
                        )}
                     </div>

                     <div className="flex justify-between items-end pt-4 border-b border-dashed border-white/10 pb-6">
                        <span className="text-gray-400 font-bold text-lg uppercase tracking-wider">Tổng cộng</span>
                        <span className="text-4xl font-extrabold text-amber-500">{totalPrice.toLocaleString("vi-VN")} đ</span>
                     </div>

                     <div className="pt-2">
                        <span className="text-gray-500 text-sm font-semibold tracking-wide uppercase mb-3 block">
                           Bước tiếp theo
                        </span>
                        <div className="rounded-xl border border-[#008bd0]/40 bg-[#008bd0]/10 px-4 py-3 flex gap-3 items-start">
                           <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#008bd0] text-white">
                              <CreditCard className="h-4 w-4" />
                           </div>
                           <div className="min-w-0">
                              <div className="font-bold text-white text-sm">Combo & thanh toán</div>
                              <div className="text-xs text-gray-400 mt-1 leading-relaxed">
                                 Chọn combo bắp nước (nếu muốn), sau đó thanh toán VNPay.
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-6 bg-black/40 mt-auto rounded-b-2xl border-t border-white/5">
                     <button
                        type="button"
                        onClick={handleContinueToCombo}
                        disabled={!selectedShowtime || selectedSeats.length === 0}
                        className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-extrabold text-lg uppercase transition-all duration-300
                           ${(!selectedShowtime || selectedSeats.length === 0) 
                              ? "bg-[#2a2b2e] text-gray-500 cursor-not-allowed" 
                              : "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-[0_10px_25px_rgba(245,158,11,0.4)] hover:scale-[1.02]"
                           }
                        `}
                     >
                        <span className="flex items-center gap-2">
                           Tiếp theo <ArrowRight className="w-6 h-6" />
                        </span>
                     </button>
                  </div>
               </div>
            </div>

         </div>
      </div>
    </Layout>
  );
}
