# マネタイズ計画：有料ストレージサービス

```
Created : 2026.04.30
```

## 概要

Yomii の基本機能（クライアント完結型のブックリーダー）は無料で提供しつつ、サーバーサイドのストレージ機能をサブスクリプション（月額/年額）で提供する。

- ストレージ: AWS S3
- 決済: Stripe（サブスクリプション）

---

## 1. サービスプラン設計

### プラン構成

| プラン | 容量 | 月額 | 年額（割引） | 想定ユーザー |
|--------|------|------|-------------|-------------|
| Free | なし（クライアント完結のみ） | ¥0 | ¥0 | ライトユーザー |
| Basic | 10GB（〜200冊） | ¥300 | ¥3,000（2ヶ月分お得） | 一般ユーザー |
| Standard | 50GB（〜1,000冊） | ¥800 | ¥8,000 | 自炊ユーザー |
| Premium | 200GB（〜4,000冊） | ¥1,500 | ¥15,000 | ヘビーユーザー |

※ 1冊あたり約50MB（漫画200p, WebP）で試算

### Free プランでできること

- ローカルファイルの閲覧（PDF / ZIP / .yomii）
- IndexedDB への保存（ブラウザ内本棚）
- Google Drive / pCloud 連携（ユーザー自身のストレージ）
- PWA としての利用

### 有料プランの付加価値

- サーバーストレージ（AWS S3）に書籍を保存
- どのデバイスからでもログインするだけで本棚にアクセス
- サーバーサイド変換（高品質 pdftoppm 変換）
- 自動バックアップ
- 高速CDN配信（CloudFront）
- 優先サポート

---

## 2. 技術構成

### アーキテクチャ

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   ブラウザ    │────▶│  API Server  │────▶│   AWS S3     │
│  (フロント)   │◀────│  (PHP/Node)  │◀────│  (ストレージ) │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────▼───────┐
                     │   Stripe     │
                     │  (決済管理)   │
                     └──────────────┘
                            │
                     ┌──────▼───────┐
                     │  Database    │
                     │ (ユーザー/   │
                     │  プラン管理)  │
                     └──────────────┘
```

### AWS S3 構成

```
s3://yomii-books/
├── {user_id}/
│   ├── {book_id}/
│   │   ├── meta.json          # 書籍メタデータ
│   │   ├── cover.webp         # 表紙サムネイル
│   │   ├── pages/
│   │   │   ├── 00001.webp    # ページ画像
│   │   │   ├── 00002.webp
│   │   │   └── ...
│   │   └── setting.json      # 表示設定
│   └── shelf.json             # 本棚メタデータ
└── ...
```

**S3 設定:**
- バケットポリシー: プライベート（直接アクセス不可）
- アクセス: 署名付きURL（Pre-signed URL）経由のみ
- ストレージクラス: S3 Standard（頻繁アクセス）/ S3 Infrequent Access（長期保存）
- ライフサイクル: 解約後90日でデータ削除
- 暗号化: SSE-S3（サーバーサイド暗号化）

### Stripe 構成

```
Stripe Products:
├── prod_basic     → price_basic_monthly (¥300/月)
│                  → price_basic_yearly  (¥3,000/年)
├── prod_standard  → price_standard_monthly (¥800/月)
│                  → price_standard_yearly  (¥8,000/年)
└── prod_premium   → price_premium_monthly (¥1,500/月)
                   → price_premium_yearly  (¥15,000/年)
```

---

## 3. Stripe 実装設計

### 3.1 サブスクリプションフロー

```
1. ユーザー登録 / ログイン
       │
2. プラン選択画面
       │
3. Stripe Checkout Session 作成（サーバーサイド）
       │
4. Stripe の決済画面にリダイレクト
       │
5. 決済完了 → Webhook で通知受信
       │
6. ユーザーのプランを有効化（DB更新）
       │
7. S3 のストレージ割り当て
```

### 3.2 API設計

```
POST /api/subscription/create
  → Stripe Checkout Session を作成し、URLを返す

POST /api/subscription/webhook
  → Stripe Webhook を受信し、プラン状態を更新

GET /api/subscription/status
  → 現在のプラン・使用量・残り容量を返す

POST /api/subscription/cancel
  → サブスクリプションをキャンセル（期間終了まで有効）

POST /api/subscription/change
  → プラン変更（アップグレード/ダウングレード）
```

### 3.3 Stripe Checkout 実装例

**サーバーサイド（PHP）:**

```php
<?php
require 'vendor/autoload.php';

\Stripe\Stripe::setApiKey(getenv('STRIPE_SECRET_KEY'));

function create_checkout_session($user_id, $price_id) {
    $session = \Stripe\Checkout\Session::create([
        'customer' => get_stripe_customer_id($user_id),
        'payment_method_types' => ['card'],
        'line_items' => [[
            'price' => $price_id,
            'quantity' => 1,
        ]],
        'mode' => 'subscription',
        'success_url' => 'https://book.myntinc.com/subscription/success',
        'cancel_url'  => 'https://book.myntinc.com/subscription/cancel',
        'metadata' => [
            'user_id' => $user_id,
        ],
    ]);
    return $session->url;
}
```

**Webhook 処理:**

```php
<?php
function handle_webhook() {
    $payload = file_get_contents('php://input');
    $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
    $endpoint_secret = getenv('STRIPE_WEBHOOK_SECRET');

    $event = \Stripe\Webhook::constructEvent(
        $payload, $sig_header, $endpoint_secret
    );

    switch ($event->type) {
        case 'checkout.session.completed':
            $session = $event->data->object;
            activate_subscription($session->metadata->user_id, $session->subscription);
            break;

        case 'invoice.paid':
            // 継続課金成功
            extend_subscription($event->data->object);
            break;

        case 'invoice.payment_failed':
            // 支払い失敗 → 猶予期間へ
            suspend_subscription($event->data->object);
            break;

        case 'customer.subscription.deleted':
            // 解約完了
            deactivate_subscription($event->data->object);
            break;
    }
}
```

### 3.4 フロントエンド（プラン選択UI）

```javascript
// プラン選択 → Checkout へ遷移
async function subscribePlan(priceId) {
    const res = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: priceId })
    })
    const { checkout_url } = await res.json()
    window.location.href = checkout_url
}
```

---

## 4. AWS S3 実装設計

### 4.1 書籍アップロード

```php
<?php
use Aws\S3\S3Client;

function upload_book_page($user_id, $book_id, $page_num, $webp_data) {
    $s3 = new S3Client([
        'region'  => 'ap-northeast-1',
        'version' => 'latest',
    ]);

    $key = "{$user_id}/{$book_id}/pages/" . sprintf("%05d", $page_num) . ".webp";

    $s3->putObject([
        'Bucket' => 'yomii-books',
        'Key'    => $key,
        'Body'   => $webp_data,
        'ContentType' => 'image/webp',
        'ServerSideEncryption' => 'AES256',
    ]);
}
```

### 4.2 署名付きURLでのページ配信

ユーザーがページを閲覧する際、直接S3にアクセスさせず、有効期限付きのURLを発行する。

```php
<?php
function get_page_url($user_id, $book_id, $page_num) {
    // 権限チェック
    if (!has_active_subscription($user_id)) {
        return ['error' => 'subscription_required'];
    }

    $s3 = new S3Client([
        'region'  => 'ap-northeast-1',
        'version' => 'latest',
    ]);

    $key = "{$user_id}/{$book_id}/pages/" . sprintf("%05d", $page_num) . ".webp";

    $cmd = $s3->getCommand('GetObject', [
        'Bucket' => 'yomii-books',
        'Key'    => $key,
    ]);

    $request = $s3->createPresignedRequest($cmd, '+15 minutes');
    return (string) $request->getUri();
}
```

### 4.3 容量管理

```php
<?php
function get_storage_usage($user_id) {
    $s3 = new S3Client([
        'region'  => 'ap-northeast-1',
        'version' => 'latest',
    ]);

    $total = 0;
    $objects = $s3->listObjectsV2([
        'Bucket' => 'yomii-books',
        'Prefix' => "{$user_id}/",
    ]);

    foreach ($objects['Contents'] as $obj) {
        $total += $obj['Size'];
    }

    return $total; // bytes
}

function check_upload_allowed($user_id, $file_size) {
    $usage = get_storage_usage($user_id);
    $limit = get_plan_limit($user_id);
    return ($usage + $file_size) <= $limit;
}
```

### 4.4 CloudFront（CDN）配信

頻繁にアクセスされるページはCDN経由で高速配信する。

```
[ブラウザ] → [CloudFront] → [S3]
                  ↑
          キャッシュヒット時は
          S3にアクセスしない
```

**設定:**
- Origin: S3 バケット（OAI経由）
- TTL: 24時間（書籍データは変更されないため長め）
- 署名付きCookie または 署名付きURL で認証

---

## 5. データベース設計

ユーザー・サブスクリプション管理用のDB。

```sql
-- ユーザーテーブル
CREATE TABLE users (
    id              VARCHAR(36) PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    name            VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- サブスクリプションテーブル
CREATE TABLE subscriptions (
    id                  VARCHAR(36) PRIMARY KEY,
    user_id             VARCHAR(36) REFERENCES users(id),
    stripe_subscription_id VARCHAR(255),
    plan                VARCHAR(20) NOT NULL,  -- 'basic', 'standard', 'premium'
    status              VARCHAR(20) NOT NULL,  -- 'active', 'past_due', 'canceled'
    storage_limit_bytes BIGINT NOT NULL,
    current_period_start TIMESTAMP,
    current_period_end   TIMESTAMP,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 書籍メタデータテーブル
CREATE TABLE books (
    id          VARCHAR(36) PRIMARY KEY,
    user_id     VARCHAR(36) REFERENCES users(id),
    name        VARCHAR(255) NOT NULL,
    page_count  INT,
    direction   VARCHAR(10) DEFAULT 'right',
    size_bytes  BIGINT,
    s3_prefix   VARCHAR(512),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP
);
```

---

## 6. コスト試算

### AWS コスト（月額）

| 項目 | 単価 | 100ユーザー想定 | 1,000ユーザー想定 |
|------|------|----------------|-----------------|
| S3 ストレージ | $0.025/GB/月 | $25（1TB） | $250（10TB） |
| S3 リクエスト | $0.0004/1000 GET | $2 | $20 |
| CloudFront 転送 | $0.114/GB（日本） | $11（100GB） | $114（1TB） |
| データ転送（S3→CF） | $0.09/GB | 含む | 含む |
| **合計** | | **〜$38/月** | **〜$384/月** |

### Stripe 手数料

| 項目 | 料率 |
|------|------|
| 決済手数料 | 3.6% |
| サブスクリプション追加料金 | なし（Billing に含む） |

### 損益分岐点

| ユーザー数 | 月額収入（平均¥500/人） | AWSコスト | Stripe手数料 | 利益 |
|-----------|----------------------|----------|-------------|------|
| 50人 | ¥25,000 | ¥3,000 | ¥900 | ¥21,100 |
| 100人 | ¥50,000 | ¥5,700 | ¥1,800 | ¥42,500 |
| 500人 | ¥250,000 | ¥20,000 | ¥9,000 | ¥221,000 |
| 1,000人 | ¥500,000 | ¥57,000 | ¥18,000 | ¥425,000 |

※ 為替 $1 = ¥150 で計算

---

## 7. セキュリティ考慮事項

### 7.1 データ分離

- S3 のキーにユーザーIDをプレフィックスとして含め、他ユーザーのデータにアクセスできない構造にする
- IAM ポリシーでバケットレベルのアクセス制御
- 署名付きURLの有効期限を短く設定（15分）

### 7.2 Stripe のセキュリティ

- Webhook の署名検証を必ず行う
- シークレットキーは環境変数で管理（コードにハードコードしない）
- Checkout Session を使い、カード情報をサーバーで扱わない（PCI DSS 対応不要）

### 7.3 著作権対策（legal-risk.md 参照）

- ユーザーごとにデータを暗号化して保存
- 共有機能は提供しない
- 利用規約で私的使用に限定
- DMCA対応フローを整備

---

## 8. 実装ロードマップ

| フェーズ | 内容 | 期間目安 |
|---------|------|---------|
| Phase 1 | ユーザー認証（Google OAuth） | 1〜2週間 |
| Phase 2 | Stripe 連携（Checkout + Webhook） | 1〜2週間 |
| Phase 3 | S3 アップロード / ダウンロード API | 2〜3週間 |
| Phase 4 | 本棚UI（サーバー書籍一覧） | 1〜2週間 |
| Phase 5 | 容量管理 / プラン変更UI | 1週間 |
| Phase 6 | CloudFront 配信最適化 | 1週間 |
| Phase 7 | テスト / ベータリリース | 2週間 |

---

## 9. 将来の拡張案

| 機能 | 説明 |
|------|------|
| ファミリープラン | 家族間で本棚を共有（著作権法の「家庭内」に該当） |
| 従量課金オプション | 基本料金 + 超過分を従量課金 |
| 年間一括アップロード | 大量の自炊データを一括変換・保存するバッチプラン |
| API提供 | サードパーティアプリからのアクセス（開発者向け） |
| Electron アプリ連携 | デスクトップアプリからの直接アップロード |
