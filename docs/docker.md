# Docker環境構築

## 概要

開発環境はDocker Composeで構築します。PHP-FPMとNginxの2コンテナ構成です。

## コンテナ構成

| コンテナ名 | イメージベース | 役割 |
|-----------|--------------|------|
| yomii-php | php:8.1-fpm-alpine | PHPアプリケーション実行 |
| yomii-nginx | nginx:1.19.5 | Webサーバー / リバースプロキシ |

## 起動方法

```bash
cd docker
docker-compose up -d
```

ブラウザで http://localhost:8001/ にアクセスします。

## 停止方法

```bash
cd docker
docker-compose down
```

## リビルド

Dockerfileや設定を変更した場合:

```bash
cd docker
docker-compose build --no-cache
docker-compose up -d
```

## コンテナへのログイン

```bash
# PHP コンテナ
docker exec -it yomii-php sh

# Nginx コンテナ
docker exec -it yomii-nginx sh
```

## PHP コンテナ詳細

### ベースイメージ
`php:8.1-fpm-alpine`

### インストール済みパッケージ

| パッケージ | 用途 |
|-----------|------|
| libjpeg-turbo-dev | JPEG画像処理 |
| libwebp-dev | WebP画像処理 |
| libpng-dev | PNG画像処理 |
| libarchive-tools | bsdtar（アーカイブ展開） |
| poppler-utils | pdftoppm（PDF→画像変換） |
| php-zip | ZIP操作 |
| composer | PHPパッケージ管理 |
| git | バージョン管理 |

### PHP拡張

- **GD** (JPEG + WebP対応): 画像処理・変換
- **ZIP**: ZIPファイル操作

### PHP設定 (`docker/php/php.ini`)

| 設定 | 値 |
|------|-----|
| memory_limit | 128M |
| max_execution_time | 30 |
| max_input_time | 60 |
| post_max_size | 1000M |
| upload_max_filesize | 1000M |

### タイムゾーン

`Asia/Tokyo` (UTC+9)

## Nginx コンテナ詳細

### ポートマッピング

- ホスト: 8001 → コンテナ: 80

### 設定 (`docker/nginx/default.conf`)

```nginx
server {
  listen 80;
  server_name localhost;
  index index.php index.html;
  root /var/www/html;

  location ~ \.php$ {
    fastcgi_pass yomii-php:9000;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
  }
  client_max_body_size 1000M;
}
```

### アップロード上限

`client_max_body_size 1000M` — 最大1GBのファイルアップロードに対応。

## ボリュームマウント

| ホスト | コンテナ | 対象 |
|--------|---------|------|
| `../public` | `/var/www/html` | ドキュメントルート |
| `./php/php.ini` | `/usr/local/etc/php/php.ini` | PHP設定 |
| `./nginx/default.conf` | `/etc/nginx/conf.d/default.conf` | Nginx設定 |

## トラブルシューティング

### `<none>` イメージの削除

```bash
docker rmi <image-id>
```

### ポート競合

8001番ポートが使用中の場合、`docker-compose.yml` の `ports` を変更してください。

```yaml
ports:
  - 8002:80  # 別のポートに変更
```
