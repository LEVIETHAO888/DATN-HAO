import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LayoutMovie from "../../components/LayoutMovie";
import useNagivateLoading from "@/hooks/useNagivateLoading";
import { PlayCircle, Ticket, X } from "lucide-react";
import MovieReviewSection from "../../components/Movie/MovieReviewSection";

const getTrailerConfig = (url) => {
  if (!url?.trim()) return null;

  const trimmedUrl = url.trim();
  const lowerUrl = trimmedUrl.toLowerCase();
  const isDirectVideo = [".mp4", ".webm", ".ogg", ".mov", ".m3u8"].some((ext) => lowerUrl.includes(ext));

  if (isDirectVideo) {
    return { type: "video", src: trimmedUrl };
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    const host = parsedUrl.hostname.replace(/^www\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = parsedUrl.pathname.split("/").filter(Boolean)[0] || "";
    } else if (host.includes("youtube.com")) {
      if (parsedUrl.pathname === "/watch") {
        videoId = parsedUrl.searchParams.get("v") || "";
      } else if (parsedUrl.pathname.startsWith("/embed/")) {
        videoId = parsedUrl.pathname.split("/embed/")[1]?.split("/")[0] || "";
      } else if (parsedUrl.pathname.startsWith("/shorts/")) {
        videoId = parsedUrl.pathname.split("/shorts/")[1]?.split("/")[0] || "";
      }
    }

    if (videoId) {
      return {
        type: "youtube",
        src: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
      };
    }
  } catch {
    return null;
  }

  return null;
};

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigateLoading = useNagivateLoading();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const trailerSectionRef = useRef(null);

  useEffect(() => {
    const fetchMovieDetail = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const headers = { "Content-Type": "application/json" };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
        const res = await fetch(`${API_BASE}/movies/${id}`, { method: "GET", headers });
        const data = await res.json();

        let mov = data;
        if (data?.data) mov = data.data;

        if (res.ok && mov) {
          setMovie(mov);
        } else {
          setMovie(null);
        }
      } catch (error) {
        console.error("Loi khi tai chi tiet phim:", error);
        setMovie(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetail();
  }, [id]);

  useEffect(() => {
    setIsTrailerOpen(false);
  }, [id]);

  const trailerConfig = useMemo(() => getTrailerConfig(movie?.trailerUrl), [movie?.trailerUrl]);

  const handleOpenTrailer = () => {
    if (!trailerConfig) {
      alert("Trailer dang duoc cap nhat!");
      return;
    }

    setIsTrailerOpen(true);
    window.requestAnimationFrame(() => {
      trailerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (loading) {
    return (
      <LayoutMovie>
        <div className="w-full min-h-screen bg-[#0b0f19] flex justify-center items-center text-white text-2xl font-bold">
          Dang tai thong tin...
        </div>
      </LayoutMovie>
    );
  }

  if (!movie) {
    return (
      <LayoutMovie>
        <div className="w-full min-h-screen bg-[#0b0f19] flex justify-center items-center text-white text-2xl font-bold flex-col gap-4">
          Khong tim thay trang phim!
          <button
            className="px-6 py-2 bg-[#008bd0] rounded-lg text-lg text-white hover:bg-[#0070a8] transition"
            onClick={() => navigate("/")}
          >
            Quay lai trang chu
          </button>
        </div>
      </LayoutMovie>
    );
  }

  const bgImage = movie.thumbnailUrl || movie.posterUrl || "/banner2.jpg";
  const posterImage = movie.posterUrl || movie.thumbnailUrl || "/banner1.jpg";

  return (
    <LayoutMovie>
      <div className="w-full min-h-screen relative bg-[#0b0f19] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[700px]">
          <img src={bgImage} className="w-full h-full object-cover opacity-30" alt="Background" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/60 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto pt-32 pb-20 px-6 sm:px-10 lg:flex gap-16">
          <div className="w-full sm:w-[350px] shrink-0 mx-auto lg:mx-0 mb-10 lg:mb-0">
            <div className="rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.7)] group relative aspect-[2/3]">
              <img src={posterImage} className="w-full h-full object-cover" alt="Poster" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center items-center">
                <PlayCircle className="text-white scale-150 w-16 h-16 opacity-80" />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end text-white">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold uppercase mb-4 drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm sm:text-base font-semibold text-gray-300">
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg flex items-center gap-1">
                <i className="fa-solid fa-star"></i> {movie.rating || "N/A"}
              </span>
              <span className="px-3 py-1 bg-white/10 rounded-lg">{movie.duration ? `${movie.duration} Phút` : "Đang cập nhật"}</span>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg uppercase">
                {movie.language || "Đang cập nhật"}
              </span>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg uppercase">
                {movie.genre || "Đang cập nhật"}
              </span>
              {(movie.ageLimit || movie.age_limit) && (
                 <span className="px-3 py-1 bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg font-bold">
                   Cấm trẻ em dưới {movie.ageLimit || movie.age_limit} tuổi
                 </span>
              )}
            </div>

            <div className="text-gray-300 text-lg sm:text-xl leading-relaxed mb-8 max-w-4xl text-justify">
              {movie.description || "Đang cập nhật nội dung phim..."}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-10 text-base mb-10 pb-8 border-b border-white/10">
              <div>
                <span className="text-gray-500 font-semibold w-24 inline-block">Đạo diễn:</span>
                <span className="font-bold text-gray-200">{movie.director || "Đang cập nhật..."}</span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold w-24 inline-block">Diễn viên:</span>
                <span className="font-bold text-gray-200">{movie.castMembers || "Đang cập nhật..."}</span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold w-24 inline-block">Khởi chiếu:</span>
                <span className="font-bold text-gray-200">
                  {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString("vi-VN") : "Sắp ra mắt"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold w-24 inline-block">Quốc gia:</span>
                <span className="font-bold text-gray-200">{movie.country || "Đang cập nhật..."}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-5">
              <button
                className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-[0_10px_20px_rgba(245,158,11,0.3)] shadow-amber-500/40"
                onClick={() => navigateLoading(`/order-ticket?movieId=${movie.id}`)}
              >
                <Ticket className="w-6 h-6" /> Mua ve ngay
              </button>

              <button
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/20"
                onClick={handleOpenTrailer}
              >
                <PlayCircle className="w-6 h-6" /> Xem Trailer
              </button>
            </div>
          </div>
        </div>

        {isTrailerOpen ? (
          <div ref={trailerSectionRef} className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 pb-20">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-sm shadow-[0_25px_60px_rgba(0,0,0,0.45)] overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-white/10">
                <div>
                  <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-cyan-300/80">Trailer</p>
                  <h2 className="text-white text-xl sm:text-2xl font-bold mt-1">{movie.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTrailerOpen(false)}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/8 hover:bg-white/14 text-white transition-colors"
                  aria-label="Dong trailer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-black">
                <div className="aspect-video w-full">
                  {trailerConfig?.type === "youtube" ? (
                    <iframe
                      title={`Trailer ${movie.title}`}
                      src={trailerConfig.src}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  ) : trailerConfig?.type === "video" ? (
                    <video className="w-full h-full" controls autoPlay playsInline src={trailerConfig.src}>
                      Trinh duyet cua ban khong ho tro phat video.
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      Trailer dang duoc cap nhat.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Divider */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 mb-10">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Đánh giá phim */}
        <MovieReviewSection movieId={id} />
      </div>
    </LayoutMovie>
  );
};

export default MovieDetailPage;
