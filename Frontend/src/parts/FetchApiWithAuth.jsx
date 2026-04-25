import { refreshAccessToken } from "./ApiRefreshToken";

export const fetchWithAuth = async (url, options = {}) => {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) throw new Error("TokenExpiredError");

  let res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: "Bearer " + accessToken,
    },
  });

  if (res.status === 403) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      throw new Error("ForbiddenError");
    }

    res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: "Bearer " + newToken,
      },
    });
  }

  return res;
};
