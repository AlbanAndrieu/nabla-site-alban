# syntax=docker/dockerfile:1
# Static fallback only. Production remains the Next.js application on Vercel.
FROM nginxinc/nginx-unprivileged:1.30.4-alpine-slim

LABEL org.opencontainers.image.title="nabla-site-alban" \
      org.opencontainers.image.vendor="nabla" \
      org.opencontainers.image.description="Static public/ fallback for nabla-site-alban"

COPY public/ /usr/share/nginx/html/

EXPOSE 8080

USER 101

CMD ["nginx", "-g", "daemon off;"]
