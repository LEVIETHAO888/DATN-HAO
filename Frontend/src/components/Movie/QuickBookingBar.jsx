import React, { useEffect, useMemo, useState } from "react";
import useNagivateLoading from "@/hooks/useNagivateLoading";

const QuickBookingBar = () => {
  const navigateLoading = useNagivateLoading();
  const [cinemas, setCinemas] = useState([]);
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);

  const [selectedCinema, setSelectedCinema] = useState("");
  const [selectedMovie, setSelectedMovie] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedShowtime, setSelectedShowtime] = useState("");

  const getHeaders = () => {
    const token = localStorage.getItem("accessToken");
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

  const normalizeArray = (responseJson) => {
    if (Array.isArray(responseJson)) return responseJson;
    if (responseJson && Array.isArray(responseJson.data)) return responseJson.data;
    if (responseJson && Array.isArray(responseJson.listResults)) return responseJson.listResults;
    return [];
  };

  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const headers = getHeaders();
        const [cinemaRes, movieRes] = await Promise.all([
          fetch(`${API_BASE}/cinemas`, { headers }),
          fetch(`${API_BASE}/movies`, { headers }),
        ]);

        const [cinemaJson, movieJson] = await Promise.all([cinemaRes.json(), movieRes.json()]);
        setCinemas(normalizeArray(cinemaJson));
        setMovies(normalizeArray(movieJson));
      } catch (e) {
        console.error("Lỗi tải dữ liệu đặt vé nhanh:", e);
      }
    };

    fetchBaseData();
  }, []);

  useEffect(() => {
    const fetchShowtimes = async () => {
      if (!selectedCinema || !selectedMovie) {
        setShowtimes([]);
        return;
      }

      try {
        const headers = getHeaders();
        const res = await fetch(
          `${API_BASE}/movies/${selectedMovie}/showtimes?cinemaId=${encodeURIComponent(selectedCinema)}`,
          { headers }
        );
        const json = await res.json();
        const list = normalizeArray(json).filter((st) => !!st.startTime);
        setShowtimes(list);
      } catch (e) {
        console.error("Lỗi tải suất chiếu:", e);
        setShowtimes([]);
      }
    };

    setSelectedDate("");
    setSelectedShowtime("");
    fetchShowtimes();
  }, [selectedCinema, selectedMovie]);

  const availableDates = useMemo(() => {
    const map = new Map();

    showtimes.forEach((st) => {
      const dt = new Date(st.startTime);
      if (Number.isNaN(dt.getTime())) return;
      const dateValue = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
        dt.getDate()
      ).padStart(2, "0")}`;
      if (!map.has(dateValue)) {
        map.set(dateValue, dt.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" }));
      }
    });

    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [showtimes]);

  const availableShowtimes = useMemo(() => {
    if (!selectedDate) return [];

    return showtimes
      .filter((st) => {
        const dt = new Date(st.startTime);
        if (Number.isNaN(dt.getTime())) return false;
        const dateValue = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
          dt.getDate()
        ).padStart(2, "0")}`;
        return dateValue === selectedDate;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [showtimes, selectedDate]);

  const canBookNow = selectedCinema && selectedMovie && selectedDate && selectedShowtime;

  const handleBookNow = () => {
    if (!canBookNow) return;
    const query = new URLSearchParams({
      movieId: String(selectedMovie),
      cinemaId: String(selectedCinema),
      showDate: selectedDate,
      showtimeId: String(selectedShowtime),
    });
    navigateLoading(`/order-ticket?${query.toString()}`);
  };

  const selectBaseClass =
    "w-full bg-black/60 border border-white/20 text-white text-sm md:text-base font-semibold rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#008bd0] focus:border-transparent cursor-pointer shadow-md backdrop-blur-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_14px_center] bg-[length:12px_12px]";

  return (
    <div className="w-full relative z-30 flex justify-center mt-2 mb-2 pt-8">
      <div className="w-[95%] max-w-7xl bg-transparent flex flex-col md:flex-row items-center gap-8 px-6 lg:px-8 relative z-30 rounded-xl">
        {/* Left Title */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-[#008bd0] to-cyan-400 rounded-full shadow-inner hidden md:block"></div>
          <h3 className="text-xl md:text-[26px] font-bold text-white uppercase tracking-wide drop-shadow-lg">
            Đặt vé nhanh
          </h3>
        </div>

        {/* Dropdowns */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
          <select
            value={selectedCinema}
            onChange={(e) => setSelectedCinema(e.target.value)}
            className={selectBaseClass}
          >
            <option value="" className="bg-black text-white">
              1. Chọn Rạp
            </option>
            {cinemas.map((c) => (
              <option key={c.id} value={c.id} className="bg-black text-white">
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={selectedMovie}
            onChange={(e) => setSelectedMovie(e.target.value)}
            className={`${selectBaseClass} ${selectedCinema ? "" : "opacity-70"}`}
            disabled={!selectedCinema}
          >
            <option value="" className="bg-black text-white">
              2. Chọn Phim
            </option>
            {movies.map((m) => (
              <option key={m.id} value={m.id} className="bg-black text-white">
                {m.title}
              </option>
            ))}
          </select>
          <select
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedShowtime("");
            }}
            className={`${selectBaseClass} ${selectedMovie ? "" : "opacity-70"}`}
            disabled={!selectedMovie}
          >
            <option value="" className="bg-black text-white">
              3. Chọn Ngày
            </option>
            {availableDates.map((d) => (
              <option key={d.value} value={d.value} className="bg-black text-white">
                {d.label}
              </option>
            ))}
          </select>
          <select
            value={selectedShowtime}
            onChange={(e) => setSelectedShowtime(e.target.value)}
            className={`${selectBaseClass} ${selectedDate ? "" : "opacity-70"}`}
            disabled={!selectedDate}
          >
            <option value="" className="bg-black text-white">
              4. Chọn Suất
            </option>
            {availableShowtimes.map((st) => (
              <option key={st.id} value={st.id} className="bg-black text-white">
                {new Date(st.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </option>
            ))}
          </select>
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0 w-full md:w-auto">
          <button
            onClick={handleBookNow}
            disabled={!canBookNow}
            className={`w-full md:w-auto text-black font-bold py-2.5 px-8 rounded-lg uppercase shadow-lg transition-all transform
              ${canBookNow ? "bg-amber-500 hover:bg-amber-600 hover:shadow-xl hover:-translate-y-0.5" : "bg-amber-500/50 cursor-not-allowed"}
            `}
          >
            Đặt Ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickBookingBar;
export { QuickBookingBar };
