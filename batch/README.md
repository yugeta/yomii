# yomii-batch

ZIP/PDF を .yomii 形式に一括変換するバッチツール。

## セットアップ

```bash
cd batch
npm install
```

PDF 変換には `pdftoppm`（poppler-utils）が必要です：

```bash
# macOS
brew install poppler

# Ubuntu/Debian
apt-get install poppler-utils
```

## 使い方

```bash
# 基本: フォルダ内の全 ZIP/PDF を変換（出力は ./output/）
node convert.js ./books/

# 出力先を指定
node convert.js ./books/ ./converted/

# 品質を指定（0.1〜1.0、デフォルト: 0.3）
node convert.js ./books/ --quality 0.5

# 最大画像サイズを指定（デフォルト: 1500px）
node convert.js ./books/ --max-size 1200
```

## 動作

1. 入力フォルダ内の `.zip` / `.pdf` ファイルを再帰的に検索
2. 各ファイルの画像を WebP に変換（リサイズ + 品質調整）
3. `.yomii` 形式（ZIP アーカイブ）として出力
4. 既に変換済み（同名の .yomii が存在）のファイルはスキップ

## 変換後

出力された `.yomii` ファイルを pCloud の `yomii/` フォルダにコピーすれば、
Yomii アプリの本棚から読めるようになります。
