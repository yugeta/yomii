import { Main } from "./main.js"
import { Urlinfo } from "../../../asset/js/lib/urlinfo.js"

export class Event{
  constructor(options){
    this.options = options || {}
    this.init()
  }

  elm_lists = document.querySelector(`ul.lists`)

  init(){
    this.elm_lists.addEventListener('mousedown' , this.click_lists.bind(this))
    this.elm_lists.addEventListener('dblclick' , this.dbl_click_icon.bind(this))
  }

  click_lists(e){
    this.clear_lists()
    const li = e.target.closest('li[data-id]')
    if(!li){return}
    li.setAttribute('data-status' , 'active')
    e.preventDefault()
  }

  clear_lists(){
    const lis = this.elm_lists.querySelectorAll(':scope > li[data-id]')
    for(const li of lis){
      if(li.hasAttribute("data-status")){
        li.removeAttribute("data-status")
      }
    }
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
    const source = new URLSearchParams(location.search).get("source") || "local"

    if(source === "pcloud"){
      this.open_pcloud_book(name)
    }else{
      const dir = new Urlinfo().queries.dir ? new Urlinfo().queries.dir + '/' : ''
      location.href = `book.html?dir=${dir}&book=${name}`
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

  get_active(){

  }

  finish(){
    if(this.options.callback){
      this.options.callback(this)
    }
  }
}
