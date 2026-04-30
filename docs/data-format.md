# データフォーマット仕様

## 概要

Yomiiでは独自フォーマット `.yomii` を使用して書籍データを管理します。このファイルはZIPアーカイブ形式で、画像データと設定ファイルを格納しています。

## .yomii ファイル構造

`.yomii` ファイルはZIPアーカイブで、以下の構造を持ちます。

```
book_name.yomii (ZIP)
├── ___setting.json        # 設定ファイル
├── 001.webp               # ページ画像
├── 002.webp
├── 003.webp
└── ...
```

## 設定ファイル (`___setting.json`)

書籍のメタデータと表示設定を格納します。

```json
{
  "name": "書籍名",
  "direction": "left",
  "singles": [0, 5],
  "pages": 100
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `name` | string | 書籍名 |
| `direction` | string | 読み方向。`"left"`（左綴じ）または `"right"`（右綴じ） |
| `singles` | number[] | 単独ページとして表示するページ番号の配列（表紙等） |
| `pages` | number | 総ページ数 |

### 読み方向

| 値 | 意味 | 用途 |
|----|------|------|
| `"left"` | 左綴じ（左→右にめくる） | 洋書、一般文書 |
| `"right"` | 右綴じ（右→左にめくる） | 漫画、日本語書籍 |

## サーバーサイド設定ファイル (`setting.json`)

アップロード時にサーバーが生成する設定ファイルです。

```json
{
  "status": "success",
  "query": {},
  "files": {
    "name": "original_filename.pdf",
    "ext": "pdf",
    "tmp_name": "/tmp/phpXXXXXX",
    "size": 52428800
  },
  "info": {
    "date": "2023-11-15",
    "time": "12:00:00",
    "timezone": "JST",
    "uuid": "20231115120000_abc123",
    "path": "/var/www/html/data/tmp/20231115120000_abc123",
    "pages": 100
  },
  "setting_file": "setting.json",
  "origin_file": "original.pdf",
  "tmp_dir": "/var/www/html/data/tmp/20231115120000_abc123",
  "page_count": 100,
  "uuid": "20231115120000_abc123",
  "ext": "pdf"
}
```

## 進捗ファイル (`progress.json`)

変換処理中の進捗を記録します。

```json
{
  "status": "progress",
  "start": 1700000000,
  "time": 15,
  "current": 50,
  "total": 100
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `status` | string | `"progress"` / `"success"` / `"error"` |
| `start` | number | 変換開始時刻（Unix timestamp） |
| `time` | number | 経過秒数 |
| `current` | number | 現在の処理ページ |
| `total` | number | 総ページ数 |

## 対応入力フォーマット

| フォーマット | 拡張子 | 処理方法 |
|-------------|--------|---------|
| PDF | `.pdf` | サーバー: pdftoppm → WebP / クライアント: PDF.js |
| ZIP | `.zip` | サーバー: bsdtar展開 → WebP / クライアント: Zlib.js |
| YOMII | `.yomii` | クライアント: Zlib.js で展開 |

## 対応画像フォーマット（ZIP内）

| フォーマット | 拡張子 |
|-------------|--------|
| JPEG | `.jpg`, `.jpeg` |
| PNG | `.png` |
| GIF | `.gif` |
| BMP | `.bmp` |
| WebP | `.webp` |

## 出力画像フォーマット

変換後の画像はすべて **WebP** 形式で保存されます。

- MIME Type: `image/webp`
- 軽量で高品質な圧縮
- ブラウザのネイティブサポート

## UUID形式

ファイル管理に使用するUUIDは以下の形式です。

```
{YYYYMMDDHHmmss}_{uniqid}
例: 20231115120000_6554a1b2c3d4e
```

## localStorage データ構造

読書進捗はブラウザの localStorage に保存されます。

**キー:** `yomii`

**値:** Base64エンコードされたJSON配列

```json
[
  {
    "name": "book_name",
    "page": 42,
    "group": 21
  },
  {
    "name": "another_book",
    "page": 10,
    "group": 5
  }
]
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `name` | string | 書籍名（ファイル名から拡張子を除いたもの） |
| `page` | number | 最後に読んだページ番号 |
| `group` | number | 最後に読んだグループ番号 |
