# Requirements Document

## Introduction

yomii のアップロード（convert）ページにおいて、変換済み書籍データ（.yomii ファイル）を外部クラウドストレージサービス（pCloud および Google Drive）に保存する機能を追加する。ユーザーは保存ボタン押下時に保存先を選択でき、各サービスとの OAuth 2.0 認証を通じてファイルをアップロードできる。また、各サービスのセットアップ手順（OAuth 設定等）を開発者向けドキュメントとして提供する。

## Glossary

- **Convert_Page**: yomii アプリケーションのアップロード（変換）ページ。書籍ファイルを読み込み、WebP 画像に変換して .yomii 形式で保存する機能を持つ
- **Storage_Selector**: 保存先クラウドストレージサービスを選択するための UI コンポーネント
- **Cloud_Storage_Manager**: クラウドストレージサービスとの通信を管理するモジュール
- **OAuth_Handler**: OAuth 2.0 認証フローを処理するモジュール
- **Yomii_File**: 変換済み書籍データの ZIP アーカイブファイル（拡張子 .yomii）
- **pCloud_Client**: pcloud-sdk-js を使用した pCloud API クライアント
- **Google_Drive_Client**: Google Drive API v3 を使用した Google Drive クライアント
- **Access_Token**: OAuth 2.0 認証で取得したアクセストークン
- **Refresh_Token**: Access_Token の有効期限切れ時に新しいトークンを取得するためのトークン
- **Yomii_Folder**: クラウドストレージ上に作成される yomii 専用フォルダ（フォルダ名: "Yomii"）

## Requirements

### Requirement 1: 保存先選択 UI

**User Story:** As a ユーザー, I want 保存ボタン押下時にクラウドストレージの保存先を選択できる, so that 自分の好みのサービスにデータを保存できる

#### Acceptance Criteria

1. WHEN ユーザーが保存ボタンを押下する, THE Storage_Selector SHALL pCloud、Google Drive、およびローカルダウンロードの選択肢を含むモーダルを1秒以内に表示する
2. WHEN ユーザーが保存先を選択する, THE Storage_Selector SHALL 選択されたサービスへの保存処理を開始し、進捗インジケーターを表示する
3. WHILE 書籍データが変換処理を完了していない状態（ページ画像が未生成）, THE Convert_Page SHALL 保存ボタンを非活性（disabled）状態で表示する
4. WHEN Storage_Selector が表示される, THE Storage_Selector SHALL 各サービスの認証状態を「認証済み」または「未認証」のラベルで区別して表示する
5. IF ユーザーが未認証のサービスを選択した場合, THEN THE Storage_Selector SHALL 該当サービスのOAuth認証フローを開始する
6. WHEN ユーザーがモーダル外の領域をタップする、または閉じるボタンを押下する, THE Storage_Selector SHALL モーダルを閉じ、保存処理を実行しない

### Requirement 2: OAuth 2.0 認証（Google Drive）

**User Story:** As a ユーザー, I want Google アカウントで認証して Google Drive に接続できる, so that 自分の Google Drive に書籍データを保存できる

#### Acceptance Criteria

1. WHEN ユーザーが Google Drive を保存先として選択する, IF ユーザーが未認証である, THEN THE OAuth_Handler SHALL Google OAuth 2.0 認証フローを開始し、認証画面を60秒以内に表示する
2. WHEN Google OAuth 2.0 認証が成功する, THE OAuth_Handler SHALL Access_Token および Refresh_Token をブラウザのローカルストレージに保存する
3. IF Google OAuth 2.0 認証が失敗する（ユーザーによる拒否、ネットワークエラー、またはサーバーエラー）, THEN THE OAuth_Handler SHALL 失敗の原因を示すエラーメッセージを表示し、保存処理を中断し、認証前の画面状態を維持する
4. IF Access_Token の有効期限が切れている, THEN THE OAuth_Handler SHALL Refresh_Token を使用して新しい Access_Token を取得し、ローカルストレージを更新する
5. THE OAuth_Handler SHALL Google Drive API の scope として `https://www.googleapis.com/auth/drive.file` を要求する
6. IF Refresh_Token による Access_Token の再取得が失敗する（Refresh_Token の失効またはユーザーによる権限取り消し）, THEN THE OAuth_Handler SHALL 保存済みのトークン情報を削除し、再認証が必要である旨のメッセージを表示し、再認証フローへの導線を提示する

### Requirement 3: OAuth 2.0 認証（pCloud）

**User Story:** As a ユーザー, I want pCloud アカウントで認証して pCloud に接続できる, so that 自分の pCloud に書籍データを保存できる

#### Acceptance Criteria

1. WHEN ユーザーが pCloud を保存先として選択し未認証の場合, THE OAuth_Handler SHALL pCloud OAuth 2.0 認証フローを開始し、認証画面を60秒以内に表示する
2. WHEN pCloud OAuth 2.0 認証が成功する, THE OAuth_Handler SHALL Access_Token をブラウザのローカルストレージに保存する
3. IF pCloud OAuth 2.0 認証が失敗する（ユーザーによる拒否、ネットワークエラー、またはサーバーエラー）, THEN THE OAuth_Handler SHALL 失敗の原因を示すエラーメッセージを表示し、保存処理を中断し、認証前の画面状態を維持する
4. THE OAuth_Handler SHALL pCloud の認証エンドポイント（`https://my.pcloud.com/oauth2/authorize`）を使用する
5. THE OAuth_Handler SHALL pCloud のデータリージョン（US: `api.pcloud.com` / EU: `eapi.pcloud.com`）に応じた API エンドポイントを使用する
6. IF pCloud のトークンが無効化された場合, THEN THE OAuth_Handler SHALL 保存済みのトークン情報を削除し、再認証が必要である旨のメッセージを表示する

### Requirement 4: Google Drive へのファイルアップロード

**User Story:** As a ユーザー, I want 変換済み書籍データを Google Drive に保存できる, so that 複数デバイスから書籍にアクセスできる

#### Acceptance Criteria

1. WHEN 認証済みユーザーが Google Drive への保存を実行する, THE Google_Drive_Client SHALL Google Drive 上に「Yomii」という名前のフォルダが存在するか確認し、存在しない場合のみ Yomii_Folder を新規作成する
2. WHEN アップロードを実行する, THE Google_Drive_Client SHALL 200MB以下の Yomii_File を Yomii_Folder 内にマルチパートアップロードする
3. WHILE アップロードが進行中, THE Google_Drive_Client SHALL 転送済みバイト数に基づくアップロード進捗率（0〜100%）をプログレスバーで表示し、1秒以上の間隔で更新する
4. IF アップロードがネットワークエラーまたはサーバーエラーにより失敗する, THEN THE Google_Drive_Client SHALL エラーメッセージを表示し、最大3回まで自動リトライ可能な状態にする
5. IF Google Drive の空き容量が不足している, THEN THE Google_Drive_Client SHALL 容量不足を示すエラーメッセージを表示し、アップロードを中止する
6. IF アップロードが60秒以内に完了しない, THEN THE Google_Drive_Client SHALL タイムアウトとして処理を中断し、エラーメッセージを表示してリトライ可能な状態にする
7. WHEN アップロードが完了する, THE Google_Drive_Client SHALL 完了メッセージを表示する

### Requirement 5: pCloud へのファイルアップロード

**User Story:** As a ユーザー, I want 変換済み書籍データを pCloud に保存できる, so that 大容量の書籍コレクションを管理できる

#### Acceptance Criteria

1. WHEN 認証済みユーザーが pCloud への保存を実行する, THE pCloud_Client SHALL pCloud のルートディレクトリ直下に Yomii_Folder を作成する（未作成の場合）
2. WHEN アップロードを実行する, THE pCloud_Client SHALL pcloud-sdk-js の upload メソッドを使用して Yomii_File を Yomii_Folder 内にアップロードする
3. IF Yomii_Folder 内に同名のファイルが既に存在する, THEN THE pCloud_Client SHALL 既存ファイルを上書きしてアップロードする
4. WHILE アップロードが進行中, THE pCloud_Client SHALL アップロード進捗率を 0%〜100% の範囲でプログレスバーに表示し、1秒以内の間隔で更新する
5. IF アップロードが失敗する, THEN THE pCloud_Client SHALL エラーの原因を示すメッセージを表示し、最大3回までリトライ可能な状態にする
6. IF アップロード中にネットワーク接続が切断される, THEN THE pCloud_Client SHALL 接続エラーを示すメッセージを表示し、ネットワーク復帰後にリトライ可能な状態にする
7. WHEN アップロードが完了する, THE pCloud_Client SHALL アップロード完了を示すメッセージとファイル名を表示する

### Requirement 6: 認証状態の永続化

**User Story:** As a ユーザー, I want 一度認証したら次回以降は再認証なしで保存できる, so that 毎回ログインする手間を省ける

#### Acceptance Criteria

1. THE Cloud_Storage_Manager SHALL 認証トークンをサービスごとに区別してブラウザの localStorage に保存する
2. WHEN Convert_Page が読み込まれる, THE Cloud_Storage_Manager SHALL 保存済みトークンの有効期限を確認し、有効期限内であれば該当サービスを認証済み状態として扱う
3. IF 保存済みトークンの有効期限が切れている, THEN THE Cloud_Storage_Manager SHALL トークンのリフレッシュを試行し、成功した場合は新しいトークンで localStorage を更新する
4. IF トークンのリフレッシュが失敗した場合、または保存済みトークンが無効である, THEN THE Cloud_Storage_Manager SHALL 該当サービスを未認証状態として表示し、再認証を促すUIを表示する
5. WHEN ユーザーがログアウト操作を行う, THE Cloud_Storage_Manager SHALL 該当サービスのトークンを localStorage から削除し、該当サービスを未認証状態に更新する
6. IF トークン有効性確認中にネットワークエラーが発生した場合, THEN THE Cloud_Storage_Manager SHALL 10秒以内にタイムアウトし、直前の認証状態を維持したまま、接続エラーをユーザーに通知する

### Requirement 7: セットアップ手順ドキュメント

**User Story:** As a 開発者, I want 各クラウドストレージサービスの OAuth セットアップ手順を参照できる, so that 開発環境を正しく構築できる

#### Acceptance Criteria

1. THE ドキュメント SHALL Google Cloud Console での OAuth 2.0 クライアント ID 作成手順（プロジェクト作成、OAuth 同意画面設定、認証情報作成）を記載する
2. THE ドキュメント SHALL Google Drive API の有効化手順（API ライブラリでの検索と有効化操作）を記載する
3. THE ドキュメント SHALL pCloud Developer Portal でのアプリ登録手順（アプリ名、リダイレクト URI、権限設定）を記載する
4. THE ドキュメント SHALL pCloud OAuth 2.0 のリダイレクト URI 設定手順（開発環境: localhost、本番環境: 本番ドメイン）を記載する
5. THE ドキュメント SHALL 各サービスの環境変数（クライアント ID、リダイレクト URI）の設定方法を記載する
6. THE ドキュメント SHALL 開発環境（localhost）と本番環境での OAuth リダイレクト URI およびオリジン設定の違いを記載する

### Requirement 8: エラーハンドリング

**User Story:** As a ユーザー, I want エラーが発生した場合に適切なフィードバックを受け取れる, so that 問題を理解し対処できる

#### Acceptance Criteria

1. IF ネットワーク接続が利用できない, THEN THE Cloud_Storage_Manager SHALL ネットワーク接続が利用できないことを示すエラーメッセージを画面上に表示し、ユーザーが閉じるまで表示を維持する
2. IF クラウドストレージの容量が不足している, THEN THE Cloud_Storage_Manager SHALL ストレージ容量が不足していることを示すエラーメッセージを画面上に表示し、ユーザーが閉じるまで表示を維持する
3. IF API レートリミットに達した, THEN THE Cloud_Storage_Manager SHALL レートリミットに達したことを示すエラーメッセージと待機時間（APIレスポンスに含まれる場合はその値、含まれない場合は60秒）を画面上に表示し、ユーザーが閉じるまで表示を維持する
4. WHEN エラーが発生する, THE Cloud_Storage_Manager SHALL エラー種別、発生日時、および失敗した操作名をブラウザのコンソールにログ出力する
5. IF クラウドストレージ操作中にエラーが発生した, THEN THE Cloud_Storage_Manager SHALL 操作開始前の状態を維持し、ローカルに保持されている未同期データを破棄しない
6. WHEN エラーメッセージが表示される, THE Cloud_Storage_Manager SHALL エラーメッセージ表示後3秒以内にユーザーが操作可能な状態（メッセージの閉じるボタン押下、または別の画面操作）に復帰する
