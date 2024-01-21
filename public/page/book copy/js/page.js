import { Data }    from "./data.js"
import { View }    from "./view.js"
import { Element } from "./element.js"
import { Common }  from "./common.js"

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
    // Data.save()
  }
  // ページめくり（左）
  turn_left(){
    switch(Common.dimension){
      case "landscape":
        Data.group_num = this.check_group_num_over(Element.direction.checked ? Data.group_num-1 : Data.group_num+1)
        new View()
        Element.book.scrollLeft = this.get_scrollLeft_group(Data.group_num)
      break
      case "portrait":
        Data.page_num  = this.check_page_num_over(Element.direction.checked ? Data.page_num-1 : Data.page_num+1)
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
        new View()
        Element.book.scrollLeft = this.get_scrollLeft_group(Data.group_num)
      break
      case "portrait":
        Data.page_num  = this.check_page_num_over(Element.direction.checked ? Data.page_num+1 : Data.page_num-1)
        new View()
        Element.book.scrollLeft = this.get_scrollLeft_page(Data.page_num)
      break
    }
  }

  // ページめくり（ページ番号）
  turn_num(page_num){
    if(page_num === null){return}
    Data.page_num = page_num
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
    new View()

    Data.page_num = Common.group_num2page_num(Data.group_num)
    Data.save()
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
    new View()

    Data.group_num = Common.page_num2group_num(Data.page_num)
    Data.save()
  }
  get_scrollLeft_group(group_num){
    return Page.get_scrollLeft_group(group_num)
  }
  get_scrollLeft_page(page_num){
    return Page.get_scrollLeft_page(page_num)
  }
  static get_scrollLeft_group(group_num){
    return Element.book.querySelector(`.group[data-group="${group_num}"]`).offsetLeft
  }
  static get_scrollLeft_page(page_num){
    return Element.book.querySelector(`.page[data-page="${page_num}"]`).offsetLeft
  }

  get_group2page_num(group_num){
    return Page.get_group2page_num(group_num)
  }
  get_page2group_num(page_num){
    return Page.get_page2group_num(page_num)
  }
  static get_group2page_num(group_num){
    return Data.groups[group_num][0]
  }
  static get_page2group_num(page_num){
    return Data.groups.findIndex(e => e.indexOf(page_num) !== -1)
  }

  static transition(){
    Element.book.setAttribute("data-scroll" , "auto")
    switch(Common.dimension){
      case "landscape":
        Element.book.scrollLeft = Page.get_scrollLeft_group(Data.group_num)
      break
      case "portrait":
        Element.book.scrollLeft = Page.get_scrollLeft_page(Data.page_num)
      break
    }
    Element.book.removeAttribute("data-scroll")
  }
}