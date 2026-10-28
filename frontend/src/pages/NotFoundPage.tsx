import React from 'react';
import { Link } from 'react-router';

export const NotFoundPage: React.FC = () => (
  <div className="container">
    <div className="vacio" style={{ marginTop: 32 }}>
      <span className="vacio-marca">Error 404</span>
      <h1 className="vacio-titulo">Página no encontrada</h1>
      <p className="vacio-texto">La dirección que buscas no existe o fue movida.</p>
      <Link to="/" className="btn btn-primary">
        Volver al catálogo
      </Link>
    </div>
  </div>
);
