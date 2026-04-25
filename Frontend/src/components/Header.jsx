/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import useNagivateLoading from "@/hooks/useNagivateLoading";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import ModalNotification from "@/parts/ModalNotification";
import { Dropdown, Menu } from "antd";
import { fetchWithAuth } from "@/parts/FetchApiWithAuth";
import { canAccessAdminDashboard, getRoleIdFromToken, decodeJwtPayload, getUserIdFromToken, getUsernameFromToken } from "@/utils/jwt";
const Header = ({ isFixed }) => {
  const navigate = useNagivateLoading();
  const [userLogin, setUserLogin] = useState(null);
  const [isModalNotiOpen, setIsModalNotiOpen] = useState(false);
  const [modalNotiProps, setModalNotiProps] = useState({});
  const token = localStorage.getItem("accessToken");
  const [isLogin, setIsLogin] = useState(!!token);

  // Phân quyền hiển thị Menu Admin
  const isAdmin = token ? canAccessAdminDashboard(getRoleIdFromToken(token)) : false;

  // Lấy userId và tên hiển thị từ JWT (luôn có sẵn, không cần chờ API)
  const tokenUserId = getUserIdFromToken(token);
  const tokenUsername = getUsernameFromToken(token);

  // Lấy dữ liệu user ban đầu từ localStorage (để hiển thị luôn không cần chờ API)
  useEffect(() => {
    if (token) {
      try {
        const str = localStorage.getItem("userLogin");
        if (str) setUserLogin(JSON.parse(str));
      } catch (e) {
        console.warn("Lỗi parse userLogin", e);
      }
    }

    // Lắng nghe khi localStorage["userLogin"] thay đổi (vd: sau khi cập nhật hồ sơ)
    const handleStorage = () => {
      try {
        const str = localStorage.getItem("userLogin");
        if (str) setUserLogin(JSON.parse(str));
      } catch (e) {}
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [token]);

  const displayName = userLogin?.firstName
    ? `${userLogin.firstName} ${userLogin.lastName || ""}`.trim()
    : userLogin?.username || tokenUsername || "Thành viên";

  const openModal = ({
    title,
    message,
    type,
    buttonText,
    redirectPath,
    cancelButtonText,
    onConfirm,
  }) => {
    setModalNotiProps({
      modalTitle: title,
      modalMessage: message,
      type: type,
      buttonText: buttonText,
      redirectPath: redirectPath,
      cancelButtonText: cancelButtonText,
      onConfirm: onConfirm,
    });
    setIsModalNotiOpen(true);
  };

  const items = [
    {
      key: "1",
      label: <span>Trang cá nhân</span>,
    },
    {
      key: "3",
      label: <span>Đăng xuất</span>,
    },
  ];

  useEffect(() => {
    const fetchUserLogin = async () => {
      try {
        const res = await fetchWithAuth(
          `${import.meta.env.VITE_API_URL}/users/me`,
          {
            method: "GET",
          }
        );

        const response = await res.json();

        // Update dữ liệu nếu API trả về đúng
        if (response && (response.status === "success" || response.id)) {
          const userData = response.data || response;
          localStorage.setItem("userLogin", JSON.stringify(userData));
          setUserLogin(userData);
          setIsLogin(true);
        } else {
          console.log("Thất bại: ", response.message);
        }
      } catch (error) {
        console.log("có lỗi khi gọi api: " + error);
        const accessToken = localStorage.getItem("accessToken");
        const currentPath = window.location.pathname;
        const isSocialPath = currentPath.startsWith("/social");

        if (accessToken && isSocialPath) {
          setModalNotiProps({
            modalTitle: "Phiên đăng nhập đã hết hạn",
            modalMessage: "Vui lòng đăng nhập lại!",
            type: "error",
            buttonText: "Đăng nhập",
            redirectPath: "/login",
          });
          setIsModalNotiOpen(true);
          localStorage.clear();
        } else if (isSocialPath) {
          setModalNotiProps({
            modalTitle: "Bạn chưa đăng nhập",
            modalMessage: "Vui lòng đăng nhập để sử dụng CineX!",
            buttonText: "Đăng nhập",
            redirectPath: "/login",
          });
          setIsModalNotiOpen(true);
        }
      }
    };

    fetchUserLogin();
  }, []);

  const deleteCookie = (name) => {
    document.cookie = `${name}=; Max-Age=-99999999; path=/;`;
  };

  const handleMenuClick = async ({ key }) => {
    if (key === "1") {
      const uid = tokenUserId || userLogin?.userId || userLogin?.id;
      navigate(`/profile/${uid}`);
    }

    if (key === "3") {
      openModal({
        title: "Đăng xuất?",
        message: "Bạn có chắc chắn muốn đăng xuất không?",
        type: "warning",
        buttonText: "Đăng xuất",
        cancelButtonText: "Hủy",
        onConfirm: () => {
          localStorage.removeItem("accessToken");
          deleteCookie("refreshToken");
          location.reload();
        },
      });
    }
  };

  return (
    <div
      className={`bg-[url('/public/bgblue.jpg')] text-white w-[100%] h-13 bg-cover bg-no-repeat ${isFixed ? "fixed z-50" : ""
        }`}
    >
      <div className="flex h-full">
        <div className="flex items-center w-[20%] h-full">
          <img src="/public/logo.png" className="h-[50px] pl-6" />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className=" h-[10px] text-[24px] font-bold pl-3 flex items-center cursor-pointer"
            onClick={() => navigate("/")}
          >
            CineX
          </motion.p>
        </div>
        <div className="flex text-lg m-auto items-center justify-center">
          <div
            className="px-12 py-2 rounded-t-md hover:bg-white/20 hover:border-b-5 transition-all cursor-pointer"
            onClick={() => navigate("/")}
          >
            <i className="fa-solid fa-house scale-120" />
          </div>
          <div
            className="px-12 py-2 rounded-t-md hover:bg-white/20 hover:border-b-5 transition-all cursor-pointer"
            onClick={() => navigate("/order-ticket")}
          >
            <i className="fa-solid fa-ticket scale-130" />
          </div>

          <div
            className="px-12 py-2 rounded-t-md hover:bg-white/20 hover:border-b-5 transition-all cursor-pointer"
            onClick={() => navigate("/promotions")}
            title="Ưu đãi & Khuyến mãi"
          >
            <i className="fa-solid fa-tag scale-120" />
          </div>

          {isAdmin && (
            <div
              className="px-12 py-2 rounded-t-md hover:bg-white/20 hover:border-b-5 transition-all cursor-pointer text-amber-400"
              onClick={() => navigate("/admin/dashboard")}
              title="Trang Quản Trị"
            >
              <i className="fa-solid fa-user-shield scale-120" />
            </div>
          )}

        </div>
        <div className="flex items-center justify-end gap-4 p-5 w-[20%]">
          {isLogin ? (
            <div>
              <Dropdown
                menu={{
                  items,
                  onClick: handleMenuClick,
                  className: "custom-dropdown-menu",
                }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <div className="cursor-pointer flex items-center gap-3 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-all shadow-md">
                  <Avatar className="w-8 h-8 md:w-9 md:h-9 border border-white/20">
                    <AvatarImage
                      src={
                        userLogin?.avatar
                          ? userLogin.avatar.startsWith("http")
                            ? userLogin.avatar
                            : `${(import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace("/api", "")}${userLogin.avatar}`
                          : "/defaultavt.png"
                      }
                      className="object-cover"
                    />
                  </Avatar>
                  <span className="font-semibold text-sm hidden sm:block text-gray-200 truncate max-w-[120px] pb-0.5">
                    {displayName}
                  </span>
                </div>
              </Dropdown>
            </div>
          ) : (
            <div className="flex gap-3">
              <div
                className="hover:scale-105 transition-transform duration-400 cursor-pointer"
                onClick={() => navigate("/sign-up")}
              >
                Đăng ký
              </div>
              <div>|</div>
              <div
                className="hover:scale-105 transition-transform duration-400 cursor-pointer"
                onClick={() => navigate("/login")}
              >
                Đăng nhập
              </div>
            </div>
          )}
        </div>
      </div>

      <ModalNotification
        isModalOpen={isModalNotiOpen}
        setIsModalOpen={setIsModalNotiOpen}
        {...modalNotiProps}
      />
    </div>
  );
};

export default Header;
