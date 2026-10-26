import React, { useEffect, useState } from 'react';
import type { Categoria } from '../../types/categoria';
import { actualizarCategoria, crearCategoria, eliminarCategoria, getCategorias } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { erroresDeCampos, mensajeDeError } from '../../utils/formato';
import styles from './Admin.module.scss';

export const AdminCategoriasPage: React.FC = () => {
  const { notificar } = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    getCategorias()
      .then(setCategorias)
      .catch((err) => setError(mensajeDeError(err)))
      .finally(() => setCargando(false));
  }, []);

  const limpiarForm = () => {
    setEditandoId(null);
    setNombre('');
    setDescripcion('');
    setErrores({});
  };

  const editar = (c: Categoria) => {
    setEditandoId(c.id);
    setNombre(c.nombre);
    setDescripcion(c.descripcion ?? '');
    setErrores({});
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrores({ nombre: 'El nombre es obligatorio' });
      return;
    }
    setGuardando(true);
    setErrores({});
    const datos = { nombre, descripcion: descripcion || null };
    try {
      if (editandoId === null) {
        const creada = await crearCategoria(datos);
        setCategorias((cs) => [...cs, creada].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        notificar(`Categoría "${creada.nombre}" creada`);
      } else {
        const actualizada = await actualizarCategoria(editandoId, datos);
        setCategorias((cs) => cs.map((c) => (c.id === actualizada.id ? actualizada : c)));
        notificar(`Categoría "${actualizada.nombre}" actualizada`);
      }
      limpiarForm();
    } catch (err) {
      setErrores({ general: mensajeDeError(err), ...erroresDeCampos(err) });
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (c: Categoria) => {
    if (!window.confirm(`¿Eliminar la categoría "${c.nombre}"?`)) {
      return;
    }
    try {
      await eliminarCategoria(c.id);
      setCategorias((cs) => cs.filter((x) => x.id !== c.id));
      if (editandoId === c.id) {
        limpiarForm();
      }
      notificar(`Categoría "${c.nombre}" eliminada`);
    } catch (err) {
      // Ej. 409: "No se puede eliminar la categoría porque tiene productos asociados"
      notificar(mensajeDeError(err, 'No se pudo eliminar la categoría'), 'error');
    }
  };

  return (
    <section className={styles.split} aria-label="Gestión de categorías">
      <form className={`panel ${styles.formPanel}`} onSubmit={handleGuardar} noValidate>
        <h2 className={styles.formTitle}>{editandoId === null ? 'Nueva categoría' : 'Editar categoría'}</h2>
        {errores.general && <div className="alert alert-error">{errores.general}</div>}
        <div className="field">
          <label htmlFor="c-nombre">Nombre</label>
          <input
            id="c-nombre"
            className="input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={80}
            aria-invalid={Boolean(errores.nombre)}
          />
          {errores.nombre && <span className="field-error">{errores.nombre}</span>}
        </div>
        <div className="field">
          <label htmlFor="c-descripcion">Descripción (opcional)</label>
          <textarea
            id="c-descripcion"
            className="input"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            maxLength={255}
            rows={3}
          />
        </div>
        <div className={styles.formActions}>
          {editandoId !== null && (
            <button type="button" className="btn btn-secondary" onClick={limpiarForm} disabled={guardando}>
              Cancelar
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            {guardando ? 'Guardando...' : editandoId === null ? 'Crear categoría' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      <div>
        {error && <div className="alert alert-error">{error}</div>}
        {cargando ? (
          <div className="panel" aria-busy="true">Cargando categorías...</div>
        ) : (
          <ul className={styles.cardList}>
            {categorias.map((c) => (
              <li key={c.id} className={`panel ${styles.cardItem} ${editandoId === c.id ? styles.editing : ''}`}>
                <div>
                  <strong>{c.nombre}</strong>
                  {c.descripcion && <p className={styles.muted}>{c.descripcion}</p>}
                </div>
                <div className={styles.rowActions}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => editar(c)}>
                    Editar
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleEliminar(c)}>
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
            {categorias.length === 0 && <li className="panel">Aún no hay categorías.</li>}
          </ul>
        )}
      </div>
    </section>
  );
};
