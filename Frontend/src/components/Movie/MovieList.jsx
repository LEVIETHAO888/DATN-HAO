import { MoveRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import useNagivateLoading from "@/hooks/useNagivateLoading";

const MovieList = ({ title }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
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
        const res = await fetch(`${API_BASE}/movies`, {
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

  return (
    <div className="relative px-20 my-10 min-h-[300px] z-20">
      <div className="mt-5 items-center uppercase text-[26px] font-bold flex mb-5 text-white">
        <div>{title}</div>
        <MoveRight className="scale-150 ml-5 cursor-pointer hover:text-[#008bd0]" />
      </div>

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
        className="w-full"
      >
        {movies.map((movie) => (
          <SwiperSlide key={movie.id} className="pb-5">
            <div
              className="bg-black/60 border border-white/10 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer flex flex-col h-[400px]"
              onClick={() => navigateLoading(`/movie/${movie.id}`)}
            >
              <img
                src={movie.thumbnailUrl || movie.posterUrl || "/banner1.jpg"}
                alt={movie.title}
                className="w-full h-[65%] object-cover object-top"
              />
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-white text-lg font-bold line-clamp-1">{movie.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mt-1">
                    {movie.description || "Nội dung đang cập nhật..."}
                  </p>
                </div>
                <div className="mt-3 flex justify-between items-center gap-2">
                  <button
                    className="flex-1 bg-[#008bd0] hover:bg-[#0070a8] text-white text-[12px] py-1.5 rounded cursor-pointer font-semibold transition-colors text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateLoading(`/movie/${movie.id}`);
                    }}
                  >
                    Xem chi tiết
                  </button>
                  <button
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-black text-[12px] py-1.5 rounded cursor-pointer font-semibold transition-colors text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateLoading("/social/home");
                    }}
                  >
                    Đặt vé
                  </button>
                  <div className="text-yellow-400 text-sm font-bold flex items-center ml-1">
                    <i className="fa-solid fa-star mr-1"></i> {movie.rating || "8.5"}
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default MovieList;
