FROM ubuntu:23.10-alpine

COPY init.sh /root/init.sh

# Archive
RUN apt-get update && apt-get install -y \
  curl \
  zip \
  unzip \
  unar \
  vim \
  libfreetype6-dev \
  libpng-dev \
  iputils-ping \
  bc

