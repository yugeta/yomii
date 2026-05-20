/**
 * BookCache
 * IndexedDB を使った書籍データのローカルキャッシュ
 * 
 * - pCloud からダウンロードした .yomii ファイルを IndexedDB に保存
 * - 次回以降はキャッシュから即座に読み込み
 * - LRU（最終閲覧日時順）で古いキャッシュを自動削除
 */
export class BookCache{

  static DB_NAME    = "yomii_book_cache"
  static DB_VERSION = 1
  static STORE_META = "meta"
  static STORE_DATA = "data"
  static MAX_CACHE_SIZE = 2 * 1024 * 1024 * 1024  // 2GB デフォルト

  static _db = null

  // ============================================================
  // DB 初期化
  // ============================================================

  /**
   * IndexedDB を開く
   */
  static open(){
    if(BookCache._db) return Promise.resolve(BookCache._db)

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(BookCache.DB_NAME, BookCache.DB_VERSION)

      request.onupgradeneeded = (e) => {
        const db = e.target.result

        // メタデータストア（書籍情報）
        if(!db.objectStoreNames.contains(BookCache.STORE_META)){
          const meta_store = db.createObjectStore(BookCache.STORE_META, { keyPath: "id" })
          meta_store.createIndex("last_read", "last_read", { unique: false })
          meta_store.createIndex("source_path", "source_path", { unique: false })
        }

        // データストア（Blob）
        if(!db.objectStoreNames.contains(BookCache.STORE_DATA)){
          db.createObjectStore(BookCache.STORE_DATA, { keyPath: "id" })
        }
      }

      request.onsuccess = (e) => {
        BookCache._db = e.target.result
        resolve(BookCache._db)
      }

      request.onerror = (e) => {
        reject(new Error("IndexedDB を開けませんでした: " + e.target.error))
      }
    })
  }

  // ============================================================
  // キャッシュ操作
  // ============================================================

  /**
   * キャッシュに書籍があるか確認
   * @param {string} source_path - pCloud 上のパス（例: /yomii/book.yomii）
   * @returns {object|null} メタデータ or null
   */
  static async get_meta(source_path){
    const db = await BookCache.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BookCache.STORE_META, "readonly")
      const store = tx.objectStore(BookCache.STORE_META)
      const index = store.index("source_path")
      const request = index.get(source_path)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => resolve(null)
    })
  }

  /**
   * キャッシュから書籍データ（Blob）を取得
   * @param {string} id - キャッシュ ID
   * @returns {Blob|null}
   */
  static async get_data(id){
    const db = await BookCache.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BookCache.STORE_DATA, "readonly")
      const store = tx.objectStore(BookCache.STORE_DATA)
      const request = store.get(id)
      request.onsuccess = () => {
        const result = request.result
        if(!result || !result.blob){
          resolve(null)
          return
        }
        // Blob の整合性チェック
        const blob = result.blob
        if(!(blob instanceof Blob) || blob.size === 0){
          resolve(null)
          return
        }
        resolve(blob)
      }
      request.onerror = () => resolve(null)
    })
  }

  /**
   * 書籍データをキャッシュに保存
   * @param {string} source_path - pCloud 上のパス
   * @param {string} name - 書籍名
   * @param {Blob} blob - .yomii ファイルの Blob
   * @param {string} source - ソース種別（"pcloud", "local" 等）
   */
  static async save(source_path, name, blob, source = "pcloud"){
    const db = await BookCache.open()
    const id = BookCache.generate_id(source_path)

    // 容量チェック & 古いキャッシュ削除
    await BookCache.ensure_space(blob.size)

    // メタデータ保存
    const meta = {
      id          : id,
      source_path : source_path,
      name        : name,
      size        : blob.size,
      source      : source,
      cached_at   : Date.now(),
      last_read   : Date.now(),
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction([BookCache.STORE_META, BookCache.STORE_DATA], "readwrite")
      
      tx.objectStore(BookCache.STORE_META).put(meta)
      tx.objectStore(BookCache.STORE_DATA).put({ id: id, blob: blob })

      tx.oncomplete = () => resolve(meta)
      tx.onerror = (e) => reject(new Error("キャッシュ保存に失敗: " + e.target.error))
    })
  }

  /**
   * 最終閲覧日時を更新
   */
  static async touch(source_path){
    const db = await BookCache.open()
    const meta = await BookCache.get_meta(source_path)
    if(!meta) return

    meta.last_read = Date.now()

    return new Promise((resolve) => {
      const tx = db.transaction(BookCache.STORE_META, "readwrite")
      tx.objectStore(BookCache.STORE_META).put(meta)
      tx.oncomplete = () => resolve()
    })
  }

  /**
   * キャッシュから書籍を削除
   */
  static async remove(id){
    const db = await BookCache.open()
    return new Promise((resolve) => {
      const tx = db.transaction([BookCache.STORE_META, BookCache.STORE_DATA], "readwrite")
      tx.objectStore(BookCache.STORE_META).delete(id)
      tx.objectStore(BookCache.STORE_DATA).delete(id)
      tx.oncomplete = () => resolve()
    })
  }

  /**
   * 全キャッシュを削除
   */
  static async clear(){
    const db = await BookCache.open()
    return new Promise((resolve) => {
      const tx = db.transaction([BookCache.STORE_META, BookCache.STORE_DATA], "readwrite")
      tx.objectStore(BookCache.STORE_META).clear()
      tx.objectStore(BookCache.STORE_DATA).clear()
      tx.oncomplete = () => resolve()
    })
  }

  /**
   * 全キャッシュのメタデータ一覧を取得
   */
  static async list(){
    const db = await BookCache.open()
    return new Promise((resolve) => {
      const tx = db.transaction(BookCache.STORE_META, "readonly")
      const store = tx.objectStore(BookCache.STORE_META)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => resolve([])
    })
  }

  /**
   * 現在のキャッシュ合計サイズを取得
   */
  static async get_total_size(){
    const all = await BookCache.list()
    return all.reduce((sum, item) => sum + (item.size || 0), 0)
  }

  // ============================================================
  // 容量管理
  // ============================================================

  /**
   * 指定サイズ分の空きを確保する（LRU で古いものから削除）
   */
  static async ensure_space(needed_size){
    let total = await BookCache.get_total_size()
    
    if(total + needed_size <= BookCache.MAX_CACHE_SIZE) return

    // LRU: last_read が古い順に削除
    const all = await BookCache.list()
    all.sort((a, b) => (a.last_read || 0) - (b.last_read || 0))

    for(const item of all){
      if(total + needed_size <= BookCache.MAX_CACHE_SIZE) break
      await BookCache.remove(item.id)
      total -= item.size || 0
    }
  }

  // ============================================================
  // ユーティリティ
  // ============================================================

  /**
   * source_path から一意の ID を生成
   * Base64 エンコードでパスをそのまま ID に変換（衝突なし）
   */
  static generate_id(source_path){
    return "cache_" + btoa(unescape(encodeURIComponent(source_path)))
  }

  /**
   * source_path から一意の ID を生成（旧方式 - マイグレーション用）
   */
  static generate_id_legacy(source_path){
    let hash = 0
    for(let i = 0; i < source_path.length; i++){
      const char = source_path.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return "cache_" + Math.abs(hash).toString(36)
  }

  /**
   * キャッシュから書籍を読み込み、なければ pCloud からダウンロードしてキャッシュ
   * @param {string} source_path - pCloud 上のパス
   * @param {string} name - 書籍名
   * @param {function} download_fn - ダウンロード関数（Blob を返す async 関数）
   * @returns {Blob}
   */
  static async get_or_download(source_path, name, download_fn){
    // キャッシュ確認
    const meta = await BookCache.get_meta(source_path)
    if(meta){
      const blob = await BookCache.get_data(meta.id)
      if(blob && blob.size > 0){
        // 最終閲覧日時を更新
        await BookCache.touch(source_path)
        console.log(`[BookCache] キャッシュから読み込み: ${name}`)
        return blob
      }
    }

    // 旧ID形式でも試す（マイグレーション対応）
    const legacy_id = BookCache.generate_id_legacy(source_path)
    const legacy_blob = await BookCache.get_data(legacy_id)
    if(legacy_blob && legacy_blob.size > 0){
      console.log(`[BookCache] 旧キャッシュから読み込み、新形式に移行: ${name}`)
      // 旧データを削除して新形式で保存し直す
      await BookCache.remove(legacy_id)
      await BookCache.save(source_path, name, legacy_blob)
      return legacy_blob
    }

    // キャッシュなし → ダウンロード
    console.log(`[BookCache] ダウンロード: ${name}`)
    const blob = await download_fn()

    // キャッシュに保存
    await BookCache.save(source_path, name, blob)
    
    return blob
  }
}
