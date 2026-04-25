export async function refreshAccessToken() {
  try {
    const currentToken = localStorage.getItem("accessToken");
    if (!currentToken) return null;

    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + currentToken,
      },
    });
    const raw = await res.text();
    if (!raw) return null;

    let response;
    try {
      response = JSON.parse(raw);
    } catch {
      return null;
    }

    if (response.status === "success") {
      localStorage.setItem("accessToken", response.data.token);
      return response.data.token;
    }
    return null;
  } catch (error) {
    console.error("Lỗi khi refresh token:", error);
    return null;
  }
}
