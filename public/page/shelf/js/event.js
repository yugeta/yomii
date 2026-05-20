import { Main } from "./main.js"
import { Urlinfo } from "../../../asset/js/lib/urlinfo.js"
import { BookCache } from "../../storage/js/book_cache.js"

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
    if(!btn) return
    const selected = this.elm_lists.querySelector('li[data-status="active"]')
    btn.disabled = !selected
  }

  bind_cache_toolbar(){
    const btn_delete = document.querySelector(".btn-cache-delete")
    const btn_clear = document.querySelector(".btn-cache-clear")

    if(btn_delete){
      btn_delete.addEventListener("click", this.on_cache_delete.bind(this))
    }
    if(btn_clear){
      btn_clear.addEventListener("click", this.on_cache_clear.bind(this))
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
