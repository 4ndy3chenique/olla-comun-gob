import { Link } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import { Icon } from "../components/ui/Icon";

export function AccesoDenegadoPage() {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <PageHeader
        eyebrow="Acceso restringido"
        titulo="No tienes permisos para esta sección"
        descripcion="Tu rol no permite consultar este módulo. Si crees que se trata de un error, comunícate con el administrador del sistema."
      />
      <div className="card card-pad">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-danger-light text-danger">
            <Icon nombre="candado" tamano={24} />
          </span>
          <div>
            <h2 className="font-semibold text-ink">Acceso denegado</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              La Plataforma del Estado registra los accesos y las acciones realizadas.
            </p>
            <Link to="/" className="btn-primary mt-5">
              <Icon nombre="flecha-izquierda" tamano={18} />
              Volver al panel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
