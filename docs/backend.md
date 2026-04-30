# バックエンド構成

## 概要

バックエンドはPHP 8.1で構築されており、ファイルのアップロード受付、フォーマット変換、進捗管理を担当します。

## APIエンドポイント

すべてのAPIリクエストは `book.php` に対してPOSTで送信します。`mode` パラメータでアクションを切り替えます。

### `mode=upload`

ファイルのアップロードを受け付けます。

**リクエスト:**
- Method: POST (multipart/form-data)
- Body: `book` (ファイル)

**処理内容:**
1. UUID（日時 + uniqid）を生成
2. `data/tmp/{uuid}/` ディレクトリを作成
3. アップロードファイルを `original.{ext}` として保存
4. ファイル情報（ページ数等）を取得
5. `setting.json` を保存

**レスポンス:**
```json
{
  "status": "success",
  "uuid": "20231115120000_abc123",
  "page_count": 100,
  "ext": "pdf",
  "tmp_dir": "/var/www/html/data/tmp/20231115120000_abc123"
}
```

### `mode=convert_start`

バックグラウンドで変換処理を開始します。

**リクエスト:**
- `uuid`: 対象ファイルのUUID

**処理内容:**
- `nohup php book.php mode=convert uuid={uuid}` をバックグラウンド実行

### `mode=convert`

実際の変換処理（CLIから呼び出し）。

**処理内容:**
- PDFの場合: `poppler-utils (pdftoppm)` で各ページを画像化 → WebP変換
- ZIPの場合: `bsdtar` で展開 → 各画像をWebP変換
- 変換進捗を `progress.json` に記録
- 完了後、`.yomii` ファイル（JSON）を生成

### `mode=convert_progress`

変換の進捗状況を取得します。

**リクエスト:**
- `uuid`: 対象ファイルのUUID

**レスポンス:**
```json
{
  "status": "progress",
  "start": 1700000000,
  "time": 15,
  "current": 50,
  "total": 100
}
```

完了時:
```json
{
  "status": "success",
  "uuid": "20231115120000_abc123"
}
```

### `mode=get_json`

変換済みの書籍データ（JSON）を取得します。

**リクエスト:**
- `uuid`: 対象ファイルのUUID

**レスポンス:** .yomii ファイルの内容（JSON）

### `mode=get_download_link`

変換済みファイルのダウンロードリンクを取得します。

**リクエスト:**
- `uuid`: 対象ファイルのUUID

**レスポンス:**
```json
{
  "name": "book_name.yomii",
  "path": "data/tmp/20231115120000_abc123.yomii"
}
```

## PHPモジュール構成 (`public/page/upload/php/`)

| ファイル | 役割 |
|---------|------|
| `common.php` | 共通ユーティリティ（パス管理、進捗管理、設定読み込み） |
| `upload.php` | ファイルアップロード処理（UUID生成、ディレクトリ作成、ファイル移動） |
| `convert.php` | 変換ディスパッチャー（拡張子に応じてPdf/Zipクラスに振り分け） |
| `pdf.php` | PDF変換処理（pdftoppm → WebP） |
| `zip.php` | ZIP展開・変換処理（bsdtar → WebP） |
| `info.php` | ファイル情報取得（ページ数等） |
| `json.php` | JSON出力処理 |
| `main.php` | メイン処理 |

## ファイルストレージ構造

```
public/data/
├── tmp/                          # 一時ファイル・変換データ
│   ├── {uuid}/                   # UUID別ディレクトリ
│   │   ├── original.pdf          # アップロード元ファイル
│   │   ├── setting.json          # 設定・メタデータ
│   │   ├── progress.json         # 変換進捗
│   │   └── nohup.out             # 変換ログ
│   └── {uuid}.yomii              # 変換済みファイル
└── shelf/                        # 本棚（永続保存）
```

## 依存ツール

| ツール | 用途 |
|--------|------|
| poppler-utils (pdftoppm) | PDFを画像に変換 |
| libarchive-tools (bsdtar) | ZIP/RAR等のアーカイブ展開 |
| PHP GD Extension | 画像処理（WebP変換、リサイズ） |
| PHP ZIP Extension | ZIPファイル操作 |
| Composer | PHPパッケージ管理 |

## CLI実行

`book.php` はCLIからも実行可能です。バックグラウンド変換処理で使用されます。

```bash
# 変換処理の実行
php book.php mode=convert uuid=20231115120000_abc123
```

CLIモードでは `$argv` からパラメータを解析し、`$_POST` に格納して処理します。
