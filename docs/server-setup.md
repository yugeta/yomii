# Yomii サーバーセットアップ手順

```
Created : 2026.05.23
```

## 前提条件

| 項目 | 要件 |
|------|------|
| Docker | Docker Engine 20.x 以上 |
| Docker Compose | v2 以上（`docker compose` コマンド対応） |
| Git | リポジトリのクローン用 |
| ディスク容量 | 最低 2GB（Docker イメージ + 変換データ用） |
| ポート | 8001 番が空いていること |

---

## 1. リポジトリのクローン

```bash
git clone <repository-url> yomii
cd yomii
```

---

## 2. 環境変数の設定

### 2.1 ルートの .env

```bash
cp .env.example .env
```

`.env` を編集し、以下の値を設定:

```
# Google OAuth Client ID（ログイン用）
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Google Client ID は [Google Cloud Console](https://console.cloud.google.com/) で取得します。
詳細は `docs/cloud-storage-setup.md` を参照してください。

### 2.2 public/.env

フロントエンドが読み込む環境変数ファイルです。ルートの `.env` と同じ内容、または以下のように設定:

```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
PCLOUD_CLIENT_ID=your-pcloud-app-id
PCLOUD_REDIRECT_URI=http://localhost:8001/page/storage/callback/pcloud.html
```

> **注意**: `.env` は `.gitignore` に含まれているため、各環境で個別に作成する必要があります。

---

## 3. Docker 環境の起動

### 3.1 ビルドと起動

```bash
cd docker
docker-compose up -d
```

これにより以下の2つのコンテナが起動します:

| コンテナ名 | ベースイメージ | 役割 | ポート |
|-----------|--------------|------|--------|
| yomii-php | php:8.1-fpm-alpine | PHP アプリケーション（変換処理） | 9000（内部） |
| yomii-nginx | nginx:1.19.5-alpine | Web サーバー / リバースプロキシ | 8001 → 80 |

### 3.2 動作確認

ブラウザで以下にアクセス:

```
http://localhost:8001/
```

トップページが表示されれば成功です。

---

## 4. コンテナ構成の詳細

### 4.1 PHP コンテナ（yomii-php）

**インストール済みパッケージ:**

| パッケージ | 用途 |
|-----------|------|
| poppler-utils (pdftoppm) | PDF → 画像変換 |
| libarchive-tools (bsdtar) | ZIP/RAR 等のアーカイブ展開 |
| PHP GD Extension (WebP対応) | 画像処理・WebP 変換 |
| PHP ZIP Extension | ZIP ファイル操作 |
| Composer | PHP パッケージ管理 |

**PHP 設定（主要項目）:**

| 設定 | 値 | 説明 |
|------|-----|------|
| memory_limit | 128M | スクリプトのメモリ上限 |
| max_execution_time | 30 | 最大実行時間（秒） |
| max_input_time | 60 | 入力解析の最大時間（秒） |
| post_max_size | 1000M | POST データの最大サイズ |
| upload_max_filesize | 1000M | アップロードファイルの最大サイズ |

**タイムゾーン:** `Asia/Tokyo`

### 4.2 Nginx コンテナ（yomii-nginx）

**設定内容:**

- ドキュメントルート: `/var/www/html`（= ホストの `public/` ディレクトリ）
- PHP リクエスト: FastCGI で `yomii-php:9000` に転送
- アップロード上限: `client_max_body_size 1000M`

### 4.3 ボリュームマウント

| ホスト側 | コンテナ側 | 用途 |
|---------|-----------|------|
| `../public` | `/var/www/html` | ドキュメントルート |
| `./php/php.ini` | `/usr/local/etc/php/php.ini` | PHP 設定 |
| `./nginx/default.conf` | `/etc/nginx/conf.d/default.conf` | Nginx 設定 |

---

## 5. データディレクトリの準備

変換処理で使用するディレクトリを作成します:

```bash
mkdir -p public/data/tmp
mkdir -p public/data/shelf
```

> これらのディレクトリは `.gitignore` に含まれているため、手動で作成する必要があります。

---

## 6. バッチ変換ツール（オプション）

大量の PDF/ZIP ファイルを一括で `.yomii` 形式に変換するための Node.js ツールです。

### 6.1 ローカル実行

```bash
cd batch
npm install
```

PDF 変換には `pdftoppm` が必要です:

```bash
# macOS
brew install poppler

# Ubuntu/Debian
apt-get install poppler-utils
```

使い方:

```bash
# 基本: フォルダ内の全 ZIP/PDF を変換
node convert.js ./books/

# 出力先を指定
node convert.js ./books/ ./converted/

# 品質を指定（0.1〜1.0、デフォルト: 0.3）
node convert.js ./books/ --quality 0.5

# 最大画像サイズを指定（デフォルト: 1500px）
node convert.js ./books/ --max-size 1200
```

### 6.2 Docker で実行

```bash
cd docker
docker-compose --profile batch run yomii-node
```

入力: `data/` フォルダ内の ZIP/PDF  
出力: `data/converted/` フォルダに `.yomii` ファイル

---

## 7. 本番環境へのデプロイ

### 7.1 ドメイン・SSL 設定

本番環境では HTTPS が必須です（Google OAuth に必要）。

Nginx の設定例（`docker/nginx/default.conf` を本番用に変更）:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    index index.php index.html;
    root /var/www/html;

    location ~ \.php$ {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass yomii-php:9000;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $fastcgi_path_info;
    }
    
    # .env ファイルへの外部アクセスを制限
    location ~ /\.env {
        deny all;
        return 404;
    }
    
    client_max_body_size 1000M;
}
```

### 7.2 セキュリティ対策

- `.env` ファイルへの外部アクセスを Nginx で制限する
- Google OAuth の Redirect URI を本番ドメインに更新する
- PHP の `display_errors` を `Off` に設定する（デフォルトで Off）

### 7.3 ポート変更

デフォルトの 8001 番ポートを変更する場合は `docker-compose.yml` を編集:

```yaml
ports:
  - 80:80    # 本番用
```

---

## 8. 運用コマンド

### コンテナの停止

```bash
cd docker
docker-compose down
```

### コンテナの再ビルド（設定変更後）

```bash
cd docker
docker-compose build --no-cache
docker-compose up -d
```

### コンテナへのログイン

```bash
# PHP コンテナ
docker exec -it yomii-php sh

# Nginx コンテナ
docker exec -it yomii-nginx sh
```

### ログの確認

```bash
# Nginx アクセスログ
docker logs yomii-nginx

# PHP コンテナのログ
docker logs yomii-php

# 変換処理のログ（コンテナ内）
docker exec -it yomii-php cat /var/www/html/data/tmp/{uuid}/nohup.out
```

---

## 9. トラブルシューティング

### ポート 8001 が使用中

```bash
# 使用中のプロセスを確認
lsof -i :8001

# docker-compose.yml でポートを変更
ports:
  - 8002:80
```

### `<none>` イメージの削除

```bash
docker image prune
```

### アップロードが失敗する

以下の設定が一致しているか確認:

| 設定箇所 | 設定値 |
|---------|--------|
| Nginx `client_max_body_size` | 1000M |
| PHP `post_max_size` | 1000M |
| PHP `upload_max_filesize` | 1000M |

### 変換処理が途中で止まる

```bash
# PHP コンテナ内で手動実行して確認
docker exec -it yomii-php sh
php /var/www/html/book.php mode=convert uuid={uuid}
```

### PHP 拡張が見つからない

```bash
# コンテナ内で確認
docker exec -it yomii-php php -m | grep -i gd
docker exec -it yomii-php php -m | grep -i zip
```

---

## 10. システム構成図

```
┌─────────────────────────────────────────────────────────┐
│  ブラウザ（フロントエンド）                                │
│  - Vanilla JS (ES6 Modules)                             │
│  - Canvas API によるページ描画                            │
│  - PDF.js / Zlib.js によるクライアントサイド処理            │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (port 8001)
┌────────────────────────▼────────────────────────────────┐
│  Nginx（リバースプロキシ / 静的ファイル配信）               │
│  - 静的ファイル（HTML/CSS/JS）の配信                      │
│  - PHP-FPM へのリクエスト転送                             │
└────────────────────────┬────────────────────────────────┘
                         │ FastCGI (port 9000)
┌────────────────────────▼────────────────────────────────┐
│  PHP-FPM（バックエンド処理）                              │
│  - ファイルアップロード受付                                │
│  - PDF → WebP 変換 (pdftoppm)                           │
│  - ZIP 展開 → WebP 変換 (bsdtar + GD)                   │
│  - .yomii ファイル生成                                   │
└─────────────────────────────────────────────────────────┘
```

---

## クイックスタート（まとめ）

```bash
# 1. クローン
git clone <repository-url> yomii && cd yomii

# 2. 環境変数
cp .env.example .env
# .env を編集して GOOGLE_CLIENT_ID を設定

# 3. データディレクトリ作成
mkdir -p public/data/tmp public/data/shelf

# 4. Docker 起動
cd docker && docker-compose up -d

# 5. アクセス
open http://localhost:8001/
```
