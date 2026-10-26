export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
  creadoEn?: string;
}

export interface CategoriaRequest {
  nombre: string;
  descripcion?: string | null;
}
