import { Data }      from "./data.js"
import { Common }    from "./common.js"
import { Element }   from "./element.js"
import { Direction } from "./direction.js"

export class Book{
  pages = []

  constructor(options){
    Data.flg_setting = true

// console.log("Book",Data.group_num,Data.page_num)
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

export class View{
  constructor(){
    switch(Common.dimension){
      case "landscape":
        this.group(Data.group_num)
        // next
        this.group(Data.group_num+1)
        // prev
        this.group(Data.group_num-1)
      break
      case "portrait":
        this.page(Data.page_num)
        // next
        this.page(Data.page_num+1)
        // prev
        this.page(Data.page_num-1)
      break
    }
  }
  // 対象のグループ要素に画像が挿入されているか確認（要素がない場合も処理をしない）
  check_group_image(group_num){
    const elm_group = this.elm_group(group_num)
    if(!elm_group){return true}
    return elm_group.querySelector("canvas") ? true : false
  }
  group(group_num){
    if(group_num < 0 || !Data.groups[group_num]){return}
    if(this.check_group_image(group_num) === true){return}
    const page_nums = Data.groups[group_num]
    if(!page_nums){return}
    for(const page_num of page_nums){
      const data = Common.page2Info(page_num)
      const img  = data.img
      const elm_page = this.elm_page(page_num)
      if(img.naturalWidth > img.naturalHeight){
        const sub_flg = page_nums.findIndex(e => e === page_num) === 1 ? true : false
        const canvas = new Canvas(img, sub_flg).canvas
        elm_page.appendChild(canvas)
      }
      else{
        const canvas = new Canvas(img).canvas
        if(!canvas){continue}
        elm_page.appendChild(canvas)
      }
    }
  }
  check_page_image(page_num){
    const elm_page = this.elm_page(page_num)
    if(!elm_page){return true}
    return elm_page.querySelector("canvas") ? true : false
  }
  page(page_num){
    if(page_num < 0 || page_num > Math.max(Data.groups.length)){return}
    if(this.check_page_image(page_num) === true){return}
    const data      = Common.page2Info(page_num)
    const img       = data.img
    const elm_page  = this.elm_page(page_num)
    const page_nums = Data.groups.find(e => e.indexOf(page_num) !== -1)
    if(img.naturalWidth > img.naturalHeight){
      const sub_flg = page_nums.findIndex(e => e === page_num) === 1 ? true : false
      const canvas = new Canvas(img, sub_flg).canvas
      elm_page.appendChild(canvas)
    }
    else{
      const canvas = new Canvas(img).canvas
      if(canvas){
        elm_page.appendChild(canvas)
      }
    }
  }

  page_data(page_num){
    return Data.images[page_num]
  }

  elm_page(page_num){
    return Element.book.querySelector(`.page[data-page="${page_num}"]`)
  }
  elm_group(group_num){
    return Element.book.querySelector(`.group[data-group="${group_num}"]`)
  }
  elm_group_pages(group_num){
    const elm_group = this.elm_group(group_num)
    return elm_group.querySelectorAll(`.page`)
  }
}

class Canvas{
  constructor(img , sub_flg){
    if(!img){return null}
    this.img = img
    this.w   = img.naturalWidth
    this.h   = img.naturalHeight

    if(sub_flg !== undefined){
      this.canvas = this.half(sub_flg)
    }
    else{
      this.canvas = this.full()
    }
  }
  full(){
    const canvas  = document.createElement("canvas")
    canvas.width  = this.w
    canvas.height = this.h
    let x = 0
    canvas.getContext("2d").drawImage(this.img, x, 0, this.w, this.h)
    return canvas
  }

  half(sub_flg){
    const canvas  = document.createElement("canvas")
    canvas.width  = ~~(this.w / 2)
    canvas.height = this.h
    let x = 0
    if((sub_flg  &&  Element.direction.checked)
    || (!sub_flg && !Element.direction.checked)){
      x = -canvas.width
    }
    canvas.getContext("2d").drawImage(this.img, x, 0, this.w, this.h)
    return canvas
  }
}

export class Page{
  constructor(type, options){
    this.options = options || {}
    switch(type){
      case "left":
        this.turn_left()
      break
      case "right":
        this.turn_right()
      break
      case "scroll":
        switch(Common.dimension){
          case "landscape":
            this.turn_scroll_landscape(options)
            break
          case "portrait":
            this.turn_scroll_portrait(options)
            break
        }
      case "page_num":
        this.turn_num(this.options.page_num || null)
      break
    }
  }
  // ページめくり（左）
  turn_left(){
    switch(Common.dimension){
      case "landscape":
        Data.group_num = this.check_group_num_over(Element.direction.checked ? Data.group_num-1 : Data.group_num+1)
        // Data.page_num  = this.get_group2page_num(Data.group_num)
// console.log("turn_left-landscape",Data.group_num,Data.page_num)
        new View()
        Element.book.scrollLeft = this.get_scrollLeft_group(Data.group_num)
      break
      case "portrait":
        Data.page_num  = this.check_page_num_over(Element.direction.checked ? Data.page_num-1 : Data.page_num+1)
        // Data.group_num = this.get_page2group_num(Data.page_num)
// console.log("turn_left-portrait",Data.group_num,Data.page_num)
        new View()
        Element.book.scrollLeft = this.get_scrollLeft_page(Data.page_num)
      break
    }
  }
  // ページめくり（右）
  turn_right(){
    switch(Common.dimension){
      case "landscape":
        Data.group_num = this.check_group_num_over(Element.direction.checked ? Data.group_num+1 : Data.group_num-1)
        // Data.page_num  = this.get_group2page_num(Data.group_num)
// console.log("turn_right-landscape",Data.group_num,Data.page_num)
        new View()
        Element.book.scrollLeft = this.get_scrollLeft_group(Data.group_num)
      break
      case "portrait":
        Data.page_num  = this.check_page_num_over(Element.direction.checked ? Data.page_num+1 : Data.page_num-1)
        // Data.group_num = this.get_page2group_num(Data.page_num)
// console.log("turn_right-portrait",Data.group_num,Data.page_num)
        new View()
        Element.book.scrollLeft = this.get_scrollLeft_page(Data.page_num)
      break
    }
  }

  // ページめくり（ページ番号）
  turn_num(page_num){
    if(page_num === null){return}
    Data.page_num = page_num
// console.log("turn-num",Data.page_num)
  }
  check_page_num_over(page_num){
    if(page_num < 0){
      return 0  
    }
    const   page_count = Math.max(Data.groups.flat())
    if(page_num > page_count){
      return page_count
    }
    return page_num
  }
  check_group_num_over(group_num){
    if(group_num < 0){
      return 0
    }
    const page_count = Math.max(Data.groups.length)
    if(group_num > Data.groups.length-1){
      return Data.groups.length-1
    }
    return group_num
  }

  turn_scroll_landscape(options){
    // 画面内にあるページをスキャンする。
    const groups = Element.book.querySelectorAll(".group")
    let group_num = null
    for(const group of groups){
      const st = group.offsetLeft - (document.body.offsetWidth / 2)
      const ed = group.offsetLeft + (document.body.offsetWidth / 2)
      if(options.scrollLeft >=st && options.scrollLeft <= ed && group.hasAttribute("data-group")){
        group_num = Number(group.getAttribute("data-group"))
        break
      }
    }
    if(group_num === Data.group_num){return}
    Data.group_num = group_num
    // Data.page_num  = this.get_group2page_num(Data.group_num)
// console.log("turn_scroll_landscape",Data.group_num,Data.page_num,options)
    new View()
  }
  turn_scroll_portrait(options){
    // 画面内にあるページをスキャンする。
    const pages = Element.book.querySelectorAll(".page")
    let page_num = null
    for(const page of pages){
      const st = page.offsetLeft - (document.body.offsetWidth / 2)
      const ed = page.offsetLeft + (document.body.offsetWidth / 2)
      if(options.scrollLeft >=st && options.scrollLeft <= ed && page.hasAttribute("data-page")){
        page_num = Number(page.getAttribute("data-page"))
        break
      }
    }
    if(page_num === Data.page_num){return}
    Data.page_num  = page_num
    // Data.group_num = this.get_page2group_num(Data.page_num)
// console.log("turn_scroll_portrait",Data.group_num,Data.page_num)
    new View()
  }
  get_scrollLeft_group(group_num){
    // return Element.book.querySelector(`.group[data-group="${group_num}"]`).offsetLeft
    return Page.get_scrollLeft_group(group_num)
  }
  get_scrollLeft_page(page_num){
    // return Element.book.querySelector(`.page[data-page="${page_num}"]`).offsetLeft
    return Page.get_scrollLeft_page(page_num)
  }
  static get_scrollLeft_group(group_num){
    return Element.book.querySelector(`.group[data-group="${group_num}"]`).offsetLeft
  }
  static get_scrollLeft_page(page_num){
    return Element.book.querySelector(`.page[data-page="${page_num}"]`).offsetLeft
  }

  get_group2page_num(group_num){
    // return Data.groups[group_num][0]
    return Page.get_group2page_num(group_num)
  }
  get_page2group_num(page_num){
    // return Data.groups.findIndex(e => e.indexOf(page_num) !== -1)
    return Page.get_page2group_num(page_num)
  }
  static get_group2page_num(group_num){
    return Data.groups[group_num][0]
  }
  static get_page2group_num(page_num){
    return Data.groups.findIndex(e => e.indexOf(page_num) !== -1)
  }

  static transition(){
    switch(Common.dimension){
      case "landscape":
        Element.book.scrollLeft = Page.get_scrollLeft_group(Data.group_num)
      break
      case "portrait":
        Element.book.scrollLeft = Page.get_scrollLeft_page(Data.page_num)
      break
    }
  }
}
