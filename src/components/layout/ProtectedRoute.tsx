import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { CargandoPagina } from "../ui/Cargando";
import { AccesoDenegadoPage } from "../../pages/AccesoDenegadoPage";
import type { Rol } from "../../types/api";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { funcionario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return <CargandoPagina />;

  if (!funcionario) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ desde: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <>{children}</>;
}

export function RolRoute({
  roles,
  children,
}: {
  roles: Rol[];
  children: ReactNode;
}) {
  const { tieneRol } = useAuth();
  if (!tieneRol(...roles)) return <AccesoDenegadoPage />;
  return <>{children}</>;
}
