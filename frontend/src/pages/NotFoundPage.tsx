import React from 'react';
import { Link } from 'react-router';

export const NotFoundPage: React.FC = () => (
  <div className="container">
    <header className="page-header">
      <h1 className="page-title">Página no encontrada</h1>
      <p className="page-subtitle">La dirección que buscas no existe.</p>
    </header>
    <Link to="/" className="btn btn-primary">
      Volver al catálogo
    </Link>
  </div>
);
