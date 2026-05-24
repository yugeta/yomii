import { Load }  from './load.js'
import { View }  from './view.js'
import { Event } from './event.js'
import { Breadcrumps } from './breadcrumps.js'
import { Urlinfo } from "../../../asset/js/lib/urlinfo.js"
import { SourceRegistry } from './source_registry.js'
import { AddDialog } from './add_dialog.js'
import { TabInfoDialog } from './tab_info_dialog.js'
import { GoogleDrive } from "../../storage/js/google_drive.js"
import { BookCache } from "../../storage/js/book_cache.js"
import { format_storage_size, check_low_storage, aggregate_file_stats } from "../../storage/js/google_drive_utils.js"

export class Main{
  constructor(options){
    this.options = options || {}
    if(!options){
      new Event()
      this.bind_tabs()
    }
    new Breadcrumps()

    const source = new Urlinfo().queries.source || "cache"
    this.set_active_tab(source)

    // 動的タブを生成
    this.render_dynamic_tabs()

    // 共有リンクモードの場合、タブを非表示にして共有ヘッダーを表示
    if(source === "pcloud_share"){
      this.show_share_header()
    }

    // 「+」ボタンのバインド
    this.bind_add_button()

    new Load({
      source   : source,
      dir      : new Urlinfo().queries.dir || '',
      source_id: new Urlinfo().queries.source_id || '',
      callback : this.view.bind(this),
    })
  }

  view(load_cls){
    const empty_el = document.querySelector(".shelf-empty")
    const toolbar = document.querySelector(".cache-toolbar")
    const source = new URLSearchParams(location.search).get("source") || "cache"

    // キャッシュツールバーの表示制御
    if(toolbar){
      toolbar.style.display = (source === "cache") ? "" : "none"
    }

    // Google Drive ヘッダーの表示制御
    const gd_header = document.querySelector(".google-drive-header")
    if(gd_header){
      gd_header.style.display = (source === "google_drive") ? "" : "none"
    }

    if(load_cls.error_message){
      document.querySelector("ul.lists").innerHTML = ""
      if(empty_el){
        empty_el.style.display = ""
        // Google Drive 未認証時は接続ボタンを表示
        if(source === "google_drive" && !GoogleDrive.is_authenticated()){
          empty_el.innerHTML = `
            <p class="empty-title">${load_cls.error_message}</p>
            <p><button class="btn-google-drive-connect">Google Drive に接続</button></p>
          `
          const btn = empty_el.querySelector(".btn-google-drive-connect")
          if(btn){
            btn.addEventListener("click", () => this.on_google_drive_connect())
          }
        }else{
          empty_el.textContent = load_cls.error_message
        }
      }
      return
    }

    if(!load_cls.datas || load_cls.datas.length === 0){
      document.querySelector("ul.lists").innerHTML = ""
      if(empty_el){
        empty_el.style.display = ""
        empty_el.innerHTML = this.get_empty_message(load_cls.source || new URLSearchParams(location.search).get("source") || "cache")
      }
      return
    }

    if(empty_el){
      empty_el.style.display = "none"
    }

    new View({
      datas: load_cls.datas,
    })

    // 直前に読んでいた本をハイライト＆スクロール
    this.highlight_current_book()

    // キャッシュ済みの本にマーキング（キャッシュタブ以外）
    if(source !== "cache"){
      this.mark_cached_books()
    }

    // キャッシュタブの場合、容量情報を表示
    if(source === "cache" && toolbar){
      this.update_cache_info()
    }

    // Google Drive タブの場合、ヘッダー表示
    if(source === "google_drive"){
      this.show_google_drive_header(load_cls.datas)
    }
  }

  /**
   * URLパラメータ current に一致する本をハイライトしてスクロール
   */
  highlight_current_book(){
    const current = new URLSearchParams(location.search).get("current")
    if(!current) return

    const lists = document.querySelector("ul.lists")
    if(!lists) return

    const items = lists.querySelectorAll("li[data-name]")
    for(const li of items){
      if(li.getAttribute("data-name") === current){
        li.setAttribute("data-current", "true")
        // 少し待ってからスクロール（レンダリング完了後）
        requestAnimationFrame(() => {
          li.scrollIntoView({ behavior: "smooth", block: "center" })
        })
        break
      }
    }
  }

  async update_cache_info(){
    const { BookCache } = await import("../../storage/js/book_cache.js")
    const all = await BookCache.list()
    const total = all.reduce((sum, item) => sum + (item.size || 0), 0)
    const info_el = document.querySelector(".cache-info")
    if(info_el){
      const mb = (total / (1024 * 1024)).toFixed(1)
      const max_mb = (BookCache.MAX_CACHE_SIZE / (1024 * 1024)).toFixed(0)
      info_el.textContent = `${all.length} 冊 / ${mb} MB（上限 ${max_mb} MB）`
    }
  }

  /**
   * キャッシュ済みの本に「ダウンロード済み」マークを付ける
   */
  async mark_cached_books(){
    const { BookCache } = await import("../../storage/js/book_cache.js")
    const cached_list = await BookCache.list()
    if(!cached_list || cached_list.length === 0) return

    // キャッシュされた書籍名のセットを作成
    const cached_names = new Set(cached_list.map(item => item.name))

    const lists = document.querySelector("ul.lists")
    if(!lists) return

    const items = lists.querySelectorAll('li[data-type="file"]')
    for(const li of items){
      const name = li.getAttribute("data-name")
      if(name && cached_names.has(name)){
        li.setAttribute("data-cached", "true")
      }
    }
  }

  bind_tabs(){
    const tabs = document.querySelectorAll(".shelf-tab")
    for(const tab of tabs){
      tab.addEventListener("click", this.on_tab_click.bind(this))
    }

    // モバイル用プルダウン
    const select = document.querySelector(".shelf-tab-select")
    if(select){
      select.addEventListener("change", this.on_tab_select_change.bind(this))
    }

    // ビュー切り替え
    const view_btns = document.querySelectorAll(".view-btn")
    for(const btn of view_btns){
      btn.addEventListener("click", this.on_view_toggle.bind(this))
    }

    // 保存済みのビュー設定を復元
    const saved_view = localStorage.getItem("yomii_shelf_view") || "icon"
    this.set_view(saved_view)
  }

  on_tab_click(e){
    const source = e.currentTarget.getAttribute("data-source")
    
    const params = new URLSearchParams(location.search)
    params.set("p", "shelf")
    params.set("source", source)
    params.delete("dir")
    params.delete("source_id")
    params.delete("folderid")
    location.search = params.toString()
  }

  on_tab_select_change(e){
    const value = e.target.value
    // dynamic_ プレフィックスの場合は source_id を含む
    // 形式: dynamic_{type}_{uuid}
    if(value.startsWith("dynamic_")){
      // dynamic_pcloud_share_c5f3d111-... のようなフォーマット
      // type部分とid部分を分離
      const parts = value.match(/^(dynamic_[^_]+(?:_[^_]+)?)_([0-9a-f]{8}-.+)$/)
      if(parts){
        const source_type = parts[1]
        const source_id = parts[2]
        const params = new URLSearchParams()
        params.set("p", "shelf")
        params.set("source", source_type)
        params.set("source_id", source_id)
        location.search = params.toString()
      }
    }else{
      const params = new URLSearchParams()
      params.set("p", "shelf")
      params.set("source", value)
      location.search = params.toString()
    }
  }

  on_view_toggle(e){
    const view = e.currentTarget.getAttribute("data-view")
    this.set_view(view)
    localStorage.setItem("yomii_shelf_view", view)
  }

  set_view(view){
    const lists = document.querySelector("ul.lists")
    if(lists){
      lists.setAttribute("data-view", view)
    }

    const btns = document.querySelectorAll(".view-btn")
    for(const btn of btns){
      if(btn.getAttribute("data-view") === view){
        btn.classList.add("active")
      }else{
        btn.classList.remove("active")
      }
    }
  }

  set_active_tab(source){
    const tabs = document.querySelectorAll(".shelf-tab")
    for(const tab of tabs){
      if(tab.getAttribute("data-source") === source){
        tab.classList.add("active")
      }else{
        tab.classList.remove("active")
      }
    }

    // モバイル用プルダウンも同期
    const select = document.querySelector(".shelf-tab-select")
    if(select){
      // 固定タブの場合
      const option = select.querySelector(`option[value="${source}"]`)
      if(option){
        select.value = source
      }
    }
  }

  /**
   * 共有リンクモード時のUI表示
   */
  show_share_header(){
    const tabs = document.querySelector(".shelf-tabs")
    if(tabs){
      tabs.style.display = "none"
    }

    const h2 = document.querySelector("h2")
    if(h2){
      h2.textContent = "共有本棚"
    }
  }

  get_empty_message(source){
    switch(source){
      case "cache":
        return `
          <p class="empty-title">本棚に書籍がありません</p>
          <p class="empty-help">書籍を追加するには：</p>
          <ol class="empty-steps">
            <li><a href="./?p=convert">アップロード</a>ページで書籍ファイル（ZIP/PDF）を変換する</li>
            <li>変換後、保存先で「pCloud」を選択してアップロードする</li>
            <li>「pCloud」タブから書籍を開くと、自動的にキャッシュされます</li>
          </ol>
        `
      case "pcloud":
        return `
          <p class="empty-title">pCloud に書籍がありません</p>
          <p class="empty-help">書籍を追加するには：</p>
          <ol class="empty-steps">
            <li><a href="./?p=convert">アップロード</a>ページで書籍ファイルを変換・保存する</li>
            <li>または、pCloud の <code>/yomii/</code> フォルダに .yomii ファイルを直接配置する</li>
          </ol>
          <p class="empty-note">※ <a href="./?p=mypage">マイページ</a>で pCloud 連携が完了している必要があります</p>
        `
      case "google_drive":
        return `
          <p class="empty-title">Google Drive に書籍がありません</p>
          <p class="empty-help">書籍を追加するには：</p>
          <ol class="empty-steps">
            <li><a href="./?p=convert">アップロード</a>ページで書籍ファイルを変換し、Google Drive に保存する</li>
            <li>または、Google Drive の「Yomii」フォルダに .yomii ファイルを直接配置する</li>
          </ol>
        `
      case "pcloud_share":
        return `
          <p class="empty-title">共有本棚に書籍がありません</p>
          <p class="empty-help">この公開リンクには .yomii ファイルが含まれていません。</p>
        `
      case "local":
        return `
          <p class="empty-title">ローカルフォルダが未設定です</p>
          <p class="empty-help"><a href="./?p=mypage">マイページ</a>で書籍フォルダを選択してください。</p>
          <p class="empty-note">※ .yomii ファイルが含まれるフォルダを指定します</p>
        `
      case "sample":
        return `
          <p class="empty-title">サンプル書籍がありません</p>
          <p class="empty-help">サーバーの <code>data/shelf/</code> フォルダにサンプル .yomii ファイルを配置してください。</p>
        `
      default:
        return `<p class="empty-title">書籍がありません</p>`
    }
  }

  // ============================================================
  // 動的タブ管理
  // ============================================================

  /**
   * SourceRegistry から動的タブを生成して DOM に追加
   */
  render_dynamic_tabs(){
    const sources = SourceRegistry.list()
    const add_btn = document.querySelector(".shelf-tab-add")
    if(!add_btn) return

    // 既存の動的タブを削除
    const existing = document.querySelectorAll(".shelf-tab-dynamic")
    for(const el of existing){
      el.remove()
    }

    // 動的タブを「+」ボタンの前に挿入
    for(const source of sources){
      const tab = this.create_dynamic_tab(source)
      add_btn.parentNode.insertBefore(tab, add_btn)
    }

    // モバイル用プルダウンに動的タブのオプションを追加
    const select = document.querySelector(".shelf-tab-select")
    if(select){
      // 既存の動的オプションを削除
      const dynamic_options = select.querySelectorAll("option[data-dynamic]")
      for(const opt of dynamic_options) opt.remove()

      // 動的ソースをオプションとして追加
      for(const source of sources){
        const option = document.createElement("option")
        option.value = `dynamic_${source.type}_${source.id}`
        option.textContent = source.name
        option.setAttribute("data-dynamic", "true")
        select.appendChild(option)
      }
    }

    // アクティブ状態の設定（sourceがdynamic_で始まる場合のみ）
    const current_source = new Urlinfo().queries.source || "cache"
    const current_source_id = new Urlinfo().queries.source_id
    if(current_source_id && current_source.startsWith("dynamic_")){
      const active_tab = document.querySelector(`.shelf-tab-dynamic[data-source-id="${current_source_id}"]`)
      if(active_tab){
        // 固定タブのアクティブを解除
        const tabs = document.querySelectorAll(".shelf-tab")
        for(const t of tabs) t.classList.remove("active")
        active_tab.classList.add("active")
      }

      // モバイル用プルダウンも同期
      if(select){
        select.value = `dynamic_${current_source.replace("dynamic_", "")}_${current_source_id}`
      }
    }
  }

  /**
   * 動的タブの DOM 要素を生成
   */
  create_dynamic_tab(source){
    const tab = document.createElement("button")
    tab.className = "shelf-tab shelf-tab-dynamic"
    tab.setAttribute("data-source", `dynamic_${source.type}`)
    tab.setAttribute("data-source-id", source.id)

    // 表示名（20文字で切り詰め）
    const display_name = source.name.length > 20
      ? source.name.substring(0, 20) + "…"
      : source.name

    tab.innerHTML = `
      <span class="tab-label">${this.escape_html(display_name)}</span>
      <span class="tab-info-btn" title="タブ情報">ⓘ</span>
    `

    // タブクリック
    tab.addEventListener("click", (e) => {
      // 情報ボタンのクリックは除外
      if(e.target.classList.contains("tab-info-btn")) return
      this.on_dynamic_tab_click(source)
    })

    // 情報ボタン
    tab.querySelector(".tab-info-btn").addEventListener("click", (e) => {
      e.stopPropagation()
      this.on_dynamic_tab_info(source, tab)
    })

    return tab
  }

  /**
   * 動的タブクリック時の処理
   */
  on_dynamic_tab_click(source){
    const params = new URLSearchParams()
    params.set("p", "shelf")
    params.set("source", `dynamic_${source.type}`)
    params.set("source_id", source.id)
    location.search = params.toString()
  }

  /**
   * 動的タブ情報ダイアログ表示
   */
  on_dynamic_tab_info(source, tab_el){
    const dialog = new TabInfoDialog({
      source: source,
      on_updated: (updated_source) => {
        // タブ名を更新
        const label = tab_el.querySelector(".tab-label")
        if(label){
          const display_name = updated_source.name.length > 20
            ? updated_source.name.substring(0, 20) + "…"
            : updated_source.name
          label.textContent = display_name
        }
      },
      on_deleted: (deleted_source) => {
        // DOM から削除
        tab_el.remove()

        // 削除したタブがアクティブだった場合、キャッシュタブに戻る
        const current_source_id = new URLSearchParams(location.search).get("source_id")
        if(current_source_id === deleted_source.id){
          const params = new URLSearchParams()
          params.set("p", "shelf")
          params.set("source", "cache")
          location.search = params.toString()
        }
      }
    })
    dialog.show()
  }

  /**
   * 「+」ボタンのバインド
   */
  bind_add_button(){
    const btn = document.querySelector(".shelf-tab-add")
    if(!btn) return

    // 共有リンクモードでは非表示
    const source = new Urlinfo().queries.source || "cache"
    if(source === "pcloud_share"){
      btn.style.display = "none"
      return
    }

    btn.addEventListener("click", () => {
      const dialog = new AddDialog({
        on_added: (entry) => {
          // 追加成功 → そのタブに遷移
          this.on_dynamic_tab_click(entry)
        }
      })
      dialog.show()
    })
  }

  /**
   * HTML エスケープ
   */
  escape_html(str){
    const div = document.createElement("div")
    div.textContent = str
    return div.innerHTML
  }

  // ============================================================
  // Google Drive ヘッダー管理
  // ============================================================

  /**
   * Google Drive ヘッダー（容量表示・接続解除ボタン）を表示
   */
  show_google_drive_header(datas){
    const header = document.querySelector(".google-drive-header")
    if(!header) return

    header.style.display = ""

    // ファイル統計表示
    const stats = aggregate_file_stats(datas || [])
    const quota_el = header.querySelector(".google-drive-quota")
    if(quota_el){
      const size_str = format_storage_size(stats.total_size)
      quota_el.textContent = `${stats.count} 冊 / ${size_str}`
    }

    // 接続解除ボタン
    const disconnect_btn = header.querySelector(".btn-google-drive-disconnect")
    if(disconnect_btn){
      disconnect_btn.style.display = ""
      disconnect_btn.onclick = () => this.on_google_drive_disconnect()
    }

    // ストレージ容量を非同期で取得
    this.load_google_drive_quota()
  }

  /**
   * Google Drive ストレージ容量を取得して表示
   */
  async load_google_drive_quota(){
    const quota_el = document.querySelector(".google-drive-quota")
    if(!quota_el) return

    try{
      const quota = await GoogleDrive.get_storage_quota()
      const usage_str = format_storage_size(quota.usage)
      const limit_str = format_storage_size(quota.limit)
      const remaining_str = format_storage_size(quota.remaining)

      let text = `使用: ${usage_str} / ${limit_str}（残り ${remaining_str}）`
      if(check_low_storage(quota.remaining)){
        text += " ⚠️ 容量が少なくなっています"
      }
      quota_el.textContent = text
    }catch(e){
      // 容量取得失敗時は非表示（書籍一覧に影響しない）
      console.error("Google Drive quota error:", e)
    }
  }

  /**
   * Google Drive 接続解除
   */
  on_google_drive_disconnect(){
    if(!confirm("Google Drive との接続を解除しますか？ローカルキャッシュは保持されます。")) return

    try{
      GoogleDrive.logout()
      // ページリロードで未認証状態に
      const params = new URLSearchParams(location.search)
      params.set("source", "google_drive")
      location.search = params.toString()
    }catch(e){
      alert(`接続解除に失敗しました: ${e.message}`)
    }
  }

  /**
   * Google Drive に接続（OAuth 認証フロー開始）
   */
  async on_google_drive_connect(){
    try{
      await GoogleDrive.start_auth()
      // 認証成功 → ページリロード
      const params = new URLSearchParams(location.search)
      params.set("source", "google_drive")
      location.search = params.toString()
    }catch(e){
      console.error("Google Drive auth error:", e)
      alert(`Google Drive 認証に失敗しました: ${e.message}`)
    }
  }
}

switch(document.readyState){
  case 'complete':
  case 'interactive':
    new Main()
    break
  default:
    window.addEventListener('DOMContentLoaded' , (()=>new Main()))
    break
}
