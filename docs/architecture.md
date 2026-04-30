# システムアーキテクチャ

## 全体構成

Yomiiは3層アーキテクチャで構成されています。

```
┌─────────────────────────────────────────────────────────┐
│  ブラウザ（フロントエンド）                                │
│  - ES6 Modules (Vanilla JS)                             │
│  - Canvas API によるページ描画                            │
│  - PDF.js / Zlib.js によるクライアントサイド処理            │
│  - localStorage による読書進捗保存                        │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (port 8001)
┌────────────────────────▼────────────────────────────────┐
│  Nginx（リバースプロキシ / 静的ファイル配信）               │
│  - 静的ファイル（HTML/CSS/JS/画像）の配信                  │
│  - PHP-FPMへのリクエスト転送                              │
│  - アップロード上限: 1000MB                               │
└────────────────────────┬────────────────────────────────┘
                         │ FastCGI (port 9000)
┌────────────────────────▼────────────────────────────────┐
│  PHP-FPM（バックエンド処理）                              │
│  - ファイルアップロード受付                                │
│  - PDF → WebP 変換 (poppler-utils / pdftoppm)           │
│  - ZIP 展開 → WebP 変換 (bsdtar / GD)                   │
│  - .yomii ファイル生成                                   │
│  - 変換進捗管理                                          │
└─────────────────────────────────────────────────────────┘
```

## データフロー

### アップロード〜変換〜閲覧の流れ

```
1. ユーザーがファイル（PDF/ZIP）をアップロード
       │
2. PHP がファイルを受け取り、UUID付きディレクトリに保存
       │  data/tmp/{uuid}/original.{ext}
       │
3. バックグラウンドで変換処理を開始（nohup）
       │  - PDF: pdftoppm → WebP変換
       │  - ZIP: bsdtar展開 → WebP変換
       │
4. 変換進捗を progress.json に記録
       │
5. 全ページ変換完了後、.yomii ファイル（JSON）を生成
       │  data/tmp/{uuid}.yomii
       │
6. フロントエンドが .yomii を読み込み、Canvas で描画
```

### クライアントサイド直接読み込み

ローカルファイルを直接ブラウザで開く場合は、サーバー変換を経由せずにクライアントサイドで処理します。

```
1. ユーザーがローカルファイルを選択
       │
2. JavaScript がファイルを読み込み
       │  - PDF: PDF.js でレンダリング
       │  - ZIP/YOMII: Zlib.js で展開
       │
3. 各ページを Canvas に描画
```

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Vanilla JavaScript (ES6 Modules), HTML5, CSS3 |
| PDF処理（クライアント） | PDF.js |
| ZIP処理（クライアント） | Zlib.js |
| 画像描画 | Canvas API |
| Webサーバー | Nginx 1.19.5 |
| アプリケーション | PHP 8.1 (FPM) |
| PDF変換（サーバー） | poppler-utils (pdftoppm) |
| アーカイブ展開 | libarchive-tools (bsdtar) |
| 画像処理 | PHP GD Extension (WebP対応) |
| コンテナ | Docker / Docker Compose |
| データ保存 | ファイルシステム (data/tmp/, data/shelf/) |
| クライアント永続化 | localStorage |

## ディレクトリ構成

```
yomii/
├── README.md                  # プロジェクト概要
├── docker/                    # Docker環境
│   ├── docker-compose.yml     # コンテナ定義
│   ├── nginx/                 # Nginx設定
│   ├── php/                   # PHP-FPM設定
│   └── ubuntu/                # Ubuntu設定（未使用）
├── public/                    # ドキュメントルート
│   ├── index.html             # トップページ
│   ├── book.html              # ブックビューア（テンプレート）
│   ├── book.php               # バックエンドAPI
│   ├── info.php               # PHP情報
│   ├── asset/                 # 共有アセット
│   │   └── js/
│   │       ├── lib/           # ユーティリティライブラリ
│   │       ├── loading/       # ローディングUI
│   │       ├── modal/         # モーダルUI
│   │       ├── markdown_viewer/ # Markdownビューア
│   │       ├── pdf/           # PDF.jsライブラリ
│   │       └── zip/           # Zip/Unzipライブラリ
│   └── page/                  # ページモジュール
│       ├── common/            # 共通コンポーネント
│       ├── index/             # トップページ
│       ├── book/              # ブックビューア
│       ├── upload/            # アップロード機能
│       ├── convert/           # 変換機能
│       ├── shelf/             # 本棚
│       ├── edit/              # 編集機能
│       ├── about/             # アバウトページ
│       └── contact/           # コンタクトページ
├── books/                     # サンプル書籍
└── docs/                      # ドキュメント
```
