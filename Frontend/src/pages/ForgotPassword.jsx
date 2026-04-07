import useNagivateLoading from "@/hooks/useNagivateLoading";
import React from "react";

const ForgotPassword = () => {
  const navigate = useNagivateLoading();

  return (
    <div className="w-full h-screen relative">
      <img src="/banner5.jpg" className="w-full h-full object-cover absolute opacity-85" />
      <div className="w-full lg:w-[40%] h-full flex flex-col justify-center items-center z-5 absolute">
        <div className="h-[30%] space-y-2 flex items-center justify-center">
          <img src="/logo.png" className="h-[100px] drop-shadow-[0_10px_20px_rgba(0,139,208,0.8)]" />
          <div className="ml-3">
            <div className="text-4xl lg:text-5xl font-extrabold text-[#ffffff] flex justify-center drop-shadow-[0_10px_20px_rgba(0,139,208,0.4)]">
              PhimNet
            </div>
            <div className="text-lg md:text-3xl font-bold text-[#ffffff] flex justify-center" style={{ fontFamily: "Smooch Sans" }}>
              Xem phim hay, kết nối ngay
            </div>
          </div>
        </div>

        <div className="w-[60%]">
          <div className="w-full p-6 bg-black/50 rounded-2xl text-white text-center">
            <div className="text-xl mb-4 font-bold">Quên mật khẩu</div>
            <p className="text-white/80 mb-6">
              Backend phimnet_be hiện chưa có API khôi phục mật khẩu. Bạn có thể đăng ký tài khoản mới hoặc đăng nhập bằng tài khoản có sẵn trong dữ liệu mẫu.
            </p>
            <button
              className="px-6 py-2 w-full text-white bg-blue-500/70 font-semibold rounded-lg shadow-md hover:bg-blue-600/90 transition"
              onClick={() => navigate("/login")}
              type="button"
            >
              Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
      <div className="bottom-0 right-3 text-[13px] absolute z-10">PhimNet</div>
    </div>
  );
};

export default ForgotPassword;
