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
    const dir = new Urlinfo().queries.dir ? new Urlinfo().queries.dir + '/' : ''
    const name = li.getAttribute('data-name')
    new Urlinfo().add_query("dir",`${dir}${name}`)
    new Main({
      reload : true
    })
  }

  click_file(li){
    if(!li){return}
    const name = li.getAttribute('data-name')
    const dir = new Urlinfo().queries.dir ? new Urlinfo().queries.dir + '/' : ''
    const urlinfo = new Urlinfo()
    const url = `book.html?dir=${dir}&book=${name}`
    location.href = url
  }

  get_active(){

  }

  finish(){
    if(this.options.callback){
      this.options.callback(this)
    }
  }
}