import type { ReactNode } from "react";

interface Props {
  titulo: string;
  descripcion?: string;
  eyebrow?: string;
  acciones?: ReactNode;
}

export function PageHeader({ titulo, descripcion, eyebrow, acciones }: Props) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 sm:mb-8 lg:flex-row lg:items-end">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent-dark">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{titulo}</h1>
        {descripcion ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted sm:text-base">
            {descripcion}
          </p>
        ) : null}
      </div>
      {acciones ? (
        <div className="flex flex-wrap items-center gap-2">{acciones}</div>
      ) : null}
    </header>
  );
}
