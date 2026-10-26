#!/usr/bin/env sh
# Genera un certificado autofirmado para probar HTTPS en local (perfil "https").
# El navegador mostrara una advertencia porque no lo firma una autoridad reconocida;
# en produccion (Render) el certificado lo emite la plataforma automaticamente.
set -e
cd "$(dirname "$0")/.."
mkdir -p certs
keytool -genkeypair -alias tienda-local -keyalg RSA -keysize 2048 -validity 365 \
  -storetype PKCS12 -keystore certs/tienda-local.p12 -storepass tienda-local \
  -dname "CN=localhost, OU=Tienda Modular, O=Proyecto de Aula, C=CO" \
  -ext "SAN=dns:localhost,ip:127.0.0.1"
echo "Certificado creado en certs/tienda-local.p12"
