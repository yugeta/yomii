# 一括変換ツール（バッチ処理）

```
Created : 2026.05.20
```

## 概要

ZIP/PDF 形式の書籍ファイルを `.yomii` 形式に一括変換する Node.js スクリプト。
Docker コンテナ内で実行する。

## 前提条件

- Docker / Docker Compose がインストール済み
- 変換元の書籍ファイル（ZIP/PDF）が用意されている

## ディレクトリ構成

```
yomii/
├── batch/
│   ├── convert.js      ← 変換スクリプト本体
│   ├── package.json    ← 依存パッケージ定義
│   └── README.md
├── data/               ← 変換元ファイルを置く（gitignore 対象）
│   └── converted/      ← 変換後の .yomii が出力される
└── docker/
    ├── docker-compose.yml
    └── node/
        └── Dockerfile
```

## 使い方

### 1. 変換元ファイルを配置

`data/` フォルダに変換したい ZIP/PDF ファイルを置く。
サブフォルダ内のファイルも再帰的に検索される。

```
data/
├── 漫画A.zip
├── 漫画B.zip
├── 技術書/
│   ├── book1.pdf
│   └── book2.pdf
└── converted/          ← ここに出力される
```

### 2. Docker で実行

```bash
cd docker
docker compose run --rm yomii-node
```

初回実行時は Docker イメージのビルドと `npm install` が自動で行われる。

### 3. 出力確認

`data/converted/` に `.yomii` ファイルが生成される。

```
data/converted/
├── 漫画A.yomii
├── 漫画B.yomii
├── book1.yomii
└── book2.yomii
```

### 4. pCloud にアップロード

変換後の `.yomii` ファイルを pCloud の `/yomii/` フォルダにコピーする。

- pCloud デスクトップアプリの同期フォルダに置く
- または pCloud Web（my.pcloud.com）から手動アップロード

---

## オプション

Docker 経由でオプションを渡す場合：

```bash
# 品質を変更（デフォルト: 0.3）
docker compose run --rm yomii-node node convert.js /data/input /data/output --quality 0.5

# 最大画像サイズを変更（デフォルト: 1500px）
docker compose run --rm yomii-node node convert.js /data/input /data/output --max-size 1200
```

### オプション一覧

| オプション | デフォルト | 説明 |
|-----------|-----------|------|
| `--quality <0.1-1.0>` | 0.3 | WebP 変換品質。低いほど軽量 |
| `--max-size <px>` | 1500 | 画像の最大辺サイズ（px） |
| `--help` | - | ヘルプ表示 |

---

## Docker を使わずに実行する場合

ローカルに Node.js（v18+）がインストールされていれば直接実行可能。

```bash
cd batch
npm install

# 実行
node convert.js /path/to/books/ /path/to/output/

# オプション付き
node convert.js /path/to/books/ /path/to/output/ --quality 0.5
```

### PDF 変換の追加要件

PDF を変換する場合は `pdftoppm`（poppler-utils）が必要。

```bash
# macOS
brew install poppler

# Ubuntu / Debian
apt-get install poppler-utils
```

---

## 変換仕様

| 項目 | 内容 |
|------|------|
| 入力形式 | ZIP（画像アーカイブ）、PDF |
| 出力形式 | .yomii（ZIP アーカイブ、無圧縮） |
| 画像形式 | WebP |
| 画像品質 | デフォルト 30%（`--quality` で変更可） |
| 最大サイズ | 1500px（`--max-size` で変更可） |
| ファイル構造 | `0000.webp`, `0001.webp`, ..., `___setting.json` |
| スキップ | 出力先に同名 .yomii が既に存在する場合はスキップ |

### ___setting.json の内容

```json
{
  "base_filename": "元ファイル名.zip",
  "name": "元ファイル名",
  "direction": "right",
  "singles": [],
  "deletes": []
}
```

---

## トラブルシューティング

### Docker ビルドエラー

```bash
docker compose build yomii-node
```

### npm install が失敗する

`sharp` パッケージはネイティブバイナリを含むため、ネットワーク環境によっては失敗することがある。

```bash
# コンテナ内で手動実行
docker compose run --rm --entrypoint sh yomii-node
npm install
```

### PDF 変換で「pdftoppm not found」

Docker コンテナ内には `poppler-utils` がインストール済み。
ローカル実行の場合は手動インストールが必要。

### 変換後のファイルが大きい

`--quality` を下げる（0.2〜0.3 推奨）。
漫画であれば 0.3 で十分な画質を維持できる。
