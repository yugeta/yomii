/**
 * pCloud WebDAV プロキシ経由
 * 
 * PHP プロキシ（pcloud_webdav.php）を経由して pCloud WebDAV にアクセスする。
 * 認証情報（email/password）は localStorage に保存し、リクエスト時に送信する。
 */
import { Loading } from "../../../asset/js/loading/loading.js"

export class PCloud{

  // ============================================================
  // 定数
  // ============================================================
  static PROXY_URL   = "page/storage/php/pcloud_webdav.php"
  static STORAGE_KEY = "yomii_pcloud_config"
  static FOLDER_PATH = "/yomii/"
  static MAX_RETRY   = 3

  // ============================================================
  // 設定管理（localStorage）
  // ============================================================

  /**
   * 連携済みかどうか
   */
  static is_authenticated(){
    const config = PCloud.get_config()
    return !!(config && config.email && config.password)
  }

  /**
   * 設定を取得
   */
  static get_config(){
    try{
      const raw = localStorage.getItem(PCloud.STORAGE_KEY)
      if(!raw) return null
      return JSON.parse(raw)
    }catch(e){
      return null
    }
  }

  /**
   * 設定を保存
   */
  static save_config(config){
    localStorage.setItem(PCloud.STORAGE_KEY, JSON.stringify(config))
  }

  /**
   * 設定を削除（連携解除）
   */
  static logout(){
    localStorage.removeItem(PCloud.STORAGE_KEY)
  }

  /**
   * 互換性のため（StorageManager から呼ばれる）
   */
  static get_token_data(){
    return PCloud.get_config()
  }

  /**
   * start_auth は使わない（マイページで email/password を入力する方式）
   */
  static async start_auth(){
    throw new Error("pCloud はマイページでメールアドレス/パスワードを設定してください。")
  }

  // ============================================================
  // 認証テスト
  // ============================================================

  /**
   * 認証情報が正しいかテスト（一覧取得で確認）
   */
  static async test_auth(email, password){
    console.log("[pCloud] test_auth: sending request...", { email, path: "/" })
    const response = await fetch(PCloud.PROXY_URL + "?action=list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email    : email,
        password : password,
        path     : "/",
      }),
    })
    console.log("[pCloud] test_auth: HTTP status =", response.status)
    const data = await response.json()
    console.log("[pCloud] test_auth: response data =", JSON.stringify(data, null, 2))
    if(data.result === "error"){
      if(data.debug){
        console.error("[pCloud] test_auth: debug info =", data.debug)
      }
      throw new Error(data.message)
    }
    return data
  }

  // ============================================================
  // アップロード
  // ============================================================

  /**
   * ファイルをアップロード
   */
  static async upload_file(blob, filename, on_progress){
    const config = PCloud.get_config()
    if(!config || !config.email || !config.password){
      throw new Error("pCloud: 認証情報が設定されていません。マイページで設定してください。")
    }

    const form = new FormData()
    form.append("email", config.email)
    form.append("password", config.password)
    form.append("path", PCloud.FOLDER_PATH)
    form.append("filename", filename)
    form.append("file", blob, filename)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open("POST", PCloud.PROXY_URL + "?action=upload", true)

      if(on_progress){
        xhr.upload.addEventListener("progress", (e) => {
          if(e.lengthComputable){
            const rate = (e.loaded / e.total) * 100
            on_progress(rate)
          }
        })
      }

      xhr.onload = () => {
        try{
          const data = JSON.parse(xhr.responseText)
          if(data.result === "success"){
            resolve(data)
          }else{
            reject(new Error(data.message || "アップロードに失敗しました"))
          }
        }catch(e){
          reject(new Error("レスポンスの解析に失敗しました"))
        }
      }

      xhr.onerror = () => {
        reject(new Error("ネットワーク接続を確認してください"))
      }

      xhr.ontimeout = () => {
        reject(new Error("アップロードがタイムアウトしました。"))
      }

      xhr.timeout = 300000 // 5分
      xhr.send(form)
    })
  }

  // ============================================================
  // ファイル一覧
  // ============================================================

  /**
   * yomii フォルダのファイル一覧を取得
   */
  static async list_files(){
    return PCloud.list_files_path(PCloud.FOLDER_PATH)
  }

  /**
   * 指定パスのファイル一覧を取得
   */
  static async list_files_path(path){
    const config = PCloud.get_config()
    if(!config || !config.email || !config.password){
      throw new Error("pCloud: 認証情報が設定されていません。")
    }

    const response = await fetch(PCloud.PROXY_URL + "?action=list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email    : config.email,
        password : config.password,
        path     : path,
      }),
    })

    const data = await response.json()
    if(data.result === "error"){
      throw new Error(data.message)
    }
    return data.files || []
  }

  // ============================================================
  // ダウンロード
  // ============================================================

  /**
   * ファイルをダウンロード（Blob として返す）
   */
  static async download_file(filepath){
    const config = PCloud.get_config()
    if(!config || !config.email || !config.password){
      throw new Error("pCloud: 認証情報が設定されていません。")
    }

    new Loading({ type: "plane" })
    Loading.set_status('active')
    Loading.set_rate(10)

    try{
      const response = await fetch(PCloud.PROXY_URL + "?action=download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email    : config.email,
          password : config.password,
          filepath : filepath,
        }),
      })

      Loading.set_rate(50)

      // エラーチェック（JSON が返ってきた場合はエラー）
      const content_type = response.headers.get("content-type") || ""
      if(content_type.includes("application/json")){
        const data = await response.json()
        Loading.set_status('passive')
        throw new Error(data.message || "ダウンロードに失敗しました")
      }

      const blob = await response.blob()
      Loading.set_rate(100)
      setTimeout(() => Loading.set_status('passive'), 300)
      return blob
    }catch(e){
      Loading.set_status('passive')
      throw e
    }
  }

  // ============================================================
  // フォルダ作成
  // ============================================================

  /**
   * yomii フォルダを作成（存在しない場合）
   */
  static async ensure_folder(){
    const config = PCloud.get_config()
    if(!config || !config.email || !config.password){
      throw new Error("pCloud: 認証情報が設定されていません。")
    }

    const response = await fetch(PCloud.PROXY_URL + "?action=mkdir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email    : config.email,
        password : config.password,
        path     : PCloud.FOLDER_PATH,
      }),
    })

    const data = await response.json()
    if(data.result === "error"){
      throw new Error(data.message)
    }
    return data
  }
}
