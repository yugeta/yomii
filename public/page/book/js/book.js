

export class Book{
  static data  = null
  static pages = []
  static page_num = 0

  constructor(options){
    this.options = options || {}
    // console.log(Book.data);return
    Book.data = this.options.book || Book.data
    this.set_system()
    this.set_pages()
  }

  main = document.querySelector("main")
  static area = document.querySelector(`.book-area`)

  set_system(){
    if(!Book.data){return}
    this.main.setAttribute("rel" , "book")
  }

  set_pages(){
    if(!Book.data || !Book.data.datas || !Book.data.datas.length){return}
    Book.pages = []
    for(let i=0; i<Book.data.datas.length; i++){
      const img = new Image()
      img.onload = this.loaded_image.bind(this, i)
      img.src = `data:image/webp;base64,${Book.data.datas[0]}`
      Book.pages[i] = {
        w : null,
        h : null,
        img : img,
        status : "loading"
      }
    }
  }
  loaded_image(num, e){
    const w = e.target.naturalWidth
    const h = e.target.naturalHeight
    Book.pages[num].w = w
    Book.pages[num].h = h
    Book.pages[num].status = "success"
    Book.pages[num].size_direction = w < h ? "horizontal" : "vertical"
    this.finish_images()
  }

  finish_images(){
    const loaded_count = Book.pages.filter(e => e.status === "success").length
    // console.log(loaded_count,Book.pages.length)
    if(loaded_count !== Book.pages.length){return}
    this.view_page()
  }

  view_page(){
    console.log(Book.pages)
    // const img = Book.pages[Book.page_num].img
    // if(!img){return}
    // img.setAttribute("data-page-num" , Book.page_num)
    Book.area.appendChild(Book.pages[Book.page_num].img)

    // 見開き処理
    if(Book.pages[Book.page_num].size_direction === "vertical"){return}
    if(!Book.pages[Book.page_num+1] || Book.pages[Book.page_num+1].size_direction === "vertical"){return}
    Book.area.appendChild(Book.pages[Book.page_num+1].img)

  }



}
