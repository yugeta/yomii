import { Common } from './common.js'
import { Book }   from './book.js'

export class List{
  constructor(options){
    this.options = options || {}
    this.set_group()
    this.set_event()
  }

  set_group(){
    Common.groups = []
    let group_num = 0
    for(let i=0; i<Common.images.length; i++){
      const page = Common.images[i]
      const next = Common.images[i+1] || null
      Common.groups[group_num] = [i]
      // 見開き処理
      if(!page.single){
        switch(page.dimension){
          case "vertical":
            break
          case "horizontal":
            if(next && next.dimension === "horizontal" && !next.single){
              i++
              Common.groups[group_num].push(i)
            }
            break
          default:
            continue
        }
      }
      group_num++
    }
    this.view_groups()
  }

  view_groups(){
    for(let i=0; i<Common.groups.length; i++){
      const group_num = i
      const div_group = document.createElement("div")
      Common.list.appendChild(div_group)
      div_group.className = "group"
      div_group.setAttribute("data-group", group_num)
      this.view_pages(div_group, Common.groups[i])
    }
  }

  view_pages(elm_group, pages){
    for(const page_num of pages){
      const page_data = Common.images.find(e => e.page === page_num)
      const div_page = document.createElement("div")
      div_page.className = "page"
      div_page.setAttribute("data-page-num" , page_data.page)
      div_page.appendChild(this.canvas(page_data.img))
      elm_group.appendChild(div_page)
    }
  }
  canvas(img){
    const canvas  = document.createElement("canvas")
    canvas.className = "img"
    const ctx     = canvas.getContext("2d")
    const w       = img.naturalWidth
    const h       = img.naturalHeight
    canvas.width  = w
    canvas.height = h
    let x = 0
    // if(Book.is_portrait && page_count === 1 && w > h){
    //   canvas.width  = w / 2
    //   if((page_sub_flg && Common.direction.checked)
    //   || (!page_sub_flg && !Common.direction.checked)){
    //     x = -(w / 2)
    //   }
    // }
    ctx.drawImage(img, x, 0, w, h)
    return canvas
  }

  set_event(){
    if(Common.list){
      Common.list.addEventListener("click" , this.click_list.bind(this))
    }
  }

  click_list(e){
    if(Book.is_portrait){
      const elm = e.target.closest(`.page`)
      if(!elm){return}
      const page_num = elm.getAttribute("data-page-num")
      if(!page_num || Common.page_num === Number(page_num)){return}
      Book.view_page(Number(page_num))
      Common.group_num = Book.get_page2group_num(page_num)
      Common.page_num  = page_num
      List.set_active(page_num)
    }
    else{
      const elm = e.target.closest(`.group`)
      if(!elm){return}
      const group_num = elm.getAttribute("data-group")
      if(!group_num || Common.group_num === Number(group_num)){return}
      Book.view_group(Number(group_num))
      Common.group_num = group_num
      Common.page_num  = Book.get_group2page_num(group_num)
      List.set_active()
    }
  }

  static set_active(){
    if(Book.is_portrait){
      List.set_active_page(Common.page_num)
      List.set_active_group(Common.group_num)
      setTimeout(List.set_center_page , 0)
    }
    else{
      List.set_active_page(Common.page_num)
      List.set_active_group(Common.group_num)
      setTimeout(List.set_center_group , 0)
    }
  }

  static set_active_page(page_num){
    page_num = page_num || 0
    const pages = Common.list.querySelectorAll(`.page`)
    for(const page of pages){
      if(Number(page.getAttribute("data-page-num")) === Number(page_num)){
        page.setAttribute("data-status","active")
      }
      else{
        page.setAttribute("data-status","passive")
      }
    }
  }

  static set_center_page(){
    Common.page_num = Common.page_num || 0
    try{
      const page_elm  = Common.list.querySelector(`.page[data-page-num="${Common.page_num}"]`)
      const left      = page_elm.offsetLeft
      const width     = page_elm.offsetWidth
      const view_w    = Common.list.offsetWidth
      const center    = left + width/2 - view_w/2
      Common.list.scrollLeft = center
    }
    catch(err){
      console.warn("list:set_center",err)
    }
  }

  static set_active_group(group_num){
    const groups = Common.list.querySelectorAll(`.group`)
    for(const group of groups){
      if(Number(group.getAttribute("data-group")) === Number(group_num)){
        group.setAttribute("data-status","active")
      }
      else{
        group.setAttribute("data-status","passive")
      }
    }
  }

  static set_center_group(){
    Common.group_num = Common.group_num || 0
    try{
      const book_list = Common.list
      const page_elm  = book_list.querySelector(`.group[data-group="${Common.group_num}"]`)
      const left      = page_elm.offsetLeft
      const width     = page_elm.offsetWidth
      const view_w    = book_list.offsetWidth
      const center    = left + width/2 - view_w/2
      Common.list.scrollLeft = center
    }
    catch(err){
      console.warn("list:set_center",err)
    }
  }

}