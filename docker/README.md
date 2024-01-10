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