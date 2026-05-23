# Tasks

## Task 1: SourceRegistry クラスの実装
- [x] `public/page/shelf/js/source_registry.js` を作成
- [x] localStorage `yomii_shelf_sources` の CRUD 操作を実装
- [x] `list()`, `add()`, `remove()`, `get()` メソッド
- [x] IndexedDB ハンドル保存・取得メソッド（ローカルフォルダ用）
- [x] UUID 生成ユーティリティ

## Task 2: 追加ダイアログの実装
- [x] `public/page/shelf/js/add_dialog.js` を作成
- [x] `public/page/shelf/css/add_dialog.css` を作成
- [x] モーダルダイアログの表示・非表示
- [x] ソース種別選択画面
- [x] pCloud URL 入力フォーム + 接続検証
- [x] ローカルフォルダ選択 + 検証
- [x] Google Drive（グレーアウト表示）
- [x] エラー表示・ローディング表示

## Task 3: HTML・CSS の更新
- [x] `index.html` に「+」ボタンを追加
- [x] `style.css` に「+」ボタンと動的タブのスタイルを追加（add_dialog.css に含む）

## Task 4: main.js の更新（動的タブ管理）
- [x] ページ読み込み時に SourceRegistry から動的タブを生成
- [x] 「+」ボタンのクリックハンドラ
- [x] 動的タブのクリック → ソース読み込み
- [x] 動的タブの削除ボタンハンドラ
- [x] 共有リンクモード時の「+」ボタン非表示

## Task 5: load.js の更新（動的ソース読み込み）
- [x] 動的 pCloud 共有リンクの読み込み対応
- [x] 動的ローカルフォルダの読み込み対応
- [x] event.js の書籍オープン処理に動的ソース対応
