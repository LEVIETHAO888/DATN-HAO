import React, { useEffect, useState } from "react";
import LayoutMovie from "../../components/LayoutMovie";
import { Loader2, Tag, Calendar, PlaySquare } from "lucide-react";
import useNagivateLoading from "../../hooks/useNagivateLoading"; // To handle routing if necessary

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

const PromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNagivateLoading();

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await fetch(`${API_BASE}/promotions/active`);
        if (res.ok) {
          const data = await res.json();
          setPromotions(data);
        }
      } catch (error) {
        console.error("Lỗi khi tải ưu đãi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Không thời hạn";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
  };

  return (
    <LayoutMovie>
      <div className="w-full min-h-screen bg-[#0b0f19] pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 mb-4 inline-flex items-center gap-4">
              Ưu Đãi & Khuyến Mãi <Tag className="w-10 h-10 text-amber-500" />
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Đừng bỏ lỡ các chương trình khuyến mãi và ưu đãi đặc biệt từ CineX. Nhanh tay săn vé, nhận bắp nước thả ga!
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            </div>
          ) : promotions.length === 0 ? (
            <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-12">
              <Tag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Hiện chưa có ưu đãi nào</h2>
              <p className="text-gray-400">Vui lòng quay lại sau để cập nhật các chương trình mới nhất!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {promotions.map((promo) => (
                <div key={promo.id} className="bg-[#1c1d1f] hover:-translate-y-2 transition-all duration-300 border border-white/10 rounded-3xl overflow-hidden shadow-xl group">
                  <div className="relative h-48 w-full overflow-hidden bg-gray-900 border-b border-white/10">
                    {promo.imageUrl ? (
                      <img src={promo.imageUrl} alt={promo.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-orange-600/20">
                        <Tag className="w-16 h-16 text-amber-500/50" />
                      </div>
                    )}
                    {promo.discountPercentage > 0 && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-600 text-white font-black text-xl px-4 py-1.5 rounded-full shadow-lg">
                        -{promo.discountPercentage}%
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{promo.title}</h3>
                    <p className="text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                      {promo.description || "Tận hưởng ưu đãi ngay hôm nay."}
                    </p>
                    
                    <div className="space-y-3 mb-6">
                      {promo.code && (
                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 border-dashed">
                          <span className="text-gray-400 text-sm">Mã:</span>
                          <span className="text-amber-400 font-mono font-bold tracking-wider">{promo.code}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 text-sm text-gray-300">
                        <Calendar className="w-4 h-4 text-[#008bd0]" />
                        <span>Hết hạn: {formatDate(promo.endDate)}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate("/movies")}
                      className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
                    >
                      <PlaySquare className="w-5 h-5" /> Mua vé ngay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LayoutMovie>
  );
};

export default PromotionsPage;
