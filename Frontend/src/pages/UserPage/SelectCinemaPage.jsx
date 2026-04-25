import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Building2, ChevronLeft, MapPin, CalendarDays, ChevronDown, ChevronRight, Clock, Film } from "lucide-react";
import { toLocalYmd, getNextSevenDays, isSameLocalDay } from "@/utils/showDate";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

export default function SelectCinemaPage() {
  const navigate = useNavigate();
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  // Left intentionally blank as handleSelectCinema replaces this

  return (
    <Layout>
      <div className="min-h-screen bg-[#0b0f19] text-white pt-24 pb-20 px-4 md:px-10">
        <div className="max-w-5xl mx-auto">
          <button
            type="button"
            onClick={() => navigate("/")}
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
            <>
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-[#008bd0]" /> Chọn Ngày Chiếu
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-4 select-none scrollbar-hide py-2">
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
                <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                  {cinemas.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCinema(c)}
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
            </>
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
