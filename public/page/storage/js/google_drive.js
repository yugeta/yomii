/**
 * Google Drive OAuth 2.0 認証 + ファイル管理
 * 
 * OAuth 2.0 Authorization Code Flow (with implicit for SPA)
 * Google Drive API v3 を使用
 * 
 * セットアップ手順: docs/cloud-storage-setup.md を参照
 */
import { Loading } from "../../../asset/js/loading/loading.js"
import { transform_file_entry } from "./google_drive_utils.js"

export class GoogleDrive{

  // ============================================================
  // 設定値（.env から読み込み）
  // ============================================================
  static CLIENT_ID    = ""
  static REDIRECT_URI = ""

  // ============================================================
  // 定数
  // ============================================================
  static AUTH_URL     = "https://accounts.google.com/o/oauth2/v2/auth"
  static TOKEN_URL    = "https://oauth2.googleapis.com/token"
  static API_BASE     = "https://www.googleapis.com"
  static UPLOAD_URL   = "https://www.googleapis.com/upload/drive/v3/files"
  static SCOPE        = "https://www.googleapis.com/auth/drive.file"
  static FOLDER_NAME  = "Yomii"
  static STORAGE_KEY  = "yomii_google_drive_token"
  static MAX_RETRY    = 3

  // ============================================================
  // 認証
  // ============================================================

  /**
   * 認証済みかどうか
   */
  static is_authenticated(){
    const data = GoogleDrive.get_token_data()
    return !!(data && data.access_token)
  }

  /**
   * 保存されたトークンデータを取得
   */
  static get_token_data(){
    try{
      const raw = localStorage.getItem(GoogleDrive.STORAGE_KEY)
      if(!raw) return null
      return JSON.parse(raw)
    }catch(e){
      return null
    }
  }

  /**
   * トークンデータを保存
   */
  static save_token_data(data){
    localStorage.setItem(GoogleDrive.STORAGE_KEY, JSON.stringify(data))
  }

  /**
   * トークンを削除（ログアウト）
   */
  static logout(){
    localStorage.removeItem(GoogleDrive.STORAGE_KEY)
  }

  /**
   * アクセストークンを取得（有効期限チェック付き）
   */
  static get_access_token(){
    const data = GoogleDrive.get_token_data()
    if(!data || !data.access_token) return null

    // 有効期限チェック（expires_at が設定されている場合）
    if(data.expires_at && Date.now() > data.expires_at){
      return null // 期限切れ
    }
    return data.access_token
  }

  /**
   * OAuth 認証フローを開始（ポップアップウィンドウ）
   * Token (implicit) フローを使用
   */
  static start_auth(){
    return new Promise((resolve, reject) => {
      if(!GoogleDrive.CLIENT_ID){
        reject(new Error("Google Drive CLIENT_ID が設定されていません。docs/cloud-storage-setup.md を参照してください。"))
        return
      }
      if(!GoogleDrive.REDIRECT_URI){
        reject(new Error("Google Drive REDIRECT_URI が設定されていません。docs/cloud-storage-setup.md を参照してください。"))
        return
      }

      const state = "google_" + (+new Date())
      const params = new URLSearchParams({
        client_id     : GoogleDrive.CLIENT_ID,
        redirect_uri  : GoogleDrive.REDIRECT_URI,
        response_type : "token",
        scope         : GoogleDrive.SCOPE,
        state         : state,
        include_granted_scopes : "true",
      })

      const auth_url = `${GoogleDrive.AUTH_URL}?${params.toString()}`
      const width  = 600
      const height = 700
      const left   = (screen.width - width) / 2
      const top    = (screen.height - height) / 2

      const popup = window.open(
        auth_url,
        "google_auth",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
      )

      if(!popup){
        reject(new Error("ポップアップがブロックされました。ポップアップを許可してください。"))
        return
      }

      const handler = (event) => {
        if(event.data && event.data.type === "google_auth_callback"){
          window.removeEventListener("message", handler)
          clearInterval(timer)

          if(event.data.error){
            reject(new Error(event.data.error))
          }else{
            const expires_in = parseInt(event.data.expires_in) || 3600
            const token_data = {
              access_token : event.data.access_token,
              token_type   : event.data.token_type,
              expires_in   : expires_in,
              expires_at   : Date.now() + (expires_in * 1000),
              scope        : event.data.scope,
              state        : event.data.state,
              saved_at     : Date.now(),
            }
            GoogleDrive.save_token_data(token_data)
            resolve(token_data)
          }
        }
      }
      window.addEventListener("message", handler)

      const timer = setInterval(() => {
        if(popup.closed){
          clearInterval(timer)
          window.removeEventListener("message", handler)
          reject(new Error("認証がキャンセルされました。"))
        }
      }, 500)
    })
  }

  // ============================================================
  // API 呼び出し
  // ============================================================

  /**
   * API リクエスト（GET）- エラーハンドリング強化版
   * - 401: トークン削除 + 再認証エラー throw
   * - 403: レートリミットエラー throw
   * - 404: リソース不在エラー throw
   * - 500系: 最大3回リトライ後にサーバーエラー throw
   * - ネットワークエラー: 接続確認メッセージ throw
   * - タイムアウト: AbortController で指定秒タイムアウト throw
   * @param {string} path - API パス
   * @param {object} params - クエリパラメータ
   * @param {object} options - { timeout_ms, operation }
   */
  static async api_get(path, params = {}, options = {}){
    const token = GoogleDrive.get_access_token()
    if(!token){
      throw new Error("Google Drive: 認証が必要です")
    }

    const timeout_ms = options.timeout_ms || 60000
    const operation = options.operation || "api_get"

    const url_params = new URLSearchParams(params)
    const url = `${GoogleDrive.API_BASE}${path}?${url_params.toString()}`

    for(let attempt = 0; attempt <= GoogleDrive.MAX_RETRY; attempt++){
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout_ms)

      try{
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        clearTimeout(timer)

        if(response.ok){
          return response.json()
        }

        const status = response.status
        const error_data = await response.json().catch(() => ({}))
        const message = error_data.error?.message || response.statusText

        // 401: トークン削除 + 再認証エラー
        if(status === 401){
          GoogleDrive.logout()
          const err = new Error("Google Drive: 認証が必要です。再度ログインしてください。")
          console.error(`[GoogleDrive] ${operation} failed:`, { type: "api_error", status, operation, message: err.message })
          throw err
        }

        // 403: レートリミット / 権限エラー
        if(status === 403){
          const err = new Error(`Google Drive: アクセスが拒否されました (${message})`)
          console.error(`[GoogleDrive] ${operation} failed:`, { type: "api_error", status, operation, message: err.message })
          throw err
        }

        // 404: リソース不在
        if(status === 404){
          const err = new Error("Google Drive: 対象が見つかりません")
          console.error(`[GoogleDrive] ${operation} failed:`, { type: "api_error", status, operation, message: err.message })
          throw err
        }

        // 500系: リトライ
        if(status >= 500 && status < 600){
          if(attempt < GoogleDrive.MAX_RETRY){
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
            continue
          }
          const err = new Error("Google Drive: サーバーエラーが発生しました。しばらく待ってから再試行してください。")
          console.error(`[GoogleDrive] ${operation} failed:`, { type: "api_error", status, operation, message: err.message })
          throw err
        }

        // その他のエラー
        const err = new Error(`Google Drive API Error (${status}): ${message}`)
        console.error(`[GoogleDrive] ${operation} failed:`, { type: "api_error", status, operation, message: err.message })
        throw err

      }catch(e){
        clearTimeout(timer)

        if(e.name === "AbortError"){
          const err = new Error("Google Drive: リクエストがタイムアウトしました")
          console.error(`[GoogleDrive] ${operation} failed:`, { type: "timeout", operation, message: err.message })
          throw err
        }

        // 既に処理済みのエラーはそのまま throw
        if(e.message.startsWith("Google Drive:")){
          throw e
        }

        // ネットワークエラー
        const err = new Error("ネットワーク接続を確認してください")
        console.error(`[GoogleDrive] ${operation} failed:`, { type: "network_error", operation, message: err.message })
        throw err
      }
    }
  }

  /**
   * API リクエスト（DELETE）
   * @param {string} path - API パス
   * @param {object} options - { timeout_ms, operation }
   */
  static async api_delete(path, options = {}){
    const token = GoogleDrive.get_access_token()
    if(!token){
      throw new Error("Google Drive: 認証が必要です")
    }

    const timeout_ms = options.timeout_ms || 60000
    const operation = options.operation || "api_delete"

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout_ms)

    try{
      const response = await fetch(`${GoogleDrive.API_BASE}${path}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
      clearTimeout(timer)

      if(response.ok || response.status === 204){
        return true
      }

      const status = response.status
      const error_data = await response.json().catch(() => ({}))
      const message = error_data.error?.message || response.statusText

      if(status === 401){
        GoogleDrive.logout()
        const err = new Error("Google Drive: 認証が必要です。再度ログインしてください。")
        console.error(`[GoogleDrive] ${operation} failed:`, { type: "api_error", status, operation, message: err.message })
        throw err
      }
      if(status === 403){
        const err = new Error(`Google Drive: 削除権限がありません (${message})`)
        console.error(`[GoogleDrive] ${operation} failed:`, { type: "api_error", status, operation, message: err.message })
        throw err
      }
      if(status === 404){
        const err = new Error("Google Drive: 対象が見つかりません")
        console.error(`[GoogleDrive] ${operation} failed:`, { type: "api_error", status, operation, message: err.message })
        throw err
      }

      const err = new Error(`Google Drive API Error (${status}): ${message}`)
      console.error(`[GoogleDrive] ${operation} failed:`, { type: "api_error", status, operation, message: err.message })
      throw err

    }catch(e){
      clearTimeout(timer)

      if(e.name === "AbortError"){
        const err = new Error("Google Drive: リクエストがタイムアウトしました")
        console.error(`[GoogleDrive] ${operation} failed:`, { type: "timeout", operation, message: err.message })
        throw err
      }

      if(e.message.startsWith("Google Drive:")){
        throw e
      }

      const err = new Error("ネットワーク接続を確認してください")
      console.error(`[GoogleDrive] ${operation} failed:`, { type: "network_error", operation, message: err.message })
      throw err
    }
  }

  /**
   * Yomii フォルダを作成（存在しない場合）
   */
  static async ensure_folder(){
    const token = GoogleDrive.get_access_token()
    if(!token) throw new Error("Google Drive: 認証が必要です")

    // フォルダを検索
    const query = `name='${GoogleDrive.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    const search_result = await GoogleDrive.api_get("/drive/v3/files", {
      q      : query,
      fields : "files(id,name)",
    })

    if(search_result.files && search_result.files.length > 0){
      return search_result.files[0].id
    }

    // フォルダ作成
    const response = await fetch(`${GoogleDrive.API_BASE}/drive/v3/files`, {
      method: "POST",
      headers: {
        Authorization  : `Bearer ${token}`,
        "Content-Type" : "application/json",
      },
      body: JSON.stringify({
        name     : GoogleDrive.FOLDER_NAME,
        mimeType : "application/vnd.google-apps.folder",
      }),
    })

    if(!response.ok){
      throw new Error(`Google Drive: フォルダ作成に失敗しました (${response.status})`)
    }

    const folder = await response.json()
    return folder.id
  }

  // ============================================================
  // ファイル一覧
  // ============================================================

  /**
   * Yomii フォルダ内のファイル一覧を取得
   * @returns {Array<{name, size, modified, is_folder, file_id}>}
   */
  static async list_files(){
    const folder_id = await GoogleDrive.ensure_folder()
    return GoogleDrive._list_files_in_folder(folder_id)
  }

  /**
   * 指定パスのファイル一覧を取得
   * @param {string} dir_path - Yomii フォルダからの相対パス（例: "manga/shonen"）
   * @returns {Array<{name, size, modified, is_folder, file_id}>}
   */
  static async list_files_path(dir_path){
    const root_id = await GoogleDrive.ensure_folder()
    const folder_id = await GoogleDrive.resolve_folder_path(dir_path, root_id)
    return GoogleDrive._list_files_in_folder(folder_id)
  }

  /**
   * 指定フォルダ ID 配下のファイル一覧を取得（ページネーション対応）
   * @param {string} folder_id - フォルダ ID
   * @returns {Array}
   */
  static async _list_files_in_folder(folder_id){
    const all_files = []
    let page_token = null

    do{
      const params = {
        q       : `'${folder_id}' in parents and trashed=false`,
        fields  : "nextPageToken,files(id,name,size,modifiedTime,mimeType)",
        pageSize: 1000,
      }
      if(page_token){
        params.pageToken = page_token
      }

      const result = await GoogleDrive.api_get("/drive/v3/files", params, {
        timeout_ms: 30000,
        operation: "list_files",
      })

      if(result.files){
        for(const file of result.files){
          all_files.push(transform_file_entry(file))
        }
      }
      page_token = result.nextPageToken || null
    }while(page_token)

    return all_files
  }

  // ============================================================
  // フォルダパス解決
  // ============================================================

  /**
   * フォルダ名パスからフォルダ ID を解決
   * @param {string} dir_path - "manga/shonen" 形式のパス
   * @param {string} parent_id - 起点フォルダ ID
   * @returns {string} 最終フォルダの ID
   */
  static async resolve_folder_path(dir_path, parent_id){
    if(!dir_path) return parent_id

    const segments = dir_path.split("/").filter(s => s)
    let current_id = parent_id

    for(const segment of segments){
      const query = `name='${segment.replace(/'/g, "\\'")}' and '${current_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
      const result = await GoogleDrive.api_get("/drive/v3/files", {
        q      : query,
        fields : "files(id,name)",
      }, { operation: "resolve_folder_path" })

      if(!result.files || result.files.length === 0){
        throw new Error(`Google Drive: フォルダ「${segment}」が見つかりません`)
      }
      current_id = result.files[0].id
    }

    return current_id
  }

  /**
   * 指定フォルダ内の同名ファイルを検索
   * @param {string} filename - ファイル名
   * @param {string} folder_id - フォルダ ID
   * @returns {string|null} ファイル ID or null
   */
  static async find_file_by_name(filename, folder_id){
    const query = `name='${filename.replace(/'/g, "\\'")}' and '${folder_id}' in parents and trashed=false`
    const result = await GoogleDrive.api_get("/drive/v3/files", {
      q      : query,
      fields : "files(id,name)",
    }, { operation: "find_file_by_name" })

    if(result.files && result.files.length > 0){
      return result.files[0].id
    }
    return null
  }

  // ============================================================
  // ダウンロード
  // ============================================================

  /**
   * ファイルをダウンロード（Blob として返す）
   * Loading 表示付き（PCloud.download_file と同パターン）
   * @param {string} file_id - Google Drive ファイル ID
   * @returns {Blob}
   */
  static async download_file(file_id){
    const token = GoogleDrive.get_access_token()
    if(!token) throw new Error("Google Drive: 認証が必要です")

    new Loading({ type: "plane" })
    Loading.set_status("active")
    Loading.set_rate(10)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 120000)

    try{
      const response = await fetch(
        `${GoogleDrive.API_BASE}/drive/v3/files/${file_id}?alt=media`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }
      )
      clearTimeout(timer)

      if(!response.ok){
        const status = response.status
        if(status === 401){
          GoogleDrive.logout()
          throw new Error("Google Drive: 認証が必要です。再度ログインしてください。")
        }
        if(status === 404){
          throw new Error("Google Drive: ファイルが見つかりません")
        }
        throw new Error(`Google Drive: ダウンロードに失敗しました (${status})`)
      }

      Loading.set_rate(50)
      const blob = await response.blob()
      Loading.set_rate(100)
      setTimeout(() => Loading.set_status("passive"), 300)
      return blob

    }catch(e){
      clearTimeout(timer)
      Loading.set_status("passive")

      if(e.name === "AbortError"){
        const err = new Error("Google Drive: ダウンロードがタイムアウトしました")
        console.error("[GoogleDrive] download_file failed:", { type: "timeout", operation: "download_file", message: err.message })
        throw err
      }

      if(e.message.startsWith("Google Drive:")){
        console.error("[GoogleDrive] download_file failed:", { type: "api_error", operation: "download_file", message: e.message })
        throw e
      }

      const err = new Error("ネットワーク接続を確認してください")
      console.error("[GoogleDrive] download_file failed:", { type: "network_error", operation: "download_file", message: err.message })
      throw err
    }
  }

  // ============================================================
  // 削除
  // ============================================================

  /**
   * ファイルを削除
   * @param {string} file_id - Google Drive ファイル ID
   */
  static async delete_file(file_id){
    await GoogleDrive.api_delete(`/drive/v3/files/${file_id}`, {
      operation: "delete_file",
    })
  }

  // ============================================================
  // ストレージ容量
  // ============================================================

  /**
   * ストレージ容量情報を取得
   * @returns {{usage: number, limit: number, remaining: number}}
   */
  static async get_storage_quota(){
    const result = await GoogleDrive.api_get("/drive/v3/about", {
      fields: "storageQuota",
    }, { operation: "get_storage_quota" })

    const quota = result.storageQuota || {}
    const usage = parseInt(quota.usage || "0", 10)
    const limit = parseInt(quota.limit || "0", 10)
    const remaining = Math.max(0, limit - usage)

    return { usage, limit, remaining }
  }

  /**
   * ファイルをアップロード（マルチパート）
   */
  static async upload_file(blob, filename, on_progress){
    const token = GoogleDrive.get_access_token()
    if(!token) throw new Error("Google Drive: 認証が必要です")

    const folder_id = await GoogleDrive.ensure_folder()

    // マルチパートアップロード
    const metadata = {
      name    : filename,
      parents : [folder_id],
    }

    const boundary = "yomii_boundary_" + (+new Date())
    const delimiter = `--${boundary}`
    const close_delimiter = `--${boundary}--`

    // メタデータ部分
    const metadata_part = `${delimiter}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`
    // ファイル部分のヘッダー
    const file_header = `${delimiter}\r\nContent-Type: application/zip\r\nContent-Transfer-Encoding: binary\r\n\r\n`
    const file_footer = `\r\n${close_delimiter}`

    // Blob を結合
    const body = new Blob([metadata_part, file_header, blob, file_footer], {
      type: `multipart/related; boundary=${boundary}`
    })

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open("POST", `${GoogleDrive.UPLOAD_URL}?uploadType=multipart`, true)
      xhr.setRequestHeader("Authorization", `Bearer ${token}`)
      xhr.setRequestHeader("Content-Type", `multipart/related; boundary=${boundary}`)

      if(on_progress){
        xhr.upload.addEventListener("progress", (e) => {
          if(e.lengthComputable){
            const rate = (e.loaded / e.total) * 100
            on_progress(rate)
          }
        })
      }

      xhr.onload = () => {
        if(xhr.status >= 200 && xhr.status < 300){
          try{
            resolve(JSON.parse(xhr.responseText))
          }catch(e){
            resolve({ name: filename })
          }
        }else{
          try{
            const err = JSON.parse(xhr.responseText)
            reject(new Error(`Google Drive Upload Error (${xhr.status}): ${err.error?.message || "Unknown"}`))
          }catch(e){
            reject(new Error(`Google Drive Upload Error (${xhr.status})`))
          }
        }
      }

      xhr.onerror = () => {
        reject(new Error("ネットワーク接続を確認してください"))
      }

      xhr.ontimeout = () => {
        reject(new Error("アップロードがタイムアウトしました。再試行してください。"))
      }

      xhr.timeout = 60000
      xhr.send(body)
    })
  }
}
