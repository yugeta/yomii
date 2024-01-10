import { Element } from './element.js'
import { Book }    from './book.js'

export class BookList{
  constructor(options){
    this.options = options || {}
    // this.set_group()
    this.view_groups()
    this.set_event()
  }

  // set_group(){
  //   let page_num  = 0
  //   let group_num = 0
  //   Common.groups = []
  //   for(let i=0; i<Common.images.length; i++){
  //     const page = Common.images[i]
  //     const next = Common.images[i+1] || null
  //     Common.groups[group_num] = [i]
  //     // 見開き処理
  //     if(!page.single){
  //       switch(page.dimension){
  //         case "vertical":
  //           break
  //         case "horizontal":
  //           if(next && next.dimension === "horizontal" && !next.single){
  //             i++
  //             Common.groups[group_num].push(i)
  //           }
  //           break
  //         default:
  //           continue
  //       }
  //     }
  //     group_num++
  //   }
  // }
  // set_group(){
  //   Common.groups = []
  //   let group_num = 0
  //   for(let i=0; i<Common.images.length; i++){
  //     const page = Common.images[i]
  //     const next = Common.images[i+1] || null
  //     Common.groups[group_num] = [i]
  //     // 見開き処理
  //     if(!page.single){
  //       switch(page.dimension){
  //         case "vertical":
  //           break
  //         case "horizontal":
  //           if(next && next.dimension === "horizontal" && !next.single){
  //             i++
  //             Common.groups[group_num].push(i)
  //           }
  //           break
  //         default:
  //           continue
  //       }
  //     }
  //     group_num++
  //   }
  // }

  view_groups(){
    // let page_id = 0
    for(let i=0; i<Book.groups.length; i++){
      const div_group = document.createElement("div")
      Element.list.appendChild(div_group)
      div_group.className = "group"
      div_group.setAttribute("data-group", i)
      const page_count = this.view_pages(div_group, Book.groups[i])
      // page_id += page_count
    }
  }

  view_pages(elm_group, pages){
    let page_count = 0
    for(const page_num of pages){
      // const page_data = Common.images.find(e => e.page === page_num)/
      const page_data = Book.get_pageNum2pageInfo(page_num)
      console.log(page_data)
      if(!page_data){
        alert("error")
        return
      }
      // const div_page = this.create_page(page_id + page_count, page_data)
      const div_page = this.create_page(page_num, page_data)
      page_count++
      elm_group.appendChild(div_page)
      if(page_data.dimension === "vertical"){
        // const div_page2 = this.create_page(page_id + page_count, page_data , true)
        const div_page2 = this.create_page(page_num, page_data , true)
        elm_group.appendChild(div_page2)
        page_count++
      }
    }
    return page_count
  }
  create_page(page_id, page_data , page_sub_flg){
// console.log(page_id, page_data)
    const div_page = document.createElement("div")
    div_page.className = "page"
    div_page.setAttribute("data-page"     , page_id)
    div_page.setAttribute("data-page-num" , page_data.page)
    // div_page.setAttribute("data-page-sub" , !page_sub_flg ? "" : 1)
    const canvas = this.canvas(page_data.img , page_sub_flg)
    div_page.appendChild(canvas)
    return div_page
  }
  canvas(img , page_sub_flg){
    const canvas  = document.createElement("canvas")
    canvas.className = "img"
    const ctx     = canvas.getContext("2d")
    const w       = img.naturalWidth
    const h       = img.naturalHeight
    canvas.width  = w
    canvas.height = h
    let x = 0
    if(w > h){
      canvas.width  = w / 2
      if((page_sub_flg && Element.direction.checked)
      || (!page_sub_flg && !Element.direction.checked)){
        x = -(w / 2)
      }
    }
    ctx.drawImage(img, x, 0, w, h)
    return canvas
  }

  set_event(){
    if(Element.list){
      Element.list.addEventListener("click" , this.click_list.bind(this))
    }
  }

  click_list(e){
    if(Book.is_portrait){
      const elm = e.target.closest(`.page`)
      if(!elm){return}
      const page_num = Number(elm.getAttribute("data-page") || 0)
// console.log(page_num)
      // const page_num = Number(elm.getAttribute("data-page-num") || 0)
      // const page_sub = Number(elm.getAttribute("data-page-sub") || 0)
      // if(!page_num || Common.page_num === Number(page_num)){return}
      // const mode = List.get_next_page_direction(page_num + page_sub*0.1)
      const mode = BookList.get_next_page_direction(page_num)
      Book.view_page(mode, page_num)
      Book.group_num = Book.get_page2group_num(page_num)
      Book.page_num  = page_num
console.log(Book.group_num,Book.page_num)
      // Common.page_sub  = page_sub
      BookList.set_active(page_num)
    }
    else{
      const elm = e.target.closest(`.group`)
      if(!elm){return}
      const group_num = Number(elm.getAttribute("data-group") || 0)
      if(Book.group_num === group_num){return}
      const mode = List.get_next_page_direction(group_num)
      Book.view_group(mode, group_num)
      Book.group_num = group_num
      Book.page_num  = Book.get_group2page_num(group_num)
      Book.page_sub  = 0
      BookList.set_active()
    }
  }

  static get_next_page_direction(next_num){
    // →
    if(Element.direction.checked === true){
      const current_page = BookList.get_active_page()
      return current_page < next_num ? "right" : "left"
    }
    // ←
    else{
      const current_group = BookList.get_active_group()
      return current_group < next_num ? "left" : "right"
    }
  }
  static get_next_group_direction(next_group){
    const current_group = BookList.get_active_group()
    // →
    if(Element.direction.checked === true){
      return current_group < next_group ? "right" : "left"
    }
    // ←
    else{
      return current_group < next_group ? "left" : "right"
    }
  }

  static set_active(){
    if(Book.is_portrait){
      BookList.set_active_page(Book.page_num , Book.page_sub)
      BookList.set_active_group(Book.group_num)
      setTimeout(BookList.set_center_page , 0)
    }
    else{
      BookList.set_active_page(Book.page_num , Book.page_sub)
      BookList.set_active_group(Book.group_num)
      setTimeout(BookList.set_center_group , 0)
    }
  }

  static get_active_page(){
    const elm = Element.BookList.querySelector(`.page[data-status="active"]`)
    if(elm){
      return Number(elm.getAttribute("data-page-num") || 0) + Number(elm.getAttribute("data-page-sub") || 0) * 0.1
    }
    else{
      return null
    }
  }

  static set_active_page(page_num , page_sub){
    page_num = page_num || 0
    const pages = Element.list.querySelectorAll(`.page`)
    for(const page of pages){
      if(Number(page.getAttribute("data-page-num")) === Number(page_num)
      && Number(page.getAttribute("data-page-sub") || 0) === Number(page_sub || 0)){
        page.setAttribute("data-status","active")
      }
      else{
        page.setAttribute("data-status","passive")
      }
    }
  }

  static set_center_page(){
    Book.page_num = Book.page_num || 0
    try{
      const page_elm  = Element.list.querySelector(`.page[data-page-num="${Book.page_num}"]`)
      const left      = page_elm.offsetLeft
      const width     = page_elm.offsetWidth
      const view_w    = Element.list.offsetWidth
      const center    = left + width/2 - view_w/2
      Element.list.scrollLeft = center
    }
    catch(err){
      console.warn("list:set_center",err)
    }
  }

  static get_active_group(){
    const elm = Element.list.querySelector(`.group[data-status="active"]`)
    if(elm){
      return Number(elm.getAttribute("data-group"))
    }
    else{
      return null
    }
  }

  static set_active_group(group_num){
    const groups = Element.list.querySelectorAll(`.group`)
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
    Book.group_num = Book.group_num || 0
    try{
      const book_list = Element.list
      const page_elm  = book_list.querySelector(`.group[data-group="${Book.group_num}"]`)
      const left      = page_elm.offsetLeft
      const width     = page_elm.offsetWidth
      const view_w    = book_list.offsetWidth
      const center    = left + width/2 - view_w/2
      Element.list.scrollLeft = center
    }
    catch(err){
      console.warn("list:set_center",err)
    }
  }

}