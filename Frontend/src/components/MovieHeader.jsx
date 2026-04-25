import React, { useMemo, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { canAccessAdminDashboard, getRoleIdFromToken } from "@/utils/jwt";

const BACKEND_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace("/api", "");

function decodeJwt(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

function readUserFromStorage() {
  try {
    const str = localStorage.getItem("userLogin");
    return str ? JSON.parse(str) : null;
  } catch { return null; }
}

export default function MovieHeader({ activeTab }) {
  const token = localStorage.getItem("accessToken");
  const jwtPayload = useMemo(() => token ? decodeJwt(token) : {}, [token]);
  const currentEmail = jwtPayload.sub || "";

  const [userObj, setUserObj] = useState(readUserFromStorage);

  // Lắng nghe khi localStorage["userLogin"] thay đổi (vd: sau khi cập nhật hồ sơ)
  useEffect(() => {
    const handleStorage = () => setUserObj(readUserFromStorage());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const displayName = userObj?.firstName
    ? `${userObj.firstName} ${userObj.lastName || ""}`.trim()
    : userObj?.username || currentEmail.split("@")[0] || "Bạn";

  const canOpenAdminDashboard = useMemo(() => token ? canAccessAdminDashboard(getRoleIdFromToken(token)) : false, [token]);

  // Xây dựng URL avatar đúng
  const avatarSrc = useMemo(() => {
    if (!userObj?.avatar) return "/defaultavt.png";
    if (userObj.avatar.startsWith("http")) return userObj.avatar;
    return `${BACKEND_BASE}${userObj.avatar}`;
  }, [userObj?.avatar]);

  function logout() {
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
  }

  return (
    <div className="bg-[url('/bgblue.jpg')] bg-cover bg-no-repeat fixed top-0 left-0 right-0 z-[100] h-13 shadow-md">
      <div className="flex h-full">
        <div className="flex items-center w-[20%] h-full cursor-pointer" onClick={() => window.location.href = "/"}>
          <img src="/logo.png" className="h-[50px] pl-6" alt="logo" />
          <p className="text-[24px] font-bold pl-3 flex items-center text-white">CineX</p>
        </div>
        
        <div className="flex text-lg m-auto items-center justify-center flex-wrap flex-1 min-w-0 gap-1 lg:gap-4 text-white">

          <div 
            className={`px-4 lg:px-8 py-2 rounded-t-md cursor-pointer transition-all ${activeTab === 'movies' ? 'bg-white/10 border-b-4 border-[#008bd0] text-[#008bd0] font-bold' : 'hover:bg-white/5'}`}
            onClick={() => window.location.href = "/movies?tab=movies"}
          >
            Phim Đang Chiếu
          </div>
          <div 
            className={`px-4 lg:px-8 py-2 rounded-t-md cursor-pointer transition-all ${activeTab === 'upcoming' ? 'bg-white/10 border-b-4 border-amber-500 text-amber-500 font-bold' : 'hover:bg-white/5'}`}
            onClick={() => window.location.href = "/movies?tab=upcoming"}
          >
            Phim Sắp Chiếu
          </div>
          <div 
            className={`px-4 lg:px-8 py-2 rounded-t-md cursor-pointer transition-all ${activeTab === 'booking' ? 'bg-white/10 border-b-4 border-white/90 font-bold' : 'hover:bg-white/5'}`}
            onClick={() => window.location.href = "/movies?tab=bookings"}
          >
            Lịch sử vé
          </div>
          <div
            className={`px-12 py-2 rounded-t-md cursor-pointer transition-all ${activeTab === "cinema" ? "bg-white/10 border-b-4 border-white/90 font-bold" : "hover:bg-white/5"}`}
            onClick={() => window.location.href = "/movies?tab=cinema"}
          >
            Chọn rạp
          </div>
          {canOpenAdminDashboard ? (
            <div
              className="px-6 py-2 rounded-t-md cursor-pointer transition-all text-amber-300 hover:bg-white/10 font-semibold text-base"
              onClick={() => window.location.href = "/admin/dashboard"}
            >
              Admin Dashboard
            </div>
          ) : null}
        </div>
        
        <div className="flex items-center justify-end gap-2 sm:gap-3 p-3 sm:p-5 w-[20%] shrink-0 min-w-0 text-white">
          {token ? (
            <>
              <div className="flex items-center gap-2.5">
                <Avatar className="scale-105">
                  <AvatarImage src={avatarSrc} className="object-cover" />
                  {!userObj?.avatar && (
                    <AvatarFallback className="bg-gradient-to-br from-[#008bd0] to-cyan-400 text-white font-bold">
                      {displayName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="text-sm font-medium text-white/90 whitespace-nowrap hidden md:inline">
                  Xin chào, <span className="font-bold text-white">{displayName}</span>
                </span>
              </div>
              <button className="cursor-pointer hover:text-red-400 transition-colors ml-2" onClick={logout} type="button" title="Đăng xuất">
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="flex gap-3 font-semibold text-[15px]">
              <div className="hover:text-amber-400 transition-colors cursor-pointer" onClick={() => window.location.href = "/sign-up"}>
                Đăng ký
              </div>
              <div className="text-white/50">|</div>
              <div className="hover:text-amber-400 transition-colors cursor-pointer" onClick={() => window.location.href = "/login"}>
                Đăng nhập
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

