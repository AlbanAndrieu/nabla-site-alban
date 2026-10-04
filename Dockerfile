# syntax=docker/dockerfile:1
# Static fallback only. Production remains the Next.js application on Vercel.
FROM nginxinc/nginx-unprivileged:1.30.5-alpine-slim@sha256:e28dcf0a161ddcbf228c7364b4a14f9bad4763ae8f5317c437b896afa3df4b84

# The pinned upstream image predates Alpine's pcre2 10.49 security rebuild.
# Upgrade only the affected runtime package, then drop back to the unprivileged UID.
USER root
RUN apk add --no-cache 'pcre2>=10.49-r0'

LABEL org.opencontainers.image.title="nabla-site-alban" \
      org.opencontainers.image.vendor="nabla" \
      org.opencontainers.image.description="Static public/ fallback for nabla-site-alban"

COPY public/ /usr/share/nginx/html/

EXPOSE 8080

USER 101

CMD ["nginx", "-g", "daemon off;"]
