import { Common } from './common.js'
import { Book }   from './book.js'

export class List{
  data  = null
  static groups = []
  pages = []

  constructor(options){
    this.options = options || {}
    this.data = this.options.book
    this.set_image()
    // this.set_pages()
  }

  set_image(){
    if(!Book.data || !Book.data.datas || !Book.data.datas.length){return}
    for(let i=0; i<Book.data.datas.length; i++){
      const img = new Image()
      img.onload = this.loaded_image.bind(this, i)
      img.src = `data:image/webp;base64,${Book.data.datas[i]}`
      Book.pages[i] = {
        page : i,
        w : null,
        h : null,
        img : img,
        status : "loading",
        dimension : null,
      }
    }
  }

  loaded_image(num, e){
    const w = e.target.naturalWidth
    const h = e.target.naturalHeight
    Book.pages[num].w = w
    Book.pages[num].h = h
    Book.pages[num].status = "success"
    Book.pages[num].dimension = w < h ? "horizontal" : "vertical"
    this.finish_images()
  }

  finish_images(){
    const loaded_count = Book.pages.filter(e => e.status === "success").length
    if(loaded_count !== Book.pages.length){return}
    // Book.view_page(Book.page_num)
    this.set_group()
  }

  set_group(){
    let group_num = 0
    for(let i=0; i<Book.pages.length; i++){
      const page = Book.pages[i]
      const next = Book.pages[i+1] || null
      page.group = group_num
      switch(page.dimension){
        case "vertical":
          break
        case "horizontal":
          if(next && next.dimension === "horizontal"){
            next.group = group_num
            i++
          }
          break
        default:
          continue
      }
      group_num++
    }
    // console.log(Book.pages)
    // console.log(Book.pages.map(e => e.group))
    this.view_groups()
  }

  view_groups(){
    const groups = Array.from(new Set(Book.pages.map(e => e.group)))
    for(const group of groups){
      
      const div_group = document.createElement("div")
      Common.list.appendChild(div_group)
      div_group.className = "group"
      div_group.setAttribute("data-group", group)
      const imgs = Book.pages.filter(e => e.group === group)
      for(const img of imgs){
        const div_page = document.createElement("div")
        div_page.className = "page"
        div_page.setAttribute("data-page-num" , img.page)
        const p   = document.createElement("p")
        p.className = "page-num"
        div_page.appendChild(p)
        div_page.appendChild(img.img)
        div_group.appendChild(div_page)
      }
    }
    // for(let i=0; i<Book.data.datas.length; i++){
    //   const div = document.createElement("div")
    //   div.className = "page"
    //   div.setAttribute("data-page-num" , i)
    //   const p   = document.createElement("p")
    //   p.className = "page-num"
    //   const img = new Image()
      
    //   img.onload = this.loaded_image.bind(this, i)
    //   img.src = `data:image/webp;base64,${Book.data.datas[i]}`
    //   this.pages[i] = {
    //     w : null,
    //     h : null,
    //     img : img,
    //     status : "loading"
    //   }
    //   div.appendChild(p)
    //   div.appendChild(img)
    //   Common.list.appendChild(div)
    //   img.setAttribute("data-page" , i)
    // }
  }

  // set_pages(){
  //   if(!Book.data || !Book.data.datas || !Book.data.datas.length){return}
  //   for(let i=0; i<Book.data.datas.length; i++){
  //     const div = document.createElement("div")
  //     div.className = "page"
  //     div.setAttribute("data-page-num" , i)
  //     const p   = document.createElement("p")
  //     p.className = "page-num"
  //     const img = new Image()
      
  //     img.onload = this.loaded_image.bind(this, i)
  //     img.src = `data:image/webp;base64,${Book.data.datas[i]}`
  //     this.pages[i] = {
  //       w : null,
  //       h : null,
  //       img : img,
  //       status : "loading"
  //     }
  //     div.appendChild(p)
  //     div.appendChild(img)
  //     Common.list.appendChild(div)
  //     img.setAttribute("data-page" , i)
  //   }
  // }
  // loaded_image(num, e){
  //   const w = e.target.naturalWidth
  //   const h = e.target.naturalHeight
  //   this.pages[num].w = w
  //   this.pages[num].h = h
  //   this.pages[num].status = "success"
  //   this.pages[num].dimension = w < h ? "horizontal" : "vertical"
  //   this.finish_images()
  // }

  // finish_images(){
  //   const loaded_count = this.pages.filter(e => e.status === "success").length
  //   if(loaded_count !== this.pages.length){return}
  //   List.set_active()
  // }

  

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