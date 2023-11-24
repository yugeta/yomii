import { Common } from './common.js'
import { Book }   from './book.js'

export class List{
  data  = null
  pages = []

  constructor(options){
    this.options = options || {}
    this.data = this.options.book
    this.set_pages()
  }

  set_pages(){
    if(!Book.data || !Book.data.datas || !Book.data.datas.length){return}
    
    for(let i=0; i<Book.data.datas.length; i++){
      const div = document.createElement("div")
      div.className = "page"
      div.setAttribute("data-page-num" , i)
      const p   = document.createElement("p")
      p.className = "page-num"
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
      Common.list.appendChild(div)
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
    List.set_active()
  }

  static set_active(){
    const num = Book.page_num
    const cnt = Book.page_count
    const pages = Common.list.querySelectorAll(`.page[data-page-num]`)
    for(const page of pages){
      const page_num = Number(page.getAttribute("data-page-num"))
      if(page_num >= num && page_num <= num+cnt){
        page.setAttribute("data-status","active")
      }
      else{
        page.setAttribute("data-status","passive")
      }
    }
    // List.set_center()
    setTimeout(List.set_center , 0)
  }
  static set_center(){
    const book_list = Common.list
    const page_elm = book_list.querySelector(`[data-page-num="${Book.page_num}"]`)
    const left = page_elm.offsetLeft
    const width = page_elm.offsetWidth
    const scroll = book_list.scrollWidth
    const view_w = book_list.offsetWidth
    const center = left + width/2 - view_w/2
    Common.list.scrollLeft = center
  }

}