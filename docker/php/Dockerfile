FROM php:8.1-fpm-alpine

RUN apk update && \
  apk add --update --no-cache \
  libjpeg-turbo-dev \
  libwebp-dev \
  libpng-dev \
  zlib-dev \
  libarchive-tools \
  curl \
  wget \
  unzip \
  vim \
  iputils-ping \
  bc \
  git

RUN apk update && \
  apk add --update --no-cache php-zip composer


RUN docker-php-ext-configure gd --with-jpeg --with-webp && \
  docker-php-ext-install -j$(nproc) gd
  
RUN apk add --no-cache zip libzip-dev
RUN docker-php-ext-configure zip && \
  docker-php-ext-install zip

# # imagemagick
# RUN apk update && apk add --no-cache php81-pecl-imagick

# pdftoppm
# RUN apk add --update --no-cache xpdf
RUN apk add --update --no-cache poppler-utils

# 日本語対応
ENV TZ=Asia/Tokyo \
  # locale
  LANG=ja_JP.UTF-8 \
  LANGUAGE=ja_JP:ja \
  LC_ALL=ja_JP.UTF-8