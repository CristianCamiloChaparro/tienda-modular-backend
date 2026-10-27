# ---------- Etapa 1: build con npm (gestor de dependencias) + Vite ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- Etapa 2: nginx sirve los estaticos y hace de proxy hacia la API ----------
FROM nginx:1.27-alpine
ENV PORT=80 \
    BACKEND_URL=http://backend:8080 \
    HSTS_MAX_AGE=31536000
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
