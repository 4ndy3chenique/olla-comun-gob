import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";
import { Alerta } from "../ui/Alerta";
import { Modal } from "../ui/Modal";

const esquema = z
  .object({
    actual: z.string().min(1, "Ingresa tu contraseña actual.").max(72),
    nueva: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres.")
      .max(72, "Máximo 72 caracteres."),
    confirmar: z.string().min(1, "Confirma la nueva contraseña."),
  })
  .refine((datos) => datos.nueva === datos.confirmar, {
    message: "Las contraseñas nuevas no coinciden.",
    path: ["confirmar"],
  })
  .refine((datos) => datos.nueva !== datos.actual, {
    message: "La nueva contraseña debe ser distinta de la actual.",
    path: ["nueva"],
  });

type Datos = z.infer<typeof esquema>;

export function CambiarContrasenaModal({
  abierto,
  onCerrar,
}: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  const { cambiarContrasena } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<Datos>({
    resolver: zodResolver(esquema),
    defaultValues: { actual: "", nueva: "", confirmar: "" },
  });

  useEffect(() => {
    if (!abierto) reset();
  }, [abierto, reset]);

  async function enviar(datos: Datos) {
    try {
      await cambiarContrasena(datos.actual, datos.nueva);
      reset({ actual: "", nueva: "", confirmar: "" });
    } catch (fallo) {
      if (fallo instanceof ApiError) {
        if (fallo.errores.actual) setError("actual", { message: fallo.errores.actual });
        if (fallo.errores.nueva) setError("nueva", { message: fallo.errores.nueva });
        setError("root", { message: fallo.message });
      } else {
        setError("root", { message: "No pudimos cambiar la contraseña." });
      }
    }
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Cambiar contraseña"
      descripcion="Al guardar se cerrarán las demás sesiones abiertas de tu cuenta."
      ancho="sm"
      pie={
        <>
          <button type="button" className="btn-secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="submit"
            form="form-cambiar-clave"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando…" : "Guardar contraseña"}
          </button>
        </>
      }
    >
      <form id="form-cambiar-clave" className="space-y-4" onSubmit={handleSubmit(enviar)} noValidate>
        {isSubmitSuccessful ? (
          <Alerta tono="success" titulo="Contraseña actualizada">
            La nueva contraseña ya está vigente.
          </Alerta>
        ) : null}
        {errors.root?.message ? <Alerta tono="danger">{errors.root.message}</Alerta> : null}

        <div>
          <label className="label-field" htmlFor="clave-actual">
            Contraseña actual
          </label>
          <input
            id="clave-actual"
            type="password"
            autoComplete="current-password"
            className="input-field"
            aria-invalid={Boolean(errors.actual)}
            {...register("actual")}
          />
          {errors.actual ? <p className="help-text text-danger">{errors.actual.message}</p> : null}
        </div>

        <div>
          <label className="label-field" htmlFor="clave-nueva">
            Nueva contraseña
          </label>
          <input
            id="clave-nueva"
            type="password"
            autoComplete="new-password"
            className="input-field"
            aria-invalid={Boolean(errors.nueva)}
            {...register("nueva")}
          />
          <p className="help-text">Entre 8 y 72 caracteres.</p>
          {errors.nueva ? <p className="help-text text-danger">{errors.nueva.message}</p> : null}
        </div>

        <div>
          <label className="label-field" htmlFor="clave-confirmar">
            Confirmar nueva contraseña
          </label>
          <input
            id="clave-confirmar"
            type="password"
            autoComplete="new-password"
            className="input-field"
            aria-invalid={Boolean(errors.confirmar)}
            {...register("confirmar")}
          />
          {errors.confirmar ? (
            <p className="help-text text-danger">{errors.confirmar.message}</p>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}
