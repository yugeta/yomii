# Technical Design

## Overview

本棚タブの末尾に「+」ボタンを追加し、クリック時にモーダルダイアログを表示して新しい本棚ソース（ローカルフォルダ、pCloud公開リンク）を追加できる機能を実装する。追加されたソースはlocalStorage/IndexedDBに永続化され、タブとして表示される。

## Architecture

### コンポーネント構成

```
public/page/shelf/
├── js/
│   ├── main.js          (既存: タブ管理に動的タブ対応を追加)
│   ├── load.js          (既存: 動的ソースの読み込み対応を追加)
│   ├── source_registry.js (新規: ソース登録・永続化管理)
│   └── add_dialog.js     (新規: 追加ダイアログUI)
├── css/
│   ├── style.css        (既存: +ボタン・動的タブのスタイル追加)
│   └── add_dialog.css   (新規: ダイアログのスタイル)
└── index.html           (既存: +ボタンのHTML追加)
```

### データフロー

1. ページ読み込み → `SourceRegistry.list()` → 動的タブ生成
2. 「+」クリック → `AddDialog.show()` → ソース種別選択
3. ソース接続検証 → 成功 → `SourceRegistry.add()` → タブ追加 → 書籍一覧表示
4. タブ削除 → 確認 → `SourceRegistry.remove()` → タブ除去

### ストレージ設計

**localStorage キー: `yomii_shelf_sources`**
```json
[
  {
    "id": "uuid-string",
    "type": "pcloud_share",
    "name": "マンガフォルダ",
    "code": "XXXXXX",
    "added_at": "2026-05-23T00:00:00.000Z"
  }
]
```

**IndexedDB: `yomii_handles` ストア（既存を拡張）**
```
{ id: "shelf_local_{uuid}", handle: FileSystemDirectoryHandle }
```

### ソース種別

| 種別 | type値 | 接続情報 | ストレージ |
|------|--------|----------|-----------|
| ローカルフォルダ | `local_folder` | IndexedDBハンドル参照キー | localStorage + IndexedDB |
| pCloud公開リンク | `pcloud_share` | 公開リンクcode | localStorage |
| Google Drive | `google_drive` | フォルダID | localStorage（将来） |

## Implementation Details

### source_registry.js

ソースの CRUD 操作を管理するクラス。localStorage の `yomii_shelf_sources` キーに JSON 配列として保存。

### add_dialog.js

モーダルダイアログの表示・操作を管理するクラス。ソース種別選択 → 入力フォーム → 接続検証 → 登録のフローを制御。

### main.js の変更

- `bind_tabs()` に動的タブの生成・バインドを追加
- `on_tab_click()` で動的ソースのパラメータ対応
- 「+」ボタンのクリックハンドラ追加
- 動的タブの削除ボタンハンドラ追加

### load.js の変更

- `constructor` の switch に動的ソース対応を追加
- `load_dynamic_pcloud_share(code)` メソッド追加
- `load_dynamic_local_folder(handle_key)` メソッド追加
