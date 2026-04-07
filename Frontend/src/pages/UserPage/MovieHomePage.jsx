import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ThumbsUp,
  MessageSquare,
  MoreHorizontal,
  Globe,
  Search,
  ImagePlus,
  X,
  MapPin,
  Building2,
  Calendar,
} from "lucide-react";
import { canAccessAdminDashboard, getRoleIdFromToken } from "@/utils/jwt";
import { toLocalYmd, isSameLocalDay, getNextSevenDays } from "@/utils/showDate";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

function decodeJwt(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

async function readResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

async function apiRequest(path, { token, headers, ...options } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const data = await readResponse(response);

  if (!response.ok) {
    const message = typeof data === "string" ? data : data?.message || data?.error || "Request failed";
    throw new Error(message);
  }

  return data;
}

async function uploadPostMedia(file, token) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/uploads/post-media`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await readResponse(response);
  if (!response.ok) {
    const message = typeof data === "string" ? data : data?.message || data?.error || "Upload thất bại";
    throw new Error(message);
  }
  if (!data?.url) {
    throw new Error("Máy chủ không trả về đường dẫn media");
  }
  return data.url;
}

function isImageMediaUrl(url) {
  if (!url || url.startsWith("blob:")) {
    return false;
  }
  return /\.(jpe?g|gif|png|webp)(\?|#|$)/i.test(url);
}

function isVideoMediaUrl(url) {
  if (!url) {
    return false;
  }
  if (url.startsWith("blob:")) {
    return true;
  }
  return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url);
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function formatBookingStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();

  switch (normalized) {
    case "pending":
      return "Cho thanh toan";
    case "paid":
    case "completed":
    case "success":
      return "Da thanh toan";
    case "confirmed":
      return "Da xac nhan";
    case "cancelled":
    case "canceled":
      return "Da huy";
    case "expired":
      return "Het han";
    case "refunded":
      return "Da hoan tien";
    default:
      return status || "Khong xac dinh";
  }
}
function formatDate(value) {
  if (!value) {
    return "Chưa có lịch";
  }

  return new Date(value).toLocaleString("vi-VN");
}

const initialPostForm = { content: "" };
const initialBookingForm = { showtimeId: "", seatIds: "" };

export default function MovieHomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const cinemaIdParam = searchParams.get("cinemaId");
  const showDateParam = searchParams.get("showDate");
  const [cinemaBanner, setCinemaBanner] = useState(null);

  const [token] = useState(() => localStorage.getItem("accessToken") || "");
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [posts, setPosts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showtimesByMovie, setShowtimesByMovie] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [likesByPost, setLikesByPost] = useState({});
  const [hasLikedByPost, setHasLikedByPost] = useState({});
  const [postForm, setPostForm] = useState(initialPostForm);
  const [bookingForm, setBookingForm] = useState(initialBookingForm);
  const [commentDraftByPost, setCommentDraftByPost] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState("");
  const [mediaPreviewKind, setMediaPreviewKind] = useState(""); // "image" | "video" | ""
  const [mediaUploading, setMediaUploading] = useState(false);
  const pendingMediaFileRef = useRef(null);
  const fileInputRef = useRef(null);

  const jwtPayload = useMemo(() => decodeJwt(token), [token]);
  const currentEmail = jwtPayload.sub || "movie-user@phimnet";
  const canOpenAdminDashboard = useMemo(() => canAccessAdminDashboard(getRoleIdFromToken(token)), [token]);

  const weekDays = useMemo(() => getNextSevenDays(new Date()), []);

  const moviesForCinemaDay = useMemo(() => {
    if (!cinemaIdParam || !showDateParam) {
      return movies;
    }
    return movies.filter((m) =>
      (showtimesByMovie[m.id] || []).some((st) => isSameLocalDay(st.startTime, showDateParam))
    );
  }, [movies, showtimesByMovie, cinemaIdParam, showDateParam]);

  function pickShowDate(ymd) {
    const next = new URLSearchParams(searchParams);
    if (cinemaIdParam) {
      next.set("cinemaId", cinemaIdParam);
    }
    next.set("showDate", ymd);
    setSearchParams(next, { replace: true });
  }

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const moviePath = cinemaIdParam
        ? `/movies?cinemaId=${encodeURIComponent(cinemaIdParam)}`
        : "/movies";

      const [cinemasData, moviesData, postsData, bookingsData] = await Promise.all([
        apiRequest("/cinemas", { token }).catch(() => []),
        apiRequest(moviePath, { token }),
        apiRequest("/posts", { token }),
        apiRequest("/bookings", { token }),
      ]);

      const nextMovies = Array.isArray(moviesData) ? moviesData : [];
      setCinemas(Array.isArray(cinemasData) ? cinemasData : []);
      const nextPosts = Array.isArray(postsData) ? postsData : [];
      const nextBookings = Array.isArray(bookingsData) ? bookingsData : [];

      setMovies(nextMovies);
      setPosts(nextPosts);
      setBookings(nextBookings);

      if (cinemaIdParam && Array.isArray(cinemasData)) {
        const c = cinemasData.find((x) => String(x.id) === String(cinemaIdParam));
        setCinemaBanner(c ? { name: c.name, location: c.location } : { name: `Rạp #${cinemaIdParam}`, location: "" });
      } else {
        setCinemaBanner(null);
      }

      const showtimeEntries = await Promise.all(
        nextMovies.map(async (movie) => {
          const stPath = cinemaIdParam
            ? `/movies/${movie.id}/showtimes?cinemaId=${encodeURIComponent(cinemaIdParam)}`
            : `/movies/${movie.id}/showtimes`;
          return [movie.id, await apiRequest(stPath, { token })];
        })
      );
      setShowtimesByMovie(Object.fromEntries(showtimeEntries));

      const commentEntries = await Promise.all(
        nextPosts.map(async (post) => [post.id, await apiRequest(`/comments/post/${post.id}`, { token })])
      );
      setCommentsByPost(Object.fromEntries(commentEntries));

      const likeEntries = await Promise.all(
        nextPosts.map(async (post) => [post.id, Number(await apiRequest(`/likes/post/${post.id}/count`, { token })) || 0])
      );
      setLikesByPost(Object.fromEntries(likeEntries));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [cinemaIdParam, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (cinemaIdParam) {
      setActiveTab("movies");
    }
  }, [cinemaIdParam]);

  useEffect(() => {
    if (!cinemaIdParam) {
      return;
    }
    if (!searchParams.get("showDate")) {
      const next = new URLSearchParams(searchParams);
      next.set("showDate", toLocalYmd(new Date()));
      setSearchParams(next, { replace: true });
    }
  }, [cinemaIdParam, searchParams, setSearchParams]);

  function clearCinemaFilter() {
    const next = new URLSearchParams(searchParams);
    next.delete("cinemaId");
    next.delete("showDate");
    setSearchParams(next, { replace: true });
  }

  function clearLocalMedia() {
    if (mediaPreviewUrl && mediaPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    pendingMediaFileRef.current = null;
    setMediaPreviewUrl("");
    setMediaPreviewKind("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handlePickMedia(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setError("Chỉ chọn file ảnh hoặc video.");
      return;
    }
    setError("");
    clearLocalMedia();
    pendingMediaFileRef.current = file;
    const url = URL.createObjectURL(file);
    setMediaPreviewUrl(url);
    setMediaPreviewKind(file.type.startsWith("video/") ? "video" : "image");
  }

  async function handleCreatePost(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const text = (postForm.content || "").trim();
    if (!text && !pendingMediaFileRef.current) {
      setError("Hãy viết gì đó hoặc thêm ảnh/video.");
      return;
    }

    try {
      let mediaUrl = "";
      if (pendingMediaFileRef.current) {
        setMediaUploading(true);
        mediaUrl = await uploadPostMedia(pendingMediaFileRef.current, token);
        clearLocalMedia();
      }

      await apiRequest("/posts", {
        token,
        method: "POST",
        body: JSON.stringify({
          content: text || (mediaUrl ? " " : ""),
          mediaUrl,
        }),
      });
      setPostForm(initialPostForm);
      setMessage("Đã đăng bài. Nếu backend đang duyệt thủ công, bài sẽ xuất hiện sau khi được approve.");
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setMediaUploading(false);
    }
  }

  async function handleComment(postId) {
    const content = (commentDraftByPost[postId] || "").trim();
    if (!content) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await apiRequest("/comments", {
        token,
        method: "POST",
        body: JSON.stringify({
          post: { id: postId },
          content,
        }),
      });
      setCommentDraftByPost((current) => ({ ...current, [postId]: "" }));
      setMessage("Đã thêm bình luận.");
      const comments = await apiRequest(`/comments/post/${postId}`, { token });
      setCommentsByPost((current) => ({ ...current, [postId]: comments }));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleLike(postId) {
    setError("");

    const isCurrentlyLiked = hasLikedByPost[postId];
    const method = isCurrentlyLiked ? "DELETE" : "POST";

    try {
      await apiRequest(`/likes/post/${postId}`, { token, method });
      setHasLikedByPost((current) => ({ ...current, [postId]: !isCurrentlyLiked }));
    } catch (err) {
      if (method === "POST" && (err.message.toLowerCase().includes("already") || err.message.toLowerCase().includes("tồn tại") || err.message.toLowerCase().includes("đã thích"))) {
        try {
          await apiRequest(`/likes/post/${postId}`, { token, method: "DELETE" });
          setHasLikedByPost((current) => ({ ...current, [postId]: false }));
        } catch (e) {
          setError(e.message);
        }
      } else if (method === "DELETE" && (err.message.toLowerCase().includes("not found") || err.message.toLowerCase().includes("không tìm thấy") || err.message.toLowerCase().includes("chưa"))) {
        setHasLikedByPost((current) => ({ ...current, [postId]: false }));
      } else {
        setError(err.message);
      }
    }
    
    try {
        const count = await apiRequest(`/likes/post/${postId}/count`, { token });
        setLikesByPost((current) => ({ ...current, [postId]: Number(count) || 0 }));
    } catch (e) {
      console.error("Không thể lấy số lượt thích mới:", e);
    }
  }

  async function handleCreateBooking(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const seatIds = bookingForm.seatIds
        .split(",")
        .map((value) => Number(value.trim()))
        .filter(Boolean);

      await apiRequest("/bookings", {
        token,
        method: "POST",
        body: JSON.stringify({
          showtimeId: Number(bookingForm.showtimeId),
          seatIds,
        }),
      });

      setBookingForm(initialBookingForm);
      setMessage("Đã tạo booking.");
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function logout() {
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
  }

  return (
    <div className="w-full min-h-screen bg-black/90 text-white">
      <div className="bg-[url('/bgblue.jpg')] bg-cover bg-no-repeat fixed top-0 left-0 right-0 z-50 h-13">
        <div className="flex h-full">
          <div className="flex items-center w-[20%] h-full">
            <img src="/logo.png" className="h-[50px] pl-6" />
            <p className="text-[24px] font-bold pl-3 flex items-center">PhimNet</p>
          </div>
          <div className="flex text-lg m-auto items-center justify-center flex-wrap flex-1 min-w-0">
            <div 
              className={`px-12 py-2 rounded-t-md cursor-pointer transition-all ${activeTab === 'home' ? 'bg-white/10 border-b-4 border-white/90 font-bold' : 'hover:bg-white/5'}`}
              onClick={() => setActiveTab("home")}
            >
              Trang chủ
            </div>
            <div 
              className={`px-12 py-2 rounded-t-md cursor-pointer transition-all ${activeTab === 'movies' ? 'bg-white/10 border-b-4 border-white/90 font-bold' : 'hover:bg-white/5'}`}
              onClick={() => setActiveTab("movies")}
            >
              Phim
            </div>
            <div 
              className={`px-12 py-2 rounded-t-md cursor-pointer transition-all ${activeTab === 'booking' ? 'bg-white/10 border-b-4 border-white/90 font-bold' : 'hover:bg-white/5'}`}
              onClick={() => setActiveTab("booking")}
            >
              Booking
            </div>
            <div
              className={`px-12 py-2 rounded-t-md cursor-pointer transition-all ${activeTab === "cinema" ? "bg-white/10 border-b-4 border-white/90 font-bold" : "hover:bg-white/5"}`}
              onClick={() => setActiveTab("cinema")}
              role="button"
            >
              Chọn rạp
            </div>
            {canOpenAdminDashboard ? (
              <div
                className="px-6 py-2 rounded-t-md cursor-pointer transition-all text-amber-300 hover:bg-white/10 font-semibold text-base"
                onClick={() => { window.location.href = "/admin/dashboard"; }}
                role="button"
              >
                Admin Dashboard
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-end gap-2 sm:gap-3 p-3 sm:p-5 w-[20%] shrink-0 min-w-0">
            <div className="text-sm text-right min-w-0">
              <div className="font-semibold">{currentEmail}</div>
              <div className="text-white/60">Đã đăng nhập</div>
            </div>
            <Avatar className="scale-105">
              <AvatarImage src="/defaultavt.png" className="object-cover" />
              <AvatarFallback>{currentEmail.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <button className="cursor-pointer hover:underline" onClick={logout} type="button">
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div className="w-full pt-13 h-screen flex relative">
        <div className="w-[25%] h-[calc(100vh-52px)] left-0 fixed overflow-y-auto p-3">
          <div className="rounded-2xl bg-white/10 p-4 mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/defaultavt.png" className="object-cover" />
                <AvatarFallback>{currentEmail.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{currentEmail}</div>
                <div className="text-sm text-white/60">Tài khoản PhimNet</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 mb-3">
            <div className="text-gray-300 mb-3">Tổng quan nhanh</div>
            <div className="space-y-3">
              <div className="rounded-xl bg-black/20 p-3">
                <div className="text-sm text-white/60">Phim hiện có</div>
                <div className="text-2xl font-bold">{movies.length}</div>
              </div>
              <div className="rounded-xl bg-black/20 p-3">
                <div className="text-sm text-white/60">Bài cộng đồng</div>
                <div className="text-2xl font-bold">{posts.length}</div>
              </div>
              <div className="rounded-xl bg-black/20 p-3">
                <div className="text-sm text-white/60">Booking của bạn</div>
                <div className="text-2xl font-bold">{bookings.length}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-4">
            <div className="text-gray-300 mb-3">Phim nổi bật</div>
            <div className="space-y-2">
              {moviesForCinemaDay.slice(0, 5).map((movie) => (
                <div key={movie.id} className="rounded-xl bg-black/20 p-3">
                  <div className="font-semibold">{movie.title}</div>
                  <div className="text-sm text-white/60">{movie.description || "Chưa có mô tả."}</div>
                </div>
              ))}
              {!movies.length ? <div className="text-white/60">Chưa có dữ liệu phim.</div> : null}
            </div>
          </div>
        </div>

        <div className="w-[50%] ml-[25%] h-[calc(100vh-52px)] overflow-y-auto p-4">
          {cinemaBanner ? (
            <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-[#008bd0]/15 border border-[#008bd0]/35 px-4 py-3 text-sm">
              <span className="flex items-center gap-2 text-white/95">
                <MapPin className="w-4 h-4 shrink-0 text-[#008bd0]" />
                <span>
                  Suất chiếu tại: <strong className="text-white">{cinemaBanner.name}</strong>
                  {cinemaBanner.location ? (
                    <span className="text-gray-300"> — {cinemaBanner.location}</span>
                  ) : null}
                </span>
              </span>
              <button
                type="button"
                onClick={clearCinemaFilter}
                className="shrink-0 text-amber-300 hover:text-amber-200 font-semibold underline-offset-2 hover:underline text-left sm:text-right"
              >
                Xem tất cả rạp
              </button>
            </div>
          ) : null}
          {cinemaBanner && showDateParam ? (
            <div className="mb-3 rounded-xl border border-white/10 bg-[#1c1d1f]/90 px-3 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                <Calendar className="w-4 h-4 text-[#008bd0] shrink-0" />
                <span className="font-semibold text-white/90">Chọn ngày chiếu</span>
                <span className="text-white/50 hidden sm:inline">· 7 ngày tới</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {weekDays.map((d) => {
                  const ymd = toLocalYmd(d);
                  const selected = ymd === showDateParam;
                  const isToday = ymd === toLocalYmd(new Date());
                  return (
                    <button
                      key={ymd}
                      type="button"
                      onClick={() => pickShowDate(ymd)}
                      className={`shrink-0 flex flex-col items-center justify-center min-w-[4.5rem] rounded-xl border px-2 py-2 transition-all ${
                        selected
                          ? "bg-[#008bd0] border-[#008bd0] text-white shadow-md"
                          : "bg-black/30 border-white/15 text-gray-300 hover:border-[#008bd0]/50 hover:bg-white/5"
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wide opacity-80">
                        {d.toLocaleDateString("vi-VN", { weekday: "short" })}
                      </span>
                      <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
                      <span className="text-[10px] opacity-70">
                        {d.toLocaleDateString("vi-VN", { month: "short" })}
                      </span>
                      {isToday ? (
                        <span className="text-[9px] font-semibold text-amber-300 mt-0.5">Hôm nay</span>
                      ) : (
                        <span className="h-3" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {message ? <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-3 mb-3">{message}</div> : null}
          {error ? <div className="rounded-xl bg-red-500/20 border border-red-500/40 p-3 mb-3">{error}</div> : null}

          {activeTab === "home" && (
            <>
              <div className="w-full bg-[#242526] mb-3 rounded-lg border border-[#3e4042] shadow-md overflow-hidden">
                <form className="p-3" onSubmit={handleCreatePost}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handlePickMedia}
                  />
                  <div className="flex gap-2.5 items-start">
                    <Avatar className="h-10 w-10 shrink-0 ring-2 ring-[#3e4042]">
                      <AvatarImage src="/defaultavt.png" className="object-cover" />
                      <AvatarFallback className="text-sm">{currentEmail.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <textarea
                      rows={1}
                      placeholder={`${currentEmail.split("@")[0]} ơi, bạn đang nghĩ gì?`}
                      value={postForm.content}
                      onChange={(event) => setPostForm((current) => ({ ...current, content: event.target.value }))}
                      className="flex-1 min-h-[40px] max-h-[100px] resize-none rounded-[20px] bg-[#3a3b3c] px-3.5 py-2.5 text-[15px] text-[#e4e6eb] placeholder-[#b0b3b8] outline-none border border-transparent focus:border-[#008bd0]/50 transition-colors leading-snug"
                    />
                  </div>

                  {mediaPreviewUrl ? (
                    <div className="relative mt-2.5 rounded-lg overflow-hidden bg-black/50 border border-[#3e4042] max-h-[220px] flex items-center justify-center">
                      <button
                        type="button"
                        onClick={clearLocalMedia}
                        className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 border border-white/20"
                        aria-label="Gỡ ảnh hoặc video"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {mediaPreviewKind === "video" ? (
                        <video src={mediaPreviewUrl} controls className="max-h-[210px] w-full object-contain" />
                      ) : (
                        <img src={mediaPreviewUrl} alt="" className="max-h-[210px] w-full object-contain" />
                      )}
                    </div>
                  ) : null}

                  <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#3e4042] pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[15px] font-semibold text-[#b0b3b8] hover:bg-[#3a3b3c]/80 transition-colors sm:flex-none sm:justify-start sm:px-3"
                    >
                      <ImagePlus className="h-5 w-5 text-[#45bd62]" strokeWidth={2} />
                      <span>Ảnh/video</span>
                    </button>
                    <button
                      type="submit"
                      disabled={mediaUploading}
                      className="shrink-0 rounded-md bg-[#2374e1] px-5 py-1.5 text-[15px] font-semibold text-white hover:bg-[#1877f2] disabled:opacity-50 disabled:pointer-events-none transition-colors min-w-[88px]"
                    >
                      {mediaUploading ? "…" : "Đăng"}
                    </button>
                  </div>
                </form>
              </div>

          {loading ? <div className="text-center text-white/70 py-10">Đang tải dữ liệu...</div> : null}

          <div className="space-y-4 pb-8">
            {posts.map((post) => (
              <div key={post.id} className="rounded-xl bg-[#242526] border border-white/10 shadow-lg overflow-hidden mb-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 pb-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarImage src="/defaultavt.png" className="object-cover" />
                      <AvatarFallback>{post.user?.username?.slice(0, 1)?.toUpperCase() || "P"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[15px] hover:underline cursor-pointer">{post.user?.username || "Người dùng ẩn danh"}</span>
                      <div className="flex items-center text-[12px] text-gray-400 gap-1">
                        <span className="hover:underline cursor-pointer">Post #{post.id}</span>
                        <span>•</span>
                        <Globe className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors text-gray-400">
                    <MoreHorizontal className="w-5 h-5" />
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 pb-3 pt-1 text-[15px] whitespace-pre-wrap">{post.content}</div>
                
                {/* Media (Full width, no padding if URL exists) */}
                {post.mediaUrl ? (
                  <div className="w-full overflow-hidden bg-black/50 flex justify-center items-center">
                    {isImageMediaUrl(post.mediaUrl) ? (
                      <img src={post.mediaUrl} className="w-full object-contain max-h-[500px]" alt="Post media" />
                    ) : isVideoMediaUrl(post.mediaUrl) ? (
                      <video
                        src={post.mediaUrl}
                        controls
                        playsInline
                        className="w-full object-contain max-h-[500px] bg-black"
                      />
                    ) : (
                      <a className="text-[#2b90d9] break-all p-4 hover:underline" href={post.mediaUrl} rel="noreferrer" target="_blank">
                        {post.mediaUrl}
                      </a>
                    )}
                  </div>
                ) : null}

                {/* Stats Row */}
                <div className="px-4 py-2 flex items-center justify-between text-gray-400 text-sm border-b border-white/10 mx-3 mt-1">
                  <div className="flex items-center gap-1.5 cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                      <ThumbsUp className="w-3 h-3 text-white fill-white" />
                    </div>
                    <span className="hover:underline">{likesByPost[post.id] || 0}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="hover:underline cursor-pointer">{commentsByPost[post.id]?.length || 0} bình luận</span>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex px-4 py-1 gap-1 border-b border-white/10 mx-3">
                  <button 
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 font-semibold text-sm"
                    onClick={() => handleLike(post.id)}
                  >
                    <ThumbsUp className={`w-5 h-5 ${hasLikedByPost[post.id] ? "text-blue-500 fill-blue-500" : ""}`} /> 
                    <span className={hasLikedByPost[post.id] ? "text-blue-500" : ""}>Thích</span>
                  </button>
                  <button 
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 font-semibold text-sm"
                    onClick={() => {
                        const input = document.getElementById(`comment-input-${post.id}`);
                        if(input) input.focus();
                    }}
                  >
                    <MessageSquare className="w-5 h-5" /> Bình luận
                  </button>
                </div>

                {/* Comments Section */}
                <div className="px-4 py-3 space-y-3">
                  {(commentsByPost[post.id] || []).map((comment) => (
                    <div key={comment.id} className="flex gap-2 group">
                      <Avatar className="w-8 h-8 mt-1 cursor-pointer">
                         <AvatarImage src="/defaultavt.png" className="object-cover" />
                         <AvatarFallback>{comment.user?.username?.slice(0, 1)?.toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                         <div className="bg-[#3a3b3c] rounded-2xl px-3 py-2 max-w-[90%] inline-block">
                           <div className="text-[13px] font-semibold cursor-pointer hover:underline text-gray-200">{comment.user?.username || "Người dùng"}</div>
                           <div className="text-[15px]">{comment.content}</div>
                         </div>
                         <div className="flex gap-4 text-[12px] text-gray-400 font-bold mt-1 ml-2">
                            <span className="cursor-pointer hover:underline text-gray-400">Thích</span>
                            <span className="cursor-pointer hover:underline text-gray-400">Phản hồi</span>
                            <span className="font-normal">Vừa xong</span>
                         </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Write comment */}
                  <div className="flex gap-2 pt-2 items-center">
                    <Avatar className="w-8 h-8 cursor-pointer">
                       <AvatarImage src="/defaultavt.png" className="object-cover" />
                       <AvatarFallback>{currentEmail.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 relative">
                      <input
                        id={`comment-input-${post.id}`}
                        type="text"
                        value={commentDraftByPost[post.id] || ""}
                        onChange={(event) => setCommentDraftByPost((current) => ({ ...current, [post.id]: event.target.value }))}
                        onKeyDown={(e) => {
                           if(e.key === 'Enter') handleComment(post.id);
                        }}
                        placeholder="Viết bình luận công khai..."
                        className="w-full h-9 bg-[#3a3b3c] rounded-full pl-3 pr-10 outline-none text-[15px] placeholder-gray-400 border border-transparent focus:border-white/20 transition-all"
                      />
                      <button 
                         className="absolute right-2 top-1.5 text-[#008bd0] hover:text-[#0070a8] transition-colors"
                         onClick={() => handleComment(post.id)}
                      >
                         <MessageSquare className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {!loading && !posts.length ? (
              <div className="rounded-lg bg-white/10 p-6 text-center text-white/60">Chưa có bài đăng nào được duyệt.</div>
            ) : null}
          </div>
          </>
          )}

          {activeTab === "movies" && (
            <div className="space-y-4 pb-8">
               <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                 <div className="text-2xl font-bold uppercase text-[#008bd0]">
                 Phim đang chiếu
                 {cinemaIdParam ? (
                   <span className="block text-sm font-normal text-gray-400 normal-case mt-1">
                     Theo rạp đã chọn
                     {showDateParam ? (
                       <span className="block text-[#008bd0]/90 mt-0.5">
                         Ngày:{" "}
                         {new Date(`${showDateParam}T12:00:00`).toLocaleDateString("vi-VN", {
                           weekday: "long",
                           day: "numeric",
                           month: "long",
                           year: "numeric",
                         })}
                       </span>
                     ) : null}
                   </span>
                 ) : null}
               </div>
                 <div className="flex items-center bg-[#242526] border border-white/20 rounded-full px-4 py-2 w-[350px] shadow-lg transition-all focus-within:border-[#008bd0] focus-within:shadow-[0_0_10px_#008bd040]">
                   <Search className="text-gray-400 w-5 h-5 mr-3" />
                   <input 
                      type="text" 
                      placeholder="Tìm kiếm theo tên phim..." 
                      className="bg-transparent outline-none text-white w-full text-[15px] placeholder-gray-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                   />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                   {moviesForCinemaDay
                      .filter(m => m.title.toLowerCase().includes((searchQuery || "").toLowerCase()))
                      .map(movie => (
                      <div 
                         key={movie.id} 
                         className="bg-black/60 border border-white/10 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 flex flex-col h-[420px] cursor-pointer"
                         onClick={() => window.location.href = `/movie/${movie.id}`}
                      >
                         <img src={movie.thumbnailUrl || movie.posterUrl || "/banner1.jpg"} className="w-full h-[60%] object-cover object-top" />
                         <div className="p-4 flex flex-col justify-between flex-1">
                            <div>
                              <h3 className="text-white text-lg font-bold line-clamp-1">{movie.title}</h3>
                              <p className="text-gray-400 text-sm line-clamp-2 mt-1">{movie.description || "Nội dung đang cập nhật..."}</p>
                            </div>
                            <div className="mt-3 flex gap-2 items-center">
                               <button 
                                 className="flex-1 bg-[#008bd0] hover:bg-[#0070a8] py-1.5 rounded cursor-pointer text-sm text-white font-semibold transition-colors"
                                 onClick={(e) => { e.stopPropagation(); window.location.href = `/movie/${movie.id}`; }}
                               >
                                 Xem chi tiết
                               </button>
                               <button 
                                 className="flex-1 bg-amber-500 hover:bg-amber-600 py-1.5 rounded cursor-pointer text-sm text-black font-semibold transition-colors"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   const q = new URLSearchParams({ movieId: String(movie.id) });
                                   if (cinemaIdParam) {
                                     q.set("cinemaId", cinemaIdParam);
                                   }
                                   if (showDateParam) {
                                     q.set("showDate", showDateParam);
                                   }
                                   window.location.href = `/order-ticket?${q.toString()}`;
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
                   ))}
               </div>
               {!loading && moviesForCinemaDay.filter(m => m.title.toLowerCase().includes((searchQuery || "").toLowerCase())).length === 0 && (
                   <div className="text-center text-white/50 bg-white/10 p-6 rounded-xl flex flex-col items-center justify-center min-h-[200px]">
                       <Search className="w-10 h-10 mb-3 opacity-30" />
                       <div className="text-lg">
                         {movies.length === 0
                           ? "Chưa có dữ liệu phim."
                           : cinemaIdParam && showDateParam && moviesForCinemaDay.length === 0
                             ? "Không có suất chiếu nào trong ngày đã chọn. Hãy chọn ngày khác ở trên."
                             : "Không tìm thấy kết quả phù hợp với từ khóa tìm kiếm."}
                       </div>
                   </div>
               )}
            </div>
          )}

          {activeTab === "booking" && (
            <div className="space-y-4 pb-8">
               <div className="text-2xl font-bold mb-4 uppercase text-amber-500 border-b border-white/10 pb-2">Lịch sử đặt vé</div>
               <div className="grid grid-cols-1 gap-4">
                  {bookings.map(booking => (
                     <div key={booking.id} className="bg-black/40 border border-white/10 rounded-xl p-5 hover:bg-white/5 transition-colors">
                         <div className="flex justify-between items-center mb-3">
                           <div className="font-bold text-lg">Mã Booking: #{booking.id}</div>
                           <div className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-semibold border border-green-500/30 uppercase">{formatBookingStatus(booking.status)}</div>
                         </div>
                         <div className="text-white/80 space-y-1">
                            <div><span className="text-white/50 w-24 inline-block">Lịch chiếu:</span> #{booking.showtime?.id}</div>
                            <div><span className="text-white/50 w-24 inline-block">Mã phim:</span> {booking.showtime?.movieId || "N/A"}</div>
                            <div><span className="text-white/50 w-24 inline-block">Tổng tiền:</span> <span className="text-amber-400 font-bold text-lg">{formatMoney(booking.totalPrice)} đ</span></div>
                         </div>
                     </div>
                  ))}
               </div>
               {!loading && bookings.length === 0 && <div className="text-center text-white/50 bg-white/10 p-6 rounded-xl">Bạn chưa có đặt vé nào.</div>}
            </div>
          )}

          {activeTab === "cinema" && (
            <div className="space-y-4 pb-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#008bd0]/15 text-[#008bd0] mb-3">
                  <Building2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold uppercase text-[#008bd0] border-b border-white/10 pb-3 mb-2">Chọn rạp chiếu phim</h2>
                <p className="text-gray-400 text-sm max-w-xl mx-auto">
                  Chọn rạp để xem phim và suất chiếu tại đúng địa điểm bạn muốn.
                </p>
              </div>
              {loading ? (
                <div className="text-center text-white/70 py-16">Đang tải danh sách rạp...</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {cinemas.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.set("cinemaId", String(c.id));
                        next.set("showDate", toLocalYmd(new Date()));
                        setSearchParams(next);
                        setActiveTab("movies");
                      }}
                      className="text-left rounded-2xl border border-white/10 bg-[#1c1d1f] p-5 hover:border-[#008bd0]/50 hover:bg-[#252628] transition-all duration-200 shadow-lg group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#008bd0]/20 text-[#008bd0] group-hover:bg-[#008bd0]/30 transition-colors">
                          <MapPin className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-bold text-white group-hover:text-[#008bd0] transition-colors">{c.name}</h3>
                          <p className="text-gray-400 text-sm mt-1 flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-60" />
                            <span>{c.location || "Đang cập nhật địa chỉ"}</span>
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 text-sm font-semibold text-[#008bd0] opacity-90 group-hover:opacity-100">
                        Xem phim tại rạp này →
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {!loading && !cinemas.length ? (
                <div className="text-center rounded-xl border border-white/10 bg-[#1c1d1f] py-14 text-gray-500">
                  Chưa có rạp trong hệ thống. Vui lòng liên hệ quản trị viên.
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="w-[25%] h-[calc(100vh-52px)] fixed right-0 overflow-y-auto p-3">
          <div className="rounded-2xl bg-white/10 p-4 mb-3">
            <div className="text-gray-300 mb-3">Lịch chiếu sắp tới</div>
            <div className="space-y-3">
              {moviesForCinemaDay.slice(0, 4).map((movie) => {
                const showtimes = showtimesByMovie[movie.id] || [];
                const dayList =
                  cinemaIdParam && showDateParam
                    ? showtimes
                        .filter((st) => isSameLocalDay(st.startTime, showDateParam))
                        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                    : [...showtimes].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                const nextShowtime = dayList[0];

                return (
                  <div key={movie.id} className="rounded-xl bg-black/20 p-3">
                    <div className="font-semibold">{movie.title}</div>
                    <div className="text-sm text-white/60">{formatDate(nextShowtime?.startTime)}</div>
                    <div className="text-sm text-amber-300">{nextShowtime ? `${formatMoney(nextShowtime.price)} đ` : "Chưa có giá"}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 mb-3">
            <div className="text-gray-300 mb-3">Đặt vé nhanh</div>
            <form className="space-y-3" onSubmit={handleCreateBooking}>
              <input
                type="number"
                placeholder="Showtime ID"
                value={bookingForm.showtimeId}
                onChange={(event) => setBookingForm((current) => ({ ...current, showtimeId: event.target.value }))}
                className="w-full h-10 bg-white/10 rounded-2xl px-4 outline-none placeholder-white/30"
                required
              />
              <input
                type="text"
                placeholder="Seat IDs, ví dụ 1,2"
                value={bookingForm.seatIds}
                onChange={(event) => setBookingForm((current) => ({ ...current, seatIds: event.target.value }))}
                className="w-full h-10 bg-white/10 rounded-2xl px-4 outline-none placeholder-white/30"
                required
              />
              <button className="w-full rounded-lg bg-amber-500/80 py-2 font-semibold text-black hover:bg-amber-400" type="submit">
                Tạo booking
              </button>
            </form>
          </div>

          <div className="rounded-2xl bg-white/10 p-4">
            <div className="text-gray-300 mb-3">Booking gần đây</div>
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="rounded-xl bg-black/20 p-3">
                  <div className="font-semibold">Booking #{booking.id}</div>
                  <div className="text-sm text-white/60">Showtime #{booking.showtime?.id || "?"}</div>
                  <div className="text-sm text-white/60">Trạng thái: {formatBookingStatus(booking.status)}</div>
                  <div className="text-sm text-amber-300">{formatMoney(booking.totalPrice)} đ</div>
                </div>
              ))}
              {!bookings.length ? <div className="text-white/60">Bạn chưa có booking nào.</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


