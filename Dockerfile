# syntax=docker/dockerfile:1
# user-service/Dockerfile
FROM php:8.4-fpm AS base

# dockerfile_lint - ignore
LABEL name="nabla-site-alban" vendor="nabla" version="0.0.5"

ENV APP_BASE_DIR=/app

ENV PHP_VERSION=8.4
ENV DEBIAN_FRONTEND=noninteractive

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_HOME=/var/www/html/api \
    COMPOSER_MAX_PARALLEL_HTTP=24

# checkov:skip=CKV_DOCKER_8:Ensure the last USER is not root
# hadolint ignore=DL3002
# USER root

# PHP dependencies and Node
# dockerfile_lint - ignore
# hadolint ignore=DL3008
RUN apt-get update -qq && \
    apt-get install -qy --no-install-recommends \
    unzip \
    zip \
    xz-utils \
    libxml2-dev \
    libzip-dev \
    zlib1g-dev \
    libpq-dev \
    libmagickwand-dev \
    libkrb5-dev \
    libssh2-1-dev \
    curl \
    git \
    locales \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# because of tzdata and the need of noninteractive
ENV TZ="Europe/Paris"
RUN echo "${TZ}" > /etc/timezone
RUN ln -fs /usr/share/zoneinfo/${TZ} /etc/localtime && locale-gen en_US.UTF-8 \
    && dpkg-reconfigure --frontend noninteractive tzdata

# PHP COMPOSER
# dockerfile_lint - ignore
# hadolint ignore=DL3008,DL4006
# RUN apt-get update && \
#     apt-get install -yq --no-install-recommends \
#     && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer && \
#     apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN docker-php-ext-install pdo pdo_mysql

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR ${APP_BASE_DIR}

COPY composer.json composer.json composer.lock ${APP_BASE_DIR}/
COPY ./api ${APP_BASE_DIR}

# Create env files to make composer install work
# COPY --chown=www-data:www-data config/parameters.yml.dist config/parameters.yml

# hadolint ignore=SC2115
# RUN --mount=type=secret,id=read-package-token \
#   composer config --global gitlab-oauth.gitlab.com $(cat /run/secrets/read-package-token) && \
#   touch .env && \
#   composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev --no-scripts && \
#   php bin/console assets:install public && \
#   apt-get clean && rm -r /var/lib/apt/lists/* && \
#   rm -Rf /root/.composer/auth.json ${APP_BASE_DIR}/auth.json ~/.cache/composer ~/.config/composer ${APP_BASE_DIR}/var/* .env

# hadolint ignore=SC2115
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev --no-scripts && \
  apt-get clean && rm -r /var/lib/apt/lists/* && \
  rm -Rf /root/.composer/auth.json ${APP_BASE_DIR}/auth.json ~/.cache/composer ~/.config/composer ${APP_BASE_DIR}/var/* .env

CMD ["php-fpm"]

EXPOSE 80
