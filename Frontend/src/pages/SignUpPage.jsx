import { Input } from "@/components/ui/input";
import useNagivateLoading from "@/hooks/useNagivateLoading";
import ModalNotification from "@/parts/ModalNotification";
import { Form } from "antd";
import { useState } from "react";

const SignUpPage = () => {
  const navigate = useNagivateLoading();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [signUpSuccess, setSignUpSuccess] = useState(true);

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      setSignUpSuccess(false);
      setModalTitle("Đăng ký thất bại");
      setModalMessage("Xác nhận mật khẩu không trùng khớp.");
      setIsModalOpen(true);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username,
          email: values.email,
          password: values.password,
        }),
      });

      const responseText = await res.text();

      if (!res.ok) {
        setSignUpSuccess(false);
        setModalTitle("Đăng ký thất bại");
        setModalMessage(responseText || "Có lỗi xảy ra, vui lòng thử lại.");
        setIsModalOpen(true);
        return;
      }

      setSignUpSuccess(true);
      setModalTitle("Thành công");
      setModalMessage(responseText || "Đăng ký thành công, vui lòng đăng nhập.");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
      setSignUpSuccess(false);
      setModalTitle("Đăng ký thất bại");
      setModalMessage("Không thể kết nối đến server.");
      setIsModalOpen(true);
    }
  };

  return (
    <div className="w-full h-screen relative">
      <img src="/signupbg.png" className="w-full h-full object-cover absolute opacity-80" />
      <div className="w-full h-full flex flex-col justify-center items-center z-5 absolute inset-0">
        <div className="h-[20%] space-y-2 flex items-center justify-center">
          <img src="/logo.png" className="h-[100px] drop-shadow-[0_10px_20px_rgba(0,139,208,0.8)]" />
          <div className="ml-3">
            <div className="text-4xl lg:text-5xl font-extrabold text-[#1f2937] flex justify-center">PhimNet</div>
            <div className="text-lg md:text-3xl font-bold text-[#1f2937] flex justify-center" style={{ fontFamily: "Smooch Sans" }}>
              Xem phim hay, kết nối ngay
            </div>
          </div>
        </div>
        <div className="h-[80%] w-[90%] sm:w-[60%] lg:w-[450px] mb-10 z-10 w-full">
          <div className="w-full bg-black/60 backdrop-blur-sm border border-white/10 shadow-2xl rounded-2xl text-white p-8 flex flex-col items-center">
            <div className="text-xl lg:text-2xl uppercase font-bold mb-2">Đăng ký tài khoản</div>
            <div className="w-[90%] mt-5">
              <Form name="sign-up-form" layout="vertical" onFinish={onFinish}>
                <div className="flex gap-5 w-full">
                  <Form.Item
                    className="w-[40%]"
                    label={<span className="text-md text-white">Tên đăng nhập</span>}
                    name="username"
                    rules={[
                      { required: true, message: "Vui lòng nhập tên đăng nhập!" },
                      { min: 6, max: 18, message: "Tên đăng nhập phải có độ dài 6 - 18 ký tự!" },
                    ]}
                  >
                    <Input type="text" className="text-white" />
                  </Form.Item>
                  <Form.Item
                    className="w-[60%]"
                    label={<span className="text-md text-white">Email</span>}
                    name="email"
                    rules={[
                      { required: true, message: "Vui lòng nhập địa chỉ email!" },
                      { type: "email", message: "Email không hợp lệ!" },
                    ]}
                  >
                    <Input type="email" className="text-white" />
                  </Form.Item>
                </div>
                <div className="flex gap-5">
                  <Form.Item
                    className="w-[50%]"
                    label={<span className="text-md text-white">Mật khẩu</span>}
                    name="password"
                    rules={[
                      { required: true, message: "Vui lòng nhập mật khẩu!" },
                      { min: 6, max: 18, message: "Mật khẩu phải có độ dài 6 - 18 ký tự!" },
                    ]}
                  >
                    <Input type="password" className="text-white" />
                  </Form.Item>
                  <Form.Item
                    className="w-[50%]"
                    label={<span className="text-md text-white">Xác nhận mật khẩu</span>}
                    name="confirmPassword"
                    rules={[
                      { required: true, message: "Vui lòng xác nhận lại mật khẩu!" },
                      { min: 6, max: 18, message: "Mật khẩu phải có độ dài 6 - 18 ký tự!" },
                    ]}
                  >
                    <Input type="password" className="text-white" />
                  </Form.Item>
                </div>
                <button className="px-6 py-2 mt-3 w-full bg-blue-500/60 text-white font-semibold rounded-lg hover:bg-blue-700/80 transition">
                  Đăng ký ngay
                </button>
              </Form>
              <div className="mt-4 flex text-sm justify-center hover:underline hover:cursor-pointer" onClick={() => navigate("/login")}>
                Bạn đã có tài khoản? Hãy đăng nhập
              </div>
            </div>
            {signUpSuccess ? (
              <ModalNotification
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                modalTitle={modalTitle}
                modalMessage={modalMessage}
                type="success"
                buttonText="Đăng nhập"
                redirectPath="/login"
              />
            ) : (
              <ModalNotification
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                modalTitle={modalTitle}
                modalMessage={modalMessage}
                type="error"
                buttonText="Thử lại"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
