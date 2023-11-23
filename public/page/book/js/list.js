import { Book } from './book.js'
import { Urlinfo } from '../../../asset/js/lib/urlinfo.js'

export class List{
  data  = null
  pages = []
  main  = document.querySelector(`main`)
  area  = this.main.querySelector(`.book-list`)
  page_num = 0
  elm_pages = document.querySelector(`.menu a[href="#pages"`)

  constructor(options){
    this.options = options || {}
    this.data = this.options.book
    this.set_event()
    this.set_pages()
  }

  set_event(){
    if(this.elm_pages){
      this.elm_pages.onclick = (()=>{return false})
      this.elm_pages.addEventListener("click" , this.click_pages.bind(this))

    }
  }
  click_pages(){
    const urlinfo = new Urlinfo()
    if(urlinfo.hash === "#pages"){
      const url = `${urlinfo.url}?${urlinfo.query}`
      history.pushState(null , null , url);
      // location.href = url
      this.visible(false)
    }
    else{
      const url = `${urlinfo.url}?${urlinfo.query}#pages`
      history.pushState(null , null , url);
      // location.href = url
      this.visible(true)
    }
  }

  set_pages(){
    if(!Book.data || !Book.data.datas || !Book.data.datas.length){return}
    
    for(let i=0; i<Book.data.datas.length; i++){
      const div = document.createElement("div")
      const p   = document.createElement("p")
      const img = new Image()
      img.onload = this.loaded_image.bind(this, i)
      img.src = `data:image/webp;base64,${Book.data.datas[i]}`
      this.pages[i] = {
        w : null,
        h : null,
        img : img,
        status : "loading"
      }
      div.appendChild(p)
      div.appendChild(img)
      this.area.appendChild(div)
      img.setAttribute("data-page" , i)
    }
  }
  loaded_image(num, e){
    const w = e.target.naturalWidth
    const h = e.target.naturalHeight
    this.pages[num].w = w
    this.pages[num].h = h
    this.pages[num].status = "success"
    this.pages[num].size_direction = w < h ? "horizontal" : "vertical"
    this.finish_images()
  }

  finish_images(){
    const loaded_count = this.pages.filter(e => e.status === "success").length
    if(loaded_count !== this.pages.length){return}
  }

  visible(flg){
    switch(flg){
      case true:
        document.getElementById("pages").setAttribute("data-status", "active")
        break
      default:
        document.getElementById("pages").removeAttribute("data-status")
        break
    }
  }

}