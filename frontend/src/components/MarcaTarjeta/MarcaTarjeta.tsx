import React from 'react';
import type { MarcaTarjeta as Marca } from '../../utils/tarjeta';
import { NOMBRE_MARCA } from '../../utils/tarjeta';

interface Props {
  marca: Marca;
  /** Versión clara para fondos oscuros (la tarjeta). */
  claro?: boolean;
  alto?: number;
}

/** Logo simplificado de la marca de la tarjeta. */
export const MarcaTarjeta: React.FC<Props> = ({ marca, claro = false, alto = 22 }) => {
  const titulo = NOMBRE_MARCA[marca];
  if (marca === 'visa') {
    return (
      <svg height={alto} viewBox="0 0 64 22" role="img" aria-label={titulo}>
        <text
          x="0"
          y="18"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="21"
          letterSpacing="-0.5"
          fill={claro ? '#fffdf9' : '#1a1f71'}
        >
          VISA
        </text>
      </svg>
    );
  }
  if (marca === 'mastercard') {
    return (
      <svg height={alto} viewBox="0 0 36 22" role="img" aria-label={titulo}>
        <circle cx="13" cy="11" r="10" fill="#eb001b" />
        <circle cx="23" cy="11" r="10" fill="#f79e1b" />
        <path d="M18 2.3a10 10 0 0 1 0 17.4 10 10 0 0 1 0-17.4Z" fill="#ff5f00" />
      </svg>
    );
  }
  if (marca === 'amex') {
    return (
      <svg height={alto} viewBox="0 0 44 22" role="img" aria-label={titulo}>
        <rect width="44" height="22" rx="3" fill="#2e77bc" />
        <text x="22" y="15" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="10" fill="#fff">
          AMEX
        </text>
      </svg>
    );
  }
  return (
    <svg height={alto} viewBox="0 0 34 22" role="img" aria-label={titulo}>
      <rect x="1" y="1" width="32" height="20" rx="3" fill="none" stroke={claro ? '#fffdf9' : '#a39b8f'} strokeWidth="1.5" />
      <rect x="1" y="6" width="32" height="4" fill={claro ? '#fffdf9' : '#a39b8f'} />
    </svg>
  );
};
