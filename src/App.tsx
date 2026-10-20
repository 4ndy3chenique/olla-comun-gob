import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute, RolRoute } from "./components/layout/ProtectedRoute";
import { AccesoDenegadoPage } from "./pages/AccesoDenegadoPage";
import AuditoriaPage from "./pages/AuditoriaPage";
import DashboardPage from "./pages/DashboardPage";
import FuncionariosPage from "./pages/FuncionariosPage";
import LoginPage from "./pages/LoginPage";
import OllaDetallePage from "./pages/OllaDetallePage";
import OllasPage from "./pages/OllasPage";
import ParametrosPage from "./pages/ParametrosPage";
import ReportesPage from "./pages/ReportesPage";
import SolicitudDetallePage from "./pages/SolicitudDetallePage";
import SolicitudesPage from "./pages/SolicitudesPage";

function RestablecerScroll() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RestablecerScroll />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="solicitudes" element={<SolicitudesPage />} />
            <Route path="solicitudes/:id" element={<SolicitudDetallePage />} />

            <Route
              path="ollas"
              element={
                <RolRoute roles={["SUPERVISOR", "ADMINISTRADOR"]}>
                  <OllasPage />
                </RolRoute>
              }
            />
            <Route
              path="ollas/:id"
              element={
                <RolRoute roles={["SUPERVISOR", "ADMINISTRADOR"]}>
                  <OllaDetallePage />
                </RolRoute>
              }
            />
            <Route
              path="reportes"
              element={
                <RolRoute roles={["SUPERVISOR", "ADMINISTRADOR"]}>
                  <ReportesPage />
                </RolRoute>
              }
            />
            <Route
              path="auditoria"
              element={
                <RolRoute roles={["SUPERVISOR", "ADMINISTRADOR"]}>
                  <AuditoriaPage />
                </RolRoute>
              }
            />

            <Route
              path="funcionarios"
              element={
                <RolRoute roles={["ADMINISTRADOR"]}>
                  <FuncionariosPage />
                </RolRoute>
              }
            />
            <Route
              path="parametros"
              element={
                <RolRoute roles={["ADMINISTRADOR"]}>
                  <ParametrosPage />
                </RolRoute>
              }
            />

            <Route path="acceso-denegado" element={<AccesoDenegadoPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
