

export class Book{
  static data  = null
  static pages = []
  static page_num = 0

  constructor(options){
    this.options = options || {}
    Book.data = this.options.book || Book.data
    this.set_system()
    this.set_pages()
  }

  main   = document.querySelector("main")
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
      img.src = `data:image/webp;base64,${Book.data.datas[i]}`
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
    const page = document.createElement("div")
    page.className = "page"
    Book.area.appendChild(page)

    let view_page_count = 0

    const current_page = this.get_current_page(Book.page_num)
    if(current_page){
      page.appendChild(current_page)
      view_page_count++
    }

    // 見開き処理
    const next_data = this.get_next_page(Book.page_num)
    if(next_data){
      page.appendChild(next_data.img)
      view_page_count++
    }

    if(view_page_count === 1){
      page.setAttribute("data-status", "single_page")
    }
    else if(view_page_count === 2){
      page.setAttribute("data-status", "double_page_spread")
    }

  }

  // 見開き処理
  get_double_page_spread(current_page_num){

  }
  get_current_page(current_page_num){
    return Book.pages[current_page_num] ? Book.pages[current_page_num].img : null
  }
  get_next_page(current_page_num){
    if(Book.pages[current_page_num].size_direction === "vertical"){return}
    const next_page_num = current_page_num+1
    if(!Book.pages[next_page_num] || Book.pages[next_page_num].size_direction === "vertical"){return}
    return Book.pages[next_page_num]
  }



}
