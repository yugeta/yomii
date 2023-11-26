import { Common } from './common.js'
import { List }   from './list.js'
import { Img }    from './img.js'

export class Book{
  constructor(options){
    this.options = options || {}
    new Img({
      callback : (()=>{
        new List()
        Book.view_page()
      }).bind(this)
    })
  }

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
      // let go_page_num = Book.page_num - Book.view_page_count
      // go_page_num = go_page_num > 0 ? go_page_num : 0
      // Book.view_page(go_page_num)
      let go_group_num = Book.group_num - Book.view_page_count
      go_page_num = go_page_num > 0 ? go_page_num : 0
      Book.view_page(go_page_num)
    }
    else if((Common.direction.checked === false && mode === "right")
    || (Common.direction.checked === true && mode === "left")){
      // let go_page_num = Book.page_num + Book.view_page_count
      // go_page_num = go_page_num <= Book.pages.length - 1 ? go_page_num : Book.page_num
      // Book.view_page(go_page_num)

    }
    else if(typeof mode === "number"){

    }
    List.set_active()
  }

  static clear_current_page(){
    const page = Common.area.querySelector(`.page`)
    if(!page){return}
    page.parentNode.removeChild(page)
  }

  static view_page(go_group_num){
    if(Common.group_num === go_group_num){return}
    Book.clear_current_page()
    Common.group_num = go_group_num ?? Common.group_num
    const images = Book.get_group_images(Common.group_num)
    if(!images || !images.length){return}
    const page = document.createElement("div")
    page.className = "page"
    page.setAttribute("data-group" , Common.group_num)
    for(const img_list of images){
      const img_book = new Image()
      img_book.src = img_list.src
      page.appendChild(img_book)
    }
    Common.area.appendChild(page)
  }

  static get_group_images(group_num){
    return Common.list.querySelectorAll(`.group[data-group="${group_num}"] .page img`)
  }

  // static view_page(go_page_num){
  //   const page = document.createElement("div")
  //   page.className = "page"
  //   page.setAttribute("data-page", go_page_num)
    
  //   let view_page_count = 0

  //   const current_page = Book.get_current_img(go_page_num)
  //   if(current_page){
  //     const img = new Image()
  //     img.src = current_page.src
  //     page.appendChild(img)
  //     view_page_count++
  //   }

  //   // 見開き処理
  //   const next_data = Book.get_next_img(go_page_num)
  //   if(next_data){
  //     const img = new Image()
  //     img.src = next_data.src
  //     page.appendChild(img)
  //     view_page_count++
  //   }

  //   if(view_page_count === 1){
  //     page.setAttribute("data-status", "single_page")
  //   }
  //   else if(view_page_count === 2){
  //     page.setAttribute("data-status", "double_page_spread")
  //   }

  //   const current_page_elm = Common.area.querySelector(".page")
  //   if(current_page_elm){
  //     current_page_elm.parentNode.removeChild(current_page_elm)
  //   }
  //   Common.area.appendChild(page)

  //   Book.page_num        = go_page_num
  //   Book.view_page_count = view_page_count
  // }

  // static get_current_img(current_page_num){
  //   return Book.pages[current_page_num] ? Book.pages[current_page_num].img : null
  // }
  // static get_next_img(current_page_num){
  //   if(!Book.pages[current_page_num]){return}
  //   if(Book.pages[current_page_num].size_direction === "vertical"){return}
  //   const next_page_num = current_page_num+1
  //   if(!Book.pages[next_page_num] || Book.pages[next_page_num].size_direction === "vertical"){return}
  //   return Book.pages[next_page_num]
  // }

}
