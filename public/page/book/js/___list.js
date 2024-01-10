import { Data }    from "./data.js"
import { Common }  from "./common.js"
import { Element } from "./element.js"
import { Page }    from "./book.js"

export class List{
  pages = []

  constructor(){
    if(!Element.list){return}
    this.view_groups()
    // this.set_image_ajax()
    new Event()
  }

  view_groups(){
    for(let i=0; i<Data.groups.length; i++){
      const div_group = document.createElement("div")
      Element.list.appendChild(div_group)
      div_group.className = "group"
      div_group.setAttribute("data-group", i)
      this.view_pages(div_group, Data.groups[i])
    }
  }

  view_pages(elm_group, pages){
    for(const page_num of pages){
      const page_data = Common.page2Info(page_num)
      if(!page_data){
        alert("error")
        return
      }

      const div_page = this.create_page(page_num, page_data)
      elm_group.appendChild(div_page)
      let sub_flg = null
      if(page_data.img.naturalWidth > page_data.img.naturalHeight){
        sub_flg = pages.findIndex(e => e === page_num) === 1 ? true : false
      }
      // else{
      //   sub_flg = true
      // }
      this.pages.push({
        id      : page_num,
        data    : page_data,
        sub_flg : sub_flg,
      })
    }
  }

  create_page(page_id, page_data){
    const img = page_data.img
    const div_page = document.createElement("div")
    div_page.className = "page"
    div_page.setAttribute("data-page"     , page_id)
    // div_page.setAttribute("data-page-num" , page_data.page)

    return div_page
  }

  resize(x,y){
    const rate = Data.list_height / y
    return {
      w : x * rate,
      h : Data.list_height,
    }
  }

  create_canvas(img, sub_flg){
    const canvas  = document.createElement("canvas")
    const size    = this.resize(img.naturalWidth, img.naturalHeight)
    const vertical = size.w > size.h ? true : false
    canvas.width  = vertical ? size.w / 2 : size.w
    canvas.height = size.h
    let x = 0
    if((sub_flg === true && Element.direction.checked)
    || (sub_flg === false && !Element.direction.checked)){
      x = -size.w / 2
    }
    canvas.getContext("2d").drawImage(img, x, 0, size.w, size.h)
    return canvas
  }

  set_image_ajax(){
    if(!this.pages.length){return}
    const page      = this.pages.shift()
    const div_page  = Element.list.querySelector(`.page[data-page="${page.id}"]`)
    const img       = page.data.img
    const canvas    = this.create_canvas(img, page.sub_flg)
    div_page.appendChild(canvas)
    window.requestAnimationFrame(this.set_image_ajax.bind(this))
    // window.requestAnimationFrame((()=>{
    //   setTimeout(this.set_image_ajax.bind(this) , 100)
    // }).bind(this))
  }

}

class Event{
  constructor(){
    this.set_list()
  }
  set_list(){
    if(!Element.list){return}
    Element.list.addEventListener("click" , this.click_list.bind(this))
  }
  click_list(e){
    const elm_page = e.target.closest(`.page`)
    if(!elm_page){return}
    const page_num_str = elm_page.getAttribute("data-page")
    const page_num = page_num_str ? Number(page_num_str) : null
    new Page("page_num",{page_num: page_num})
  }
}
