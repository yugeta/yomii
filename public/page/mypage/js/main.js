import { StorageManager } from "../../storage/js/storage_manager.js"
import { StorageConfig } from "../../storage/js/storage_config.js"
import { PCloud }        from "../../storage/js/pcloud.js"
import { Auth }          from "../../common/js/auth.js"

class MyPage{
  constructor(){
    this.init()
  }

  async init(){
    // ログインチェック
    if(!Auth.require_login()) return

    // localStorage から設定を読み込んで各モジュールに反映
    StorageConfig.load_all()

    this.render_user_info()
    this.render_redirect_uris()
    this.render_saved_configs()
    this.render_local_folder()
    this.update_status()
    this.bind_events()
  }

  /**
   * ユーザー情報を表示
   */
  render_user_info(){
    const user = Auth.get_user()
    if(!user) return

    const user_section = document.querySelector(".user-info")
    if(!user_section) return

    const picture_html = user.picture 
      ? `<img class="user-avatar" src="${user.picture}" alt="" referrerpolicy="no-referrer"/>` 
      : ""

    user_section.innerHTML = `
      ${picture_html}
      <div class="user-detail">
        <span class="user-name">${user.name || ""}</span>
        <span class="user-email">${user.email || ""}</span>
      </div>
      <button class="btn-logout">ログアウト</button>
    `

    const logout_btn = user_section.querySelector(".btn-logout")
    if(logout_btn){
      logout_btn.addEventListener("click", () => {
        if(confirm("ログアウトしますか？")){
          Auth.logout()
          location.href = "./?p=login"
        }
      })
    }
  }

  /**
   * ローカルフォルダの状態を表示
   */
  async render_local_folder(){
    const { Load } = await import("../../shelf/js/load.js")
    const handle = await Load.get_local_folder_handle()
    const path_el = document.querySelector(".local-folder-path")
    const btn_select = document.querySelector(".btn-select-folder")
    const btn_remove = document.querySelector(".btn-remove-folder")

    // File System Access API 非対応チェック
    if(!window.showDirectoryPicker){
      if(path_el) path_el.textContent = "このブラウザでは利用できません"
      if(btn_select) btn_select.disabled = true
      return
    }

    if(handle){
      if(path_el) path_el.textContent = `📁 ${handle.name}`
      if(btn_select) btn_select.textContent = "変更"
      if(btn_remove) btn_remove.style.display = ""
    }else{
      if(path_el) path_el.textContent = "未設定"
      if(btn_select) btn_select.textContent = "フォルダを選択"
      if(btn_remove) btn_remove.style.display = "none"
    }
  }

  /**
   * フォルダ選択
   */
  async on_select_folder(){
    if(!window.showDirectoryPicker){
      alert("このブラウザではフォルダ選択に対応していません。Chrome または Edge をご利用ください。")
      return
    }

    try{
      const handle = await window.showDirectoryPicker({ mode: "read" })
      const { Load } = await import("../../shelf/js/load.js")
      await Load.save_local_folder_handle(handle)
      this.render_local_folder()
    }catch(e){
      if(e.name !== "AbortError"){
        console.error("Folder select error:", e)
      }
    }
  }

  /**
   * フォルダ解除
   */
  async on_remove_folder(){
    if(!confirm("ローカルフォルダの設定を解除しますか？")) return
    const { Load } = await import("../../shelf/js/load.js")
    await Load.remove_local_folder_handle()
    this.render_local_folder()
  }

  /**
   * Redirect URI を自動計算して表示
   */
  render_redirect_uris(){
    const origin = location.origin

    // pCloud
    const pcloud_uri_input = document.querySelector('.input-redirect-uri[data-service="pcloud"]')
    if(pcloud_uri_input){
      pcloud_uri_input.value = `${origin}/page/storage/callback/pcloud.html`
    }

    // Google Drive
    const google_uri_input = document.querySelector('.input-redirect-uri[data-service="google_drive"]')
    if(google_uri_input){
      google_uri_input.value = `${origin}/page/storage/callback/google.html`
    }

    const google_origin_input = document.querySelector('.input-origin[data-service="google_drive"]')
    if(google_origin_input){
      google_origin_input.value = origin
    }
  }

  /**
   * 保存済みの設定をフォームに反映
   */
  render_saved_configs(){
    const services = ["pcloud", "google_drive"]
    for(const service of services){
      const config = StorageConfig.get(service)
      const input = document.querySelector(`.input-client-id[data-service="${service}"]`)
      if(input && config && config.client_id){
        input.value = config.client_id
      }
    }
  }

  /**
   * 全サービスの認証状態を画面に反映
   */
  update_status(){
    // pCloud
    this.update_pcloud_status()

    // Google Drive
    this.update_google_drive_status()
  }

  /**
   * pCloud の状態を更新
   */
  update_pcloud_status(){
    const card = document.querySelector('.service-card[data-service="pcloud"]')
    if(!card) return

    const status_el      = card.querySelector(".service-status")
    const label_el       = card.querySelector(".status-label")
    const setup_form     = card.querySelector(".pcloud-setup-form")
    const connected_el   = card.querySelector(".pcloud-connected")
    const btn_disconnect = card.querySelector(".btn-disconnect")

    const is_configured = PCloud.is_authenticated()

    if(is_configured){
      const config = PCloud.get_config()
      status_el.setAttribute("data-status", "connected")
      label_el.textContent = "連携済み"
      setup_form.style.display = "none"
      connected_el.style.display = ""
      btn_disconnect.style.display = ""

      const detail_el = connected_el.querySelector(".connected-detail")
      if(detail_el && config){
        const mask_password = config.password ? "●".repeat(Math.min(config.password.length, 8)) : ""
        const saved_date = config.saved_at ? new Date(config.saved_at).toLocaleString("ja-JP") : ""
        detail_el.innerHTML = `
          <div class="connected-row"><span class="connected-label">メール:</span> <span>${config.email || ""}</span></div>
          <div class="connected-row"><span class="connected-label">パスワード:</span> <span>${mask_password}</span></div>
          <div class="connected-row"><span class="connected-label">登録日時:</span> <span>${saved_date}</span></div>
        `
      }
    }else{
      status_el.setAttribute("data-status", "disconnected")
      label_el.textContent = "未連携"
      setup_form.style.display = ""
      connected_el.style.display = "none"
      btn_disconnect.style.display = "none"
    }
  }

  /**
   * Google Drive の状態を更新
   */
  update_google_drive_status(){
    const card = document.querySelector('.service-card[data-service="google_drive"]')
    if(!card) return

    const status_el      = card.querySelector(".service-status")
    const label_el       = card.querySelector(".status-label")
    const btn_connect    = card.querySelector(".btn-connect")
    const btn_disconnect = card.querySelector(".btn-disconnect")
    const setup_section  = card.querySelector(".service-card__setup")

    const config = StorageConfig.get("google_drive")
    const has_config = !!(config && config.client_id)
    const is_auth = StorageManager.is_authenticated("google_drive")

    if(is_auth){
      status_el.setAttribute("data-status", "connected")
      label_el.textContent = "連携済み"
      btn_connect.style.display = "none"
      btn_disconnect.style.display = ""
      if(setup_section) setup_section.style.display = "none"
    }else if(has_config){
      status_el.setAttribute("data-status", "configured")
      label_el.textContent = "設定済み（未連携）"
      btn_connect.style.display = ""
      btn_connect.disabled = false
      btn_disconnect.style.display = "none"
      if(setup_section) setup_section.style.display = ""
    }else{
      status_el.setAttribute("data-status", "disconnected")
      label_el.textContent = "未設定"
      btn_connect.style.display = ""
      btn_connect.disabled = true
      btn_disconnect.style.display = "none"
      if(setup_section) setup_section.style.display = ""
    }
  }

  get_detail_text(service, token_data){
    if(!token_data) return null
    switch(service){
      case "pcloud":
        if(token_data.locationid === "1" || token_data.locationid === 1) return "US リージョン"
        if(token_data.locationid === "2" || token_data.locationid === 2) return "EU リージョン"
        return null
      case "google_drive":
        if(token_data.expires_at){
          const remaining = token_data.expires_at - Date.now()
          if(remaining <= 0) return "トークン期限切れ"
        }
        return null
      default:
        return null
    }
  }

  /**
   * イベントバインド
   */
  bind_events(){
    // ローカルフォルダ選択
    const btn_select = document.querySelector(".btn-select-folder")
    if(btn_select){
      btn_select.addEventListener("click", this.on_select_folder.bind(this))
    }
    const btn_remove = document.querySelector(".btn-remove-folder")
    if(btn_remove){
      btn_remove.addEventListener("click", this.on_remove_folder.bind(this))
    }

    // pCloud 保存ボタン
    const pcloud_save_btn = document.querySelector(".btn-pcloud-save")
    if(pcloud_save_btn){
      pcloud_save_btn.addEventListener("click", this.on_pcloud_save.bind(this))
    }

    // Google Drive 設定保存ボタン
    const save_btns = document.querySelectorAll(".btn-save-config")
    for(const btn of save_btns){
      btn.addEventListener("click", this.on_save_config.bind(this))
    }

    // 連携ボタン（Google Drive）
    const connect_btns = document.querySelectorAll(".btn-connect")
    for(const btn of connect_btns){
      btn.addEventListener("click", this.on_connect.bind(this))
    }

    // 連携解除ボタン
    const disconnect_btns = document.querySelectorAll(".btn-disconnect")
    for(const btn of disconnect_btns){
      btn.addEventListener("click", this.on_disconnect.bind(this))
    }

    // コピーボタン
    const copy_btns = document.querySelectorAll(".btn-copy")
    for(const btn of copy_btns){
      btn.addEventListener("click", this.on_copy.bind(this))
    }
  }

  /**
   * pCloud 設定保存
   */
  async on_pcloud_save(e){
    const btn = e.currentTarget
    const email = document.querySelector(".input-pcloud-email").value.trim()
    const password = document.querySelector(".input-pcloud-password").value

    if(!email || !password){
      alert("メールアドレスとパスワードを入力してください。")
      return
    }

    btn.disabled = true
    btn.textContent = "認証テスト中..."

    try{
      // 認証テスト
      await PCloud.test_auth(email, password)

      // 成功 → 保存
      PCloud.save_config({
        email    : email,
        password : password,
        saved_at : Date.now(),
      })

      // yomii フォルダを作成
      await PCloud.ensure_folder()

      alert("pCloud との連携が完了しました。")
      document.querySelector(".input-pcloud-password").value = ""
      this.update_status()
    }catch(err){
      console.error("pCloud auth error:", err)
      alert(`pCloud 連携エラー: ${err.message}`)
    }finally{
      btn.disabled = false
      btn.textContent = "連携する"
    }
  }

  /**
   * 設定保存
   */
  on_save_config(e){
    const service = e.currentTarget.getAttribute("data-service")
    const input = document.querySelector(`.input-client-id[data-service="${service}"]`)
    const client_id = input ? input.value.trim() : ""

    if(!client_id){
      alert("Client ID を入力してください。")
      return
    }

    const origin = location.origin
    let redirect_uri
    switch(service){
      case "pcloud":
        redirect_uri = `${origin}/page/storage/callback/pcloud.html`
        break
      case "google_drive":
        redirect_uri = `${origin}/page/storage/callback/google.html`
        break
    }

    StorageConfig.save(service, { client_id, redirect_uri })
    StorageConfig.load_all()

    alert("設定を保存しました。「連携する」ボタンで認証を行ってください。")
    this.update_status()
  }

  /**
   * 連携ボタン押下
   */
  async on_connect(e){
    const service = e.currentTarget.getAttribute("data-service")
    const btn = e.currentTarget
    btn.disabled = true
    btn.textContent = "認証中..."

    try{
      await StorageManager.authenticate(service)
      this.update_status()
    }catch(err){
      console.error(`${service} auth error:`, err)
      alert(`認証エラー: ${err.message}`)
      btn.disabled = false
      btn.textContent = "連携する"
    }
  }

  /**
   * 連携解除ボタン押下
   */
  on_disconnect(e){
    const service = e.currentTarget.getAttribute("data-service")
    const svc_name = StorageManager.SERVICES[service]?.name || service

    if(!confirm(`${svc_name} との連携を解除しますか？`)){
      return
    }

    StorageManager.logout(service)
    this.update_status()
  }

  /**
   * コピーボタン
   */
  on_copy(e){
    const target = e.currentTarget.getAttribute("data-target")
    const input = document.querySelector(`.input-redirect-uri[data-service="${target}"]`)
    if(input){
      navigator.clipboard.writeText(input.value).then(() => {
        e.currentTarget.textContent = "コピー済み"
        setTimeout(() => { e.currentTarget.textContent = "コピー" }, 2000)
      })
    }
  }
}

new MyPage()
