/**
 * AddDialog - 本棚ソース追加ダイアログ
 * 
 * 「+」ボタンクリック時にモーダルダイアログを表示し、
 * ソース種別の選択 → 接続情報入力 → 検証 → 登録のフローを制御する。
 */
import { SourceRegistry } from "./source_registry.js"
import { PCloudShare } from "../../storage/js/pcloud_share.js"
import { GoogleDriveShare } from "../../storage/js/google_drive_share.js"

export class AddDialog {

  constructor(options) {
    this.options = options || {}
    this.on_added = options.on_added || null
    this.overlay = null
  }

  // ============================================================
  // ダイアログ表示・非表示
  // ============================================================

  show() {
    this.create_dom()
    document.body.appendChild(this.overlay)
    requestAnimationFrame(() => {
      this.overlay.classList.add("active")
    })
    this.esc_handler = (e) => {
      if (e.key === "Escape") this.close()
    }
    document.addEventListener("keydown", this.esc_handler)
  }

  close() {
    if (!this.overlay) return
    this.overlay.classList.remove("active")
    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay)
      }
      this.overlay = null
    }, 200)
    if (this.esc_handler) {
      document.removeEventListener("keydown", this.esc_handler)
      this.esc_handler = null
    }
  }

  // ============================================================
  // DOM 生成
  // ============================================================

  create_dom() {
    this.overlay = document.createElement("div")
    this.overlay.className = "add-dialog-overlay"
    // mousedown+click の両方がオーバーレイ上で発生した場合のみ閉じる
    // （input内でドラッグしてオーバーレイ上でmouseupした場合の誤閉じを防止）
    let mousedown_on_overlay = false
    this.overlay.addEventListener("mousedown", (e) => {
      mousedown_on_overlay = (e.target === this.overlay)
    })
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay && mousedown_on_overlay) this.close()
      mousedown_on_overlay = false
    })

    const dialog = document.createElement("div")
    dialog.className = "add-dialog"
    dialog.setAttribute("role", "dialog")
    dialog.setAttribute("aria-label", "本棚を追加")

    dialog.innerHTML = `
      <button class="add-dialog-close" aria-label="閉じる">×</button>
      <h3>本棚ソースを追加</h3>
      
      <div class="add-dialog-sources">
        <button class="add-source-option" data-type="local_folder">
          <span class="source-icon">📁</span>
          <span class="source-info">
            <span class="source-name">ローカルフォルダ</span>
            <span class="source-desc">PCのフォルダを選択して追加</span>
          </span>
        </button>
        <button class="add-source-option" data-type="pcloud_share">
          <span class="source-icon">☁️</span>
          <span class="source-info">
            <span class="source-name">pCloud 公開リンク</span>
            <span class="source-desc">公開フォルダのURLを入力</span>
          </span>
        </button>
        <button class="add-source-option" data-type="google_drive_share">
          <span class="source-icon">📄</span>
          <span class="source-info">
            <span class="source-name">Google Drive 共有フォルダ</span>
            <span class="source-desc">共有フォルダのURLを入力</span>
          </span>
        </button>
      </div>

      <div class="add-dialog-form" data-form="pcloud_share">
        <button class="form-back">← 戻る</button>
        <label for="pcloud-name">タブ名（任意）</label>
        <input type="text" id="pcloud-name" placeholder="例: マンガ共有フォルダ" maxlength="50">
        <label for="pcloud-url" style="margin-top:12px;">pCloud 公開リンク URL</label>
        <input type="url" id="pcloud-url" placeholder="https://u.pcloud.link/publink/show?code=...">
        <div class="add-dialog-loading">
          <span class="spinner"></span>
          <span>接続を確認中...</span>
        </div>
        <div class="add-dialog-error"></div>
        <div class="form-actions">
          <button class="btn-connect">接続</button>
        </div>
      </div>

      <div class="add-dialog-form" data-form="google_drive_share">
        <button class="form-back">← 戻る</button>
        <label for="gdrive-name">タブ名（任意）</label>
        <input type="text" id="gdrive-name" placeholder="例: マンガ共有" maxlength="50">
        <label for="gdrive-url" style="margin-top:12px;">Google Drive 共有フォルダ URL</label>
        <input type="url" id="gdrive-url" placeholder="https://drive.google.com/drive/folders/XXXXX">
        <p class="form-hint">※ フォルダの共有設定で「リンクを知っている全員」に設定してください</p>
        <div class="add-dialog-loading">
          <span class="spinner"></span>
          <span>接続を確認中...</span>
        </div>
        <div class="add-dialog-error"></div>
        <div class="form-actions">
          <button class="btn-connect-gdrive">接続</button>
        </div>
      </div>
    `

    this.overlay.appendChild(dialog)
    this.bind_events(dialog)
  }

  // ============================================================
  // イベントバインド
  // ============================================================

  bind_events(dialog) {
    dialog.querySelector(".add-dialog-close").addEventListener("click", () => this.close())

    const options = dialog.querySelectorAll(".add-source-option:not(:disabled)")
    for (const opt of options) {
      opt.addEventListener("click", () => {
        const type = opt.getAttribute("data-type")
        this.select_source_type(type, dialog)
      })
    }

    const pcloud_form = dialog.querySelector('.add-dialog-form[data-form="pcloud_share"]')
    pcloud_form.querySelector(".form-back").addEventListener("click", () => {
      this.show_source_list(dialog)
    })
    pcloud_form.querySelector(".btn-connect").addEventListener("click", () => {
      this.connect_pcloud(dialog)
    })
    pcloud_form.querySelector("#pcloud-url").addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.connect_pcloud(dialog)
    })

    const gdrive_form = dialog.querySelector('.add-dialog-form[data-form="google_drive_share"]')
    gdrive_form.querySelector(".form-back").addEventListener("click", () => {
      this.show_source_list(dialog)
    })
    gdrive_form.querySelector(".btn-connect-gdrive").addEventListener("click", () => {
      this.connect_google_drive(dialog)
    })
    gdrive_form.querySelector("#gdrive-url").addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.connect_google_drive(dialog)
    })
  }

  // ============================================================
  // ソース種別選択
  // ============================================================

  select_source_type(type, dialog) {
    switch (type) {
      case "local_folder":
        this.select_local_folder(dialog)
        break
      case "pcloud_share":
        this.show_pcloud_form(dialog)
        break
      case "google_drive_share":
        this.show_google_drive_form(dialog)
        break
    }
  }

  show_source_list(dialog) {
    dialog.querySelector(".add-dialog-sources").style.display = ""
    const forms = dialog.querySelectorAll(".add-dialog-form")
    for (const form of forms) {
      form.classList.remove("active")
    }
    this.clear_error(dialog)
  }

  // ============================================================
  // ローカルフォルダ
  // ============================================================

  async select_local_folder(dialog) {
    if (!window.showDirectoryPicker) {
      this.show_error(dialog, "このブラウザはローカルフォルダの選択に対応していません。Chrome/Edge をお使いください。")
      return
    }

    let handle
    try {
      handle = await window.showDirectoryPicker({ mode: "read" })
    } catch (e) {
      if (e.name === "AbortError") return
      this.show_error(dialog, "フォルダへのアクセスが許可されませんでした。")
      return
    }

    this.show_loading(dialog)
    try {
      const files = []
      for await (const entry of handle.values()) {
        if (entry.kind === "file" && entry.name.endsWith(".yomii")) {
          files.push(entry.name)
        }
      }

      if (files.length === 0) {
        this.hide_loading(dialog)
        this.show_error(dialog, "選択されたフォルダに .yomii ファイルが見つかりませんでした。")
        return
      }

      const handle_key = `shelf_local_${handle.name}_${Date.now()}`
      await SourceRegistry.save_handle(handle_key, handle)

      const entry = SourceRegistry.add({
        type: "local_folder",
        name: handle.name,
        connection: { handle_key: handle_key },
      })

      this.hide_loading(dialog)
      this.close()

      if (this.on_added) {
        this.on_added(entry)
      }
    } catch (e) {
      this.hide_loading(dialog)
      this.show_error(dialog, `エラー: ${e.message}`)
    }
  }

  // ============================================================
  // pCloud 公開リンク
  // ============================================================

  show_pcloud_form(dialog) {
    dialog.querySelector(".add-dialog-sources").style.display = "none"
    const form = dialog.querySelector('.add-dialog-form[data-form="pcloud_share"]')
    form.classList.add("active")
    this.clear_error(dialog)
    form.querySelector("#pcloud-url").focus()
  }

  async connect_pcloud(dialog) {
    const form = dialog.querySelector('.add-dialog-form[data-form="pcloud_share"]')
    const url_input = form.querySelector("#pcloud-url")
    const name_input = form.querySelector("#pcloud-name")
    const url = url_input.value.trim()
    const custom_name = name_input.value.trim()

    const code = this.extract_pcloud_code(url)
    if (!code) {
      this.show_error(dialog, "有効なpCloud公開リンクURLを入力してください。\n例: https://u.pcloud.link/publink/show?code=XXXXXX")
      return
    }

    if (SourceRegistry.has_pcloud_code(code)) {
      this.show_error(dialog, "このリンクは既に追加されています。")
      return
    }

    this.show_loading(dialog)
    this.set_connect_disabled(dialog, true)

    try {
      const controller = new AbortController()
      const timeout_id = setTimeout(() => controller.abort(), 30000)

      const result = await PCloudShare.list_files(code)
      clearTimeout(timeout_id)

      const folder_name = result.folder_name || result.name || `pCloud (${code.substring(0, 6)}...)`
      const display_name = custom_name || folder_name

      const entry = SourceRegistry.add({
        type: "pcloud_share",
        name: display_name,
        connection: { code: code, url: url },
      })

      this.hide_loading(dialog)
      this.set_connect_disabled(dialog, false)
      this.close()

      if (this.on_added) {
        this.on_added(entry)
      }
    } catch (e) {
      this.hide_loading(dialog)
      this.set_connect_disabled(dialog, false)

      const msg = e.message || ""
      if (msg.includes("7001") || msg.includes("Invalid")) {
        this.show_error(dialog, "無効なリンクコードです。フォルダの公開リンクを使用してください。")
      } else if (msg.includes("7002")) {
        this.show_error(dialog, "このリンクは削除されています。")
      } else if (msg.includes("7004")) {
        this.show_error(dialog, "このリンクは有効期限が切れています。")
      } else if (msg.includes("7005")) {
        this.show_error(dialog, "トラフィック制限に達しています。しばらく待ってから再試行してください。")
      } else if (e.name === "AbortError") {
        this.show_error(dialog, "接続がタイムアウトしました。ネットワーク接続を確認してください。")
      } else {
        this.show_error(dialog, `接続に失敗しました: ${msg || "ネットワーク接続を確認してください。"}`)
      }
    }
  }

  extract_pcloud_code(url) {
    if (!url) return null
    try {
      const parsed = new URL(url)
      if (parsed.hostname.includes("pcloud.link") || parsed.hostname.includes("pcloud.com")) {
        const code = parsed.searchParams.get("code")
        if (code) return code
      }
    } catch (e) {
      // URL パースに失敗した場合、直接コードとして扱う
    }
    if (/^[a-zA-Z0-9]+$/.test(url) && url.length > 5) {
      return url
    }
    return null
  }

  // ============================================================
  // Google Drive 共有フォルダ
  // ============================================================

  show_google_drive_form(dialog) {
    dialog.querySelector(".add-dialog-sources").style.display = "none"
    const form = dialog.querySelector('.add-dialog-form[data-form="google_drive_share"]')
    form.classList.add("active")
    this.clear_error(dialog)
    form.querySelector("#gdrive-url").focus()
  }

  async connect_google_drive(dialog) {
    const form = dialog.querySelector('.add-dialog-form[data-form="google_drive_share"]')
    const url_input = form.querySelector("#gdrive-url")
    const name_input = form.querySelector("#gdrive-name")
    const url = url_input.value.trim()
    const custom_name = name_input.value.trim()

    const folder_id = GoogleDriveShare.extract_folder_id(url)
    if (!folder_id) {
      this.show_error(dialog, "有効な Google Drive 共有フォルダ URL を入力してください。\n例: https://drive.google.com/drive/folders/XXXXX")
      return
    }

    // 重複チェック
    const sources = SourceRegistry.list()
    const duplicate = sources.find(s => s.type === "google_drive_share" && s.folder_id === folder_id)
    if (duplicate) {
      this.show_error(dialog, "このフォルダは既に追加されています。")
      return
    }

    this.show_loading(dialog)
    const btn = form.querySelector(".btn-connect-gdrive")
    if (btn) btn.disabled = true

    try {
      const result = await GoogleDriveShare.list_files(folder_id)

      const file_count = (result.files || []).filter(f => f.name.endsWith(".yomii")).length
      const display_name = custom_name || `Google Drive (${file_count}冊)`

      const entry = SourceRegistry.add({
        type: "google_drive_share",
        name: display_name,
        connection: { folder_id, url },
      })

      this.hide_loading(dialog)
      this.close()

      if (this.on_added) {
        this.on_added(entry)
      }
    } catch (e) {
      this.hide_loading(dialog)
      if (btn) btn.disabled = false

      const msg = e.message || ""
      if (msg.includes("404") || msg.includes("notFound")) {
        this.show_error(dialog, "フォルダが見つかりません。共有設定で「リンクを知っている全員」に設定されているか確認してください。")
      } else {
        this.show_error(dialog, `接続に失敗しました: ${msg || "ネットワーク接続を確認してください。"}`)
      }
    }
  }

  // ============================================================
  // UI ヘルパー
  // ============================================================

  show_loading(dialog) {
    const el = dialog.querySelector(".add-dialog-loading")
    if (el) el.classList.add("active")
  }

  hide_loading(dialog) {
    const el = dialog.querySelector(".add-dialog-loading")
    if (el) el.classList.remove("active")
  }

  show_error(dialog, message) {
    const el = dialog.querySelector(".add-dialog-error")
    if (el) {
      el.textContent = message
      el.classList.add("active")
    }
  }

  clear_error(dialog) {
    const el = dialog.querySelector(".add-dialog-error")
    if (el) {
      el.textContent = ""
      el.classList.remove("active")
    }
  }

  set_connect_disabled(dialog, disabled) {
    const btn = dialog.querySelector(".btn-connect")
    if (btn) btn.disabled = disabled
  }
}
