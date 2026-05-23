# pCloud 共有本棚の使い方

```
Created : 2026.05.23
```

## 概要

pCloudの公開フォルダリンクを使って、知人に自分の本棚を共有できる機能。
閲覧者はpCloudアカウントや認証が不要で、URLにアクセスするだけで書籍一覧の表示・閲覧が可能。

---

## 共有リンクの作成手順（pCloud側）

### 1. pCloud Web にログイン

https://my.pcloud.com にアクセスしてログイン。

### 2. 共有したいフォルダを選択

`.yomii` ファイルが入っているフォルダを選ぶ（例: `/yomii/` フォルダ）。

### 3. フォルダの公開リンクを取得

1. フォルダを右クリック（またはメニューアイコンをクリック）
2. **「Share」→「Get Link」** を選択
3. 表示されるリンクが以下のような形式になる:
   ```
   https://u.pcloud.link/publink/show?code=XXXXXXXXX
   ```

### 重要: リンクの種類に注意

- ✅ **フォルダの公開リンク**（`publink`）→ 正しい
- ❌ ファイル単体の公開リンク（`puplink`）→ 動作しない

フォルダを選択した状態でリンクを取得すること。ファイル単体のリンクでは `showpublink` API が `7001`（無効なコード）を返す。

---

## 知人への共有方法

### URL の組み立て

取得したコード部分を使って、以下のURLを知人に共有する:

```
https://ドメイン/?p=shelf&source=pcloud_share&code=取得したコード
```

例:
```
https://example.com/?p=shelf&source=pcloud_share&code=V5MXZqaCtcrjFf3bGYBrfWsnXGYem7QnV
```

ローカル環境の場合:
```
http://localhost:8888/yomii/public/?p=shelf&source=pcloud_share&code=V5MXZqaCtcrjFf3bGYBrfWsnXGYem7QnV
```

### 閲覧者側の動作

1. URLにアクセスすると「共有本棚」画面が表示される
2. 通常のタブ（キャッシュ/ローカル/pCloud/サンプル）は非表示になる
3. 共有フォルダ内の `.yomii` ファイルが一覧表示される
4. 書籍をクリックすると、そのまま閲覧可能

---

## 技術的な仕組み

- pCloud の `showpublink` API でフォルダ内容を取得（認証不要）
- `getpublinkdownload` API でファイルをダウンロード
- ブラウザから直接 pCloud API を叩けないため、PHP プロキシ経由でアクセス

### 関連ファイル

| ファイル | 役割 |
|---------|------|
| `public/page/storage/js/pcloud_share.js` | フロントエンド（一覧取得・ダウンロード） |
| `public/page/storage/php/pcloud_publink.php` | PHP プロキシ（API 中継） |
| `public/page/shelf/js/load.js` | 本棚での共有モード読み込み処理 |
| `public/page/shelf/js/main.js` | 共有モード UI 制御 |
| `public/page/book/js/main.js` | 共有リンクからの書籍表示 |

---

## トラブルシューティング

| エラー | 原因 | 対処 |
|--------|------|------|
| 無効なリンクコードです（7001） | ファイル単体のリンクを使っている / コードが間違っている | フォルダの公開リンクを取得し直す |
| オーナーによって削除されています（7002） | pCloud 側でリンクを削除した | リンクを再作成する |
| 有効期限切れ（7004） | リンクに期限が設定されていた | 期限なしで再作成する |
| トラフィック制限（7005） | アクセスが多すぎる | 時間を置いてリトライ |
