# 端末ストレージとWebストレージの同期戦略

```
Created : 2026.04.30
```

## 課題

- 端末（IndexedDB / OPFS）にキャッシュした書籍データと、Webストレージ（S3 / Google Drive / pCloud）のデータを同期したい
- オフラインで読んだ進捗をオンライン復帰時に反映したい
- 複数デバイス（スマホ、タブレット、PC）間で本棚の状態を一致させたい
- 通信量を最小限に抑えたい（モバイル回線を考慮）

---

## 1. 同期対象の分類

すべてのデータを同じように同期する必要はない。データの性質に応じて戦略を分ける。

| データ種別 | サイズ | 更新頻度 | 同期方針 |
|-----------|--------|---------|---------|
| 本棚メタデータ（書籍一覧） | 小（数KB） | 低（追加/削除時） | 即時同期 |
| 読書進捗（ページ番号等） | 極小（数十B/冊） | 高（ページめくり毎） | 遅延同期 |
| 書籍ページデータ（画像） | 大（数十MB/冊） | なし（不変） | オンデマンド同期 |
| 表紙サムネイル | 中（数十KB/冊） | なし（不変） | 優先同期 |
| 表示設定（方向等） | 極小 | 低 | 即時同期 |

---

## 2. 同期モデル

### 2.1 基本方針：差分同期 + オンデマンドダウンロード

```
┌─────────────────────────────────────────────────────────┐
│  端末A（スマホ）                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │メタデータ │  │読書進捗  │  │ページ画像│              │
│  │(常に同期) │  │(遅延同期)│  │(必要時DL)│              │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘              │
└────────┼──────────────┼──────────────┼──────────────────┘
         │              │              │
    ┌────▼──────────────▼──────────────▼────┐
    │         Sync Server / API              │
    │    (メタデータ + 進捗の中継)            │
    └────┬──────────────┬──────────────┬────┘
         │              │              │
┌────────┼──────────────┼──────────────┼──────────────────┐
│  端末B（タブレット）   │              │                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │メタデータ │  │読書進捗  │  │ページ画像│              │
│  │(常に同期) │  │(遅延同期)│  │(必要時DL)│              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

**ポイント:**
- メタデータと進捗は軽量なので積極的に同期する
- ページ画像（重い）は必要になるまでダウンロードしない
- 一度ダウンロードしたページは端末にキャッシュして再ダウンロードしない

---

## 3. 同期メカニズム

### 3.1 メタデータ同期（本棚の状態）

**方式: バージョンベクトル + マージ**

各端末が本棚の変更履歴を持ち、サーバーでマージする。

```javascript
// 本棚メタデータの構造
const shelfManifest = {
    version: 42,                    // グローバルバージョン番号
    lastModified: 1714400000000,    // 最終更新タイムスタンプ
    books: [
        {
            id: "book-uuid-1",
            name: "書籍名",
            pageCount: 200,
            direction: "right",
            sizeBytes: 45000000,
            cover: "cover-hash.webp",
            addedAt: 1714300000000,
            deleted: false,         // 論理削除フラグ
        }
    ]
}
```

**同期フロー:**

```
1. アプリ起動時 / オンライン復帰時
       │
2. ローカルの version をサーバーに送信
       │
3. サーバーが差分を返す（version 以降の変更リスト）
       │
4. ローカルに差分を適用
       │
5. ローカルで発生した未送信の変更をサーバーに送信
       │
6. サーバーが version を更新
```

```javascript
// 同期API
async function syncShelf() {
    const local = await getLocalManifest()

    // サーバーから差分取得
    const res = await fetch('/api/sync/shelf', {
        method: 'POST',
        body: JSON.stringify({
            version: local.version,
            changes: local.pendingChanges  // ローカルの未送信変更
        })
    })
    const { serverVersion, remoteChanges } = await res.json()

    // リモートの変更をローカルに適用
    await applyRemoteChanges(remoteChanges)

    // バージョン更新
    await updateLocalVersion(serverVersion)

    // 送信済みの変更をクリア
    await clearPendingChanges()
}
```

### 3.2 読書進捗の同期

**方式: Last-Write-Wins（最終書き込み優先）**

読書進捗は「最後に読んだデバイスの状態が正」というシンプルなルールで十分。

```javascript
// 進捗データ
const readingProgress = {
    bookId: "book-uuid-1",
    page: 42,
    group: 21,
    timestamp: 1714400000000,  // 更新時刻（競合解決に使用）
    deviceId: "device-abc"     // どのデバイスで更新したか
}
```

**同期タイミング:**
- ページめくり毎にローカル保存（即時）
- サーバーへの送信はデバウンス（5秒間操作がなかったら送信）
- アプリ起動時にサーバーから最新を取得
- バックグラウンド同期（Service Worker で定期実行）

```javascript
// デバウンス付き進捗同期
let syncTimer = null

function onPageTurn(bookId, pageNum, groupNum) {
    // ローカルに即時保存
    saveLocalProgress(bookId, pageNum, groupNum)

    // サーバー同期はデバウンス
    clearTimeout(syncTimer)
    syncTimer = setTimeout(() => {
        syncProgressToServer(bookId, pageNum, groupNum)
    }, 5000)
}

async function syncProgressToServer(bookId, pageNum, groupNum) {
    await fetch('/api/sync/progress', {
        method: 'POST',
        body: JSON.stringify({
            bookId,
            page: pageNum,
            group: groupNum,
            timestamp: Date.now(),
            deviceId: getDeviceId()
        })
    })
}
```

**競合解決:**

```javascript
// 起動時に進捗を同期
async function resolveProgress(bookId) {
    const local = await getLocalProgress(bookId)
    const remote = await fetchRemoteProgress(bookId)

    if (!remote) return local
    if (!local) return remote

    // タイムスタンプが新しい方を採用
    return local.timestamp > remote.timestamp ? local : remote
}
```

### 3.3 ページデータの同期（オンデマンド）

**方式: Lazy Download + LRU キャッシュ**

ページ画像は重いので、必要になった時だけダウンロードし、端末にキャッシュする。

```javascript
// ページ取得（キャッシュ優先）
async function getPage(bookId, pageNum) {
    // 1. ローカルキャッシュを確認
    const cached = await getFromIndexedDB(bookId, pageNum)
    if (cached) return cached

    // 2. なければサーバーからダウンロード
    const url = await getPresignedUrl(bookId, pageNum)
    const blob = await fetch(url).then(r => r.blob())

    // 3. ローカルにキャッシュ
    await saveToIndexedDB(bookId, pageNum, blob)

    // 4. キャッシュ容量管理（LRU）
    await evictIfNeeded()

    return blob
}
```

**先読み（Prefetch）:**

```javascript
// 現在ページの前後N枚を先読み
async function prefetchPages(bookId, currentPage, range = 3) {
    const tasks = []
    for (let i = 1; i <= range; i++) {
        tasks.push(getPage(bookId, currentPage + i))
        tasks.push(getPage(bookId, currentPage - i))
    }
    // バックグラウンドで並列ダウンロード（エラーは無視）
    await Promise.allSettled(tasks)
}
```

**LRU キャッシュ管理:**

```javascript
// 端末のキャッシュ容量を管理
const MAX_CACHE_SIZE = 500 * 1024 * 1024  // 500MB

async function evictIfNeeded() {
    const usage = await getCacheUsage()
    if (usage <= MAX_CACHE_SIZE) return

    // 最後にアクセスした日時が古い順に削除
    const books = await getAllCachedBooks()
    books.sort((a, b) => a.lastAccessedAt - b.lastAccessedAt)

    for (const book of books) {
        await deleteCachedPages(book.id)
        const newUsage = await getCacheUsage()
        if (newUsage <= MAX_CACHE_SIZE * 0.8) break  // 80%まで減らす
    }
}
```

---

## 4. オフライン対応

### 4.1 オフライン時の動作

| 操作 | オフライン時の挙動 |
|------|-------------------|
| キャッシュ済み書籍を読む | ✅ 通常通り動作 |
| ページめくり（進捗更新） | ✅ ローカルに保存、オンライン復帰時に同期 |
| 未キャッシュのページを開く | ❌ 「オフラインです」表示 |
| 新しい書籍を追加 | ⚠️ ローカルのみに追加、オンライン復帰時にアップロード |
| 書籍を削除 | ⚠️ ローカルで論理削除、オンライン復帰時に同期 |

### 4.2 オフラインキュー

オフライン中の操作をキューに溜めて、オンライン復帰時にまとめて実行する。

```javascript
// オフラインキュー
const syncQueue = {
    async enqueue(action) {
        const queue = await getQueue()
        queue.push({
            ...action,
            timestamp: Date.now(),
            retryCount: 0
        })
        await saveQueue(queue)
    },

    async flush() {
        const queue = await getQueue()
        const failed = []

        for (const action of queue) {
            try {
                await executeAction(action)
            } catch (e) {
                if (action.retryCount < 3) {
                    action.retryCount++
                    failed.push(action)
                }
            }
        }

        await saveQueue(failed)
    }
}

// オンライン復帰を検知
window.addEventListener('online', () => {
    syncQueue.flush()
    syncShelf()
})
```

### 4.3 Service Worker によるバックグラウンド同期

```javascript
// service-worker.js
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-progress') {
        event.waitUntil(syncAllProgress())
    }
    if (event.tag === 'sync-shelf') {
        event.waitUntil(syncShelf())
    }
})

// メインスレッドから同期を登録
async function requestBackgroundSync() {
    const registration = await navigator.serviceWorker.ready
    await registration.sync.register('sync-progress')
}
```

---

## 5. 「お気に入り書籍のオフライン保存」機能

ユーザーが明示的に「この本をオフラインで読めるようにする」を選択できる機能。

```
┌─────────────────────────────────────┐
│  本棚                                │
│  ┌─────┐  ┌─────┐  ┌─────┐         │
│  │ 📖  │  │ 📖  │  │ 📖  │         │
│  │Book1│  │Book2│  │Book3│         │
│  │ ☁️  │  │ 📱  │  │ ☁️  │         │
│  └─────┘  └─────┘  └─────┘         │
│                                      │
│  ☁️ = クラウドのみ（オンライン必要）  │
│  📱 = 端末に保存済み（オフライン可）  │
└─────────────────────────────────────┘
```

```javascript
// 書籍を端末にダウンロード
async function downloadBookForOffline(bookId) {
    const meta = await fetchBookMeta(bookId)
    Loading.set_status('active')

    for (let i = 0; i < meta.pageCount; i++) {
        Loading.set_rate((i + 1) / meta.pageCount * 100)
        await getPage(bookId, i)  // キャッシュに保存される
    }

    // オフライン保存済みフラグを立てる
    await markAsOfflineAvailable(bookId)
    Loading.set_status('passive')
}

// 端末から削除（クラウドには残る）
async function removeOfflineBook(bookId) {
    await deleteCachedPages(bookId)
    await unmarkOfflineAvailable(bookId)
}
```

---

## 6. 同期状態の可視化

ユーザーに同期状態を分かりやすく伝えるUI。

```
┌─────────────────────────────────────┐
│  ヘッダー                    🔄 同期中 │
│                              ✅ 同期済 │
│                              ⚠️ 未同期 │
└─────────────────────────────────────┘
```

| 状態 | アイコン | 意味 |
|------|---------|------|
| synced | ✅ | すべて同期済み |
| syncing | 🔄 | 同期処理中 |
| pending | ⚠️ | 未送信の変更あり（オフライン中等） |
| error | ❌ | 同期エラー（リトライ中） |
| offline | 📴 | オフライン状態 |

---

## 7. 競合解決ポリシー

複数デバイスで同時に操作した場合の競合解決ルール。

| データ | 競合解決方式 | 理由 |
|--------|------------|------|
| 読書進捗 | Last-Write-Wins（タイムスタンプ） | 最後に読んだ位置が正しい |
| 本棚（追加） | Union（両方採用） | 追加は競合しない |
| 本棚（削除） | Delete-Wins | 削除の意図を優先 |
| 表示設定 | Last-Write-Wins | 最後の設定が正しい |

**注意:** 書籍のページデータ自体は不変（immutable）なので競合しない。競合が起きるのはメタデータと進捗のみ。

---

## 8. API設計

```
# メタデータ同期
POST /api/sync/shelf
  Request:  { version, changes[] }
  Response: { serverVersion, remoteChanges[] }

# 読書進捗同期
POST /api/sync/progress
  Request:  { bookId, page, group, timestamp, deviceId }
  Response: { status: "ok" }

GET /api/sync/progress/:bookId
  Response: { page, group, timestamp, deviceId }

# 一括進捗同期（複数冊まとめて）
POST /api/sync/progress/batch
  Request:  { items: [{ bookId, page, group, timestamp }] }
  Response: { results: [{ bookId, resolved: { page, group } }] }

# 同期状態確認
GET /api/sync/status
  Response: { lastSyncAt, pendingCount, storageUsage }
```

---

## 9. 実装の優先順位

| 優先度 | 機能 | 理由 |
|--------|------|------|
| 1 | 読書進捗の同期 | 最も頻繁に使う。データが小さく実装も軽い |
| 2 | 本棚メタデータの同期 | 複数デバイスで本棚を共有するための基盤 |
| 3 | オンデマンドページダウンロード + キャッシュ | 通信量の最適化 |
| 4 | オフラインキュー | オフライン時の操作を保証 |
| 5 | お気に入り書籍のオフライン保存 | UX向上（明示的なダウンロード） |
| 6 | Service Worker バックグラウンド同期 | バッテリー効率の良い同期 |

---

## 10. まとめ

**設計原則:**

1. **メタデータは軽いので積極的に同期する** — 本棚の状態と読書進捗は常に最新に保つ
2. **ページ画像は重いのでオンデマンドで取得する** — 必要な時だけダウンロードし、キャッシュする
3. **オフラインファーストで設計する** — ネットワークがなくても基本操作ができる
4. **競合はシンプルに解決する** — Last-Write-Wins で十分。複雑なマージは不要
5. **ユーザーに同期状態を見せる** — 安心感を与える

この設計により、「スマホで途中まで読んで、タブレットで続きを読む」「電車の中（オフライン）でも読める」という体験が実現できる。
