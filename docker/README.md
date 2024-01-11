ubuntu + php環境の構築
===
```
Create : 2023-11-11
Author : Yugeta.Koji
```

# Summary
- YoMiiのファイル（book）変換機能のためのサーバー構築

# Target
- docker/test-3

# Run
> docker-compose up -d

# Login
- ubuntu
> docker exec -it ubuntu bash

- php
> docker exec -it php sh

- nginx
> docker exec -it nginx sh

# Howto
- Dockerfileなどを更新した際は、以下のコマンドでビルドし直し
> docker-compose build --no-cache

- <none>となったイメージファイルを削除
> docker rmi %image-id

- dockerを起動したら次のURLでアクセスできる
> http://localhost:8001/


# Server install log
- https://kinsta.com/jp/blog/install-docker-ubuntu/
- UbuntuにDocker Engineをインストールする方法
```
# apt update
# apt install ca-certificates curl gnupg lsb-release

# mkdir -p /etc/apt/keyrings
# curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
# chmod a+r /etc/apt/keyrings/docker.gpg

# echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# apt update

# apt install docker-ce docker-ce-cli containerd.io
```

- 以下いらない！！！！


- バージョン確認
> containerdのGitHubページ : https://github.com/containerd/containerd/releases
```
$ curl https://download.docker.com/linux/ubuntu/dists/$(lsb_release --codename | cut -f2)/pool/stable/$(dpkg --print-architecture)/docker-ce_<DOCKER_VERSION>~3-0~ubuntu-focal_amd64.deb -o docker-ce.deb
$ curl https://download.docker.com/linux/ubuntu/dists/$(lsb_release --codename | cut -f2)/pool/stable/$(dpkg --print-architecture)/docker-ce-cli_<DOCKER_VERSION>~3-0~ubuntu-focal_amd64.deb -o docker-ce-cli.deb
$ curl https://download.docker.com/linux/ubuntu/dists/$(lsb_release --codename | cut -f2)/pool/stable/$(dpkg --print-architecture)/containerd.io_<CONTAINERD_VERISON>-1_amd64.deb -o containerd.deb
```
```
$ curl https://download.docker.com/linux/ubuntu/dists/$(lsb_release --codename | cut -f2)/pool/stable/$(dpkg --print-architecture)/docker-ce_24.0.7~3-0~ubuntu-focal_amd64.deb -o docker-ce.deb
$ curl https://download.docker.com/linux/ubuntu/dists/$(lsb_release --codename | cut -f2)/pool/stable/$(dpkg --print-architecture)/docker-ce-cli_24.0~3-0~ubuntu-focal_amd64.deb -o docker-ce-cli.deb
$ curl https://download.docker.com/linux/ubuntu/dists/$(lsb_release --codename | cut -f2)/pool/stable/$(dpkg --print-architecture)/containerd.io_1.7.11-1_amd64.deb -o containerd.deb

$ wget https://download.docker.com/linux/ubuntu/dists/bionic/stable/Contents-amd64

```

```
# apt install ./docker-ce.deb ./docker-ce-cli.deb ./containerd.deb
```

- オートインストールが便利
> curl -fsSL https://get.docker.com -o get-docker.sh
> sh get-docker.sh

- dockerグループの確認
> groupadd docker
- 自分をグループに追加
> usermod -aG docker web

- 起動
> docker run hello-world


- UbuntuにDocker Composeを追加する
> apt install docker-compose-plugin
> curl https://download.docker.com/linux/ubuntu/dists/$(lsb_release --codename | cut -f2)/pool/stable/$(dpkg --print-architecture)/docker-compose-plugin_2.6.0~ubuntu-focal_amd64.deb -o docker-compose-plugin.deb
> apt install -i ./docker-compose-plugin.deb

