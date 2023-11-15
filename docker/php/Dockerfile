FROM php:8.1-fpm-alpine

RUN apk update && \
  apk add --update --no-cache \
  libjpeg-turbo-dev \
  libwebp-dev \
  libpng-dev \
  zlib-dev \
  libarchive-tools \
  curl \
  unzip \
  vim \
  libpng-dev \
  iputils-ping \
  bc
  # libzip \
  # zlib-dev

# RUN apk update \
#   && apk add -u zlib-dev zip \
#   && docker-php-ext-configure zip --with-libzip
#   && docker-php-ext-install zip

RUN apk update && apk upgrade
RUN apk add php-zip composer


RUN docker-php-ext-configure gd --with-jpeg --with-webp\
 && docker-php-ext-install -j$(nproc) gd
  
RUN apk add --no-cache zip libzip-dev
RUN docker-php-ext-configure zip \
 && docker-php-ext-install zip




# RUN apk update && apk search unar
# RUN apk update && apk add -u unarj
# RUN apk update && apk add -u unar
# RUN apk update && apk add -u libfreetype6-dev

# RUN apk update && \
#   apk add -u busybox && \
#   apk add --update --no-cache \
#   syslog-ng \
#   cyrus-sasl \
#   postfix \
#   vim

# COPY main.cf /etc/postfix/
# COPY sasl_passwd /etc/postfix/
# RUN /usr/sbin/postmap /etc/postfix/sasl_passwd

# COPY entrypoint.sh /
# ENTRYPOINT ["sh", "/entrypoint.sh"]

# Unar
# RUN apk update && apk add -u alpine-sdk
# RUN apk update && apk add -u libbz2
# # RUN apk update && apk add -u libgnustep-base
# RUN apk update && apk add -u libicu
# RUN apk update && apk add -u libssl
# RUN apk update && apk add -u libz

# RUN apk update && apk add --update --no-cache  unar

# 日本語対応
ENV TZ=Asia/Tokyo \
  # locale
  LANG=ja_JP.UTF-8 \
  LANGUAGE=ja_JP:ja \
  LC_ALL=ja_JP.UTF-8