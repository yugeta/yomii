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

# imagemagick
RUN apk update && apk add --no-cache php81-pecl-imagick
# RUN apk add --no-cache --virtual build-dependencies gcc make autoconf libc-dev libtool jpeg-dev
# RUN apk add --no-cache libpng libjpeg libgcc libgomp
# RUN mkdir ~/src
# RUN cd ~/src
# RUN wget https://github.com/ImageMagick/ImageMagick/archive/7.0.7-28.tar.gz
# # CMD [ "curl https://github.com/ImageMagick/ImageMagick/archive/7.0.7-28.tar.gz -o ImageMagick-7.0.7-28"]
# RUN cd ImageMagick-7.0.7-28
# RUN ./configure
# CMD [ "pecl install imagick" ]
# CMD [ "echo 'extension=imagick.so' > /usr/local/etc/php/conf.d/imagick.ini"]
# CMD [ "rm -rf ~/src" ]
# RUN apk del --purge build-dependencies


# 日本語対応
ENV TZ=Asia/Tokyo \
  # locale
  LANG=ja_JP.UTF-8 \
  LANGUAGE=ja_JP:ja \
  LC_ALL=ja_JP.UTF-8