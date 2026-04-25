import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import useNagivateLoading from "@/hooks/useNagivateLoading";
import MovieList from "@/components/Movie/MovieList";
import QuickBookingBar from "@/components/Movie/QuickBookingBar";

const HomePage = () => {
  const navigateLoading = useNagivateLoading();

  return (
    <Layout>
      <div>
        <div className="relative w-full h-[500px] overflow-hidden">


          <Swiper
            spaceBetween={0}
            slidesPerView={1}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={true}
            pagination={{ clickable: true, dynamicBullets: true }}
            modules={[Navigation, Pagination, Autoplay]}
            className="w-full h-full absolute inset-0 z-0"
          >
            <SwiperSlide>
              <img src="/banner1.png" className="w-full h-full object-cover object-[center_top]" alt="Banner 1" />
            </SwiperSlide>
            <SwiperSlide>
              <img src="/banner2.png" className="w-full h-full object-cover object-[center_top]" alt="Banner 2" />
            </SwiperSlide>
            <SwiperSlide>
              <img src="/banner3.png" className="w-full h-full object-cover object-[center_top]" alt="Banner 3" />
            </SwiperSlide>
            <SwiperSlide>
              <img src="/banner4.png" className="w-full h-full object-cover object-[center_top]" alt="Banner 4" />
            </SwiperSlide>
            <SwiperSlide>
              <img src="/banner5.png" className="w-full h-full object-cover object-[center_top]" alt="Banner 5" />
            </SwiperSlide>
          </Swiper>
        </div>


        <div className="h-auto relative pb-10">
          <div className="bg-white/85 z-10 h-full w-full absolute top-0 left-0"></div>
          <div className="bg-[#008bd0]/10 z-10 h-full w-full absolute top-0 left-0"></div>
          <img src="/bg2.jpg" className="h-full w-full object-cover opacity-30 absolute top-0 left-0" />

          <QuickBookingBar />

          <div className="pt-2">
            <MovieList title="Phim Đang Chiếu" viewMoreLink="/movies?tab=movies" titleClassName="text-transparent bg-clip-text bg-gradient-to-r from-[#008bd0] to-[#00bfff] drop-shadow-sm" hideSearch={true} status="now_showing" />
          </div>
          <MovieList title="Phim Sắp Chiếu" viewMoreLink="/movies?tab=upcoming" titleClassName="text-transparent bg-clip-text bg-gradient-to-r from-[#008bd0] to-[#00bfff] drop-shadow-sm" hideSearch={true} hideBooking={true} status="coming_soon" />
        </div>

        <div className="bg-[url('/bgX.png')] h-160 w-full relative flex flex-col pt-10">
          <div className="bg-white opacity-95 h-full w-full z-5 absolute top-0 left-0" />
          <div className="bg-[#208ff7] opacity-15 h-full w-full z-5 absolute top-0 left-0" />
          <div className="h-[90%] ml-30 z-10 relative flex items-center">
            <img
              src="/aboutus.png"
              alt="About CineX"
              className="w-[30%] h-[60%] object-cover flex"
              style={{
                clipPath: "polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)",
              }}
            />
            <div className="w-[70%] h-full flex items-center">
              <div className="h-[60%] w-full ml-15 space-y-2">
                <div
                  className="w-40 text-[20px] p-2 flex justify-center bg-[#008bd0]/20 text-[#008bd0] font-bold"
                >
                  GIỚI THIỆU
                </div>
                <div className="text-[34px]">CineX</div>
                <div className="w-[80%] text-justify">
                  CineX là một nền tảng trực tuyến dành cho những người yêu điện ảnh.
                  <br />
                  <br />
                  Nơi giao lưu và kết nối những người yêu điện ảnh, đặt vé nhanh chóng,
                  nhận ưu đãi hấp dẫn, cập nhật lịch chiếu và sự kiện, chia sẻ đam mê phim ảnh.
                </div>
                <div
                  className="w-40 text-[18px] p-2 mt-6 flex justify-center border-2 border-[#46acdf] text-[#008bd0] font-bold hover:bg-[#008bd0] hover:text-white hover:shadow-lg hover:shadow-[#008bd0] transition-all duration-300 cursor-pointer"
                  onClick={() => navigateLoading("/about")}
                >
                  XEM THÊM &gt;&gt;
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
