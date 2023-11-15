#!/bin/bash


# # 日本語化
# # sudo export LANG=ja_JP.UTF-8
# source /root/.bash_profile

# ９時間ずれ補正
ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime


# # webモジュール起動
# /etc/init.d/nginx start
# /etc/init.d/fcgiwrap start
# /etc/init.d/php7.2-fpm start
# /etc/init.d/exim4 restart



while true ; do
  /bin/bash    # 最後のプロセスはフォアグラウンドで起動
done