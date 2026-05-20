# クラウドストレージ連携 セットアップ手順

```
Created : 2026.05.19
```

## pCloud セットアップ

### 1. pCloud Developer Portal でアプリを登録

1. https://docs.pcloud.com/ にアクセスし、ログイン（pCloud アカウントが必要）
2. 「My Apps」→「Create New App」をクリック
3. 以下を入力:
   - **App Name**: `Yomii`（任意の名前）
   - **App Description**: 書籍ビューア
   - **Redirect URIs**: コールバック URL を設定（下記参照）

### 2. Redirect URI の設定

| 環境 | Redirect URI |
|------|-------------|
| 開発環境 | `http://localhost:8080/page/storage/callback/pcloud.html` |
| 本番環境 | `https://yourdomain.com/page/storage/callback/pcloud.html` |

※ ポート番号は開発環境に合わせて変更してください。

### 3. Client ID の設定

アプリ登録後に表示される **App ID（Client ID）** を `.env` ファイルに設定:

```
PCLOUD_CLIENT_ID=your-pcloud-app-id
PCLOUD_REDIRECT_URI=http://localhost:8080/page/storage/callback/pcloud.html
```

### 4. 動作確認

1. マイページ（`?p=mypage`）にアクセス
2. pCloud の「連携する」ボタンを押す
3. pCloud のログイン画面がポップアップで表示される
4. ログイン・許可すると「連携済み」に変わる
5. convert ページでファイルをアップロード・変換
6. 保存ボタンを押す
7. 「pCloud」を選択するとアップロードが実行される

### 注意事項

- pCloud にはデータリージョン（US / EU）があり、ユーザーの登録地域によって API エンドポイントが異なる
- OAuth の Token フロー（implicit flow）を使用しているため、トークンの有効期限はなし（ユーザーが権限を取り消すまで有効）
- pCloud API のレートリミット: 明確な公式ドキュメントはないが、短時間に大量リクエストを送ると制限される可能性あり

---

## Google Drive セットアップ（実装予定）

### 1. Google Cloud Console でプロジェクト作成

1. https://console.cloud.google.com/ にアクセス
2. 「新しいプロジェクト」を作成
3. プロジェクト名: `Yomii`（任意）

### 2. Google Drive API の有効化

1. 「APIとサービス」→「ライブラリ」
2. 「Google Drive API」を検索して有効化

### 3. OAuth 同意画面の設定

1. 「APIとサービス」→「OAuth 同意画面」
2. ユーザータイプ: 「外部」を選択
3. アプリ名、サポートメール等を入力
4. スコープに `https://www.googleapis.com/auth/drive.file` を追加

### 4. OAuth 2.0 クライアント ID の作成

1. 「APIとサービス」→「認証情報」→「認証情報を作成」→「OAuth クライアント ID」
2. アプリケーションの種類: 「ウェブ アプリケーション」
3. 承認済みの JavaScript 生成元:
   - 開発: `http://localhost:8080`
   - 本番: `https://yourdomain.com`
4. 承認済みのリダイレクト URI:
   - 開発: `http://localhost:8080/page/storage/callback/google.html`
   - 本番: `https://yourdomain.com/page/storage/callback/google.html`

### 5. Client ID の設定

取得した **クライアント ID** を `.env` ファイルに設定:

```
GOOGLE_DRIVE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:8080/page/storage/callback/google.html
```

---

## 環境変数の管理（.env ファイル）

すべての OAuth Client ID やリダイレクト URI は `.env` ファイルで管理します。

### .env ファイルの作成

プロジェクトルートに `.env` ファイルを作成してください。テンプレートとして `.env.example` を用意しています。

```bash
cp .env.example .env
```

### .env の内容

```
# Google OAuth Client ID（ログイン用）
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# pCloud OAuth
PCLOUD_CLIENT_ID=your-pcloud-app-id
PCLOUD_REDIRECT_URI=http://localhost:8080/page/storage/callback/pcloud.html

# Google Drive OAuth
GOOGLE_DRIVE_CLIENT_ID=your-google-drive-client-id.apps.googleusercontent.com
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:8080/page/storage/callback/google.html
```

### 環境ごとの設定

| 環境 | 設置場所 | 備考 |
|------|---------|------|
| 開発 | プロジェクトルート `/.env` | localhost 用の値を設定 |
| 本番 | デプロイ先のルート `/.env` | 本番ドメイン用の値を設定 |

### 重要

- `.env` は `.gitignore` に含まれており、Git にコミットされません
- `.env.example` はコミットされるので、必要なキーの一覧として参照してください
- 各環境で `.env` ファイルを個別に設置してください
- `.env` はフロントエンドから `fetch("../.env")` で読み込まれます。Web サーバーの設定で `.env` へのアクセスを許可する必要があります（開発サーバーではデフォルトで問題ありません）

### 本番環境でのセキュリティ

本番環境では `.env` ファイルが外部からアクセスされないよう、以下のいずれかの対策を推奨します：

1. Web サーバー（nginx 等）で `.env` へのアクセスを制限し、同一オリジンからのみ許可する
2. ビルドステップで `.env` の値を JS に埋め込む方式に変更する

---

## Google ログイン（ユーザー認証）セットアップ

マイページへのアクセスに Google ログインが必要です。
Google Drive 連携とは別の OAuth クライアント ID を使用することも、同じものを共用することも可能です。

### 1. Google Cloud Console で OAuth クライアント ID を作成

1. https://console.cloud.google.com/ にアクセス
2. プロジェクトを選択（または新規作成）
3. 「APIとサービス」→「OAuth 同意画面」を設定
   - ユーザータイプ: 外部
   - アプリ名、サポートメール等を入力
4. 「APIとサービス」→「認証情報」→「認証情報を作成」→「OAuth クライアント ID」
5. アプリケーションの種類: 「ウェブ アプリケーション」
6. 承認済みの JavaScript 生成元:
   - 開発: `http://localhost:8080`
   - 本番: `https://yourdomain.com`

### 2. Client ID の設定

取得した **クライアント ID** を `.env` ファイルに設定:

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 3. 動作確認

1. `?p=login` にアクセス
2. Google ログインボタンが表示される
3. ログインするとマイページ（`?p=mypage`）へ遷移
4. マイページにユーザー名・メールアドレスが表示される
5. ログアウトするとログインページへ戻る

### 注意事項

- Google Identity Services (GIS) の Sign In with Google ボタンを使用
- JWT (credential) はクライアント側でデコードして表示用に使用
- 本番環境ではサーバーサイドで JWT の署名検証を行うことを推奨
- ログイン状態は localStorage に保存（ブラウザ単位）
