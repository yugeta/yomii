# フロントエンド構成

## 概要

フロントエンドはフレームワークを使わず、Vanilla JavaScript（ES6 Modules）で構築されています。ページごとにモジュールが分離されており、共通ライブラリは `public/asset/js/` に配置されています。

## ブックビューア（メイン機能）

### モジュール構成 (`public/page/book/js/`)

| ファイル | 役割 |
|---------|------|
| `main.js` | エントリーポイント。Upload / Direction / Event を初期化 |
| `upload.js` | ファイルアップロード処理。拡張子に応じて Zip / Pdf クラスに振り分け |
| `book.js` | ページ/グループのDOM構造を生成。表示モードに応じて切替 |
| `view.js` | 表示中ページの Canvas 描画（遅延読み込み） |
| `page.js` | ページナビゲーション（左右ボタン / スクロール / ページ番号指定） |
| `event.js` | UIイベントバインド（ボタン / スクロール / リサイズ / 方向切替） |
| `direction.js` | 読み方向（右綴じ / 左綴じ）の状態管理 |
| `data.js` | 中央データストア。localStorage による読書進捗の永続化 |
| `common.js` | ユーティリティ（ページ↔グループ変換、画面方向判定） |
| `element.js` | DOM要素の参照管理 |
| `pdf.js` | PDF.js を使ったPDFレンダリング |
| `zip.js` | Zlib.js を使ったZIP展開・画像抽出 |
| `info.js` | ファイルメタデータの抽出 |

### 表示モード

画面の向きに応じて自動的に切り替わります。

| モード | 条件 | 表示 |
|--------|------|------|
| Landscape（横長） | `window.innerWidth > window.innerHeight` | 見開き2ページ表示 |
| Portrait（縦長） | `window.innerWidth <= window.innerHeight` | 単ページ表示 |

### ページグルーピング

見開き表示時、画像のアスペクト比に基づいてページをグループ化します。

- **横長画像**（幅 > 高さ）: 1枚で1グループ（左右に分割して表示）
- **縦長画像**（幅 <= 高さ）: 2枚で1グループ（見開き表示）
- **単独ページ指定**: setting.json の `singles` 配列で指定されたページは1枚で1グループ

### Canvas描画

ページ画像は `<canvas>` 要素に描画されます。遅延読み込みにより、現在表示中のページとその前後のみを描画します。

```javascript
// View クラスの描画ロジック
// 現在のグループ + 前後1グループのみ描画
this.group(Data.group_num)     // 現在
this.group(Data.group_num + 1) // 次
this.group(Data.group_num - 1) // 前
```

### 読み方向

- **左綴じ（左→右）**: 洋書、一般的な文書
- **右綴じ（右→左）**: 漫画、日本語書籍

`#direction` チェックボックスの状態で制御されます。

## 共有ライブラリ (`public/asset/js/lib/`)

| ファイル | 機能 |
|---------|------|
| `ajax.js` | XMLHttpRequest ラッパー（GET/POST、プログレス対応） |
| `ajax_lite.js` | 軽量版Ajaxユーティリティ |
| `urlinfo.js` | URL解析（クエリ文字列、パス、ホスト等の取得・操作） |
| `cookie.js` | Cookie操作 |
| `datetime.js` | 日時ユーティリティ |
| `uuid.js` | UUID生成 |
| `convert.js` | データ変換 |
| `jsonc.js` | JSONコメント対応パーサー |
| `style.js` | スタイル操作 |
| `svg_import.js` | SVG要素の動的読み込み |
| `qrcode.min.js` | QRコード生成 |
| `three_comma.js` | 3桁カンマ区切り |
| `zero_padding.js` | ゼロパディング |
| `wareki.js` | 和暦変換 |
| `upper_selector.js` | 上位セレクタ取得 |
| `google_oauth2.js` | Google OAuth2認証 |

## UIコンポーネント

### Loading (`public/asset/js/loading/`)

ファイル読み込み中のローディング表示。進捗率の表示に対応。

```javascript
import { Loading } from "../../../asset/js/loading/loading.js"

new Loading({ type: "plane" })
Loading.set_status('active')   // 表示
Loading.set_rate(50)           // 進捗50%
Loading.set_status('passive')  // 非表示
```

### Modal (`public/asset/js/modal/`)

汎用モーダルダイアログ。コンテンツ表示やリスト表示に対応。

### Markdown Viewer (`public/asset/js/markdown_viewer/`)

Markdownファイルをブラウザ上でレンダリングするビューア。

## CSS構成 (`public/page/book/css/`)

| ファイル | 役割 |
|---------|------|
| `style.css` | 全体スタイル |
| `book.css` | ブック表示エリア |
| `book_landscape.css` | 横長画面用スタイル |
| `book_portrait.css` | 縦長画面用スタイル |
| `control.css` | コントロールUI |
| `header.css` | ヘッダー |
| `footer.css` | フッター |
| `page_turn.css` | ページめくりボタン |
| `select.css` | セレクトUI |
| `upload.css` | アップロードUI |

## ページ構成

| パス | 機能 |
|------|------|
| `page/index/` | トップページ |
| `page/book/` | ブックビューア |
| `page/upload/` | ファイルアップロード・変換 |
| `page/convert/` | 変換処理UI |
| `page/shelf/` | 本棚（蔵書一覧） |
| `page/edit/` | 書籍編集 |
| `page/about/` | アバウト |
| `page/contact/` | お問い合わせ |
| `page/common/` | 共通コンポーネント（ヘッダー、フッター、ロゴ等） |
