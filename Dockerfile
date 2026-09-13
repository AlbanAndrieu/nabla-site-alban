# syntax=docker/dockerfile:1
# Static fallback only. Production remains the Next.js application on Vercel.
FROM nginxinc/nginx-unprivileged:1.30.4-alpine-slim@sha256:3a4485bf084957d56674ee22db07d77d5a281418815c5852827419d6d629d440

LABEL org.opencontainers.image.title="nabla-site-alban" \
      org.opencontainers.image.vendor="nabla" \
      org.opencontainers.image.description="Static public/ fallback for nabla-site-alban"

COPY public/ /usr/share/nginx/html/

EXPOSE 8080

USER 101

CMD ["nginx", "-g", "daemon off;"]
