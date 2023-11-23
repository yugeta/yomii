import { Book } from './book.js'

export class List{
  data  = null
  pages = []
  main  = document.querySelector(`main`)
  area  = this.main.querySelector(`.book-list`)
  page_num = 0

  constructor(options){
    this.options = options || {}
    this.data = this.options.book
    this.set_system()
    this.set_pages()
  }
  set_system(){
    if(!Book.data){return}
    this.main.setAttribute("rel" , "list")
  }

  set_pages(){
    if(!Book.data || !Book.data.datas || !Book.data.datas.length){return}
    
    for(let i=0; i<Book.data.datas.length; i++){
      const img = new Image()
      img.onload = this.loaded_image.bind(this, i)
      img.src = `data:image/webp;base64,${Book.data.datas[i]}`
      this.pages[i] = {
        w : null,
        h : null,
        img : img,
        status : "loading"
      }
      this.area.appendChild(img)
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
    // this.view_list()
  }

  // view_list(){
  //   console.log(this.pages)
  //   this.area.appendChild(this.pages[this.page_num].img)

  //   // 見開き処理
  //   if(Book.pages[Book.page_num].size_direction === "vertical"){return}
  //   if(!Book.pages[Book.page_num+1] || Book.pages[Book.page_num+1].size_direction === "vertical"){return}
  //   Book.area.appendChild(Book.pages[Book.page_num+1].img)

  // }
}