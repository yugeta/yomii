/**
 * TabInfoDialog - 動的タブの情報・編集ダイアログ
 * 
 * 動的タブの「ⓘ」ボタンクリック時にモーダルを表示し、
 * タブ名の変更、URL修正、削除を行える。
 */
import { SourceRegistry } from "./source_registry.js"
import { PCloudShare } from "../../storage/js/pcloud_share.js"

export class TabInfoDialog {

  constructor(options) {
    this.options = options || {}
    this.source = options.source
    this.on_updated = options.on_updated || null
    this.on_deleted = options.on_deleted || null
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
    dialog.setAttribute("aria-label", "タブ情報")

    const type_label = this.get_type_label()
    const url_section = this.get_url_section()

    dialog.innerHTML = `
      <button class="add-dialog-close" aria-label="閉じる">×</button>
      <h3>タブ情報</h3>
      
      <div class="tab-info-form">
        <div class="tab-info-type">
          <span class="tab-info-type-label">${type_label}</span>
        </div>

        <label for="tab-info-name">タブ名</label>
        <input type="text" id="tab-info-name" value="${this.escape_attr(this.source.name)}" maxlength="50">

        ${url_section}

        <div class="add-dialog-loading">
          <span class="spinner"></span>
          <span>接続を確認中...</span>
        </div>
        <div class="add-dialog-error"></div>

        <div class="tab-info-actions">
          <button class="btn-tab-delete">削除</button>
          <button class="btn-tab-save">保存</button>
        </div>
      </div>
    `

    this.overlay.appendChild(dialog)
    this.bind_events(dialog)
  }

  get_type_label() {
    switch (this.source.type) {
      case "pcloud_share": return "☁️ pCloud 公開リンク"
      case "local_folder": return "📁 ローカルフォルダ"
      case "google_drive": return "📄 Google Drive"
      default: return this.source.type
    }
  }

  get_url_section() {
    if (this.source.type === "pcloud_share") {
      const url = this.source.url || `https://u.pcloud.link/publink/show?code=${this.source.code || ""}`
      return `
        <label for="tab-info-url" style="margin-top:12px;">pCloud 公開リンク URL</label>
        <input type="url" id="tab-info-url" value="${this.escape_attr(url)}">
      `
    }
    if (this.source.type === "local_folder") {
      return `
        <div class="tab-info-readonly" style="margin-top:12px;">
          <label>フォルダ</label>
          <span class="tab-info-value">${this.escape_html(this.source.handle_key || "")}</span>
          <p class="tab-info-note">※ ローカルフォルダのパスは変更できません。別のフォルダを使う場合は削除して再追加してください。</p>
        </div>
      `
    }
    return ""
  }

  // ============================================================
  // イベントバインド
  // ============================================================

  bind_events(dialog) {
    dialog.querySelector(".add-dialog-close").addEventListener("click", () => this.close())

    dialog.querySelector(".btn-tab-save").addEventListener("click", () => {
      this.save(dialog)
    })

    dialog.querySelector(".btn-tab-delete").addEventListener("click", () => {
      this.delete_source(dialog)
    })

    // Enterキーで保存
    const name_input = dialog.querySelector("#tab-info-name")
    if (name_input) {
      name_input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") this.save(dialog)
      })
    }
  }

  // ============================================================
  // 保存
  // ============================================================

  async save(dialog) {
    const name_input = dialog.querySelector("#tab-info-name")
    const new_name = name_input.value.trim()

    if (!new_name) {
      this.show_error(dialog, "タブ名を入力してください。")
      return
    }

    const updates = { name: new_name }

    // pCloud の場合、URL変更を検証
    if (this.source.type === "pcloud_share") {
      const url_input = dialog.querySelector("#tab-info-url")
      const new_url = url_input.value.trim()
      const new_code = this.extract_pcloud_code(new_url)

      if (!new_code) {
        this.show_error(dialog, "有効なpCloud公開リンクURLを入力してください。")
        return
      }

      // コードが変わった場合は接続検証
      if (new_code !== this.source.code) {
        // 重複チェック
        if (SourceRegistry.has_pcloud_code(new_code)) {
          this.show_error(dialog, "このリンクは既に別のタブで追加されています。")
          return
        }

        this.show_loading(dialog)
        try {
          await PCloudShare.list_files(new_code)
          this.hide_loading(dialog)
        } catch (e) {
          this.hide_loading(dialog)
          this.show_error(dialog, `接続に失敗しました: ${e.message}`)
          return
        }

        updates.code = new_code
        updates.url = new_url
      }
    }

    // 保存
    SourceRegistry.update(this.source.id, updates)
    this.close()

    if (this.on_updated) {
      this.on_updated({ ...this.source, ...updates })
    }
  }

  // ============================================================
  // 削除
  // ============================================================

  delete_source(dialog) {
    if (!confirm(`「${this.source.name}」タブを削除しますか？`)) return

    SourceRegistry.remove(this.source.id)

    if (this.source.type === "local_folder" && this.source.handle_key) {
      SourceRegistry.remove_handle(this.source.handle_key)
    }

    this.close()

    if (this.on_deleted) {
      this.on_deleted(this.source)
    }
  }

  // ============================================================
  // ユーティリティ
  // ============================================================

  extract_pcloud_code(url) {
    if (!url) return null
    try {
      const parsed = new URL(url)
      if (parsed.hostname.includes("pcloud.link") || parsed.hostname.includes("pcloud.com")) {
        const code = parsed.searchParams.get("code")
        if (code) return code
      }
    } catch (e) {
      // pass
    }
    if (/^[a-zA-Z0-9]+$/.test(url) && url.length > 5) {
      return url
    }
    return null
  }

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

  escape_html(str) {
    const div = document.createElement("div")
    div.textContent = str
    return div.innerHTML
  }

  escape_attr(str) {
    return (str || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  }
}
