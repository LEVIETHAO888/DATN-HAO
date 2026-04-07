/** @param {string | null | undefined} token */
export function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

/** @param {string | null | undefined} token */
export function getRoleFromToken(token) {
  return decodeJwtPayload(token)?.role ?? null;
}

/** @param {unknown} role */
export function normalizeRoleId(role) {
  if (role == null) return null;

  if (typeof role === "number" && Number.isFinite(role)) {
    return role;
  }

  const raw = String(role).trim();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  switch (raw.toUpperCase()) {
    case "ADMIN":
      return 1;
    case "MANAGER":
    case "MODERATOR":
    case "REVIEWER":
    case "CENSOR":
      return 2;
    case "USER":
      return 3;
    default:
      return null;
  }
}

/** @param {string | null | undefined} token */
export function getRoleIdFromToken(token) {
  const payload = decodeJwtPayload(token);
  return normalizeRoleId(payload?.roleId ?? payload?.role);
}

/** @param {number | null | undefined} roleId */
export function canAccessAdminDashboard(roleId) {
  return roleId === 1 || roleId === 2;
}

/** @param {number | null | undefined} roleId */
export function canManageMoviesAndShowtimes(roleId) {
  return roleId === 1 || roleId === 2;
}

/** @param {number | null | undefined} roleId */
export function isSystemAdmin(roleId) {
  return roleId === 1;
}

/** @param {number | null | undefined} roleId */
export function getRoleLabel(roleId) {
  switch (normalizeRoleId(roleId)) {
    case 1:
      return "Admin he thong";
    case 2:
      return "Manager";
    case 3:
      return "Nguoi dung";
    default:
      return "Khong xac dinh";
  }
}
