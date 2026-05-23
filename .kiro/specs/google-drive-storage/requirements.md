# Requirements Document

## Introduction

Yomii の本棚ページにおいて、Google Drive をストレージバックエンドとして使用し、書籍データ（.yomii ファイル）の一覧取得・ダウンロード・削除を行う機能を実装する。既存の Google Drive OAuth 認証基盤（`google_drive.js`）およびアップロード機能（cloud-storage-integration spec）を拡張し、本棚 UI から Google Drive 上の書籍を直接閲覧・管理できるようにする。pCloud タブと同等のインターフェース（ファイル一覧表示、サブフォルダナビゲーション、ダウンロード＋キャッシュ）を Google Drive タブでも提供する。ユーザーは Google Drive の「Yomii」フォルダを書籍ストレージとして利用し、複数デバイス間で書籍コレクションを共有できる。

## Glossary

- **Bookshelf_UI**: Yomii の本棚ページ（`page/shelf/`）のタブベースUI。書籍ソースをタブで切り替えて表示する
- **Google_Drive_Tab**: 本棚 UI に表示される Google Drive ソース用のタブ。pCloud タブと同等の操作体験を提供する
- **Google_Drive_Client**: Google Drive API v3 を使用した Google Drive クライアントモジュール（`page/storage/js/google_drive.js`）。PCloud クラスと同等のメソッド構成（`list_files`, `download_file`, `upload_file`, `ensure_folder`）を持つ
- **Yomii_Folder**: Google Drive 上に作成される Yomii 専用フォルダ（フォルダ名: "Yomii"）。pCloud の `/yomii/` フォルダに相当する
- **Yomii_File**: 変換済み書籍データの ZIP アーカイブファイル（拡張子 .yomii）
- **OAuth_Handler**: Google OAuth 2.0 認証フロー（implicit flow）を処理するモジュール。ポップアップウィンドウ方式で認証を行う
- **Access_Token**: OAuth 2.0 認証で取得したアクセストークン（localStorage に保存、有効期限付き）
- **BookCache**: IndexedDB を使った書籍データのローカルキャッシュモジュール（`page/storage/js/book_cache.js`）。`get_or_download` メソッドでキャッシュ優先のダウンロードを行う
- **Load_Module**: 本棚ページのデータ読み込みモジュール（`page/shelf/js/load.js`）。ソース種別に応じてファイル一覧を取得する

## Requirements

### Requirement 1: Google Drive タブの表示と認証連携

**User Story:** As a ユーザー, I want 本棚ページに Google Drive タブが表示され、pCloud タブと同様に認証状態に応じた UI を確認できる, so that Google Drive 上の書籍にアクセスする導線を把握できる

#### Acceptance Criteria

1. THE Bookshelf_UI SHALL 本棚タブ列に「Google Drive」タブを pCloud タブと同列の固定タブとして表示する（タブの data-source 値は "google_drive" とし、モバイル用プルダウンにも同一の選択肢を含める）
2. WHEN Google_Drive_Tab がクリックされ、IF ユーザーが未認証の場合, THEN THE Bookshelf_UI SHALL Google アカウントでの認証を促すメッセージと「Google Drive に接続」ボタンを書籍一覧エリアに表示する（pCloud 未連携時の「マイページで設定してください」メッセージと同等のパターン）
3. WHEN 「Google Drive に接続」ボタンがクリックされた時, THE OAuth_Handler SHALL Google OAuth 2.0 認証フロー（implicit flow）をポップアップウィンドウで開始する
4. WHEN OAuth 認証が成功した時, THE Bookshelf_UI SHALL 認証完了後 30 秒以内に Google Drive 内の Yomii_Folder に格納された .yomii ファイルの一覧を読み込み表示する
5. IF OAuth 認証がユーザーによりキャンセルされた場合, THEN THE Bookshelf_UI SHALL 認証がキャンセルされたことを示すメッセージを表示し、再度「Google Drive に接続」ボタンを表示する
6. IF OAuth 認証がネットワークエラーまたはサーバーエラーにより失敗した場合, THEN THE Bookshelf_UI SHALL エラーの原因を示すメッセージと再試行ボタンを表示し、再試行は最大 3 回まで許可する
7. WHEN Google_Drive_Tab がクリックされ、IF ユーザーが認証済みの場合, THEN THE Bookshelf_UI SHALL Google Drive 上の Yomii_Folder 内の .yomii ファイルおよびサブフォルダの一覧を読み込み表示する（隠しファイル・隠しフォルダは除外する）
8. IF 認証済みユーザーの Google Drive に Yomii_Folder が存在しない場合, THEN THE Bookshelf_UI SHALL フォルダが見つからないことを示すメッセージと、書籍の追加方法を案内する説明を書籍一覧エリアに表示する

### Requirement 2: Google Drive 書籍一覧の取得と表示

**User Story:** As a ユーザー, I want Google Drive の Yomii フォルダ内の書籍一覧を本棚 UI で確認できる, so that クラウドに保存した書籍コレクションを把握できる

#### Acceptance Criteria

1. WHEN 認証済みユーザーが Google_Drive_Tab を表示する, THE Google_Drive_Client SHALL `list_files` メソッドを使用して Yomii_Folder 内の .yomii ファイルおよびサブフォルダ一覧を取得する（PCloud.list_files と同等のインターフェース）
2. WHEN `list_files` メソッドが呼び出された時, THE Google_Drive_Client SHALL 取得するファイル情報として、ファイル名（name）、ファイルID（id）、ファイルサイズ（size）、更新日時（modifiedTime）、MIME タイプ（mimeType）を含め、pCloud の一覧レスポンスと同等の構造（`{ name, size, modified, is_folder }` 形式）で返す
3. WHEN 書籍一覧の取得が成功した時, THE Bookshelf_UI SHALL 隠しファイル（ドットで始まるファイル名）を除外し、フォルダと .yomii ファイルのみを表示する（pCloud タブと同じフィルタリングロジック）
4. WHEN 書籍一覧の取得が成功した時, THE Bookshelf_UI SHALL フォルダを一覧の先頭に、ファイルをその後に、それぞれ名前順（localeCompare による辞書順）でソートして表示する
5. WHILE 書籍一覧の読み込みが進行中, THE Bookshelf_UI SHALL Loading モジュールによるプログレスバーを表示する（pCloud タブと同じ Loading パターン）
6. IF Yomii_Folder が Google Drive 上に存在しない場合, THEN THE Google_Drive_Client SHALL `ensure_folder` メソッドで Yomii_Folder を新規作成し、空の書籍一覧を表示する
7. IF Yomii_Folder 内に .yomii ファイルおよびサブフォルダが存在しない場合, THEN THE Bookshelf_UI SHALL 「書籍がありません。変換ページからアップロードしてください。」メッセージを表示する
8. IF 書籍一覧の取得が HTTP レスポンスエラー（ステータス 4xx/5xx）またはネットワーク接続失敗（fetch 例外）により失敗した場合, THEN THE Bookshelf_UI SHALL エラーメッセージを `error_message` プロパティに設定し、pCloud タブのエラー表示と同じパターンで表示する
9. IF Access_Token の有効期限が切れている（`expires_at` が現在時刻を過ぎている）場合, THEN THE Google_Drive_Client SHALL 再認証が必要である旨のメッセージを表示し、再認証フローへの導線を提示する
10. WHEN Yomii_Folder 内のファイル数が Google Drive API の1ページ上限を超える場合, THE Google_Drive_Client SHALL pageToken を使用して全件取得が完了するまでページネーションを繰り返し、結果を統合して返す
11. IF `list_files` の API リクエストが 30 秒以内にレスポンスを返さない場合, THEN THE Google_Drive_Client SHALL リクエストを中断し、タイムアウトエラーとして `error_message` に設定する

### Requirement 3: サブフォルダナビゲーション

**User Story:** As a ユーザー, I want Google Drive の Yomii フォルダ内のサブフォルダに移動して書籍を閲覧できる, so that フォルダ構造で整理した書籍コレクションを管理できる

#### Acceptance Criteria

1. WHEN ユーザーが書籍一覧のフォルダをクリックした時, THE Load_Module SHALL URL パラメータ `dir` にフォルダ名パス（例: "manga/shonen"）を設定し、Google_Drive_Client を使用して該当フォルダ内のファイル一覧を取得して表示する（pCloud タブの `dir` パラメータと同じ方式で、パス文字列から内部的にフォルダ ID を解決する）
2. THE Google_Drive_Client SHALL `list_files_path` メソッドとして、`dir` パラメータのフォルダ名パスを Yomii_Folder からの相対パスとして解釈し、パス内の各フォルダ名を順にたどってフォルダ ID を解決した上で、最終フォルダ配下のファイル一覧を最大1000件まで取得する機能を提供する（PCloud.list_files_path と同等のインターフェース）
3. WHEN サブフォルダ内を表示中, THE Bookshelf_UI SHALL パンくずリスト（breadcrumbs）として「Yomii」をルートとし、現在のフォルダまでの各階層名をリンクとして表示し、各リンクのクリックでその階層の `dir` パラメータを設定して直接移動できるようにする（ルートフォルダ表示時はパンくずリストを非表示とする）
4. IF 指定されたフォルダが Google Drive 上に存在しない場合, THEN THE Google_Drive_Client SHALL フォルダが見つからない旨のエラーメッセージを throw し、Load_Module は URL パラメータ `dir` を削除して Yomii_Folder ルートの一覧を再表示する
5. IF `dir` パラメータのパス解決中に中間フォルダが見つからない場合, THEN THE Google_Drive_Client SHALL 該当パスが無効である旨のエラーメッセージを throw し、Load_Module は URL パラメータ `dir` を削除して Yomii_Folder ルートの一覧を再表示する

### Requirement 4: Google Drive からの書籍ダウンロードと閲覧

**User Story:** As a ユーザー, I want Google Drive 上の書籍を選択して閲覧できる, so that クラウドに保存した書籍をどのデバイスからでも読める

#### Acceptance Criteria

1. WHEN ユーザーが書籍一覧から書籍を選択した時, THE Bookshelf_UI SHALL BookCache の `get_or_download` メソッドを呼び出し、source_path を `google_drive://{fileId}` 形式、download_fn を Google_Drive_Client の `download_file` メソッドとして渡す
2. WHILE ダウンロードが進行中, THE Google_Drive_Client SHALL Loading モジュールを使用してプログレスバーを表示する（PCloud.download_file と同じ Loading パターン: set_status('active') → set_rate(10) → set_rate(50) → set_rate(100) → set_status('passive')）
3. WHEN BookCache の `get_or_download` がキャッシュミスによりダウンロードを実行した時, THE BookCache SHALL ダウンロードした Blob を source を "google_drive" として IndexedDB に保存する
4. WHEN BookCache の `get_or_download` が Blob を返した時（キャッシュヒットまたはダウンロード完了）, THE Bookshelf_UI SHALL 書籍ビューア（`page/book/`）に遷移して書籍を表示する
5. WHEN ユーザーが既にキャッシュ済みの書籍を選択した時, THE BookCache SHALL IndexedDB からキャッシュデータを取得し、`last_read` を現在時刻に更新して Blob を返す（ダウンロードおよび Loading 表示をスキップする）
6. IF ダウンロードがネットワークエラーにより失敗した場合, THEN THE Google_Drive_Client SHALL Loading を set_status('passive') で非表示にし、エラーメッセージを throw する（PCloud.download_file と同じエラーハンドリングパターン）
7. IF ダウンロードが120秒以内に完了しない場合, THEN THE Google_Drive_Client SHALL タイムアウトとして処理を中断し、Loading を set_status('passive') で非表示にし、タイムアウトを示すエラーメッセージを throw する
8. IF ダウンロード対象ファイルが Google Drive 上で削除されている（404エラー）場合, THEN THE Google_Drive_Client SHALL Loading を set_status('passive') で非表示にし、ファイルが見つからない旨のエラーメッセージを throw する

### Requirement 5: Google Drive 上の書籍削除

**User Story:** As a ユーザー, I want Google Drive 上の不要な書籍を削除できる, so that ストレージ容量を管理できる

#### Acceptance Criteria

1. THE Bookshelf_UI SHALL Google Drive 書籍一覧の各書籍に対して削除操作の導線（長押しメニューまたは削除ボタン）を提供する
2. WHEN ユーザーが書籍の削除を選択した時, THE Bookshelf_UI SHALL 「この書籍を Google Drive から削除しますか？」と確認ダイアログを表示する
3. WHEN 確認ダイアログで削除が確認された時, THE Google_Drive_Client SHALL 削除ボタンを無効化してローディング表示を行い、Google Drive API v3 の files.delete を使用して対象ファイルを削除する
4. WHEN 削除が成功した時, THE Bookshelf_UI SHALL 対象書籍を一覧から除去し、削除完了メッセージを3秒間表示する
5. WHEN 削除が成功した時, THE BookCache SHALL 対象書籍のローカルキャッシュが存在する場合、IndexedDB からキャッシュデータ（メタデータおよびページデータ）を削除する
6. IF 削除がネットワークエラーまたは権限エラーにより失敗した場合, THEN THE Google_Drive_Client SHALL ローディング表示を解除し、エラー種別（ネットワークエラーまたは権限エラー）を示すエラーメッセージを表示し、書籍一覧の状態を変更しない
7. IF 確認ダイアログでキャンセルが選択された場合, THEN THE Bookshelf_UI SHALL ダイアログを閉じ、書籍一覧の状態を変更しない
8. IF 削除操作時に Google Drive の認証トークンが期限切れの場合, THEN THE Google_Drive_Client SHALL 再認証フローを開始し、認証成功後に削除操作を続行する
9. WHILE 削除処理が実行中の間, THE Bookshelf_UI SHALL 対象書籍に対する追加の削除操作を受け付けない

### Requirement 6: 本棚ページからの Google Drive アップロード

**User Story:** As a ユーザー, I want 本棚ページから直接 Google Drive に書籍をアップロードできる, so that ローカルキャッシュの書籍をクラウドにバックアップできる

#### Acceptance Criteria

1. THE Bookshelf_UI SHALL ローカルキャッシュタブの各書籍に対して「Google Drive にアップロード」操作の導線を提供する
2. WHEN ユーザーが「Google Drive にアップロード」を選択し Google Drive 認証済みの場合, THE Google_Drive_Client SHALL `ensure_folder` メソッドで Yomii_Folder の存在を確認し、存在しない場合は新規作成した上で、アップロード処理を開始する（既存の ensure_folder メソッドを使用）
3. WHEN アップロードを実行する, THE Google_Drive_Client SHALL 既存の `upload_file` メソッドを使用して Yomii_File をマルチパートアップロードで Yomii_Folder 内に保存する（タイムアウト: 60秒）
4. WHILE アップロードが進行中, THE Bookshelf_UI SHALL `on_progress` コールバックを通じて受け取ったアップロード進捗率（0〜100%）をプログレスバーまたは数値で表示し、アップロード操作の導線を無効化する
5. IF Yomii_Folder 内に同名のファイルが既に存在する場合, THEN THE Bookshelf_UI SHALL 「同名のファイルが存在します。上書きしますか？」と確認ダイアログを表示し、ユーザーが「上書き」を選択した場合は既存ファイルを置き換えてアップロードし、「キャンセル」を選択した場合はアップロードを中止する
6. WHEN アップロードが完了した時, THE Bookshelf_UI SHALL アップロード完了メッセージを3秒間表示し、アップロード操作の導線を再度有効化する
7. IF アップロードがネットワークエラーまたはタイムアウトにより失敗した場合, THEN THE Google_Drive_Client SHALL エラーメッセージを throw し、呼び出し元は最大3回まで自動リトライする（リトライ間隔: 1秒）
8. IF Google Drive の空き容量が不足している場合, THEN THE Google_Drive_Client SHALL 容量不足を示すエラーメッセージを throw し、アップロードを中止する（リトライ対象外）
9. IF ユーザーが未認証の場合, THEN THE Bookshelf_UI SHALL OAuth 認証フローをポップアップウィンドウで開始し、認証完了後にアップロードを自動実行する
10. IF OAuth 認証フローがユーザーによりキャンセルされた場合またはポップアップがブロックされた場合, THEN THE Bookshelf_UI SHALL 認証失敗を示すエラーメッセージを表示し、アップロードを中止する

### Requirement 7: キャッシュと Google Drive の同期状態表示

**User Story:** As a ユーザー, I want 各書籍がローカルキャッシュ済みかクラウドのみかを視覚的に区別できる, so that オフラインで読める書籍を把握できる

#### Acceptance Criteria

1. WHEN Google Drive 書籍一覧が表示される時, THE Bookshelf_UI SHALL 各書籍に対して、ローカルキャッシュの有無を示すアイコン（キャッシュ済み: 端末アイコン、クラウドのみ: クラウドアイコン）を書籍名の横に表示する
2. WHEN Google Drive 書籍一覧が表示される時, THE BookCache SHALL `get_meta` メソッドを使用して各書籍のソースパス（google_drive://{fileId}）に基づいてキャッシュの有無を確認し、3秒以内に全書籍のキャッシュ状態判定を完了する
3. WHEN Google Drive タブが選択された時, THE Bookshelf_UI SHALL ヘッダー領域に Yomii フォルダの使用容量をファイル数（「N 冊」形式）とファイルサイズ合計（MB 単位、小数点第1位まで）で表示する
4. WHEN ユーザーがキャッシュ済み書籍を長押しまたはコンテキストメニューから「キャッシュを削除」を選択した時, THE BookCache SHALL `remove` メソッドで対象書籍のキャッシュデータを IndexedDB から削除し、THE Bookshelf_UI SHALL 対象書籍のアイコンをクラウドのみ状態に即座に更新する
5. IF キャッシュ状態の確認中に IndexedDB アクセスエラーが発生した場合, THEN THE Bookshelf_UI SHALL 全書籍をクラウドのみ状態として表示し、エラーをコンソールにログ出力する
6. WHEN ユーザーが Google Drive 書籍一覧からクラウドのみの書籍を開いてダウンロードが完了した時, THE Bookshelf_UI SHALL 対象書籍のアイコンをキャッシュ済み状態に更新する

### Requirement 8: Google Drive 接続解除

**User Story:** As a ユーザー, I want Google Drive との接続を解除できる, so that アカウントのセキュリティを管理できる

#### Acceptance Criteria

1. WHILE ユーザーが Google Drive に認証済みである状態, THE Bookshelf_UI SHALL Google Drive タブ内に「接続を解除」ボタンを表示する
2. WHEN 「接続を解除」ボタンがクリックされた時, THE Bookshelf_UI SHALL 「Google Drive との接続を解除しますか？ローカルキャッシュは保持されます。」と確認ダイアログを表示する
3. WHEN 確認ダイアログで解除が確認された時, THE Google_Drive_Client SHALL `logout` メソッドを使用して localStorage から Google Drive のトークン情報（STORAGE_KEY: "yomii_google_drive_token"）を削除する
4. WHEN 接続解除が完了した時, THE Bookshelf_UI SHALL Google_Drive_Tab の表示を未認証状態（認証促進メッセージと「Google Drive に接続」ボタン）に更新し、「接続を解除」ボタンを非表示にする
5. WHEN 接続解除が完了した時, THE BookCache SHALL Google Drive からダウンロードしたローカルキャッシュデータ（ソースが "google_drive" のエントリ）を IndexedDB 内に保持する（削除しない）
6. IF 確認ダイアログでキャンセルが選択された場合, THEN THE Bookshelf_UI SHALL ダイアログを閉じ、接続状態およびトークン情報を変更しない
7. IF localStorage からのトークン削除が例外により失敗した場合, THEN THE Bookshelf_UI SHALL エラーが発生した旨のメッセージを表示し、接続状態の表示を変更しない

### Requirement 9: Google Drive ストレージ容量情報の表示

**User Story:** As a ユーザー, I want Google Drive の残り容量を確認できる, so that 書籍の保存可否を事前に判断できる

#### Acceptance Criteria

1. WHEN 認証済みユーザーが Google_Drive_Tab を表示する, THE Google_Drive_Client SHALL Google Drive API v3 の about.get（fields: storageQuota）を使用してストレージ使用量と上限を取得し、取得完了までローディングインジケーターを表示する
2. WHEN ストレージ情報の取得が完了した, THE Bookshelf_UI SHALL Google Drive の使用容量、上限容量、および残り容量を表示する（1024MB 未満の場合は MB 単位で小数点以下なし、1024MB 以上の場合は GB 単位で小数第1位まで表示する）
3. IF 残り容量が 500MB 未満の場合, THEN THE Bookshelf_UI SHALL 容量不足を示す警告メッセージを容量表示の近傍に視覚的に区別可能な形式で表示する
4. IF ストレージ情報の取得に失敗した場合（ネットワークエラー、認証トークン期限切れ、APIエラーを含む）, THEN THE Bookshelf_UI SHALL 容量情報の表示領域を非表示にし、書籍一覧の表示・操作に影響を与えない
5. WHEN 認証済みユーザーが Google_Drive_Tab 上でストレージ容量表示を手動更新操作する, THE Google_Drive_Client SHALL ストレージ情報を再取得し表示を更新する

### Requirement 10: エラーハンドリングとリカバリ

**User Story:** As a ユーザー, I want エラーが発生した場合に適切なフィードバックと復旧手段を得られる, so that 問題を理解し対処できる

#### Acceptance Criteria

1. IF Google Drive API が 401（Unauthorized）エラーを返した場合, THEN THE Google_Drive_Client SHALL localStorage から保存済みトークン（STORAGE_KEY に対応するエントリ）を削除し、再認証が必要である旨を示すエラーメッセージを throw する
2. IF Google Drive API が 403（Forbidden / Rate Limit）エラーを返した場合, THEN THE Google_Drive_Client SHALL レートリミットに達したことを示すエラーメッセージを throw する
3. IF Google Drive API が 404（Not Found）エラーを返した場合, THEN THE Google_Drive_Client SHALL 対象リソースが見つからない旨のエラーメッセージを throw する
4. IF Google Drive API が 500 系（500〜599）エラーを返した場合, THEN THE Google_Drive_Client SHALL 最大3回までリトライし、すべて失敗した場合にサーバーエラーを示すメッセージを throw する
5. WHEN Google Drive API 呼び出しでエラーが発生する, THE Google_Drive_Client SHALL エラー種別（API エラー／ネットワークエラー／タイムアウト）、HTTP ステータスコード（取得可能な場合）、および失敗した操作名（upload_file、api_get、ensure_folder 等）をブラウザの console.error にログ出力する
6. IF ネットワーク接続が利用できない（XMLHttpRequest の onerror が発火した）場合, THEN THE Google_Drive_Client SHALL 「ネットワーク接続を確認してください」メッセージを throw する
7. IF Google Drive API へのリクエストが 60 秒以内に応答しない場合, THEN THE Google_Drive_Client SHALL タイムアウトした旨を示すエラーメッセージを throw する
8. IF アクセストークンの有効期限（expires_at）が現在時刻を超過している場合, THEN THE Google_Drive_Client SHALL 認証が必要である旨を示すエラーメッセージを throw する

### Requirement 11: Load モジュールへの Google Drive ソース統合

**User Story:** As a 開発者, I want Load モジュールに Google Drive ソースを追加して、pCloud と同じパターンで書籍一覧を読み込めるようにする, so that 既存の本棚 UI コードを最小限の変更で Google Drive に対応させられる

#### Acceptance Criteria

1. WHEN `source` パラメータに "google_drive" が指定された場合, THE Load_Module SHALL `load_google_drive` メソッドを呼び出し、Google Drive API v3 を使用して「Yomii」フォルダ内のファイル一覧を取得する
2. WHEN Google Drive からファイル一覧の取得が成功した場合, THE Load_Module SHALL 隠しファイル（名前が "." で始まるもの）を除外し、ディレクトリまたは拡張子が ".yomii" のファイルのみをフィルタした上で、`{ type, name, size, modified, file_id }` 形式の配列として `this.datas` に格納する（`type` は "dir" または "file"、`file_id` は Google Drive のファイル ID）
3. IF GoogleDrive.is_authenticated() が false を返す場合, THEN THE Load_Module SHALL `this.datas` を空配列に設定し、`this.error_message` に Google Drive 連携を促すメッセージを設定した上で `finish()` を呼び出す
4. IF Google Drive API 呼び出しが例外をスローした場合, THEN THE Load_Module SHALL `this.datas` を空配列に設定し、`this.error_message` に例外の message プロパティを設定した上で `finish()` を呼び出す
5. WHEN サブフォルダへのナビゲーションが行われた場合, THE Load_Module SHALL URL パラメータ `dir` の値を Google Drive の「Yomii」フォルダからの相対パスとして解釈し、該当サブフォルダ内のファイル一覧を取得する
