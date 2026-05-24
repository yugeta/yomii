import { Main } from "./main.js"
import { Urlinfo } from "../../../asset/js/lib/urlinfo.js"
import { BookCache } from "../../storage/js/book_cache.js"
import { GoogleDrive } from "../../storage/js/google_drive.js"
import { PCloudShare } from "../../storage/js/pcloud_share.js"
import { SourceRegistry } from "./source_registry.js"

export class Event{
  constructor(options){
    this.options = options || {}
    this.init()
  }

  elm_lists = document.querySelector(`ul.lists`)

  init(){
    this.elm_lists.addEventListener('mousedown' , this.click_lists.bind(this))
    this.elm_lists.addEventListener('dblclick' , this.dbl_click_icon.bind(this))
    this.bind_cache_toolbar()
    this.bind_action_bar()
  }

  click_lists(e){
    this.clear_lists()
    const li = e.target.closest('li[data-id]')
    if(!li){return}
    li.setAttribute('data-status' , 'active')
    e.preventDefault()
    this.update_delete_button()
    this.update_open_button()
  }

  clear_lists(){
    const lis = this.elm_lists.querySelectorAll(':scope > li[data-id]')
    for(const li of lis){
      if(li.hasAttribute("data-status")){
        li.removeAttribute("data-status")
      }
    }
  }

  update_delete_button(){
    const btn = document.querySelector(".btn-cache-delete")
    const btn_source = document.querySelector(".btn-cache-source")
    const selected = this.elm_lists.querySelector('li[data-status="active"]')

    if(btn){
      btn.disabled = !selected
    }
    if(btn_source){
      // source_path がある場合のみ有効
      const has_source = selected && selected.getAttribute("data-source-path")
      btn_source.disabled = !has_source
    }
  }

  bind_cache_toolbar(){
    const btn_delete = document.querySelector(".btn-cache-delete")
    const btn_clear = document.querySelector(".btn-cache-clear")
    const btn_source = document.querySelector(".btn-cache-source")

    if(btn_delete){
      btn_delete.addEventListener("click", this.on_cache_delete.bind(this))
    }
    if(btn_clear){
      btn_clear.addEventListener("click", this.on_cache_clear.bind(this))
    }
    if(btn_source){
      btn_source.addEventListener("click", this.on_cache_source.bind(this))
    }
  }

  bind_action_bar(){
    const btn_open = document.querySelector(".btn-open")
    if(btn_open){
      btn_open.addEventListener("click", this.on_open.bind(this))
    }
    const btn_cache_add = document.querySelector(".btn-cache-add")
    if(btn_cache_add){
      btn_cache_add.addEventListener("click", this.on_cache_add.bind(this))
    }

    // キャッシュタブ以外で「キャッシュに入れる」ボタンを表示
    const source = new URLSearchParams(location.search).get("source") || "cache"
    if(source !== "cache" && btn_cache_add){
      btn_cache_add.style.display = ""
    }
  }

  update_open_button(){
    const btn = document.querySelector(".btn-open")
    const btn_cache_add = document.querySelector(".btn-cache-add")
    const selected = this.elm_lists.querySelector('li[data-status="active"]')
    const is_file = selected && selected.getAttribute("data-type") === "file"

    if(btn){
      btn.disabled = !selected
    }
    if(btn_cache_add){
      // ファイル選択時のみ有効、既にキャッシュ済みなら無効
      const is_cached = selected && selected.getAttribute("data-cached") === "true"
      btn_cache_add.disabled = !is_file || is_cached
      if(is_cached){
        btn_cache_add.textContent = "キャッシュ済み"
      }else{
        btn_cache_add.textContent = "キャッシュに入れる"
      }
    }
  }

  /**
   * 「開く」ボタン押下 — 選択中のアイテムを開く
   */
  on_open(){
    const li = this.elm_lists.querySelector('li[data-status="active"]')
    if(!li) return
    switch(li.getAttribute('data-type')){
      case 'dir':
        this.click_dir(li)
        break
      case 'file':
        this.click_file(li)
        break
    }
  }

  /**
   * 「キャッシュに入れる」ボタン押下 — 本を開かずにキャッシュに保存
   */
  async on_cache_add(){
    const li = this.elm_lists.querySelector('li[data-status="active"]')
    if(!li || li.getAttribute("data-type") !== "file") return

    const name = li.getAttribute("data-name")
    const btn = document.querySelector(".btn-cache-add")
    const source = new URLSearchParams(location.search).get("source") || ""

    // ボタンをローディング状態に
    if(btn){
      btn.disabled = true
      btn.textContent = "ダウンロード中..."
    }

    try{
      let source_path = ""
      let blob = null

      if(source === "pcloud"){
        const dir = new URLSearchParams(location.search).get("dir") || ""
        const pcloud_path = dir ? `/yomii/${dir}/${name}` : `/yomii/${name}`
        source_path = pcloud_path
        blob = await BookCache.get_or_download(source_path, name, async () => {
          const { PCloud } = await import("../../storage/js/pcloud.js")
          return await PCloud.download_file(pcloud_path)
        })
      }else if(source === "google_drive"){
        const file_id = li.getAttribute("data-file_id") || li.getAttribute("data-fileid")
        if(!file_id){
          alert("ファイル情報が不足しています。")
          return
        }
        source_path = `google_drive://${file_id}`
        blob = await BookCache.get_or_download(source_path, name, async () => {
          return await GoogleDrive.download_file(file_id)
        })
      }else if(source === "google_drive_share" || source.startsWith("dynamic_google_drive_share")){
        const file_id = li.getAttribute("data-file_id") || li.getAttribute("data-fileid")
        if(!file_id){
          alert("ファイル情報が不足しています。")
          return
        }
        source_path = `google_drive_share://${file_id}`
        blob = await BookCache.get_or_download(source_path, name, async () => {
          const { GoogleDriveShare } = await import("../../storage/js/google_drive_share.js")
          return await GoogleDriveShare.download_file(file_id)
        })
      }else if(source === "pcloud_share" || source.startsWith("dynamic_pcloud_share")){
        const url_params = new URLSearchParams(location.search)
        let code = url_params.get("code") || ""
        const source_id = url_params.get("source_id") || ""
        const fileid = li.getAttribute("data-fileid")

        if(!code && source_id){
          const src = SourceRegistry.get(source_id)
          if(src && src.code) code = src.code
        }

        if(!code || !fileid){
          alert("ファイル情報が不足しています。")
          return
        }

        source_path = `pcloud_share://${code}/${fileid}`
        blob = await BookCache.get_or_download(source_path, name, async () => {
          return await PCloudShare.download_file(code, fileid)
        })
      }else if(source === "sample"){
        const dir = new URLSearchParams(location.search).get("dir") || ""
        const path = dir ? `data/shelf/${dir}/${name}` : `data/shelf/${name}`
        source_path = path
        blob = await BookCache.get_or_download(source_path, name, async () => {
          const response = await fetch(path)
          if(!response.ok) throw new Error(`HTTP ${response.status}`)
          return await response.blob()
        })
      }else{
        alert("このソースではキャッシュ保存に対応していません。")
        return
      }

      // キャッシュ済みマークを付ける
      li.setAttribute("data-cached", "true")
      if(btn){
        btn.disabled = true
        btn.textContent = "キャッシュ済み"
      }
    }catch(e){
      console.error("Cache add error:", e)
      alert(`キャッシュ保存に失敗しました: ${e.message}`)
      if(btn){
        btn.disabled = false
        btn.textContent = "キャッシュに入れる"
      }
    }
  }

  async on_cache_delete(){
    const li = this.elm_lists.querySelector('li[data-status="active"]')
    if(!li) return

    const name = li.getAttribute("data-name")
    const source_path = li.getAttribute("data-source-path")
    if(!confirm(`「${name}」をキャッシュから削除しますか？`)) return

    if(source_path){
      const meta = await BookCache.get_meta(source_path)
      if(meta){
        await BookCache.remove(meta.id)
      }
    }

    li.remove()
    this.update_delete_button()
    this.update_open_button()

    // 容量情報を更新
    const total = await BookCache.get_total_size()
    const info_el = document.querySelector(".cache-info")
    if(info_el){
      const mb = (total / (1024 * 1024)).toFixed(1)
      info_el.textContent = `使用量: ${mb} MB`
    }

    // リストが空になったらメッセージ表示
    if(!this.elm_lists.querySelector("li")){
      location.reload()
    }
  }

  async on_cache_clear(){
    const count = this.elm_lists.querySelectorAll("li").length
    if(!confirm(`キャッシュを全て削除しますか？（${count} 件）`)) return

    await BookCache.clear()
    location.reload()
  }

  /**
   * 選択中のキャッシュ書籍の元の場所（pCloud タブ）に移動
   */
  on_cache_source(){
    const li = this.elm_lists.querySelector('li[data-status="active"]')
    if(!li) return

    const source_path = li.getAttribute("data-source-path") || ""
    const name = li.getAttribute("data-name") || ""
    if(!source_path) return

    // source_path からソースとディレクトリを抽出
    // 例: /yomii/dir1/dir2/book.yomii → source=pcloud, dir=dir1/dir2, current=book.yomii
    const path_parts = source_path.replace(/^\/yomii\//, "").split("/")
    const filename = path_parts.pop() // ファイル名
    const dir = path_parts.join("/")

    const params = new URLSearchParams()
    params.set("p", "shelf")
    params.set("source", "pcloud")
    if(dir){
      params.set("dir", dir)
    }
    params.set("current", filename || name)
    location.search = params.toString()
  }

  dbl_click_icon(e){
    const li = e.target.closest('li[data-id]')
    if(!li){return}
    switch(li.getAttribute('data-type')){
      case 'dir':
        this.click_dir(li)
        break
      case 'file':
        this.click_file(li)
        break
    }
  }

  click_dir(li){
    if(!li){return}
    const current_dir = new URLSearchParams(location.search).get("dir") || ''
    const dir = current_dir ? current_dir + '/' : ''
    const name = li.getAttribute('data-name')
    const source = new URLSearchParams(location.search).get("source") || 'local'
    const params = new URLSearchParams()
    params.set("p", "shelf")
    params.set("source", source)
    params.set("dir", `${dir}${name}`)
    // 共有リンクの場合は code を引き継ぐ
    const code = new URLSearchParams(location.search).get("code")
    if(code){
      params.set("code", code)
    }
    // 動的ソースの場合は source_id を引き継ぐ
    const source_id = new URLSearchParams(location.search).get("source_id")
    if(source_id){
      params.set("source_id", source_id)
    }
    // pCloud 共有リンクの場合は folderid を渡す（サブフォルダナビゲーション用）
    const folderid = li.getAttribute("data-folderid")
    if(folderid && (source === "pcloud_share" || source.startsWith("dynamic_pcloud_share"))){
      params.set("folderid", folderid)
    }
    location.search = params.toString()
  }

  click_file(li){
    if(!li){return}
    const name = li.getAttribute('data-name')
    const source = new URLSearchParams(location.search).get("source") || "cache"

    switch(source){
      case "pcloud":
        this.open_pcloud_book(name)
        break
      case "pcloud_share":
        this.open_pcloud_share_book(li)
        break
      case "google_drive":
        this.open_google_drive_book(li)
        break
      case "cache":
        this.open_cached_book(li)
        break
      case "local":
        this.open_local_book(li)
        break
      case "sample":
        this.open_sample_book(name)
        break
      default:
        // 動的ソース
        if(source.startsWith("dynamic_pcloud_share")){
          this.open_pcloud_share_book(li)
        }else if(source.startsWith("dynamic_google_drive_share")){
          this.open_google_drive_share_book(li)
        }else if(source.startsWith("dynamic_local_folder")){
          this.open_local_book(li)
        }else{
          this.open_cached_book(li)
        }
    }
  }

  /**
   * pCloud の書籍を開く
   */
  open_pcloud_book(name){
    const dir = new URLSearchParams(location.search).get("dir") || ""
    const pcloud_path = dir ? `/yomii/${dir}/${name}` : `/yomii/${name}`

    const params = new URLSearchParams()
    params.set("source", "pcloud")
    params.set("path", pcloud_path)
    params.set("book", name)
    location.href = `book.html?${params.toString()}`
  }

  /**
   * Google Drive の書籍を開く
   * BookCache.get_or_download を使用
   */
  async open_google_drive_book(li){
    const name = li.getAttribute("data-name")
    const file_id = li.getAttribute("data-file_id") || li.getAttribute("data-fileid")
    if(!file_id){
      alert("ファイル情報が不足しています。")
      return
    }

    const source_path = `google_drive://${file_id}`

    try{
      await BookCache.get_or_download(source_path, name, async () => {
        return await GoogleDrive.download_file(file_id)
      })

      // キャッシュ済みマークを付ける
      li.setAttribute("data-cached", "true")

      const params = new URLSearchParams()
      params.set("source", "google_drive")
      params.set("file_id", file_id)
      params.set("book", name)
      location.href = `book.html?${params.toString()}`
    }catch(e){
      console.error("Google Drive book open error:", e)
      alert(`書籍を開けませんでした: ${e.message}`)
    }
  }

  /**
   * Google Drive 共有フォルダの書籍を開く（読み取り専用、認証不要）
   */
  open_google_drive_share_book(li){
    const name = li.getAttribute("data-name")
    const file_id = li.getAttribute("data-file_id") || li.getAttribute("data-fileid")
    if(!file_id){
      alert("ファイル情報が不足しています。")
      return
    }

    const url_params = new URLSearchParams(location.search)
    const source_id = url_params.get("source_id") || ""

    const params = new URLSearchParams()
    params.set("source", "google_drive_share")
    params.set("file_id", file_id)
    params.set("book", name)
    if(source_id){
      params.set("source_id", source_id)
    }
    location.href = `book.html?${params.toString()}`
  }

  /**
   * Google Drive の書籍を削除
   */
  async delete_google_drive_book(li){
    const name = li.getAttribute("data-name")
    const file_id = li.getAttribute("data-file_id") || li.getAttribute("data-fileid")
    if(!file_id) return

    if(!confirm(`「${name}」を Google Drive から削除しますか？`)) return

    // 削除中は操作を無効化
    li.setAttribute("data-deleting", "true")
    li.style.opacity = "0.5"

    try{
      await GoogleDrive.delete_file(file_id)

      // ローカルキャッシュも削除
      const source_path = `google_drive://${file_id}`
      const meta = await BookCache.get_meta(source_path)
      if(meta){
        await BookCache.remove(meta.id)
      }

      // 一覧から除去
      li.remove()

    }catch(e){
      console.error("Google Drive delete error:", e)
      alert(`削除に失敗しました: ${e.message}`)
      li.removeAttribute("data-deleting")
      li.style.opacity = ""
    }
  }

  /**
   * キャッシュの書籍を Google Drive にアップロード
   */
  async upload_to_google_drive(li){
    const name = li.getAttribute("data-name")
    const source_path = li.getAttribute("data-source-path") || ""
    if(!name) return

    // 認証チェック
    if(!GoogleDrive.is_authenticated()){
      try{
        await GoogleDrive.start_auth()
      }catch(e){
        alert(`Google Drive 認証に失敗しました: ${e.message}`)
        return
      }
    }

    try{
      // キャッシュから Blob を取得
      const meta = await BookCache.get_meta(source_path)
      if(!meta){
        alert("キャッシュデータが見つかりません。")
        return
      }
      const blob = await BookCache.get_data(meta.id)
      if(!blob){
        alert("キャッシュデータが見つかりません。")
        return
      }

      // Yomii フォルダを確保
      const folder_id = await GoogleDrive.ensure_folder()

      // 同名ファイルチェック
      const existing_id = await GoogleDrive.find_file_by_name(name, folder_id)
      if(existing_id){
        if(!confirm(`「${name}」は既に Google Drive に存在します。上書きしますか？`)){
          return
        }
        // 既存ファイルを削除してからアップロード
        await GoogleDrive.delete_file(existing_id)
      }

      // アップロード実行（リトライ付き）
      let last_error = null
      for(let attempt = 0; attempt < 3; attempt++){
        try{
          await GoogleDrive.upload_file(blob, name, (rate) => {
            // プログレス表示（簡易）
            li.style.background = `linear-gradient(to right, #e3f2fd ${rate}%, transparent ${rate}%)`
          })
          li.style.background = ""
          alert(`「${name}」を Google Drive にアップロードしました。`)
          return
        }catch(e){
          last_error = e
          // 容量不足はリトライしない
          if(e.message.includes("容量")){
            throw e
          }
          await new Promise(r => setTimeout(r, 1000))
        }
      }
      throw last_error

    }catch(e){
      console.error("Google Drive upload error:", e)
      li.style.background = ""
      alert(`アップロードに失敗しました: ${e.message}`)
    }
  }

  /**
   * pCloud 公開リンク共有の書籍を開く
   */
  open_pcloud_share_book(li){
    const name = li.getAttribute("data-name")
    const fileid = li.getAttribute("data-fileid")
    const url_params = new URLSearchParams(location.search)
    let code = url_params.get("code") || ""
    const source_id = url_params.get("source_id") || ""

    // 動的ソースの場合、SourceRegistry からコードを取得
    if(!code){
      if(source_id){
        const source = SourceRegistry.get(source_id)
        if(source && source.code){
          code = source.code
        }
      }
    }

    if(!fileid || !code){
      alert("ファイル情報が不足しています。")
      return
    }

    const params = new URLSearchParams()
    params.set("source", "pcloud_share")
    params.set("code", code)
    params.set("fileid", fileid)
    params.set("book", name)
    if(source_id){
      params.set("source_id", source_id)
    }
    const dir = url_params.get("dir") || ""
    if(dir){
      params.set("dir", dir)
    }
    const folderid = url_params.get("folderid") || ""
    if(folderid){
      params.set("folderid", folderid)
    }
    location.href = `book.html?${params.toString()}`
  }

  /**
   * キャッシュ済み書籍を開く
   */
  open_cached_book(li){
    const name = li.getAttribute("data-name")
    const source_path = li.getAttribute("data-source-path") || ""

    const params = new URLSearchParams()
    params.set("source", "cache")
    params.set("path", source_path)
    params.set("book", name)
    location.href = `book.html?${params.toString()}`
  }

  /**
   * ローカルフォルダの書籍を開く
   */
  open_local_book(li){
    const name = li.getAttribute("data-name")
    // ローカルファイルは book.html で File System Access API 経由で読み込む
    const params = new URLSearchParams()
    params.set("source", "local")
    params.set("book", name)
    // サブフォルダ内の場合は dir を引き継ぐ
    const dir = new URLSearchParams(location.search).get("dir") || ""
    if(dir){
      params.set("dir", dir)
    }
    location.href = `book.html?${params.toString()}`
  }

  /**
   * サンプル書籍を開く
   */
  open_sample_book(name){
    const dir = new URLSearchParams(location.search).get("dir") || ""
    const params = new URLSearchParams()
    params.set("source", "sample")
    params.set("dir", dir)
    params.set("book", name)
    location.href = `book.html?${params.toString()}`
  }

  get_active(){

  }

  finish(){
    if(this.options.callback){
      this.options.callback(this)
    }
  }
}
