import React, { useEffect, useMemo, useState } from 'react';
import type { Categoria } from '../../types/categoria';
import type { Producto, ProductoRequest } from '../../types/producto';
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  getCategorias,
  getProductos,
} from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { erroresDeCampos, formatearPrecio, mensajeDeError } from '../../utils/formato';
import styles from './Admin.module.scss';

interface FormState {
  categoriaId: string;
  nombre: string;
  descripcion: string;
  precio: string;
  stock: string;
  imagenUrl: string;
}

const FORM_VACIO: FormState = {
  categoriaId: '',
  nombre: '',
  descripcion: '',
  precio: '',
  stock: '',
  imagenUrl: '',
};

function aFormulario(p: Producto): FormState {
  return {
    categoriaId: String(p.categoriaId),
    nombre: p.nombre,
    descripcion: p.descripcion ?? '',
    precio: String(p.precio),
    stock: String(p.stock),
    imagenUrl: p.imagenUrl ?? '',
  };
}

/** Validaciones iguales a las del backend, para avisar antes de enviar. */
function validar(f: FormState): Record<string, string> {
  const errores: Record<string, string> = {};
  if (!f.categoriaId) errores.categoriaId = 'Selecciona una categoría';
  if (!f.nombre.trim()) errores.nombre = 'El nombre es obligatorio';
  if (!f.precio || Number(f.precio) <= 0) errores.precio = 'El precio debe ser mayor que 0';
  if (f.stock === '' || !Number.isInteger(Number(f.stock)) || Number(f.stock) < 0) {
    errores.stock = 'El stock debe ser un número entero de 0 o más';
  }
  if (f.imagenUrl && !/^https?:\/\/.+/.test(f.imagenUrl.trim())) {
    errores.imagenUrl = 'La imagen debe ser una URL que empiece por http:// o https://';
  }
  return errores;
}

export const AdminProductosPage: React.FC = () => {
  const { notificar } = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const [formAbierto, setFormAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    Promise.all([getProductos(null), getCategorias()])
      .then(([prods, cats]) => {
        setProductos(prods);
        setCategorias(cats);
      })
      .catch((err) => setError(mensajeDeError(err)))
      .finally(() => setCargando(false));
  }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q
      ? productos.filter(
          (p) => p.nombre.toLowerCase().includes(q) || p.categoriaNombre.toLowerCase().includes(q)
        )
      : productos;
  }, [productos, busqueda]);

  const abrirNuevo = () => {
    setEditandoId(null);
    setForm({ ...FORM_VACIO, categoriaId: categorias[0] ? String(categorias[0].id) : '' });
    setErrores({});
    setFormAbierto(true);
  };

  const abrirEdicion = (p: Producto) => {
    setEditandoId(p.id);
    setForm(aFormulario(p));
    setErrores({});
    setFormAbierto(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cerrarForm = () => {
    setFormAbierto(false);
    setEditandoId(null);
  };

  const cambiar = (campo: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const encontrados = validar(form);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) {
      return;
    }
    const datos: ProductoRequest = {
      categoriaId: Number(form.categoriaId),
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      precio: Number(form.precio),
      stock: Number(form.stock),
      imagenUrl: form.imagenUrl.trim() || null,
    };
    setGuardando(true);
    try {
      if (editandoId === null) {
        const creado = await crearProducto(datos);
        setProductos((ps) => [...ps, creado].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        notificar(`Producto "${creado.nombre}" creado`);
      } else {
        const actualizado = await actualizarProducto(editandoId, datos);
        setProductos((ps) => ps.map((p) => (p.id === actualizado.id ? actualizado : p)));
        notificar(`Producto "${actualizado.nombre}" actualizado`);
      }
      cerrarForm();
    } catch (err) {
      setErrores({ general: mensajeDeError(err), ...erroresDeCampos(err) });
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (p: Producto) => {
    if (!window.confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await eliminarProducto(p.id);
      setProductos((ps) => ps.filter((x) => x.id !== p.id));
      if (editandoId === p.id) {
        cerrarForm();
      }
      notificar(`Producto "${p.nombre}" eliminado`);
    } catch (err) {
      notificar(mensajeDeError(err, 'No se pudo eliminar el producto'), 'error');
    }
  };

  const errorDe = (campo: string) =>
    errores[campo] ? <span className="field-error">{errores[campo]}</span> : null;

  const vistaPrevia = /^https?:\/\/.+/.test(form.imagenUrl.trim()) ? form.imagenUrl.trim() : null;

  return (
    <section aria-label="Gestión de productos">
      <div className={styles.toolbar}>
        <input
          type="search"
          className={`input ${styles.search}`}
          placeholder="Buscar por nombre o categoría"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar productos"
        />
        <button type="button" className="btn btn-primary" onClick={abrirNuevo} disabled={categorias.length === 0}>
          + Nuevo producto
        </button>
      </div>
      {!cargando && categorias.length === 0 && (
        <div className="alert alert-info">Primero crea una categoría en la pestaña Categorías.</div>
      )}

      {formAbierto && (
        <form className={`panel ${styles.formPanel}`} onSubmit={handleGuardar} noValidate>
          <h2 className={styles.formTitle}>{editandoId === null ? 'Nuevo producto' : 'Editar producto'}</h2>
          {errores.general && <div className="alert alert-error">{errores.general}</div>}

          <div className={styles.formGrid}>
            <div>
              <div className="field">
                <label htmlFor="p-nombre">Nombre</label>
                <input
                  id="p-nombre"
                  className="input"
                  value={form.nombre}
                  onChange={cambiar('nombre')}
                  maxLength={120}
                  aria-invalid={Boolean(errores.nombre)}
                />
                {errorDe('nombre')}
              </div>
              <div className="field">
                <label htmlFor="p-categoria">Categoría</label>
                <select
                  id="p-categoria"
                  className="input"
                  value={form.categoriaId}
                  onChange={cambiar('categoriaId')}
                  aria-invalid={Boolean(errores.categoriaId)}
                >
                  <option value="">Selecciona...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                {errorDe('categoriaId')}
              </div>
              <div className={styles.twoCols}>
                <div className="field">
                  <label htmlFor="p-precio">Precio (COP)</label>
                  <input
                    id="p-precio"
                    className="input"
                    type="number"
                    min="1"
                    step="any"
                    value={form.precio}
                    onChange={cambiar('precio')}
                    aria-invalid={Boolean(errores.precio)}
                  />
                  {errorDe('precio')}
                </div>
                <div className="field">
                  <label htmlFor="p-stock">Unidades en stock</label>
                  <input
                    id="p-stock"
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={cambiar('stock')}
                    aria-invalid={Boolean(errores.stock)}
                  />
                  {errorDe('stock')}
                </div>
              </div>
              <div className="field">
                <label htmlFor="p-descripcion">Descripción</label>
                <textarea
                  id="p-descripcion"
                  className="input"
                  value={form.descripcion}
                  onChange={cambiar('descripcion')}
                  maxLength={1000}
                  rows={3}
                />
                {errorDe('descripcion')}
              </div>
            </div>

            <div>
              <div className="field">
                <label htmlFor="p-imagen">URL de la imagen (opcional)</label>
                <input
                  id="p-imagen"
                  className="input"
                  type="url"
                  placeholder="https://..."
                  value={form.imagenUrl}
                  onChange={cambiar('imagenUrl')}
                  aria-invalid={Boolean(errores.imagenUrl)}
                />
                {errorDe('imagenUrl')}
              </div>
              <div className={styles.preview}>
                {vistaPrevia ? <img src={vistaPrevia} alt="Vista previa" /> : <span>Vista previa de la imagen</span>}
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="button" className="btn btn-secondary" onClick={cerrarForm} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editandoId === null ? 'Crear producto' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {cargando ? (
        <div className="panel" aria-busy="true">Cargando productos...</div>
      ) : (
        <div className={`panel ${styles.tablePanel}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col">Categoría</th>
                <th scope="col" className={styles.num}>Precio</th>
                <th scope="col" className={styles.num}>Stock</th>
                <th scope="col" className={styles.actionsCol}>
                  <span className="visually-hidden">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className={styles.productCell}>
                      <div className={styles.thumb}>{p.imagenUrl && <img src={p.imagenUrl} alt="" loading="lazy" />}</div>
                      <span>{p.nombre}</span>
                    </div>
                  </td>
                  <td data-label="Categoría">{p.categoriaNombre}</td>
                  <td data-label="Precio" className={styles.num}>{formatearPrecio(p.precio)}</td>
                  <td data-label="Stock" className={`${styles.num} ${p.stock === 0 ? styles.agotado : ''}`}>
                    {p.stock === 0 ? 'Agotado' : p.stock}
                  </td>
                  <td className={styles.actionsCol}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => abrirEdicion(p)}>
                      Editar
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleEliminar(p)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyRow}>
                    No hay productos que coincidan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
