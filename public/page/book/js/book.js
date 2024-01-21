import { Data }      from "./data.js"
import { View }      from "./view.js"
import { Page }      from "./page.js"
import { Common }    from "./common.js"
import { Element }   from "./element.js"
import { Direction } from "./direction.js"

export class Book{
  // pages = []

  constructor(options){
    Data.is_scroll = false

    this.options = options || {}
    this.clear()
    switch(Common.dimension){
      case "landscape":
        this.view_groups()
      break
      case "portrait":
        this.view_pages()
      break
    }
    new View()
    new Direction()
    Page.transition()

    setTimeout((()=>{Data.is_scroll = true}) , 500)
  }

  clear(){
    Element.book.innerHTML = ""
  }

  // Landscape view
  view_groups(){
    for(let group_num=0; group_num<Data.groups.length; group_num++){
      const div_group = document.createElement("div")
      Element.book.appendChild(div_group)
      div_group.className = "group"
      div_group.setAttribute("data-group", group_num)
      for(const page_num of Data.groups[group_num]){
        const sub_flg = Data.groups[group_num].findIndex(e => e === page_num) === 1 ? true : false // ２ページ目フラグ
        const elm_page = this.view_page(group_num, page_num, sub_flg)
        if(!elm_page){continue}
        div_group.appendChild(elm_page)
      }
    }
  }

  // Portrait view
  view_pages(){
    for(let group_num=0; group_num<Data.groups.length; group_num++){
      for(const page_num of Data.groups[group_num]){
        const sub_flg = Data.groups[group_num].findIndex(e => e === page_num) === 1 ? true : false // ２ページ目フラグ
        const elm_page = this.view_page(group_num, page_num, sub_flg)
        if(!elm_page){continue}
        Element.book.appendChild(elm_page)
      }
    }
  }
  
  view_page(group_num, page_num, sub_flg){
    const page_info = Common.page2Info(page_num)
    if(!page_info){return}

    const div_page = this.create_page(page_num, page_info.img)

    // this.pages.push({
    //   group_num : group_num,
    //   page_num  : page_num,
    //   img       : img,
    //   sub_flg   : sub_flg,
    // })

    return div_page
  }

  create_page(page_id, img){
    const div_page = document.createElement("div")
    div_page.className = "page"
    div_page.setAttribute("data-page" , page_id)
    return div_page
  }

  // create_canvas(img, sub_flg){
  //   const canvas   = document.createElement("canvas")
  //   const w = img.naturalWidth
  //   const h = img.naturalHeight
  //   canvas.width   =  w > h ? w / 2 : w
  //   canvas.height  = h
  //   let x = 0
  //   if((sub_flg === true  && Element.direction.checked)
  //   || (sub_flg === false && !Element.direction.checked)){
  //     x = -w / 2
  //   }
  //   canvas.getContext("2d").drawImage(img, x, 0, w, h)
  //   return canvas
  // }
}
