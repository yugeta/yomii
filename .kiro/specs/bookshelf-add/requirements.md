# Requirements Document

## Introduction

Yomiiの本棚ページにおいて、ユーザーが新しい本棚ソースを動的に追加できる機能を実装する。本棚タブの末尾に「+」ボタンを配置し、クリック時にダイアログを表示して、ローカルフォルダ・pCloud URL・Google Drive URL（将来対応）などのソースを入力・接続できるようにする。接続に成功したソースは新しいタブとして本棚UIに追加され、以降いつでもアクセス可能となる。

## Glossary

- **Bookshelf_UI**: Yomiiの本棚ページ（`page/shelf/`）のタブベースUI。書籍ソースをタブで切り替えて表示する
- **Add_Button**: 本棚タブ列の末尾に配置される「+」ボタン。新しい本棚ソースの追加ダイアログを開くトリガー
- **Add_Dialog**: 本棚ソースの種類選択と接続情報入力を行うモーダルダイアログ
- **Bookshelf_Source**: 書籍データの取得元。ローカルフォルダ、pCloud URL、Google Drive URL等の種類がある
- **Source_Registry**: 追加された本棚ソースの設定情報を永続化するストレージ（localStorage）
- **Tab**: 本棚UIにおける各ソースの切り替えボタン。data-source属性でソース種別を識別する
- **Connection_Validator**: 入力されたソース情報に対してアクセス可能かを検証する処理

## Requirements

### Requirement 1: 追加ボタンの表示

**User Story:** ユーザーとして、本棚タブの末尾に「+」ボタンが表示されていることで、新しい本棚を追加できることを直感的に理解したい。

#### Acceptance Criteria

1. THE Bookshelf_UI SHALL 本棚タブ列の末尾（既存タブの右側、ビュー切り替えボタン `.shelf-view-toggle` の左側）に Add_Button を表示する
2. THE Add_Button SHALL 「+」記号をラベルとして表示し、スクリーンリーダー向けに「本棚を追加」を示すアクセシブルな名前を持つ
3. THE Add_Button SHALL 既存のタブと視覚的に区別できるスタイルとして、背景色なし・枠線（1px solid）のみのボタンとして表示する
4. THE Add_Button SHALL 最小タップ領域として 36×36 ピクセル以上のクリック可能領域を持つ
5. WHILE 共有リンクモード（source=pcloud_share）で表示中, THE Bookshelf_UI SHALL Add_Button を非表示にする

### Requirement 2: 追加ダイアログの表示

**User Story:** ユーザーとして、「+」ボタンをクリックした際にソース種別を選択できるダイアログが表示されることで、追加したいソースの種類を選びたい。

#### Acceptance Criteria

1. WHEN Add_Button がクリックされた時, THE Bookshelf_UI SHALL Add_Dialog をモーダル表示し、背景コンテンツへの操作を無効にする
2. THE Add_Dialog SHALL 以下のソース種別を選択肢として表示する: ローカルフォルダ、pCloud URL
3. WHERE Google Drive連携が実装済みの場合, THE Add_Dialog SHALL Google Drive URL を選択肢として追加表示する
4. WHEN Add_Dialog の背景オーバーレイがクリックされた時, THE Add_Dialog SHALL ダイアログを閉じ、背景コンテンツへの操作を再度有効にする
5. WHEN Add_Dialog の閉じるボタン（×）がクリックされた時, THE Add_Dialog SHALL ダイアログを閉じ、背景コンテンツへの操作を再度有効にする
6. WHEN ソース種別の選択肢がクリックされた時, THE Add_Dialog SHALL 選択された種別に対応するソース追加画面へ遷移する
7. WHEN Add_Dialog 表示中に Esc キーが押された時, THE Add_Dialog SHALL ダイアログを閉じ、背景コンテンツへの操作を再度有効にする

### Requirement 3: ローカルフォルダの追加

**User Story:** ユーザーとして、自分のPCのローカルフォルダを本棚ソースとして追加することで、ローカルに保存した書籍にいつでもアクセスしたい。

#### Acceptance Criteria

1. WHEN ソース種別「ローカルフォルダ」が選択された時, THE Add_Dialog SHALL File System Access API の `window.showDirectoryPicker()` を呼び出し、フォルダ選択ダイアログを起動する
2. WHEN ユーザーがフォルダを選択しアクセスを許可した時, THE Connection_Validator SHALL フォルダ直下の .yomii ファイルを列挙し、検出されたファイル数を取得する
3. WHEN フォルダへのアクセスが確認できた時, THE Source_Registry SHALL FileSystemDirectoryHandle、フォルダ名をソース名として、IndexedDBに保存する
4. WHEN フォルダの追加が成功した時, THE Bookshelf_UI SHALL ソース名をラベルとした新しいタブを追加し、そのタブをアクティブにしてフォルダ内の .yomii ファイルを書籍一覧として表示する
5. IF ユーザーがフォルダ選択をキャンセルした場合, THEN THE Add_Dialog SHALL エラーを表示せずダイアログを閉じる
6. IF フォルダへのアクセス権限が拒否された場合, THEN THE Add_Dialog SHALL アクセスが許可されなかった旨のエラーメッセージを表示し、ダイアログは開いたまま維持する
7. IF 選択されたフォルダ内に .yomii ファイルが1件も存在しない場合, THEN THE Add_Dialog SHALL 対象ファイルが見つからない旨のエラーメッセージを表示し、フォルダの追加を行わない
8. IF 既にSource_Registryに同一のフォルダハンドルが登録されている場合, THEN THE Add_Dialog SHALL 既に追加済みである旨のエラーメッセージを表示し、重複登録を行わない

### Requirement 4: pCloud URLの追加

**User Story:** ユーザーとして、pCloudの公開フォルダURLを入力して本棚ソースとして追加することで、pCloud上の書籍にアクセスしたい。

#### Acceptance Criteria

1. WHEN ソース種別「pCloud URL」が選択された時, THE Add_Dialog SHALL pCloud公開リンクURL入力フィールドを表示する
2. WHILE ソース種別「pCloud URL」が選択されている間, THE Add_Dialog SHALL 入力フィールドにプレースホルダーとして「https://u.pcloud.link/publink/show?code=...」を表示する
3. WHEN URLが入力され「接続」ボタンがクリックされた時, THE Connection_Validator SHALL URLからcodeパラメータを抽出し、PHPプロキシ経由でpCloudのshowpublink API（https://api.pcloud.com/showpublink?code=CODE）を呼び出してフォルダ内容を取得できるか検証する
4. WHEN 接続検証が成功した時, THE Source_Registry SHALL pCloudコードとAPIレスポンスから取得したフォルダ名をソース名としてlocalStorageに保存する
5. WHEN pCloudソースの追加が成功した時, THE Bookshelf_UI SHALL 新しいタブを追加し、そのタブをアクティブにして書籍一覧を表示する
6. IF 入力されたURLが「https://u.pcloud.link/publink/show?code=」形式でない、またはcodeパラメータが空の場合, THEN THE Add_Dialog SHALL エラーメッセージを表示して有効なpCloud公開リンクURLの入力を促す
7. IF pCloud APIが無効なコードエラー（result: 7001）を返した場合, THEN THE Add_Dialog SHALL フォルダの公開リンクを使用するよう促すエラーメッセージを表示する
8. IF pCloud APIがリンク削除（result: 7002）、有効期限切れ（result: 7004）、またはトラフィック制限（result: 7005）を返した場合, THEN THE Add_Dialog SHALL 各エラーコードに対応したエラーメッセージを表示する
9. IF 接続検証のAPIリクエストが30秒以内に応答しない場合, THEN THE Add_Dialog SHALL タイムアウトを示すエラーメッセージを表示し、再試行を可能にする
10. WHILE 接続検証が実行中の間, THE Add_Dialog SHALL 「接続」ボタンを無効化し、検証中であることを示す状態を表示する

### Requirement 5: Google Drive URLの追加（将来対応）

**User Story:** ユーザーとして、Google DriveのフォルダURLを入力して本棚ソースとして追加することで、Google Drive上の書籍にアクセスしたい。

#### Acceptance Criteria

1. WHERE Google Drive連携が実装済みの場合, WHEN ソース種別「Google Drive URL」が選択された時, THE Add_Dialog SHALL Google DriveフォルダURL入力フィールド（最大2048文字）およびソース名入力フィールド（最大50文字）を表示する
2. WHERE Google Drive連携が実装済みの場合, WHEN URLが入力され「接続」ボタンがクリックされた時, THE Connection_Validator SHALL Google Drive APIを使用して10秒以内にフォルダへのアクセス可否を検証し、検証中はローディング表示を行う
3. WHERE Google Drive連携が実装済みの場合, IF 入力されたURLがGoogle DriveフォルダURLの形式（https://drive.google.com/drive/folders/{folderId} パターン）に一致しない場合, THEN THE Connection_Validator SHALL 「接続」ボタンを非活性にし、URL形式が不正であることを示すエラーメッセージを表示する
4. WHERE Google Drive連携が実装済みの場合, IF 接続検証がタイムアウト・認証エラー・権限不足・フォルダ未存在のいずれかで失敗した場合, THEN THE Connection_Validator SHALL 失敗理由を示すエラーメッセージを表示し、入力内容を保持したまま再試行可能な状態を維持する
5. WHERE Google Drive連携が実装済みの場合, WHEN 接続検証が成功した時, THE Source_Registry SHALL Google DriveフォルダIDとソース名をlocalStorageに保存する
6. WHERE Google Drive連携が未実装の場合, THE Add_Dialog SHALL Google Drive選択肢を非活性（グレーアウト）で表示し「準備中」ラベルを付与し、クリック操作を受け付けない状態にする

### Requirement 6: 追加されたタブの永続化と表示

**User Story:** ユーザーとして、追加した本棚ソースがブラウザを閉じても保持され、次回アクセス時にタブとして表示されることで、毎回設定し直す手間を省きたい。

#### Acceptance Criteria

1. WHEN ページが読み込まれた時, THE Bookshelf_UI SHALL Source_Registryから登録済みソース一覧を取得し、固定タブ（cache、local、pcloud、sample）の後に追加日時の昇順でタブとして表示する
2. THE Source_Registry SHALL 各ソースについて以下の情報をlocalStorageに保持する: ソースID（UUID形式）、ソース種別（"pcloud_share" | "local_folder"）、表示名（最大50文字）、接続情報（pCloud共有コードまたはIndexedDBハンドル参照キー）、追加日時（ISO 8601形式）
3. THE Bookshelf_UI SHALL 追加されたタブの表示名として、ローカルフォルダの場合はフォルダ名、pCloud共有の場合はフォルダ名またはユーザーが追加時に指定した名前を使用し、表示名が20文字を超える場合は末尾を省略記号（…）で切り詰めて表示する
4. WHEN 追加されたタブがクリックされた時, THE Bookshelf_UI SHALL 対応するソースから書籍一覧（.yomiiファイル）を読み込み、3秒以内にリスト表示を開始する
5. IF Source_Registryからのソース一覧取得に失敗した場合, THEN THE Bookshelf_UI SHALL 固定タブのみを表示し、追加タブ領域にエラーを示すメッセージを表示せずに動作を継続する
6. IF 追加されたタブのソースへの接続に失敗した場合（権限拒否、ネットワークエラー、無効なコード）, THEN THE Bookshelf_UI SHALL 書籍一覧の代わりに接続失敗を示すメッセージを表示し、他のタブへの切り替え操作を妨げない

### Requirement 7: 追加されたタブの削除

**User Story:** ユーザーとして、不要になった本棚ソースのタブを削除できることで、本棚UIを整理したい。

#### Acceptance Criteria

1. THE Bookshelf_UI SHALL 追加されたタブ（ユーザーが追加したもの）に対して、タブ上に削除ボタン（×）を表示する
2. WHEN タブの削除ボタンがクリックされた時, THE Bookshelf_UI SHALL 「このタブを削除しますか？」と確認ダイアログを表示する
3. WHEN 確認ダイアログで削除が確認された時, THE Source_Registry SHALL 対応するソース情報をストレージから削除する
4. WHEN 確認ダイアログで削除が確認され、削除対象タブが現在アクティブである場合, THE Bookshelf_UI SHALL 対応するタブをUIから除去し、デフォルトタブ（キャッシュ）をアクティブにする
5. WHEN 確認ダイアログで削除が確認され、削除対象タブが現在アクティブでない場合, THE Bookshelf_UI SHALL 対応するタブをUIから除去し、現在のアクティブタブを維持する
6. IF 確認ダイアログでキャンセルが選択された場合, THEN THE Bookshelf_UI SHALL ダイアログを閉じ、タブを削除せずに現在の状態を維持する
7. THE Bookshelf_UI SHALL 固定タブ（キャッシュ、ローカル、pCloud、サンプル）に対しては削除ボタンを表示しない

### Requirement 8: 接続検証中のフィードバック

**User Story:** ユーザーとして、ソースへの接続検証中に進捗が表示されることで、処理が進行中であることを把握したい。

#### Acceptance Criteria

1. WHILE Connection_Validator が接続検証を実行中, THE Add_Dialog SHALL ローディングインジケーターを表示する
2. WHILE Connection_Validator が接続検証を実行中, THE Add_Dialog SHALL 「接続」ボタンを非活性にする
3. WHEN 接続検証が完了（成功または失敗）した時, THE Add_Dialog SHALL ローディングインジケーターを非表示にし、「接続」ボタンを活性状態に復帰する
4. IF 接続検証がネットワークエラーで失敗した場合, THEN THE Add_Dialog SHALL ネットワーク接続の問題を示すエラーメッセージを表示する
5. IF 接続検証が30秒以内に応答を受信しなかった場合, THEN THE Add_Dialog SHALL タイムアウトを示すエラーメッセージを表示し、ローディングインジケーターを非表示にし、「接続」ボタンを活性状態に復帰する
6. IF 接続検証が認証エラーまたはパス不正で失敗した場合, THEN THE Add_Dialog SHALL 失敗原因を示すエラーメッセージを表示する
