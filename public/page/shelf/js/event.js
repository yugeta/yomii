import { Main } from "./main.js"
import { Urlinfo } from "../../../asset/js/lib/urlinfo.js"
import { BookCache } from "../../storage/js/book_cache.js"
import { PCloudShare } from "../../storage/js/pcloud_share.js"

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
  }

  click_lists(e){
    this.clear_lists()
    const li = e.target.closest('li[data-id]')
    if(!li){return}
    li.setAttribute('data-status' , 'active')
    e.preventDefault()
    this.update_delete_button()
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
        this.open_cached_book(li)
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
   * pCloud 公開リンク共有の書籍を開く
   */
  open_pcloud_share_book(li){
    const name = li.getAttribute("data-name")
    const fileid = li.getAttribute("data-fileid")
    const code = new URLSearchParams(location.search).get("code") || ""

    if(!fileid || !code){
      alert("ファイル情報が不足しています。")
      return
    }

    const params = new URLSearchParams()
    params.set("source", "pcloud_share")
    params.set("code", code)
    params.set("fileid", fileid)
    params.set("book", name)
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
