import { Input } from "@/components/ui/input";
import useNagivateLoading from "@/hooks/useNagivateLoading";
import { Form } from "antd";
import React, { useState } from "react";

const LoginPage = () => {
  const navigate = useNagivateLoading();
  const [errorMessage, setErrorMessage] = useState("");

  const onFinish = async (values) => {
    setErrorMessage("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const responseText = await res.text();

      if (!res.ok) {
        setErrorMessage(responseText || "Đăng nhập thất bại.");
        return;
      }

      localStorage.setItem("accessToken", responseText);
      navigate("/social/home");
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
      setErrorMessage("Không thể kết nối tới server.");
    }
  };

  return (
    <div className="w-full h-screen relative">
      <img src="/banner5.jpg" className="w-full h-full object-cover absolute opacity-85" />
      <div className="w-full h-full flex flex-col justify-center items-center z-5 absolute inset-0">
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

        <div className="w-[90%] sm:w-[400px] lg:w-[450px] mb-20 z-10">
          <div className="w-full p-8 bg-black/60 backdrop-blur-sm border border-white/10 rounded-2xl text-white shadow-2xl">
            <div className="text-lg lg:text-2xl mb-8 font-bold flex justify-center">ĐĂNG NHẬP</div>
            <Form name="login-form" onFinish={onFinish} layout="vertical">
              <Form.Item
                style={{ marginBottom: "8px" }}
                label={<span className="text-md text-white">Email</span>}
                name="email"
                rules={[{ required: true, message: "Vui lòng nhập email!" }]}
              >
                <Input className="text-white" />
              </Form.Item>
              <Form.Item
                style={{ marginBottom: "8px" }}
                label={<span className="text-md text-white">Mật khẩu</span>}
                name="password"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
              >
                <Input type="password" className="text-white" />
              </Form.Item>

              <div className="mt-2 mx-4 flex justify-end text-white hover:underline hover:cursor-pointer" onClick={() => navigate("/forgot-password")}>
                Quên mật khẩu?
              </div>

              <Form.Item>
                <div className="text-red-600 mt-2 font-semibold flex justify-center">
                  <div className="bg-white/80 rounded-2xl px-2">{errorMessage}</div>
                </div>
                <button
                  htmlType="submit"
                  className="px-6 py-2 mt-3 w-full text-white bg-blue-500/70 font-semibold rounded-lg shadow-md hover:bg-blue-600/90 hover:cursor-pointer transition"
                >
                  Đăng nhập
                </button>
              </Form.Item>
            </Form>
            <div className="mt-2 flex justify-center text-white text-sm hover:underline hover:cursor-pointer" onClick={() => navigate("/sign-up")}>
              Bạn chưa có tài khoản?
            </div>
          </div>
        </div>
      </div>
      <div className="bottom-0 right-3 text-[13px] absolute z-10">
        <p>PhimNet</p>
      </div>
    </div>
  );
};

export default LoginPage;
