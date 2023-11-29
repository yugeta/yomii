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
      // div_page.setAttribute("data-dimension" , page_data.dimension)
      div_page.appendChild(page_data.img)
      elm_group.appendChild(div_page)
    }
  }

  set_event(){
    if(Common.list){
      Common.list.addEventListener("click" , this.click_list.bind(this))
    }
  }

  click_list(e){
    const elm = e.target.closest(`.group`)
    if(!elm){return}
    const group_num = elm.getAttribute("data-group")
    if(!group_num || Common.group_num === Number(group_num)){return}
    Book.view_page(Number(group_num))
    List.set_active()
  }


  static set_active(){
    const groups = Common.list.querySelectorAll(`.group`)
    for(const group of groups){
      const group_num = Number(group.getAttribute("data-group"))
      if(Number(group_num) === Number(Common.group_num)){
        group.setAttribute("data-status","active")
      }
      else{
        group.setAttribute("data-status","passive")
      }
    }
    setTimeout(List.set_center , 0)
  }
  static set_center(){
    try{
      const book_list = Common.list
      const page_elm  = book_list.querySelector(`[data-group="${Common.group_num}"]`)
      const left      = page_elm.offsetLeft
      const width     = page_elm.offsetWidth
      const scroll    = book_list.scrollWidth
      const view_w    = book_list.offsetWidth
      const center    = left + width/2 - view_w/2
      Common.list.scrollLeft = center
    }
    catch(err){
      console.warn("list:set_center",err)
    }
  }

}