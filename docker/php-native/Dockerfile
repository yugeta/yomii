FROM php:8.1-fpm

# Archive
RUN apt update && apt install -y curl
RUN apt update && apt install -y zip
RUN apt update && apt install -y unzip
RUN apt update && apt install -y vim
RUN apt update && apt install -y iputils-ping
RUN apt update && apt install -y bc
RUN apt update && apt install -y language-pack-ja

RUN apt update && apt install -y \
  # libjpeg-turbo-dev \
  libwebp-dev \
  libpng-dev \
  # zlib-dev \
  # libarchive-tools \
  unar



# RUN apk update && apk add -u zlib-dev \
#   && docker-php-ext-install zip

# RUN docker-php-ext-configure gd --with-jpeg
RUN docker-php-ext-install -j$(nproc) gd




# RUN apt update && apk search unar
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

# ENV TZ=Asia/Tokyo \
#   # locale
#   LANG=ja_JP.UTF-8 \
#   LANGUAGE=ja_JP:ja \
#   LC_ALL=ja_JP.UTF-8