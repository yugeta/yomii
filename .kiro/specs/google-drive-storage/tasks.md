# Implementation Plan: Google Drive Storage Integration

## Overview

Google Drive を Yomii 本棚ページのストレージバックエンドとして統合する。既存の `GoogleDrive` クラス（認証 + アップロード）を拡張し、`list_files`、`download_file`、`delete_file`、`get_storage_quota` メソッドを追加する。Load モジュールに `load_google_drive` を追加し、Event モジュールに書籍オープン・削除処理を追加する。HTML にタブを追加し、パンくずナビゲーション・ストレージ容量表示・キャッシュ状態アイコンを実装する。

## Tasks

- [ ] 1. GoogleDrive クラスの API 基盤強化
  - [ ] 1.1 `api_get` メソッドをエラーハンドリング強化版に改修する
    - 401: localStorage からトークン削除 + 再認証エラー throw
    - 403: レートリミットエラー throw
    - 404: リソース不在エラー throw
    - 500系: 最大3回リトライ後にサーバーエラー throw
    - ネットワークエラー（fetch 例外）: 「ネットワーク接続を確認してください」throw
    - タイムアウト: AbortController で60秒タイムアウト throw
    - すべてのエラーで `console.error` にエラー種別・ステータス・操作名をログ出力
    - ファイル: `public/page/storage/js/google_drive.js`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [ ] 1.2 `api_delete` メソッドを追加する
    - DELETE リクエスト用メソッド（`api_get` と同じエラーハンドリングパターン）
    - AbortController による60秒タイムアウト
    - ファイル: `public/page/storage/js/google_drive.js`
    - _Requirements: 5.3, 10.5_

  - [ ]* 1.3 Property テスト: トークン有効期限検証
    - **Property 7: トークン有効期限検証の正確性**
    - **Validates: Requirements 10.8**
    - `get_access_token` が expires_at < now で null、expires_at > now で access_token を返すことを検証
    - テストファイル: `tests/google-drive-storage/properties/token-validation.test.js`

  - [ ]* 1.4 Property テスト: サーバーエラーリトライ
    - **Property 8: サーバーエラーリトライの正確性**
    - **Validates: Requirements 10.4**
    - 500〜599 ステータスに対して正確に3回リトライし、すべて失敗時にエラー throw を検証
    - テストファイル: `tests/google-drive-storage/properties/server-retry.test.js`

  - [ ]* 1.5 Property テスト: 401 エラー時のトークンクリーンアップ
    - **Property 9: 401 エラー時のトークンクリーンアップ**
    - **Validates: Requirements 10.1**
    - 401 レスポンス時に localStorage からトークン削除 + エラー throw を検証
    - テストファイル: `tests/google-drive-storage/properties/token-cleanup.test.js`

- [ ] 2. GoogleDrive クラスのファイル操作メソッド追加
  - [ ] 2.1 `resolve_folder_path` メソッドを追加する
    - スラッシュ区切りパス文字列を受け取り、各セグメントを順に親フォルダ ID で検索してフォルダ ID を解決
    - 中間セグメントが見つからない場合はエラー throw
    - ファイル: `public/page/storage/js/google_drive.js`
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [ ] 2.2 `find_file_by_name` メソッドを追加する
    - 指定フォルダ内の同名ファイルを検索し、ファイル ID or null を返す
    - ファイル: `public/page/storage/js/google_drive.js`
    - _Requirements: 6.5_

  - [ ] 2.3 `list_files` メソッドを追加する
    - `ensure_folder` で Yomii フォルダ ID を取得
    - Google Drive API v3 files.list で parent=folder_id のファイル一覧取得
    - pageToken によるページネーション（全件取得まで繰り返し）
    - API レスポンスを `{ name, size, modified, is_folder, file_id }` 形式に変換
    - 30秒タイムアウト
    - ファイル: `public/page/storage/js/google_drive.js`
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 2.10, 2.11_

  - [ ] 2.4 `list_files_path` メソッドを追加する
    - `dir` パラメータのパス文字列を受け取り、`resolve_folder_path` でフォルダ ID を解決
    - 解決したフォルダ ID 配下のファイル一覧を取得（最大1000件）
    - ファイル: `public/page/storage/js/google_drive.js`
    - _Requirements: 3.1, 3.2_

  - [ ] 2.5 `download_file` メソッドを追加する
    - files.get (alt=media) で Blob をダウンロード
    - Loading パターン: set_status('active') → set_rate(10) → set_rate(50) → set_rate(100) → set_status('passive')
    - 120秒タイムアウト
    - エラー時は必ず Loading.set_status('passive') でクリーンアップ
    - ファイル: `public/page/storage/js/google_drive.js`
    - _Requirements: 4.1, 4.2, 4.6, 4.7, 4.8_

  - [ ] 2.6 `delete_file` メソッドを追加する
    - `api_delete` を使用して files.delete を実行
    - ファイル: `public/page/storage/js/google_drive.js`
    - _Requirements: 5.3, 5.6_

  - [ ] 2.7 `get_storage_quota` メソッドを追加する
    - about.get (fields: storageQuota) でストレージ使用量・上限を取得
    - `{ usage, limit, remaining }` 形式（数値、バイト単位）で返す
    - ファイル: `public/page/storage/js/google_drive.js`
    - _Requirements: 9.1_

  - [ ]* 2.8 Property テスト: API レスポンス変換
    - **Property 1: API レスポンス変換の正確性**
    - **Validates: Requirements 2.2**
    - `transform_file_entry` 関数が正しく内部形式に変換することを検証
    - テストファイル: `tests/google-drive-storage/properties/transform-file-entry.test.js`

  - [ ]* 2.9 Property テスト: フォルダパス解決
    - **Property 4: フォルダパス解決の正確性**
    - **Validates: Requirements 3.1, 3.2, 3.4, 3.5**
    - パスセグメントを順にたどり最終フォルダ ID を返す / 中間セグメント不在時にエラー throw を検証
    - テストファイル: `tests/google-drive-storage/properties/resolve-folder-path.test.js`

- [ ] 3. Checkpoint - API 基盤とファイル操作メソッドの確認
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. 純粋関数の抽出とテスト
  - [ ] 4.1 純粋関数モジュール `google_drive_utils.js` を作成する
    - `transform_file_entry(api_file)` — API レスポンスを内部形式に変換
    - `filter_file_list(files)` — 隠しファイル除外 + .yomii / ディレクトリのみフィルタ
    - `sort_file_list(files)` — ディレクトリ優先 + 名前順ソート
    - `format_storage_size(bytes)` — バイト数を MB/GB 文字列に変換
    - `check_low_storage(remaining_bytes)` — 500MB 未満で警告フラグ true
    - `generate_breadcrumbs(dir_path)` — パンくずリスト配列生成
    - `aggregate_file_stats(files)` — ファイル数・サイズ合計集計
    - ファイル: `public/page/storage/js/google_drive_utils.js`
    - _Requirements: 2.2, 2.3, 2.4, 3.3, 7.3, 9.2, 9.3_

  - [ ]* 4.2 Property テスト: ファイル一覧フィルタリング
    - **Property 2: ファイル一覧フィルタリングの正確性**
    - **Validates: Requirements 2.3, 11.2**
    - テストファイル: `tests/google-drive-storage/properties/filter-file-list.test.js`

  - [ ]* 4.3 Property テスト: ファイル一覧ソート順
    - **Property 3: ファイル一覧ソート順の不変条件**
    - **Validates: Requirements 2.4**
    - テストファイル: `tests/google-drive-storage/properties/sort-file-list.test.js`

  - [ ]* 4.4 Property テスト: パンくずリスト生成
    - **Property 5: パンくずリスト生成の正確性**
    - **Validates: Requirements 3.3**
    - テストファイル: `tests/google-drive-storage/properties/generate-breadcrumbs.test.js`

  - [ ]* 4.5 Property テスト: ストレージ容量フォーマット
    - **Property 6: ストレージ容量フォーマットの正確性**
    - **Validates: Requirements 9.2, 9.3**
    - テストファイル: `tests/google-drive-storage/properties/format-storage-size.test.js`

  - [ ]* 4.6 Property テスト: ファイル数・サイズ集計
    - **Property 10: ファイル数・サイズ集計の正確性**
    - **Validates: Requirements 7.3**
    - テストファイル: `tests/google-drive-storage/properties/aggregate-file-stats.test.js`

- [ ] 5. Load モジュールへの Google Drive ソース統合
  - [ ] 5.1 `load_google_drive` メソッドを Load クラスに追加する
    - `GoogleDrive.is_authenticated()` で認証チェック → 未認証時は error_message 設定 + finish()
    - URL パラメータ `dir` がある場合は `list_files_path(dir)` を呼び出し
    - `dir` がない場合は `list_files()` を呼び出し
    - `filter_file_list` + `sort_file_list` でフィルタ・ソート
    - 結果を `{ type, name, size, modified, file_id }` 形式で `this.datas` に格納
    - 例外時は error_message 設定 + finish()
    - ファイル: `public/page/shelf/js/load.js`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 5.2 Load コンストラクタの switch 文に `case "google_drive"` を追加する
    - `this.load_google_drive()` を呼び出す
    - ファイル: `public/page/shelf/js/load.js`
    - _Requirements: 11.1_

- [ ] 6. Event モジュールへの Google Drive 操作追加
  - [ ] 6.1 `open_google_drive_book` メソッドを Event クラスに追加する
    - source_path を `google_drive://{fileId}` 形式で構築
    - `BookCache.get_or_download(source_path, name, download_fn)` を呼び出し
    - download_fn は `GoogleDrive.download_file(fileId)` を使用
    - 成功時は `book.html` に遷移（source=google_drive, file_id, book パラメータ付き）
    - ファイル: `public/page/shelf/js/event.js`
    - _Requirements: 4.1, 4.3, 4.4, 4.5_

  - [ ] 6.2 `delete_google_drive_book` メソッドを Event クラスに追加する
    - 確認ダイアログ表示（「この書籍を Google Drive から削除しますか？」）
    - 削除ボタン無効化 + ローディング表示
    - `GoogleDrive.delete_file(fileId)` を呼び出し
    - 成功時: 一覧から除去 + 完了メッセージ3秒表示 + BookCache からキャッシュ削除
    - 失敗時: ローディング解除 + エラーメッセージ表示
    - ファイル: `public/page/shelf/js/event.js`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [ ] 6.3 `click_file` メソッドの switch 文に `case "google_drive"` を追加する
    - `this.open_google_drive_book(li)` を呼び出す
    - ファイル: `public/page/shelf/js/event.js`
    - _Requirements: 4.1_

  - [ ] 6.4 `on_cache_add` メソッドに Google Drive ソースの処理を追加する
    - source === "google_drive" の場合、source_path を `google_drive://{fileId}` で構築
    - `BookCache.get_or_download` で GoogleDrive.download_file を使用
    - ファイル: `public/page/shelf/js/event.js`
    - _Requirements: 4.1, 4.3_

- [ ] 7. HTML と UI の変更
  - [ ] 7.1 本棚ページの HTML に Google Drive タブを追加する
    - `<option value="google_drive">Google Drive</option>` をプルダウンに追加
    - `<button class="shelf-tab" data-source="google_drive">Google Drive</button>` をタブ列に追加
    - ストレージ容量表示エリア `<div class="google-drive-quota">` を追加
    - 接続解除ボタン `<button class="btn-google-drive-disconnect">` を追加
    - ファイル: `public/page/shelf/index.html`
    - _Requirements: 1.1, 8.1, 9.2_

  - [ ] 7.2 Main モジュールの `get_empty_message` に `case "google_drive"` を追加する
    - 未認証時: 認証促進メッセージ + 「Google Drive に接続」ボタン
    - フォルダ空時: 「書籍がありません。変換ページからアップロードしてください。」
    - ファイル: `public/page/shelf/js/main.js`
    - _Requirements: 1.2, 2.7_

  - [ ] 7.3 Main モジュールの `view` メソッドにストレージ容量表示を追加する
    - source === "google_drive" かつ認証済みの場合、`GoogleDrive.get_storage_quota()` を呼び出し
    - `format_storage_size` で使用量・上限・残り容量をフォーマット
    - `check_low_storage` で警告判定
    - 容量表示エリアに反映（取得失敗時は非表示）
    - ファイル: `public/page/shelf/js/main.js`
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 7.4 Main モジュールにキャッシュ状態アイコン表示を追加する
    - source === "google_drive" の場合、各書籍の `source_path` で BookCache.get_meta を確認
    - キャッシュ済み: 端末アイコン、クラウドのみ: クラウドアイコンを書籍名横に表示
    - 3秒以内に全書籍のキャッシュ状態判定を完了
    - ファイル: `public/page/shelf/js/main.js`
    - _Requirements: 7.1, 7.2, 7.5, 7.6_

  - [ ] 7.5 Main モジュールに接続解除ボタンのバインドを追加する
    - 確認ダイアログ表示（「Google Drive との接続を解除しますか？ローカルキャッシュは保持されます。」）
    - `GoogleDrive.logout()` でトークン削除
    - UI を未認証状態に更新
    - ファイル: `public/page/shelf/js/main.js`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ] 7.6 Main モジュールに「Google Drive に接続」ボタンのバインドを追加する
    - `GoogleDrive.start_auth()` を呼び出し
    - 認証成功後にページリロードで書籍一覧を表示
    - キャンセル時・エラー時のメッセージ表示
    - ファイル: `public/page/shelf/js/main.js`
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 8. Checkpoint - UI 統合の確認
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. パンくずナビゲーションの Google Drive 対応
  - [ ] 9.1 Breadcrumps クラスを Google Drive ソースに対応させる
    - source === "google_drive" の場合、ルートリンクのテキストを「Yomii」に変更
    - `generate_breadcrumbs` ユーティリティ関数を使用してリンク配列を生成
    - 各リンクの href に `dir` パラメータとして部分パスを設定
    - ルートフォルダ表示時（dir が空）はパンくずリスト非表示
    - ファイル: `public/page/shelf/js/breadcrumps.js`
    - _Requirements: 3.3_

- [ ] 10. アップロード機能の拡張
  - [ ] 10.1 Event モジュールにキャッシュタブからの Google Drive アップロード機能を追加する
    - ローカルキャッシュタブの書籍に「Google Drive にアップロード」導線を追加
    - 未認証時は OAuth 認証フローを開始し、認証完了後にアップロード実行
    - `ensure_folder` → `find_file_by_name` で同名ファイル確認 → 確認ダイアログ → `upload_file`
    - `on_progress` コールバックでプログレスバー表示
    - 失敗時は最大3回リトライ（リトライ間隔1秒、容量不足はリトライ対象外）
    - ファイル: `public/page/shelf/js/event.js`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

- [ ] 11. テスト環境セットアップと統合テスト
  - [ ] 11.1 テスト環境をセットアップする
    - プロジェクトルートに `package.json` を作成（vitest, fast-check, jsdom を devDependencies に追加）
    - `vitest.config.js` を作成（jsdom 環境、テストディレクトリ設定）
    - `tests/google-drive-storage/` ディレクトリ構造を作成
    - テスト用モック（localStorage, fetch, XMLHttpRequest）のセットアップファイルを作成
    - ファイル: `package.json`, `vitest.config.js`, `tests/setup.js`
    - _Requirements: 全体_

  - [ ]* 11.2 ユニットテスト: GoogleDrive クラスのメソッド
    - `list_files`, `download_file`, `delete_file`, `get_storage_quota` の正常系・異常系テスト
    - fetch モックを使用した API レスポンスのテスト
    - テストファイル: `tests/google-drive-storage/unit/google-drive.test.js`
    - _Requirements: 2.1, 4.1, 5.3, 9.1_

  - [ ]* 11.3 ユニットテスト: Load モジュールの load_google_drive
    - 認証チェック → 一覧取得 → フィルタ → finish() のフロー検証
    - テストファイル: `tests/google-drive-storage/unit/load-google-drive.test.js`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 12. Final checkpoint - 全体統合確認
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- 純粋関数は `google_drive_utils.js` に抽出し、プロパティベーステストの対象とする
- 既存の PCloud パターン（Loading 表示、エラーハンドリング、BookCache 連携）を踏襲する
- `GoogleDrive` クラスは static メソッドのみで構成（既存パターンに合わせる）

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "4.1", "11.1"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5", "2.1", "2.2", "2.7", "4.2", "4.3", "4.4", "4.5", "4.6"] },
    { "id": 2, "tasks": ["2.3", "2.4", "2.5", "2.6", "2.8", "2.9"] },
    { "id": 3, "tasks": ["5.1", "5.2", "7.1"] },
    { "id": 4, "tasks": ["6.1", "6.2", "6.3", "6.4", "7.2", "7.3", "7.4", "7.5", "7.6"] },
    { "id": 5, "tasks": ["9.1", "10.1"] },
    { "id": 6, "tasks": ["11.2", "11.3"] }
  ]
}
```
