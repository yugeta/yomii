# 書籍ストレージ戦略の検討

```
Created : 2026.04.30
```

## 課題

- 1冊分のデータをメモリに保持するのは問題ない
- ユーザーが複数の書籍を「置いておく」場合、どこに保存するかが問題
- スマホではローカルファイル操作が不便（ファイルアプリを経由する必要がある、ダウンロードフォルダが散らかる等）
- サーバーストレージは運用コストがかかる

## 前提条件

- スマホ（iOS Safari / Android Chrome）での利用を想定
- ユーザーが「本棚」として複数冊を管理したい
- できるだけサーバーコストを抑えたい
- オフラインでも読めると理想的

---

## 案1: ブラウザ内ストレージ（IndexedDB）

ブラウザの IndexedDB に書籍データを保存する。

### 仕組み

```
[アップロード/変換] → [IndexedDB に保存] → [本棚UIから選択して読む]
```

### メリット

- サーバー不要（変換後はクライアント完結）
- オフライン対応が自然にできる
- ユーザーがファイル管理を意識しなくてよい
- PWA化すればアプリのような体験になる

### デメリット

- ブラウザのストレージ上限がある（通常: 利用可能ディスクの50%程度、Safari: 1GBまで）
- ブラウザのデータ削除で消える（「ストレージを消去」操作）
- Safari の ITP により、7日間アクセスがないと削除される可能性がある（PWA化で回避可能）
- デバイス間の同期ができない

### 容量目安

| 書籍タイプ | 1冊あたり | 100冊 |
|-----------|----------|-------|
| 漫画（200p, WebP） | 20〜50MB | 2〜5GB |
| 小説スキャン（300p, WebP） | 30〜60MB | 3〜6GB |
| 技術書（500p, WebP） | 50〜100MB | 5〜10GB |

### 実装イメージ

```javascript
// 書籍の保存
const db = await openDB('yomii-books', 1)
await db.put('books', {
  id: 'book-uuid',
  name: '書籍名',
  cover: coverBlob,       // 表紙サムネイル
  meta: { pages: 200, direction: 'right' },
  pages: [blob1, blob2, ...],  // ページごとのBlob
  lastRead: { page: 42, date: Date.now() }
})

// 本棚表示（メタデータのみ読み込み）
const books = await db.getAllKeys('books')

// 読書時（1ページずつ読み込み）
const page = await db.get('pages', { bookId, pageNum })
```

### 補足

- ページデータを別ストアに分離すれば、本棚表示時に全データを読まなくて済む
- `navigator.storage.persist()` で永続化を要求できる（ユーザー許可が必要）

---

## 案2: Cache API + Service Worker

Service Worker の Cache API を使って書籍データをキャッシュする。

### 仕組み

```
[サーバーから取得] → [Cache API に保存] → [次回以降はキャッシュから読む]
```

### メリット

- PWAとの相性が良い
- URLベースなので、サーバーとの連携が自然
- オフライン対応が標準的なパターンで実現できる

### デメリット

- サーバーに一度はデータを置く必要がある（初回取得時）
- キャッシュの管理が複雑になりがち
- ストレージ上限は IndexedDB と共有

### 向いているケース

- サーバーに書籍を置く運用（案5, 6と組み合わせ）
- 「一度読んだ本はオフラインでも読める」というキャッシュ戦略

---

## 案3: Origin Private File System（OPFS）

ブラウザの新しいファイルシステムAPI。IndexedDB より高速で大容量向き。

### 仕組み

```
[アップロード/変換] → [OPFS に保存] → [本棚UIから選択して読む]
```

### メリット

- IndexedDB より高速（特に大きなバイナリデータ）
- ファイルシステムのような構造で管理できる
- ストリーミング読み込みが可能（メモリ効率が良い）
- ユーザーからは見えない（ブラウザ内部のサンドボックス）

### デメリット

- 比較的新しいAPI（2023〜）、古いブラウザでは使えない
- Safari のサポートが限定的（iOS 15.2+で基本対応、Worker内のみの制約あり）
- デバイス間同期ができない

### ブラウザ対応状況（2026年時点）

| ブラウザ | 対応 |
|---------|------|
| Chrome / Edge | ✅ 完全対応 |
| Firefox | ✅ 完全対応 |
| Safari (iOS/macOS) | ⚠️ 基本対応（一部制約あり） |

### 実装イメージ

```javascript
// ディレクトリ構造で管理
const root = await navigator.storage.getDirectory()
const booksDir = await root.getDirectoryHandle('books', { create: true })
const bookDir = await booksDir.getDirectoryHandle('book-uuid', { create: true })

// ページ保存
const pageFile = await bookDir.getFileHandle('page-001.webp', { create: true })
const writable = await pageFile.createWritable()
await writable.write(pageBlob)
await writable.close()

// ページ読み込み（必要な時だけ）
const file = await pageFile.getFile()
const url = URL.createObjectURL(file)
```

---

## 案4: PWA + ホーム画面追加

案1〜3と組み合わせて、PWA（Progressive Web App）としてホーム画面に追加してもらう。

### メリット

- アプリのような体験（フルスクリーン、アイコン）
- ストレージの永続化が保証されやすい（Safari の ITP 回避）
- プッシュ通知等の拡張も可能
- App Store 不要で配布できる

### 実装に必要なもの

- `manifest.json`（アプリ名、アイコン、テーマカラー）
- Service Worker（オフライン対応、キャッシュ戦略）
- HTTPS（必須）

### 補足

- iOS Safari では PWA のストレージ上限が緩和される
- 「ホーム画面に追加」の導線をUIに組み込むと良い

---

## 案5: 外部クラウドストレージ連携

ユーザー自身のクラウドストレージに書籍データを保存する。

### 候補サービス

| サービス | API | 無料容量 | 特徴 |
|---------|-----|---------|------|
| Google Drive | Google Drive API | 15GB | 最大の無料枠、普及率高い |
| pCloud | pCloud API | 2〜10GB | ライフタイムプラン（買い切り）あり |
| Dropbox | Dropbox API | 2GB | 無料枠が小さい |
| OneDrive | Microsoft Graph API | 5GB | Windows連携 |
| iCloud | なし（Web非対応） | 5GB | API非公開、Web連携不可 |

### 仕組み

```
[変換済みデータ] → [ユーザーのクラウドに保存] → [読書時にダウンロード] → [ブラウザキャッシュ]
```

### メリット

- サーバーのストレージコストがゼロ
- ユーザーが自分のデータを管理できる
- デバイス間同期が自然にできる（同じアカウントでログイン）
- 大容量（Google Drive 15GB = 漫画300冊程度）

### デメリット

- OAuth認証の実装が必要
- API の利用制限（レートリミット）がある
- サービスごとにAPI実装が必要
- ユーザーにログインを求める必要がある

### 推奨: Google Drive + pCloud

**Google Drive:**
- 無料容量が最大（15GB）
- Google OAuth は README に記載済み（実装予定あり）
- JavaScript SDK が充実している
- スマホでも Google アカウントは普及している

**pCloud:**
- 公式 JavaScript SDK（[pcloud-sdk-js](https://github.com/pCloud/pcloud-sdk-js)）がブラウザ対応
- OAuth 2.0 認証対応
- ライフタイムプラン（買い切り）があり、ユーザーが大容量を安価に確保できる
  - 500GB: $199（一度きり）、2TB: $399（一度きり）
- アップロード/ダウンロード速度制限なし
- スイス拠点でプライバシー重視
- REST API（HTTP/JSON）で実装しやすい
- データセンターが米国/欧州の2拠点（ユーザー登録地域で自動振り分け）

**使い分けの方針:**
- 無料で手軽に始めたいユーザー → Google Drive（15GB）
- 大容量を買い切りで確保したいユーザー → pCloud（ライフタイムプラン）
- 両方を選択肢として提供し、ユーザーに選ばせる

### 実装イメージ（Google Drive）

```javascript
// Google Drive に保存
const metadata = {
  name: 'book-name.yomii',
  parents: ['yomii-folder-id']
}
const form = new FormData()
form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
form.append('file', yomiiBlob)

await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: form
})
```

### 実装イメージ（pCloud）

```javascript
import pcloudSdk from 'pcloud-sdk-js'

// OAuth トークンでクライアント作成
const client = pcloudSdk.createClient(accessToken)

// Yomii用フォルダ作成（初回のみ）
const folder = await client.createfolder('Yomii', 0)

// 書籍データのアップロード
client.upload(yomiiFile, folder.folderid, {
  onProgress: (progress) => {
    Loading.set_rate(progress.loaded / progress.total * 100)
  },
  onFinish: (fileMetadata) => {
    console.log('uploaded:', fileMetadata)
  }
})

// 書籍一覧の取得
const contents = await client.listfolder(folder.folderid)

// ファイルのダウンロード
const link = await client.getfilelink(fileId)
// link.hosts[0] + link.path でダウンロードURL取得
```

---

## 案6: 自前サーバーストレージ（有料プラン）

README に記載のある「ストレージレンタル機能（有料）」。

### 仕組み

```
[アップロード] → [サーバーで変換・保存] → [ページ単位でAPI配信] → [ブラウザで表示]
```

### メリット

- ユーザー体験が最もシンプル（アップロードするだけ）
- デバイス間同期が完全
- ページ単位配信でメモリ効率が良い
- バックアップもサーバー側で管理

### デメリット

- サーバーのストレージコスト・帯域コストが発生
- ユーザー認証が必須
- サーバーダウン時に読めなくなる
- 運用・保守コスト

### コスト試算

| 項目 | 単価 | 100ユーザー × 50冊 |
|------|------|-------------------|
| ストレージ（S3等） | $0.023/GB/月 | 〜$23/月（1TB想定） |
| 転送量 | $0.09/GB | 利用量次第 |
| サーバー | $5〜20/月 | VPS |

---

## 案7: ハイブリッド方式（推奨）

複数の方式を組み合わせて、ユーザーの状況に応じて選択できるようにする。

### 構成

```
┌─────────────────────────────────────────────┐
│  本棚UI                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ローカル  │ │クラウド  │ │サーバー  │       │
│  │(IndexedDB│ │(Google  │ │(有料)   │       │
│  │ /OPFS)  │ │ Drive)  │ │         │       │
│  └────┬────┘ └────┬────┘ └────┬────┘       │
│       └───────────┼───────────┘             │
│                   ▼                          │
│          統一された本棚インターフェース         │
└─────────────────────────────────────────────┘
```

### 段階的な実装ロードマップ

| フェーズ | 実装内容 | 効果 |
|---------|---------|------|
| Phase 1 | IndexedDB + PWA | サーバー不要で本棚機能が使える |
| Phase 2 | Google Drive / pCloud 連携 | デバイス間同期、大容量対応 |
| Phase 3 | OPFS 対応 | 大きな書籍のパフォーマンス改善 |
| Phase 4 | サーバーストレージ（有料） | プレミアム機能として提供 |

### Phase 1 の具体的な設計

```javascript
// 本棚のデータ構造（IndexedDB）
const bookshelfSchema = {
  books: {           // 書籍メタデータ
    id: 'string',
    name: 'string',
    cover: 'Blob',          // 表紙サムネイル（小さい画像）
    pageCount: 'number',
    direction: 'string',
    size: 'number',         // 総バイト数
    addedAt: 'number',
    lastReadAt: 'number',
    lastReadPage: 'number',
    source: 'string',       // 'local' | 'google-drive' | 'server'
  },
  pages: {           // ページデータ（別ストア）
    bookId: 'string',
    pageNum: 'number',
    blob: 'Blob',           // WebP画像
  }
}
```

**ポイント:**
- メタデータとページデータを分離する（本棚表示時に全画像を読まない）
- 表紙サムネイルだけ `books` ストアに持つ
- 読書時は必要なページだけ `pages` ストアから取得する

---

## 比較まとめ

| 方式 | サーバーコスト | オフライン | デバイス同期 | 容量 | 実装難度 |
|------|-------------|-----------|------------|------|---------|
| IndexedDB | なし | ✅ | ❌ | 〜数GB | 低 |
| OPFS | なし | ✅ | ❌ | 〜数GB | 中 |
| Cache API | なし〜低 | ✅ | ❌ | 〜数GB | 中 |
| Google Drive | なし | △（キャッシュ併用） | ✅ | 15GB | 中〜高 |
| pCloud | なし | △（キャッシュ併用） | ✅ | 2〜10GB（無料）/ 500GB〜（買い切り） | 中〜高 |
| サーバー（有料） | 高 | ❌ | ✅ | 無制限 | 高 |
| ハイブリッド | 低〜中 | ✅ | ✅ | 柔軟 | 高 |

---

## 結論・推奨

**スマホユーザーの利便性を最優先するなら:**

1. **まず IndexedDB + PWA**（Phase 1）を実装する
   - サーバーコストゼロ
   - 「ホーム画面に追加」でアプリ感覚
   - 本棚UIで直感的に管理
   - 数十冊程度なら十分

2. **次に Google Drive / pCloud 連携**（Phase 2）を追加する
   - デバイス間同期の実現
   - 容量の拡張
   - Google OAuth は元々実装予定
   - pCloud はライフタイムプラン（買い切り）でヘビーユーザーに最適
   - 両方を選択肢として提供し、ユーザーに選ばせる

この2段階で、ほとんどのユーザーのニーズをカバーできる。サーバーストレージ（有料）は、ヘビーユーザー向けのプレミアム機能として後から追加する形が現実的。
