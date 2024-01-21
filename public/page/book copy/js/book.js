import { Data }      from "./data.js"
import { View }      from "./view.js"
import { Page }      from "./page.js"
import { Common }    from "./common.js"
import { Element }   from "./element.js"
import { Direction } from "./direction.js"

export class Book{
  pages = []

  constructor(options){
    Data.flg_setting = true

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

    setTimeout((()=>{Data.flg_setting = false}) , 500)
  }

  clear(){
    Element.book.innerHTML = ""
  }

  view_groups(){
    for(let i=0; i<Data.groups.length; i++){
      const div_group = document.createElement("div")
      Element.book.appendChild(div_group)
      div_group.className = "group"
      div_group.setAttribute("data-group", i)
      for(const page_num of Data.groups[i]){
        const sub_flg = Data.groups[i].findIndex(e => e === page_num) === 1 ? true : false
        const elm_page = this.view_page(i, page_num, sub_flg)
        if(!elm_page){continue}
        div_group.appendChild(elm_page)
      }
    }
  }
  view_pages(){
    for(let i=0; i<Data.groups.length; i++){
      for(const page_num of Data.groups[i]){
        const sub_flg = Data.groups[i].findIndex(e => e === page_num) === 1 ? true : false
        const elm_page = this.view_page(i, page_num, sub_flg)
        if(!elm_page){continue}
        Element.book.appendChild(elm_page)
      }
    }
  }

  view_page(group_num, page_num, sub_flg){
    const page_data = Common.page2Info(page_num)
    if(!page_data){return}

    const div_page = this.create_page(page_num, page_data)

    this.pages.push({
      group_num : group_num,
      page_num  : page_num,
      data      : page_data,
      sub_flg   : sub_flg,
    })

    return div_page
  }

  create_page(page_id, page_data){
    const img = page_data.img
    const div_page = document.createElement("div")
    div_page.className = "page"
    div_page.setAttribute("data-page"     , page_id)
    return div_page
  }

  create_canvas(img, sub_flg){
    const canvas   = document.createElement("canvas")
    const size     = {
      w : img.naturalWidth,
      h : img.naturalHeight,
    }
    const vertical = size.w > size.h ? true : false
    canvas.width   = vertical ? size.w / 2 : size.w
    canvas.height  = size.h
    let x = 0
    if((sub_flg === true  && Element.direction.checked)
    || (sub_flg === false && !Element.direction.checked)){
      x = -size.w / 2
    }
    canvas.getContext("2d").drawImage(img, x, 0, size.w, size.h)
    return canvas
  }
}
