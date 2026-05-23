/**
 * SourceRegistry - 追加された本棚ソースの管理
 * 
 * localStorage に保存されたソース一覧の CRUD 操作を提供する。
 * ローカルフォルダのハンドルは IndexedDB に保存する。
 */
export class SourceRegistry {

  static STORAGE_KEY = "yomii_shelf_sources"
  static DB_NAME = "yomii_handles"
  static DB_VERSION = 1

  // ============================================================
  // ソース一覧の CRUD
  // ============================================================

  /**
   * 登録済みソース一覧を取得（追加日時の昇順）
   */
  static list() {
    try {
      const raw = localStorage.getItem(SourceRegistry.STORAGE_KEY)
      if (!raw) return []
      const sources = JSON.parse(raw)
      return sources.sort((a, b) => new Date(a.added_at) - new Date(b.added_at))
    } catch (e) {
      console.error("[SourceRegistry] list error:", e)
      return []
    }
  }

  /**
   * ソースを追加
   */
  static add(source) {
    const sources = SourceRegistry.list()
    const entry = {
      id: SourceRegistry.generate_id(),
      type: source.type,
      name: source.name,
      added_at: new Date().toISOString(),
      ...source.connection,
    }
    sources.push(entry)
    SourceRegistry.save(sources)
    return entry
  }

  /**
   * ソースを削除
   */
  static remove(id) {
    const sources = SourceRegistry.list()
    const filtered = sources.filter(s => s.id !== id)
    SourceRegistry.save(filtered)
  }

  /**
   * ソースを更新
   */
  static update(id, updates) {
    const sources = SourceRegistry.list()
    const index = sources.findIndex(s => s.id === id)
    if (index === -1) return null
    sources[index] = { ...sources[index], ...updates }
    SourceRegistry.save(sources)
    return sources[index]
  }

  /**
   * IDでソースを取得
   */
  static get(id) {
    const sources = SourceRegistry.list()
    return sources.find(s => s.id === id) || null
  }

  /**
   * pCloudコードで重複チェック
   */
  static has_pcloud_code(code) {
    const sources = SourceRegistry.list()
    return sources.some(s => s.type === "pcloud_share" && s.code === code)
  }

  /**
   * ローカルフォルダのハンドルキーで重複チェック
   */
  static has_handle_key(handle_key) {
    const sources = SourceRegistry.list()
    return sources.some(s => s.type === "local_folder" && s.handle_key === handle_key)
  }

  // ============================================================
  // IndexedDB ハンドル管理（ローカルフォルダ用）
  // ============================================================

  /**
   * フォルダハンドルを IndexedDB に保存
   */
  static async save_handle(key, handle) {
    const db = await SourceRegistry.open_db()
    return new Promise((resolve, reject) => {
      const tx = db.transaction("handles", "readwrite")
      tx.objectStore("handles").put({ id: key, handle: handle })
      tx.oncomplete = () => resolve()
      tx.onerror = (e) => reject(e.target.error)
    })
  }

  /**
   * フォルダハンドルを IndexedDB から取得
   */
  static async get_handle(key) {
    try {
      const db = await SourceRegistry.open_db()
      return new Promise((resolve) => {
        const tx = db.transaction("handles", "readonly")
        const request = tx.objectStore("handles").get(key)
        request.onsuccess = () => resolve(request.result?.handle || null)
        request.onerror = () => resolve(null)
      })
    } catch (e) {
      return null
    }
  }

  /**
   * フォルダハンドルを IndexedDB から削除
   */
  static async remove_handle(key) {
    try {
      const db = await SourceRegistry.open_db()
      return new Promise((resolve) => {
        const tx = db.transaction("handles", "readwrite")
        tx.objectStore("handles").delete(key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      })
    } catch (e) {
      // ignore
    }
  }

  /**
   * IndexedDB を開く
   */
  static open_db() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(SourceRegistry.DB_NAME, SourceRegistry.DB_VERSION)
      request.onupgradeneeded = (e) => {
        const db = e.target.result
        if (!db.objectStoreNames.contains("handles")) {
          db.createObjectStore("handles", { keyPath: "id" })
        }
      }
      request.onsuccess = (e) => resolve(e.target.result)
      request.onerror = (e) => reject(e.target.error)
    })
  }

  // ============================================================
  // ユーティリティ
  // ============================================================

  static save(sources) {
    localStorage.setItem(SourceRegistry.STORAGE_KEY, JSON.stringify(sources))
  }

  static generate_id() {
    return crypto.randomUUID ? crypto.randomUUID() : SourceRegistry.fallback_uuid()
  }

  static fallback_uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}
