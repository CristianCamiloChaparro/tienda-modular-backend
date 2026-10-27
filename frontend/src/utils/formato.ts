const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  // Explicito: segun la version de ICU, COP se formatea con 0 o con 2 decimales por defecto.
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const fechaFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatearPrecio(valor: number): string {
  return copFormatter.format(valor);
}

export function formatearFecha(iso: string): string {
  return fechaFormatter.format(new Date(iso));
}

export function mensajeDeError(err: unknown, porDefecto = 'Ocurrió un error inesperado'): string {
  return err instanceof Error && err.message ? err.message : porDefecto;
}

/** Errores por campo que devuelve la API (ApiError.campos) para mostrarlos junto a cada input. */
export function erroresDeCampos(err: unknown): Record<string, string> {
  const campos = (err as { apiError?: { campos?: Record<string, string> | null } })?.apiError?.campos;
  return campos ?? {};
}
