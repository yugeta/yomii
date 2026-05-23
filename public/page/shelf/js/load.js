import { PCloud } from "../../storage/js/pcloud.js"
import { PCloudShare } from "../../storage/js/pcloud_share.js"
import { BookCache } from "../../storage/js/book_cache.js"
import { Loading } from "../../../asset/js/loading/loading.js"
import { SourceRegistry } from "./source_registry.js"

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
      case "pcloud_share":
        this.load_pcloud_share()
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
        // 動的ソースの処理
        if(this.source.startsWith("dynamic_")){
          this.load_dynamic()
        }else{
          this.load_cache()
        }
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
  // pCloud 公開リンク共有
  // ============================================================
  async load_pcloud_share(){
    const params = new URLSearchParams(location.search)
    const code = params.get("code") || ""

    if(!code){
      this.datas = []
      this.error_message = "公開リンクコードが指定されていません。URLに code パラメータを追加してください。"
      this.finish()
      return
    }

    try{
      // サブフォルダナビゲーション: folderid が URL にあればそれを使う
      const folderid = params.get("folderid") || ""

      const result = await PCloudShare.list_files(code, folderid || undefined)
      
      this.datas = (result.files || [])
        .filter(file => {
          if(file.name.startsWith('.')) return false
          if(file.is_folder) return true
          return file.name.endsWith('.yomii')
        })
        .map(file => ({
          type     : file.is_folder ? "dir" : "file",
          name     : file.name,
          size     : file.size,
          modified : file.modified,
          fileid   : file.fileid,
          folderid : file.folderid,
        }))
      
      this.share_code = code
      this.finish()
    }catch(e){
      console.error("pCloud share list error:", e)
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
  // 動的ソース
  // ============================================================
  async load_dynamic(){
    const source_id = this.options.source_id || new URLSearchParams(location.search).get("source_id") || ""
    if(!source_id){
      this.datas = []
      this.error_message = "ソース情報が見つかりません。"
      this.finish()
      return
    }

    const source = SourceRegistry.get(source_id)
    if(!source){
      this.datas = []
      this.error_message = "登録されたソースが見つかりません。削除された可能性があります。"
      this.finish()
      return
    }

    switch(source.type){
      case "pcloud_share":
        await this.load_dynamic_pcloud_share(source)
        break
      case "local_folder":
        await this.load_dynamic_local_folder(source)
        break
      default:
        this.datas = []
        this.error_message = "未対応のソース種別です。"
        this.finish()
    }
  }

  /**
   * 動的 pCloud 公開リンクの読み込み
   */
  async load_dynamic_pcloud_share(source){
    const code = source.code
    if(!code){
      this.datas = []
      this.error_message = "pCloud リンクコードが見つかりません。"
      this.finish()
      return
    }

    try{
      // サブフォルダナビゲーション: folderid が URL にあればそれを使う
      const params = new URLSearchParams(location.search)
      const folderid = params.get("folderid") || ""

      const result = await PCloudShare.list_files(code, folderid || undefined)
      
      this.datas = (result.files || [])
        .filter(file => {
          if(file.name.startsWith('.')) return false
          if(file.is_folder) return true
          return file.name.endsWith('.yomii')
        })
        .map(file => ({
          type     : file.is_folder ? "dir" : "file",
          name     : file.name,
          size     : file.size,
          modified : file.modified,
          fileid   : file.fileid,
          folderid : file.folderid,
        }))
      
      this.share_code = code
      this.finish()
    }catch(e){
      console.error("Dynamic pCloud share list error:", e)
      this.datas = []
      this.error_message = `接続に失敗しました: ${e.message}`
      this.finish()
    }
  }

  /**
   * 動的ローカルフォルダの読み込み
   */
  async load_dynamic_local_folder(source){
    const handle_key = source.handle_key
    if(!handle_key){
      this.datas = []
      this.error_message = "フォルダ情報が見つかりません。"
      this.finish()
      return
    }

    const handle = await SourceRegistry.get_handle(handle_key)
    if(!handle){
      this.datas = []
      this.error_message = "フォルダハンドルが見つかりません。再度追加してください。"
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
      console.error("Dynamic local folder read error:", e)
      this.datas = []
      this.error_message = `フォルダの読み込みに失敗しました: ${e.message}`
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
