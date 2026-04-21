# syntax=docker/dockerfile:1
# Serves the static site from public/ (no PHP runtime).
FROM nginx:1.27-alpine

LABEL name="nabla-site-alban" vendor="nabla" version="0.0.6"

COPY public/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
