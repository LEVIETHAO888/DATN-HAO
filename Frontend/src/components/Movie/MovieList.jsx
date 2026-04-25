import { MoveRight, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import useNagivateLoading from "@/hooks/useNagivateLoading";

const MovieCard = ({ movie, navigateLoading, hideBooking }) => (
  <div
    className="group relative h-[450px] w-full rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-cyan-500/20 transition-all duration-300"
    onClick={() => navigateLoading(`/movie/${movie.id}`)}
  >
    <img
      src={movie.thumbnailUrl || movie.posterUrl || "/banner1.jpg"}
      alt={movie.title}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-[#060b19] via-black/50 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
    
    <div className="absolute inset-0 p-5 flex flex-col justify-end">
      <div className="translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white text-xl font-bold line-clamp-1 drop-shadow-md pr-2">{movie.title}</h3>
          <div className="flex bg-black/60 backdrop-blur-md px-2 py-1 rounded-md items-center gap-1 shadow-md">
             <i className="fa-solid fa-star text-yellow-400 text-sm"></i>
             <span className="text-white font-bold text-sm">{movie.rating || "8.5"}</span>
          </div>
        </div>
        
        <p className="text-gray-300 text-sm line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
          {movie.description || "Nội dung đang cập nhật..."}
        </p>

        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-150 relative z-10">
          <button
            className="flex-1 bg-gradient-to-r from-[#008bd0] to-[#00bfff] hover:from-[#0070a8] hover:to-[#008bd0] text-white text-sm py-2 px-4 rounded-lg font-bold shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5"
            onClick={(e) => {
              e.stopPropagation();
              navigateLoading(`/movie/${movie.id}`);
            }}
          >
            Chi Tiết
          </button>
          {!hideBooking && (
            <button
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm py-2 px-4 rounded-lg font-bold shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5"
              onClick={(e) => {
                e.stopPropagation();
                navigateLoading(`/order-ticket?movieId=${movie.id}`);
              }}
            >
              Đặt Vé
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

const MovieList = ({ title, viewMoreLink, isGrid = false, hideBooking = false, hideSearch = false, titleClassName, status }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigateLoading = useNagivateLoading();

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const headers = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
        const url = status && status !== "all" 
          ? `${API_BASE}/movies?status=${status}` 
          : `${API_BASE}/movies`;
        
        const res = await fetch(url, {
          method: "GET",
          headers,
        });

        const responseData = await res.json();

        let moviesArray = [];
        if (Array.isArray(responseData)) {
          moviesArray = responseData;
        } else if (responseData && Array.isArray(responseData.data)) {
          moviesArray = responseData.data;
        } else if (responseData && Array.isArray(responseData.listResults)) {
          moviesArray = responseData.listResults;
        }

        if (res.ok && moviesArray.length > 0) {
          setMovies([...moviesArray].sort(() => 0.5 - Math.random()));
        } else {
          setMovies([]);
        }
      } catch (error) {
        console.error("Lỗi khi tải phim:", error);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) {
    return (
      <div className="relative px-20 my-10 min-h-[300px] z-20">
        <div className="mt-5 items-center uppercase text-[26px] font-bold flex mb-5 text-white">
          <div>{title}</div>
          <MoveRight className="scale-150 ml-5" />
        </div>
        <div className="flex justify-center items-center h-[200px] text-gray-400 text-xl font-bold rounded-2xl bg-white/10">
          Đang tải danh sách phim...
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="relative px-20 my-10 min-h-[300px] z-20">
        <div className="mt-5 items-center uppercase text-[26px] font-bold flex mb-5 text-white">
          <div>{title}</div>
          <MoveRight className="scale-150 ml-5 cursor-pointer hover:text-[#008bd0]" />
        </div>
        <div className="flex justify-center items-center h-[200px] text-gray-400 text-xl font-bold rounded-2xl bg-white/10">
          Chưa có phim nào.
        </div>
      </div>
    );
  }

  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative px-20 my-10 min-h-[300px] z-20">
      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6 mb-8 mt-5">
        <h2 className={`text-3xl font-black uppercase tracking-wider shrink-0 ${titleClassName || "text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400"}`}>
          {title}
        </h2>
        <div className="flex-1 h-[2px] bg-gradient-to-r from-[#008bd0]/50 to-transparent hidden md:block"></div>
        
        {!hideSearch && (
          <div className="relative w-full md:w-64 shrink-0">
            <input
              type="text"
              placeholder="Tìm kiếm phim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1c1d1f] border border-white/10 text-white text-sm rounded-full pl-4 pr-10 py-2 focus:outline-none focus:border-[#008bd0] transition-colors shadow-inner"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        )}

        {viewMoreLink && (
          <div 
            className="group flex items-center space-x-2 cursor-pointer shrink-0"
            onClick={() => navigateLoading(viewMoreLink)}
          >
            <span className="text-[#008bd0] font-semibold text-sm uppercase tracking-widest group-hover:text-[#00bfff] transition-colors">Xem tất cả</span>
            <MoveRight className="text-[#008bd0] group-hover:text-[#00bfff] group-hover:translate-x-2 transition-all" />
          </div>
        )}
      </div>

      {isGrid ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {filteredMovies.length > 0 ? (
            filteredMovies.map((movie) => (
              <div key={movie.id} className="pb-5">
                <MovieCard movie={movie} navigateLoading={navigateLoading} hideBooking={hideBooking} />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500 italic">
               Không tìm thấy kết quả nào trùng khớp.
            </div>
          )}
        </div>
      ) : filteredMovies.length > 0 ? (
        <Swiper
          spaceBetween={20}
          slidesPerView={4}
          navigation={true}
          modules={[Navigation]}
          breakpoints={{
            320: { slidesPerView: 1, spaceBetween: 10 },
            640: { slidesPerView: 2, spaceBetween: 20 },
            768: { slidesPerView: 3, spaceBetween: 20 },
            1024: { slidesPerView: 4, spaceBetween: 20 },
          }}
          className="w-full pb-10"
        >
          {filteredMovies.map((movie) => (
            <SwiperSlide key={movie.id} className="pb-8 pt-4">
              <MovieCard movie={movie} navigateLoading={navigateLoading} hideBooking={hideBooking} />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="w-full text-center py-10 text-gray-500 italic">
           Không tìm thấy kết quả nào trùng khớp.
        </div>
      )}
      {viewMoreLink && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => navigateLoading(viewMoreLink)}
            className="w-40 text-[18px] p-2 flex justify-center border-2 border-[#46acdf] text-[#008bd0] font-bold hover:bg-[#008bd0] hover:text-white hover:shadow-lg hover:shadow-[#008bd0] transition-all duration-300 cursor-pointer"
          >
            XEM THÊM &gt;&gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default MovieList;
