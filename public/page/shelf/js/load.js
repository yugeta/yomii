import { PCloud } from "../../storage/js/pcloud.js"
import { BookCache } from "../../storage/js/book_cache.js"
import { Loading } from "../../../asset/js/loading/loading.js"

export class Load{
  constructor(options){
    this.options = options || {}
    this.source = this.options.source || "cache"

    // プログレス表示開始
    new Loading({ type: "plane" })
    Loading.set_status('active')
    Loading.set_rate(5)
    this.progress_value = 5
    this.start_progress_timer()

    switch(this.source){
      case "pcloud":
        this.load_pcloud()
        break
      case "cache":
        this.load_cache()
        break
      case "local":
        this.load_local()
        break
      case "sample":
        this.load_sample()
        break
      default:
        this.load_cache()
        break
    }
  }

  /**
   * 通信中にバーを少しずつ進めるタイマー
   * 90%を上限として徐々に減速しながら進む
   */
  start_progress_timer(){
    this.progress_timer = setInterval(() => {
      if(this.progress_value >= 90) return
      // 残りの距離の10%ずつ進む（減速）
      const remaining = 90 - this.progress_value
      this.progress_value += remaining * 0.08
      Loading.set_rate(this.progress_value)
    }, 100)
  }

  stop_progress_timer(){
    if(this.progress_timer){
      clearInterval(this.progress_timer)
      this.progress_timer = null
    }
  }

  // ============================================================
  // ローカル（File System Access API）
  // ============================================================
  async load_local(){
    // マイページで保存されたフォルダハンドルを取得
    const handle = await Load.get_local_folder_handle()

    if(!handle){
      this.datas = []
      this.finish()
      return
    }

    try{
      // 権限を再確認
      const permission = await handle.queryPermission({ mode: "read" })
      if(permission !== "granted"){
        const request = await handle.requestPermission({ mode: "read" })
        if(request !== "granted"){
          this.datas = []
          this.error_message = "フォルダへのアクセスが許可されていません。"
          this.finish()
          return
        }
      }

      const files = []
      for await(const entry of handle.values()){
        if(entry.kind === "file" && entry.name.endsWith(".yomii")){
          files.push({
            type : "file",
            name : entry.name,
            handle : entry,
          })
        }else if(entry.kind === "directory"){
          files.push({
            type : "dir",
            name : entry.name,
            handle : entry,
          })
        }
      }

      files.sort((a, b) => {
        if(a.type !== b.type) return a.type === "dir" ? -1 : 1
        return a.name.localeCompare(b.name)
      })

      this.datas = files
      this.finish()
    }catch(e){
      console.error("Local folder read error:", e)
      this.datas = []
      this.error_message = e.message
      this.finish()
    }
  }

  /**
   * IndexedDB に保存されたフォルダハンドルを取得
   */
  static async get_local_folder_handle(){
    try{
      const db = await Load.open_handle_db()
      return new Promise((resolve) => {
        const tx = db.transaction("handles", "readonly")
        const request = tx.objectStore("handles").get("local_folder")
        request.onsuccess = () => resolve(request.result?.handle || null)
        request.onerror = () => resolve(null)
      })
    }catch(e){
      return null
    }
  }

  /**
   * フォルダハンドルを IndexedDB に保存
   */
  static async save_local_folder_handle(handle){
    const db = await Load.open_handle_db()
    return new Promise((resolve) => {
      const tx = db.transaction("handles", "readwrite")
      tx.objectStore("handles").put({ id: "local_folder", handle: handle })
      tx.oncomplete = () => resolve()
    })
  }

  /**
   * フォルダハンドルを削除
   */
  static async remove_local_folder_handle(){
    const db = await Load.open_handle_db()
    return new Promise((resolve) => {
      const tx = db.transaction("handles", "readwrite")
      tx.objectStore("handles").delete("local_folder")
      tx.oncomplete = () => resolve()
    })
  }

  /**
   * ハンドル保存用の IndexedDB を開く
   */
  static open_handle_db(){
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("yomii_handles", 1)
      request.onupgradeneeded = (e) => {
        e.target.result.createObjectStore("handles", { keyPath: "id" })
      }
      request.onsuccess = (e) => resolve(e.target.result)
      request.onerror = (e) => reject(e.target.error)
    })
  }

  // ============================================================
  // サンプル（サーバーの data/shelf/）
  // ============================================================
  load_sample(){
    const query = {
      mode : 'lists',
      dir  : this.options.dir || '',
    }
    const xhr = new XMLHttpRequest()
    xhr.withCredentials = true
    xhr.open('POST' , 'page/shelf/php/main.php' , true)
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
    xhr.onload = this.loaded_sample.bind(this)
    xhr.onerror = () => {
      this.datas = []
      this.finish()
    }
    const query_string = Object.entries(query).map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`).join('&')
    xhr.send(query_string)
  }

  loaded_sample(e){
    if(!e || !e.target || !e.target.response){
      this.datas = []
      this.finish()
      return
    }
    try{
      const res = JSON.parse(e.target.response)
      this.datas = res.lists || []
    }catch(err){
      this.datas = []
    }
    this.finish()
  }

  // ============================================================
  // pCloud
  // ============================================================
  async load_pcloud(){
    if(!PCloud.is_authenticated()){
      this.datas = []
      this.error_message = "pCloud が連携されていません。マイページで設定してください。"
      this.finish()
      return
    }

    try{
      const params = new URLSearchParams(location.search)
      const raw_dir = params.get("dir") || ""
      const dir = raw_dir ? `/yomii/${raw_dir}/` : "/yomii/"
      
      const files = await PCloud.list_files_path(dir)
      
      this.datas = files
        .filter(file => {
          // 隠しファイル・隠しフォルダを除外
          if(file.name.startsWith('.')) return false
          // ディレクトリは表示
          if(file.is_folder) return true
          // ファイルは .yomii のみ表示
          return file.name.endsWith('.yomii')
        })
        .map(file => ({
          type : file.is_folder ? "dir" : "file",
          name : file.name,
          size : file.size,
          modified : file.modified,
        }))
      this.finish()
    }catch(e){
      console.error("pCloud list error:", e)
      this.datas = []
      this.error_message = e.message
      this.finish()
    }
  }

  // ============================================================
  // キャッシュ（IndexedDB）
  // ============================================================
  async load_cache(){
    try{
      const all = await BookCache.list()

      if(all.length === 0){
        this.datas = []
        this.finish()
        return
      }

      all.sort((a, b) => (b.last_read || 0) - (a.last_read || 0))

      this.datas = all.map(item => ({
        type     : "file",
        name     : item.name,
        size     : item.size,
        modified : item.last_read ? new Date(item.last_read).toLocaleString("ja-JP") : "",
        source_path : item.source_path,
        cache_id : item.id,
      }))
      this.finish()
    }catch(e){
      console.error("Cache list error:", e)
      this.datas = []
      this.error_message = e.message
      this.finish()
    }
  }

  // ============================================================
  finish(){
    this.stop_progress_timer()
    Loading.set_rate(100)

    // callback（View描画）を先に実行し、描画完了後にプログレスを消す
    if(this.options.callback){
      this.options.callback(this)
    }

    // 描画が反映された後にプログレスを非表示
    requestAnimationFrame(() => {
      Loading.set_status('passive')
    })
  }
}
