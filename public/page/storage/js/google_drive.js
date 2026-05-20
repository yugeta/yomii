/**
 * Google Drive OAuth 2.0 認証 + ファイルアップロード
 * 
 * OAuth 2.0 Authorization Code Flow (with implicit for SPA)
 * Google Drive API v3 を使用
 * 
 * セットアップ手順: docs/cloud-storage-setup.md を参照
 */
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
   * API リクエスト（GET）
   */
  static async api_get(path, params = {}){
    const token = GoogleDrive.get_access_token()
    if(!token){
      throw new Error("Google Drive: 認証が必要です")
    }

    const url_params = new URLSearchParams(params)
    const response = await fetch(`${GoogleDrive.API_BASE}${path}?${url_params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if(!response.ok){
      const error_data = await response.json().catch(() => ({}))
      throw new Error(`Google Drive API Error (${response.status}): ${error_data.error?.message || response.statusText}`)
    }
    return response.json()
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
