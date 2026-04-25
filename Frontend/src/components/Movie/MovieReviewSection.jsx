import React, { useCallback, useEffect, useState } from "react";
import { Star, Trash2, Send, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const StarRating = ({ value, onChange, readonly = false, size = "md" }) => {
  const [hovered, setHovered] = useState(0);
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  const iconSize = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 10 }, (_, i) => {
        const starVal = i + 1;
        const filled = (readonly ? value : (hovered || value)) >= starVal;
        return (
          <button
            key={starVal}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange && onChange(starVal)}
            onMouseEnter={() => !readonly && setHovered(starVal)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={`transition-all duration-100 ${readonly ? "cursor-default" : "cursor-pointer hover:scale-125"}`}
            aria-label={`${starVal} sao`}
          >
            <Star
              className={`${iconSize} transition-colors ${
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-gray-600"
              }`}
            />
          </button>
        );
      })}
      {!readonly && (hovered || value) > 0 && (
        <span className="ml-2 text-amber-400 font-bold text-sm">
          {hovered || value}/10
        </span>
      )}
    </div>
  );
};

const ReviewCard = ({ review, currentUserId, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.content && review.content.length > 250;
  const displayContent = isLong && !expanded ? review.content.slice(0, 250) + "..." : review.content;
  const isOwner = currentUserId && review.userId === currentUserId;

  const initials = review.username
    ? review.username.slice(0, 2).toUpperCase()
    : "??";

  return (
    <div className="group relative rounded-2xl bg-white/[0.04] border border-white/8 hover:border-white/15 hover:bg-white/[0.06] transition-all duration-300 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{review.username}</p>
            <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Rating badge */}
          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-amber-400 font-bold text-sm">{review.rating}/10</span>
          </div>

          {isOwner && (
            <button
              onClick={() => onDelete(review.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400"
              title="Xóa đánh giá của bạn"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {review.content && (
        <div className="mt-2">
          <p className="text-gray-300 text-sm leading-relaxed">{displayContent}</p>
          {isLong && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-1 text-cyan-400 text-xs flex items-center gap-1 hover:text-cyan-300 transition-colors"
            >
              {expanded ? (
                <><ChevronUp className="w-3 h-3" /> Thu gọn</>
              ) : (
                <><ChevronDown className="w-3 h-3" /> Xem thêm</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const MovieReviewSection = ({ movieId }) => {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form state
  const [myRating, setMyRating] = useState(0);
  const [myContent, setMyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const token = localStorage.getItem("accessToken");
  const isLoggedIn = !!token;

  // Lấy userId từ JWT (decode đơn giản)
  const getCurrentUserId = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub ? null : payload.userId || payload.id || null;
    } catch {
      return null;
    }
  };

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/movies/${movieId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setAvgRating(data.averageRating);
        setTotalReviews(data.totalReviews || 0);
      }
    } catch (e) {
      console.error("Lỗi tải reviews:", e);
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  const fetchMyReview = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await fetch(`${API_BASE}/movies/${movieId}/reviews/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyReview(data);
        if (data) {
          setMyRating(data.rating || 0);
          setMyContent(data.content || "");
        }
      }
    } catch {
      // ignore
    }
  }, [movieId, isLoggedIn, token]);

  useEffect(() => {
    fetchReviews();
    fetchMyReview();
  }, [fetchReviews, fetchMyReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!myRating || myRating < 1) {
      setFormError("Vui lòng chọn số sao trước khi gửi.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/movies/${movieId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: myRating, content: myContent }),
      });
      if (res.ok) {
        const data = await res.json();
        setMyReview(data);
        setFormSuccess(myReview ? "Đã cập nhật đánh giá!" : "Đã gửi đánh giá thành công!");
        fetchReviews();
      } else {
        const err = await res.text();
        setFormError(err || "Gửi thất bại, vui lòng thử lại.");
      }
    } catch {
      setFormError("Không thể kết nối server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Xóa đánh giá này?")) return;
    try {
      await fetch(`${API_BASE}/movies/${movieId}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyReview(null);
      setMyRating(0);
      setMyContent("");
      setFormSuccess("");
      fetchReviews();
    } catch {
      alert("Xóa thất bại.");
    }
  };

  // Phân phối sao để hiện thanh histogram
  const ratingDistribution = Array.from({ length: 10 }, (_, i) => {
    const star = 10 - i;
    const count = reviews.filter((r) => r.rating === star).length;
    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { star, count, pct };
  });

  const currentUserId = getCurrentUserId();

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 pb-24 mt-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600" />
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Đánh Giá Phim
        </h2>
        {totalReviews > 0 && (
          <span className="px-3 py-0.5 rounded-full bg-white/10 text-gray-300 text-sm font-medium">
            {totalReviews} lượt
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT — Tổng quan + Form */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Tổng quan điểm */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/8 p-6 text-center">
            {avgRating != null ? (
              <>
                <div className="text-7xl font-black text-white mb-1 leading-none">
                  {avgRating.toFixed(1)}
                </div>
                <div className="text-gray-400 text-sm mb-4">/ 10 điểm</div>
                <StarRating value={Math.round(avgRating)} readonly size="sm" />
                <p className="text-gray-500 text-xs mt-3">{totalReviews} đánh giá</p>
              </>
            ) : (
              <div className="text-gray-500 py-4">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Chưa có đánh giá nào</p>
              </div>
            )}

            {/* Histogram */}
            {totalReviews > 0 && (
              <div className="mt-5 space-y-1.5 text-left">
                {ratingDistribution.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-4 text-right">{star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                    <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-gray-500 w-4">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form đánh giá */}
          {isLoggedIn ? (
            <div className="rounded-2xl bg-white/[0.04] border border-white/8 p-6">
              <h3 className="text-white font-bold text-lg mb-4">
                {myReview ? "Sửa đánh giá của bạn" : "Viết đánh giá"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Điểm của bạn</label>
                  <StarRating value={myRating} onChange={setMyRating} size="md" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Nhận xét</label>
                  <textarea
                    value={myContent}
                    onChange={(e) => setMyContent(e.target.value)}
                    placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
                    maxLength={1000}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none resize-none transition-colors"
                  />
                  <p className="text-right text-xs text-gray-600 mt-1">{myContent.length}/1000</p>
                </div>

                {formError && (
                  <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {formError}
                  </p>
                )}
                {formSuccess && (
                  <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                    {formSuccess}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Đang gửi..." : myReview ? "Cập nhật" : "Gửi đánh giá"}
                </button>
              </form>
            </div>
          ) : null}
        </div>

        {/* RIGHT — Danh sách reviews */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/10" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 bg-white/10 rounded w-28" />
                      <div className="h-3 bg-white/5 rounded w-16" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="w-14 h-14 text-gray-700 mb-4" />
              <p className="text-gray-400 text-lg font-semibold">Chưa có đánh giá nào</p>
              <p className="text-gray-600 text-sm mt-1">Hãy là người đầu tiên đánh giá bộ phim này!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  currentUserId={currentUserId}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MovieReviewSection;
