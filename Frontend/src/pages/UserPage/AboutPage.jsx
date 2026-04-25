import React from "react";
import LayoutMovie from "../../components/LayoutMovie";
import { Film, Volume2, Monitor, Award, Heart, Star, Users, MapPin, Ticket } from "lucide-react";

const FeatureCard = ({ icon: Icon, title, description, delay = "0ms" }) => (
  <div
    className="group relative bg-[#151a27] border border-white/5 hover:border-[#008bd0]/30 rounded-3xl p-8 hover:-translate-y-2 transition-all duration-500 overflow-hidden"
    style={{ animationDelay: delay }}
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#008bd0]/10 to-transparent blur-3xl -z-10 group-hover:bg-[#008bd0]/20 transition-all duration-500 rounded-full translate-x-1/2 -translate-y-1/2" />
    <div className="w-16 h-16 rounded-2xl bg-[#0b0f19] flex items-center justify-center border border-white/5 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(0,139,208,0.15)] group-hover:shadow-[0_0_25px_rgba(0,139,208,0.3)]">
      <Icon className="w-8 h-8 text-[#008bd0]" />
    </div>
    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{title}</h3>
    <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{description}</p>
  </div>
);

const NumberStat = ({ number, label }) => (
  <div className="text-center p-6 bg-gradient-to-br from-white/5 to-transparent rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
    <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#008bd0] to-cyan-400 mb-2">{number}</div>
    <div className="text-sm font-semibold uppercase tracking-widest text-gray-400">{label}</div>
  </div>
);

const AboutPage = () => {
  return (
    <LayoutMovie>
      <div className="w-full min-h-screen bg-[#0b0f19] overflow-hidden selection:bg-[#008bd0]/30">

        {/* TOP HERO SECTION */}
        <section className="relative pt-36 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Decorative background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#008bd0]/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="inline-block py-1.5 px-4 rounded-full bg-white/5 border border-white/10 text-[#008bd0] font-semibold text-sm uppercase tracking-[0.2em] mb-6 backdrop-blur-sm">
              Trải Nghiệm Điện Ảnh Đỉnh Cao
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight max-w-4xl leading-[1.1]">
              Chào mừng bạn đến với <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#008bd0] to-[#00bfff]">CineX</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed">
              Phá vỡ mọi giới hạn của kỹ xảo và âm thanh. CineX không chỉ là nơi xem phim, mà là cánh cửa bước vào vạn thế giới điện ảnh kỳ thú.
            </p>
          </div>
        </section>

        {/* IMAGE BREAK SECTION */}
        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32 z-10">
          <div className="w-full h-[400px] md:h-[600px] rounded-[32px] overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group">
            {/* Dark overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-transparent to-transparent z-10" />
            <img
              src="/public/rapcinex.png"
              alt="CineX Cinema Hall"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
            />

            
          </div>
        </section>

        {/* CÔNG NGHỆ SECTION */}
        <section className="py-24 bg-[#111623] relative border-y border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Trang bị <span className="text-[#008bd0]">Hàng Đầu</span></h2>
              <p className="text-gray-400 text-lg">Chúng tôi liên tục nâng cấp hệ thống kỹ thuật để mang lại chất lượng hiển thị sắc nét nhất và âm thanh vòm sống động nhất.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={Monitor}
                title="IMAX Laser"
                description="Màn hình cong khổng lồ với độ phân giải 4K sắc nét từng điểm ảnh, mang đến độ tương phản hoàn mỹ."
              />
              <FeatureCard
                icon={Volume2}
                title="Dolby Atmos"
                description="Hệ thống âm thanh vòm đa chiều với hàng trăm loa vây quanh, cho bạn cảm giác như đang đứng giữa trận chiến điện ảnh."
              />
              <FeatureCard
                icon={Award}
                title="Ghế Sweetbox"
                description="Hệ thống ghế ngồi bọc da cao cấp, tuỳ chỉnh độ nghiêng và mang đến không gian rộng rãi, riêng tư nhất cho các cặp đôi."
              />
            </div>
          </div>
        </section>

        {/* THỐNG KÊ (STATS) SECTION */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <NumberStat number="18+" label="Cụm rạp toàn quốc" />
            <NumberStat number="120+" label="Phòng chiếu cao cấp" />
            <NumberStat number="5M+" label="Thành viên CineX" />
            <NumberStat number="98%" label="Khách hàng hài lòng" />
          </div>
        </section>

        {/* TẦM NHÌN VÀ SỨ MỆNH */}
        <section className="py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-8">
                  Vì sao khách hàng yêu thích <span className="text-[#008bd0]">CineX</span>?
                </h2>

                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#008bd0]/10 flex items-center justify-center border border-[#008bd0]/20">
                      <Heart className="w-5 h-5 text-[#008bd0]" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">Trải nghiệm cá nhân hoá</h4>
                      <p className="text-gray-400">Từ gói xem phim, ưu đãi độc quyền đến tính năng ghi nhớ sở thích, CineX tôn trọng và chăm sóc từng khán giả.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                      <Star className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">Đa dạng lựa chọn</h4>
                      <p className="text-gray-400">Không chỉ phim bom tấn Hollywood, CineX tự hào đưa phim nghệ thuật, phim độc lập đến gần hơn với đại chúng.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Users className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">Cộng đồng điện ảnh</h4>
                      <p className="text-gray-400">Tham gia những buổi offline, chia sẻ nhận xét phim và trò chuyện cùng hàng triệu người chung niềm đam mê.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#008bd0]/20 to-transparent blur-3xl -z-10 rounded-[40px]" />
                <div className="bg-[#151a27] border border-white/10 p-10 md:p-12 rounded-[40px]">
                  <Film className="w-12 h-12 text-[#008bd0] mb-6" />
                  <p className="text-xl md:text-2xl font-medium text-gray-200 indent-2 leading-relaxed italic mb-8">
                    "Chúng tôi xây dựng CineX không bắt đầu từ những chiếc máy chiếu đắt tiền nhất, mà bắt đầu từ trải nghiệm, nụ cười và cảm xúc của khán giả khi đèn rạp bắt đầu tắt."
                  </p>
                  <div>
                    <h5 className="font-bold text-white text-lg">Nguyễn Việt Hoàng</h5>
                    <p className="text-gray-500 text-sm">Nhà sáng lập & CEO CineX</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-24 relative px-4 text-center">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-[rgba(0,139,208,0.15)] to-transparent border border-white/10 rounded-[40px] p-12 md:p-20 relative overflow-hidden">
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#008bd0] blur-[120px] rounded-full opacity-30 pointer-events-none" />

            <TargetAndTicket />
          </div>
        </section>

      </div>
    </LayoutMovie>
  );
};

// Component con nhỏ để tách gọn phần CTA
const TargetAndTicket = () => {
  return (
    <div className="relative z-10 flex flex-col items-center text-center">
      <Ticket className="w-16 h-16 text-[#008bd0] mb-6" />
      <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Sẵn sàng để bị cuốn hút?</h2>
      <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto">Hàng loạt các bom tấn đang chờ bạn khám phá. Trải nghiệm xem phim khác biệt tại CineX chỉ với vài cú click.</p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <a
          href="/movies"
          className="px-8 py-4 bg-white text-black font-bold text-lg rounded-full hover:scale-105 transition-transform duration-300"
        >
          Đặt Vé Ngay
        </a>
        <a
          href="/promotions"
          className="px-8 py-4 bg-transparent text-white border border-white/20 font-bold text-lg rounded-full hover:bg-white/5 transition-colors duration-300"
        >
          Xem Ưu Đãi
        </a>
      </div>
    </div>
  )
}

export default AboutPage;
