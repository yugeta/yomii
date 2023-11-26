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


  // ページ送り
  static next_page(mode){
    if((Common.direction.checked === true && mode === "left")
    || (Common.direction.checked === false && mode === "right")){
      let go_group_num = Common.group_num - 1
      go_group_num = go_group_num > 0 ? go_group_num : 0
      Book.view_page(go_group_num)
    }
    else if((Common.direction.checked === true && mode === "right")
    || (Common.direction.checked === false && mode === "left")){
      let go_group_num = Common.group_num + 1
      go_group_num = go_group_num <= Common.groups.length - 1 ? go_group_num : Common.group_num
      Book.view_page(go_group_num)
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
    page.setAttribute("data-count" , images.length)
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
}
