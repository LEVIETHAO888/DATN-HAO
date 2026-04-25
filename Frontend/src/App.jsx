import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPassword from "./pages/ForgotPassword";
import LoadingNavigate from "./pages/LoadingNavigate";
import HomePage from "./pages/UserPage/HomePage";
import MoviesPage from "./pages/UserPage/MoviesPage";
import AboutPage from "./pages/UserPage/AboutPage";
import PromotionsPage from "./pages/UserPage/PromotionsPage";
import MovieDetailPage from "./pages/UserPage/MovieDetailPage";
import OrderTicket from "./pages/UserPage/OrderTicket";
import OrderCombo from "./pages/UserPage/OrderCombo";
import PaymentPage from "./pages/UserPage/PaymentPage";
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage";
import AdminMoviesPage from "./pages/Admin/AdminMoviesPage";
import AdminShowtimesPage from "./pages/Admin/AdminShowtimesPage";
import AdminUsersPage from "./pages/Admin/AdminUsersPage";
import AdminCombosPage from "./pages/Admin/AdminCombosPage";
import AdminPromotionsPage from "./pages/Admin/AdminPromotionsPage";
import AdminBookingsPage from "./pages/Admin/AdminBookingsPage";
import AdminCinemasPage from "./pages/Admin/AdminCinemasPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import {
  canAccessAdminDashboard,
  getRoleIdFromToken,
  isSystemAdmin,
} from "./utils/jwt";
import CreateUser from "./pages/Admin/UserManagement/CreateUser";
import PaymentStatus from "./pages/UserPage/PaymentStatus";
import PersonalPage from "./pages/UserPage/PersonalPage";

export const AppContext = createContext(null);

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used within AppContext.Provider");
  }

  return context;
}

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLogin, setIsLogin] = useState(!!localStorage.getItem("accessToken"));
  const value = useMemo(() => ({ isLogin, setIsLogin }), [isLogin]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

const ProtectedRoute = ({ children, requireRole }) => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    return <Navigate replace to="/login" />;
  }

  if (requireRole) {
    const hasRole = Array.isArray(requireRole)
      ? requireRole.some((role) => role())
      : requireRole();

    if (!hasRole) {
      if (getRoleIdFromToken(token) === 1) {
        return <Navigate replace to="/" />;
      }
      return <Navigate replace to="/access-denied" />;
    }
  }

  return children;
};

function AppRoutes() {
  const token = localStorage.getItem("accessToken");

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="/movie/:id" element={<MovieDetailPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/promotions" element={<PromotionsPage />} />
      <Route
        path="/movies"
        element={
          <ProtectedRoute>
            <MoviesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment"
        element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      {/* Public: VNPay redirects here without auth header */}
      <Route path="/payment-status" element={<PaymentStatus />} />
      <Route
        path="/order-ticket"
        element={
          <ProtectedRoute>
            <OrderTicket />
          </ProtectedRoute>
        }
      />
      <Route
        path="/order-combo"
        element={
          <ProtectedRoute>
            <OrderCombo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute
            requireRole={() =>
              canAccessAdminDashboard(getRoleIdFromToken(localStorage.getItem("accessToken")))
            }
          >
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/movies"
        element={
          <ProtectedRoute
            requireRole={() =>
              isSystemAdmin(getRoleIdFromToken(localStorage.getItem("accessToken")))
            }
          >
            <AdminMoviesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/showtimes"
        element={
          <ProtectedRoute
            requireRole={() =>
              isSystemAdmin(getRoleIdFromToken(localStorage.getItem("accessToken")))
            }
          >
            <AdminShowtimesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cinemas"
        element={
          <ProtectedRoute
            requireRole={() =>
              isSystemAdmin(getRoleIdFromToken(localStorage.getItem("accessToken")))
            }
          >
            <AdminCinemasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute
            requireRole={() =>
              isSystemAdmin(getRoleIdFromToken(localStorage.getItem("accessToken")))
            }
          >
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/create"
        element={
          <ProtectedRoute
            requireRole={() =>
              isSystemAdmin(getRoleIdFromToken(localStorage.getItem("accessToken")))
            }
          >
            <CreateUser />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:id"
        element={
          <ProtectedRoute>
            <PersonalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/combos"
        element={
          <ProtectedRoute
            requireRole={() =>
              canAccessAdminDashboard(getRoleIdFromToken(localStorage.getItem("accessToken")))
            }
          >
            <AdminCombosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/promotions"
        element={
          <ProtectedRoute
            requireRole={() =>
              canAccessAdminDashboard(getRoleIdFromToken(localStorage.getItem("accessToken")))
            }
          >
            <AdminPromotionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute
            requireRole={() =>
              canAccessAdminDashboard(getRoleIdFromToken(localStorage.getItem("accessToken")))
            }
          >
            <AdminBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  const [appState, setAppState] = useState({
    loading: false,
  });

  const contextValue = useMemo(() => ({ appState, setAppState }), [appState]);

  return (
    <AppContext.Provider value={contextValue}>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <LoadingNavigate />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </AppContext.Provider>
  );
};

export default App;
