# Imagen para desplegar el front en un servidor aparte (sin proxy a la API en nginx).
# Construir con la URL pública del backend, por ejemplo:
#   docker build --build-arg API_BASE=https://api.tudominio.com -t chatbot-frontend .
FROM nginx:alpine
ARG API_BASE=https://ejemplo.com
COPY index.html css/ js/ /usr/share/nginx/html/
RUN echo "export const API_BASE = \"${API_BASE}\";" > /usr/share/nginx/html/js/config.js
EXPOSE 80
