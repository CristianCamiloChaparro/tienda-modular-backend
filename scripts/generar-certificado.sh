#!/usr/bin/env sh
# Genera el certificado para probar HTTPS en local (perfil "https") en certs/tienda-local.p12.
# - Con mkcert instalado: certificado firmado por una CA local en la que el equipo confia (candado sin aviso).
#   mkcert siempre protege el .p12 con la clave "changeit": use SSL_PASSWORD=changeit en el .env.
# - Sin mkcert: certificado autofirmado con keytool; el navegador mostrara una advertencia.
# La clave del archivo se toma de SSL_PASSWORD (archivo .env), nunca se escribe en el codigo.
# En produccion (Render) el certificado lo emite la plataforma automaticamente.
set -e
cd "$(dirname "$0")/.."

if [ -z "$SSL_PASSWORD" ] && [ -f .env ]; then
  SSL_PASSWORD=$(sed -n 's/^SSL_PASSWORD=//p' .env | tr -d '\r')
fi
if [ -z "$SSL_PASSWORD" ]; then
  echo "Falta SSL_PASSWORD: agreguela al archivo .env (ver .env.example)" >&2
  exit 1
fi

mkdir -p certs
rm -f certs/tienda-local.p12

if command -v mkcert >/dev/null 2>&1; then
  if [ "$SSL_PASSWORD" != "changeit" ]; then
    echo "mkcert usa la clave 'changeit': ponga SSL_PASSWORD=changeit en el .env" >&2
    exit 1
  fi
  mkcert -install
  mkcert -pkcs12 -p12-file certs/tienda-local.p12 localhost 127.0.0.1 ::1
else
  echo "mkcert no esta instalado: se genera un certificado autofirmado con keytool"
  keytool -genkeypair -alias tienda-local -keyalg RSA -keysize 2048 -validity 365 \
    -storetype PKCS12 -keystore certs/tienda-local.p12 -storepass "$SSL_PASSWORD" \
    -dname "CN=localhost, OU=Tienda Modular, O=Proyecto de Aula, C=CO" \
    -ext "SAN=dns:localhost,ip:127.0.0.1"
fi
echo "Certificado creado en certs/tienda-local.p12"
