import { Common } from './common.js'
import { List }   from './list.js'

export class Book{
  static data  = null
  static pages = []
  // static page_num = 0
  // static view_page_count = 0

  constructor(options){
    this.options = options || {}
    Book.data = this.options.book || Book.data
    // this.set_system()
    // this.set_pages()
  }

  // set_system(){
  //   if(!Book.data){return}
  //   Common.main.setAttribute("rel" , "book")
  // }

  // set_pages(){
  //   if(!Book.data || !Book.data.datas || !Book.data.datas.length){return}
  //   Book.pages = []
  //   for(let i=0; i<Book.data.datas.length; i++){
  //     const img = new Image()
  //     img.onload = this.loaded_image.bind(this, i)
  //     img.src = `data:image/webp;base64,${Book.data.datas[i]}`
  //     Book.pages[i] = {
  //       w : null,
  //       h : null,
  //       img : img,
  //       status : "loading"
  //     }
  //   }
  // }
  // loaded_image(num, e){
  //   const w = e.target.naturalWidth
  //   const h = e.target.naturalHeight
  //   Book.pages[num].w = w
  //   Book.pages[num].h = h
  //   Book.pages[num].status = "success"
  //   Book.pages[num].size_direction = w < h ? "horizontal" : "vertical"
  //   this.finish_images()
  // }

  finish_images(){
    const loaded_count = Book.pages.filter(e => e.status === "success").length
    // console.log(loaded_count,Book.pages.length)
    if(loaded_count !== Book.pages.length){return}
    Book.view_page(Book.page_num)
  }

  // view_page(){
  //   const page = document.createElement("div")
  //   page.className = "page"
  //   Common.area.appendChild(page)

  //   Book.view_page_count = 0

  //   const current_page = Book.get_current_page(Book.page_num)
  //   if(current_page){
  //     page.appendChild(current_page)
  //     Book.view_page_count++
  //   }

  //   // 見開き処理
  //   const next_data = Book.get_next_page(Book.page_num)
  //   if(next_data){
  //     page.appendChild(next_data.img)
  //     Book.view_page_count++
  //   }

  //   if(Book.view_page_count === 1){
  //     page.setAttribute("data-status", "single_page")
  //   }
  //   else if(Book.view_page_count === 2){
  //     page.setAttribute("data-status", "double_page_spread")
  //   }

  // }

  // // 見開き処理
  // get_double_page_spread(current_page_num){

  // }
  // get_current_page(current_page_num){
  //   return Book.pages[current_page_num] ? Book.pages[current_page_num].img : null
  // }
  // get_next_page(current_page_num){
  //   if(Book.pages[current_page_num].size_direction === "vertical"){return}
  //   const next_page_num = current_page_num+1
  //   if(!Book.pages[next_page_num] || Book.pages[next_page_num].size_direction === "vertical"){return}
  //   return Book.pages[next_page_num]
  // }

  

  // 読む方向の取得

  static get page_num(){
    const num = Common.page_num.value
    return Number(num)
  }
  static set page_num(num){
    Common.page_num.value = num
  }
  static get page_count(){
    const num = Common.page_count.value
    return Number(num)
  }
  static set page_count(num){
    Common.page_count.value = num
  }

  static get_direction(){
    return Common.area.getAttribute("data-direction")
  }

  // 
  static change_page(mode){
    if((Common.direction.checked === false && mode === "left")
    || (Common.direction.checked === true && mode === "right")){
      let go_page_num = Book.page_num - Book.view_page_count
      go_page_num = go_page_num > 0 ? go_page_num : 0
      Book.view_page(go_page_num)
    }
    else if((Common.direction.checked === false && mode === "right")
    || (Common.direction.checked === true && mode === "left")){
      let go_page_num = Book.page_num + Book.view_page_count
      go_page_num = go_page_num <= Book.pages.length - 1 ? go_page_num : Book.page_num
      Book.view_page(go_page_num)
    }
    else if(typeof mode === "number"){

    }
    List.set_active()
  }

  static view_page(next_page_num){
    const page = document.createElement("div")
    page.className = "page"
    page.setAttribute("data-page", next_page_num)
    
    let view_page_count = 0

    const current_page = Book.get_current_img(next_page_num)
    if(current_page){
      page.appendChild(current_page)
      view_page_count++
    }

    // 見開き処理
    const next_data = Book.get_next_img(next_page_num)
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

    const current_page_elm = Common.area.querySelector(".page")
    if(current_page_elm){
      current_page_elm.parentNode.removeChild(current_page_elm)
    }
    Common.area.appendChild(page)

    Book.page_num = next_page_num
    Book.view_page_count = view_page_count
  }

  static get_current_img(current_page_num){
    return Book.pages[current_page_num] ? Book.pages[current_page_num].img : null
  }
  static get_next_img(current_page_num){
    if(!Book.pages[current_page_num]){return}
    if(Book.pages[current_page_num].size_direction === "vertical"){return}
    const next_page_num = current_page_num+1
    if(!Book.pages[next_page_num] || Book.pages[next_page_num].size_direction === "vertical"){return}
    return Book.pages[next_page_num]
  }

}
