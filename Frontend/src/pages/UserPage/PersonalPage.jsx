import { Avatar, Image, message } from "antd";
import {
  UserCheck2,
  UserMinus2Icon,
  UserPlus,
  UserX,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LayoutSocial from "../../components/LayoutSocial";
import NewsFeed from "@/components/HomePage/NewsFeed";
import { fetchWithAuth } from "@/parts/FetchApiWithAuth";
import { handleAuthError } from "@/parts/HandleAuthError";
import { handleFriendAction } from "@/parts/HandleApiAction";
import ModalNotification from "@/parts/ModalNotification";
import InfiniteScroll from "react-infinite-scroll-component";
import CreatePost from "@/components/Post/CreatePost";
import EditProfileModal from "@/components/PersonalPage/EditProfileModal";

const PersonalPage = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [modalNotiProps, setModalNotiProps] = useState({});
  const [isModalNotiOpen, setIsModalNotiOpen] = useState(false);

  const [listPost, setListPost] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 1;
  const [hasMore, setHasMore] = useState(true);

  const [isOpenEditModal, setIsOpenEditModal] = useState(false);
  const [isLoadUser, setIsLoadUser] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isSentRequest, setIsSentRequest] = useState(false);
  const [isSender, setIsSender] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const userLogin = JSON.parse(localStorage.getItem("userLogin"));

  //fetch personal page
  const fetchPersonalPage = async () => {
    try {
      const res = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/users/personal-page?userId=${userId}`,
        {
          method: "GET",
        }
      );
      const response = await res.json();

      if (response.status === "success") {
        const data = response.data;
        setUser(data);
        if (data?.isFriend !== undefined) setIsFriend(data.isFriend);
        if (data?.isSentRequest !== undefined) setIsSentRequest(data.isSentRequest);
        if (data?.isSender !== undefined) setIsSender(data.isSender);
      }
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        handleAuthError(error, setModalNotiProps, setIsModalNotiOpen);
      } else {
        console.error("Lỗi khác:", error);
      }
    }
  };

  //fetch list post of user
  const fetchPersonalPost = async (pageOverride) => {
    const currentPage = pageOverride ?? page;
    try {
      const res = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/posts/personal-page?page=${currentPage}&limit=${limit}&userId=${userId}`,
        {
          method: "GET",
        }
      );
      const response = await res.json();

      if (response.status === "success") {
        const newPosts = response.data.listResults;
        setListPost((prev) =>
          currentPage === 1 ? newPosts : [...prev, ...newPosts]
        );

        if (response.data.totalPage <= currentPage) {
          setHasMore(false);
        } else {
          setPage(currentPage + 1);
        }
      }
    } catch (error) {
      if (error.message === "TokenExpiredError") {
        handleAuthError(error, setModalNotiProps, setIsModalNotiOpen);
      }
      console.log("Có lỗi khi gọi api: ", error);
    }
  };

  useEffect(() => {
    if (userId) {
      setUser(null);
      setListPost([]);
      setPage(1);
      setHasMore(true);
      fetchPersonalPage();
      fetchPersonalPost(1);
    }
    setIsLoadUser(false);
  }, [userId, isLoadUser]);

  const handleAddFriend = () =>
    handleFriendAction({
      url: `${import.meta.env.VITE_API_URL}/friends`,
      method: "POST",
      body: {
        senderId: userLogin?.userId,
        receiverId: user?.userId,
      },
      onSuccess: () => {
        setIsSentRequest(true);
        setIsSender(true);
      },
      successMessage: `Gửi lời mời kết bạn đến ${user?.firstName} ${user?.lastName} thành công!`,
      errorMessage: "Gửi lời mời thất bại",
      messageApi: messageApi,
    });

  const handleDeleteFriend = () =>
    handleFriendAction({
      url: `${import.meta.env.VITE_API_URL}/friends/${user?.userId}`,
      method: "DELETE",
      onSuccess: () => {
        setIsFriend(false);
        setIsSentRequest(false);
      },
      successMessage: "Hủy kết bạn thành công!",
      errorMessage: "Hủy kết bạn thất bại",
      messageApi: messageApi,
    });

  const handleAcceptFriend = () =>
    handleFriendAction({
      url: `${import.meta.env.VITE_API_URL}/friends/accept/${user?.userId}`,
      method: "PATCH",
      onSuccess: () => {
        setIsFriend(true);
        setIsSentRequest(false);
      },
      successMessage: "Bạn đã chấp nhận lời mời kết bạn!",
      errorMessage: "Chấp nhận thất bại",
      messageApi: messageApi,
    });

  const handleRejectFriend = () =>
    handleFriendAction({
      url: `${import.meta.env.VITE_API_URL}/friends/reject/${user?.userId}`,
      method: "DELETE",
      onSuccess: () => {
        setIsSentRequest(false);
      },
      successMessage: "Đã từ chối lời mời kết bạn",
      errorMessage: "Từ chối thất bại",
      messageApi: messageApi,
    });

  const handleCancelRequest = () =>
    handleFriendAction({
      url: `${import.meta.env.VITE_API_URL}/friends/add-request/${user?.userId}`,
      method: "DELETE",
      onSuccess: () => {
        setIsSentRequest(false);
      },
      successMessage: "Đã hủy lời mời kết bạn",
      errorMessage: "Hủy lời mời thất bại",
      messageApi: messageApi,
    });

  if (!userLogin) {
    return (
      <LayoutSocial>
        <div className="mt-13 w-full h-[calc(100vh-52px)] flex items-center justify-center bg-black/90 text-white">
          Vui lòng đăng nhập để xem trang cá nhân.
        </div>
      </LayoutSocial>
    );
  }

  return (
    <LayoutSocial>
      {contextHolder}
      <div
        className="mt-13 w-full h-[calc(100vh-52px)] px-[20%] overflow-y-auto bg-black/90 py-3 text-white"
        id="scrollableDiv"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#666 #333" }}
      >
        <InfiniteScroll
          dataLength={listPost.length}
          next={fetchPersonalPost}
          hasMore={hasMore}
          loader={<h4 className="text-center my-4">Đang tải thêm...</h4>}
          scrollThreshold={0.8}
          scrollableTarget="scrollableDiv"
          endMessage={
            <p className="flex justify-center py-4">
              Đã hiển thị tất cả bài viết.
            </p>
          }
          className="w-full flex flex-col gap-4"
        >
          <div className="relative bg-white/10 h-[250px] py-3 flex justify-between rounded-2xl pl-3 mb-3">
            <div className="absolute inset-0">
              <img
                src="/bg2.jpg"
                className="w-full h-full object-cover opacity-80 rounded-b-2xl"
              />
            </div>
            <div className="absolute inset-0 bg-black/60 w-full h-full rounded-b-2xl"></div>
            <div className="flex items-end justify-between w-full z-20">
              <div className="flex items-end">
                <div className="h-[200px] w-[200px] flex items-center justify-center rounded-[50%] border-2">
                  <Avatar
                    src={user?.avatar || "/defaultavt.png"}
                    style={{ height: "100%", width: "100%" }}
                  />
                </div>
                <div className="ml-8">
                  <div className=" text-white space-y-2">
                    <div className="text-3xl font-bold">
                      {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "—" : "Đang tải..."}
                    </div>
                    <div className="flex space-x-5">
                      <div>{user ? `${user.totalFriends ?? 0} bạn bè` : "—"}</div>
                      <div>-</div>
                      <div>{user ? `${user.totalPosts ?? 0} bài viết` : "—"}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-end space-x-5 text-white mr-4">
                {userId == userLogin?.userId ? (
                  <div
                    className="px-3 py-2 text-sm bg-white/20 flex justify-center rounded-lg hover:cursor-pointer hover:bg-white/40"
                    onClick={() => setIsOpenEditModal(true)}
                  >
                    Chỉnh sửa trang cá nhân
                  </div>
                ) : user ? (
                  <div className="flex flex-wrap gap-2">
                    {isFriend ? (
                      <>
                        <button className="px-4 py-2 text-sm bg-white/20 rounded-lg hover:bg-white/40 flex items-center gap-1">
                          <UserCheck2 className="w-4 h-4" />
                          Bạn bè
                        </button>
                        <button
                          className="px-4 py-2 text-sm bg-white/20 rounded-lg hover:bg-white/40 flex items-center gap-1 hover:cursor-pointer"
                          onClick={handleDeleteFriend}
                        >
                          <UserMinus2Icon className="w-4 h-4" />
                          Hủy kết bạn
                        </button>
                      </>
                    ) : isSentRequest ? (
                      isSender ? (
                        <button
                          className="px-4 py-2 text-sm bg-white/20 rounded-lg hover:bg-white/40 flex items-center gap-1 hover:cursor-pointer"
                          onClick={handleCancelRequest}
                        >
                          <UserX className="w-4 h-4" />
                          Đã gửi lời mời
                        </button>
                      ) : (
                        <>
                          <button
                            className="px-4 py-2 text-sm bg-blue-500/70 rounded-lg hover:bg-blue-600 flex items-center gap-1 hover:cursor-pointer"
                            onClick={handleAcceptFriend}
                          >
                            <UserCheck2 className="w-4 h-4" />
                            Chấp nhận
                          </button>
                          <button
                            className="px-4 py-2 text-sm bg-white/20 rounded-lg hover:bg-white/40 flex items-center gap-1 hover:cursor-pointer"
                            onClick={handleRejectFriend}
                          >
                            <UserX className="w-4 h-4" />
                            Từ chối
                          </button>
                        </>
                      )
                    ) : (
                      <button
                        className="px-6 py-2 text-sm bg-blue-500/70 rounded-lg hover:bg-blue-600 flex items-center gap-1 hover:cursor-pointer"
                        onClick={handleAddFriend}
                      >
                        <UserPlus className="w-4 h-4" />
                        Kết bạn
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {userId != userLogin?.userId && user && (
              <div className="w-full">
                <div className="bg-white/10 p-5 space-y-2 rounded-2xl">
                  <div className="font-semibold">Thông tin</div>
                  <div className="grid grid-cols-1 gap-2 ml-3 text-white text-sm">
                    <div className="flex">
                      <span className="w-32 text-white/60">Ngày sinh:</span>
                      <span className="font-medium">{user.dateOfBirth || "—"}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-white/60">Số điện thoại:</span>
                      <span className="font-medium">{user.phoneNumber || "—"}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-white/60">Email:</span>
                      <span className="font-medium">{user.emailAddress || "—"}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-white/60">Địa chỉ:</span>
                      <span className="font-medium">{user.address || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {userId == userLogin?.userId && user && (
              <div className="w-full">
                <div className="bg-white/10 p-5 space-y-2 rounded-2xl">
                  <div className="font-semibold">Thông tin cá nhân</div>
                  <div className="flex justify-between">
                    <div className="grid grid-cols-1 gap-2 ml-3 text-white text-sm">
                      <div className="flex">
                        <span className="w-32 text-white/60">Ngày sinh:</span>
                        <span className="font-medium">
                          {user?.dateOfBirth || "—"}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="w-32 text-white/60">
                          Số điện thoại:
                        </span>
                        <span className="font-medium">
                          {user?.phoneNumber || "—"}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="w-32 text-white/60">Email:</span>
                        <span className="font-medium">
                          {user?.emailAddress || "—"}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="w-32 text-white/60">Địa chỉ:</span>
                        <span className="font-medium">
                          {user?.address || "—"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="px-3 py-2 bg-white/20 text-sm flex justify-center rounded-lg hover:cursor-pointer hover:bg-white/40">
                        Lịch sử đặt vé
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 w-[70%] mx-auto">
                  <CreatePost
                    onPostCreated={(post) =>
                      setListPost((prev) => (post ? [post, ...prev] : prev))
                    }
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col items-center">
              {listPost.length === 0 && (
                <div className="my-10">Chưa có bài viết nào!</div>
              )}
              <div className="w-[70%]">
                <NewsFeed listPost={listPost} isReaction={true} />
              </div>
            </div>
          </div>
        </InfiniteScroll>
      </div>
      <ModalNotification
        isModalOpen={isModalNotiOpen}
        setIsModalOpen={setIsModalNotiOpen}
        {...modalNotiProps}
      />
      <EditProfileModal
        isModalOpen={isOpenEditModal}
        setIsModalOpen={setIsOpenEditModal}
        user={user}
        setIsLoadUser={setIsLoadUser}
      />
    </LayoutSocial>
  );
};

export default PersonalPage;
