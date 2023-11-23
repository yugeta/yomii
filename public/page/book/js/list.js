import { Common } from './common.js'
import { Book }   from './book.js'

export class List{
  data  = null
  pages = []
  page_num = 0

  constructor(options){
    this.options = options || {}
    this.data = this.options.book
    this.set_pages()
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
  }

}