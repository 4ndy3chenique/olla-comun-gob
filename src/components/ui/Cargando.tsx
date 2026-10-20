export function Cargando({ texto = "Cargando información…" }: { texto?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-muted" role="status">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary"
        aria-hidden="true"
      />
      <span>{texto}</span>
    </div>
  );
}

export function CargandoPagina() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="flex items-center gap-3 text-sm font-medium text-muted" role="status">
        <span
          className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary"
          aria-hidden="true"
        />
        Verificando sesión…
      </div>
    </div>
  );
}
