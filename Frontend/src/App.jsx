import React, { createContext, useContext, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPassword from "./pages/ForgotPassword";
import LoadingNavigate from "./pages/LoadingNavigate";
import MovieHomePage from "./pages/UserPage/MovieHomePage";
import ClubHomePage from "./pages/UserPage/ClubHomePage";
import MovieDetailPage from "./pages/UserPage/MovieDetailPage";
import OrderTicket from "./pages/UserPage/OrderTicket";
import OrderCombo from "./pages/UserPage/OrderCombo";
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage";
import AdminMoviesPage from "./pages/Admin/AdminMoviesPage";
import AdminShowtimesPage from "./pages/Admin/AdminShowtimesPage";
import AdminUsersPage from "./pages/Admin/AdminUsersPage";
import SelectCinemaPage from "./pages/UserPage/SelectCinemaPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import {
  canAccessAdminDashboard,
  canManageMoviesAndShowtimes,
  getRoleIdFromToken,
  isSystemAdmin,
} from "./utils/jwt";
import CreateUser from "./components/Admin/UserManagement/CreateUser";

const AppContext = createContext(null);

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used within AppContext.Provider");
  }

  return context;
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    return <Navigate replace to="/login" />;
  }

  return children;
}

function RoleRoute({ children, allow }) {
  const token = localStorage.getItem("accessToken");
  const roleId = getRoleIdFromToken(token);

  if (!allow(roleId)) {
    return <Navigate replace to="/access-denied" />;
  }

  return children;
}

function AppRoutes() {
  const token = localStorage.getItem("accessToken");

  return (
    <Routes>
      <Route path="/" element={<Navigate replace to={token ? "/social/home" : "/login"} />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="/home-club" element={<ClubHomePage />} />
      <Route path="/movie/:id" element={<MovieDetailPage />} />
      <Route
        path="/social/home"
        element={
          <ProtectedRoute>
            <MovieHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/select-cinema"
        element={
          <ProtectedRoute>
            <SelectCinemaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/order-ticket"
        element={
          <ProtectedRoute>
            <OrderTicket />
          </ProtectedRoute>
        }
      />
      <Route
        path="/order-ticket/combo"
        element={
          <ProtectedRoute>
            <OrderCombo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allow={canAccessAdminDashboard}>
              <AdminDashboardPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/movies"
        element={
          <ProtectedRoute>
            <RoleRoute allow={canManageMoviesAndShowtimes}>
              <AdminMoviesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/showtimes"
        element={
          <ProtectedRoute>
            <RoleRoute allow={canManageMoviesAndShowtimes}>
              <AdminShowtimesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <RoleRoute allow={isSystemAdmin}>
              <AdminUsersPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/create"
        element={
          <ProtectedRoute>
            <RoleRoute allow={isSystemAdmin}>
              <CreateUser />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate replace to={token ? "/social/home" : "/login"} />} />
    </Routes>
  );
}

function App() {
  const [appState, setAppState] = useState({
    loading: false,
  });

  const contextValue = useMemo(() => ({ appState, setAppState }), [appState]);

  return (
    <AppContext.Provider value={contextValue}>
      <BrowserRouter>
        <LoadingNavigate />
        <AppRoutes />
      </BrowserRouter>
    </AppContext.Provider>
  );
}

export default App;
