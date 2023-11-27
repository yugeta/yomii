import { Data }   from "./data.js"

export class View{
  constructor(options){
    this.options = options || {}
    this.clear()
    this.set_direction()
    this.set_group()
    this.finish()
  }

  static area = document.querySelector(`.pages`)

  clear(){
    View.area.innerHTML = ""
  }

  set_direction(){
    const elm = document.getElementById(`direction`)
    if(!elm){return}
    elm.checked = Data.data.direction === "right" ? false : true
  }

  set_group(){
    Data.groups = []
    let group_num = 0
    for(let i=0; i<Data.pages.length; i++){
      const page = Data.pages[i]
      const next = Data.pages[i+1] || null
      Data.groups[group_num] = [i]
      // 見開き処理
      if(!page.single){
        switch(page.dimension){
          case "vertical":
            break
          case "horizontal":
            if(next && next.dimension === "horizontal" && !next.single){
              i++
              Data.groups[group_num].push(i)
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
    for(let i=0; i<Data.groups.length; i++){
      const group_num = i
      const div_group = document.createElement("div")
      View.area.appendChild(div_group)
      div_group.className = "group"
      div_group.setAttribute("data-group", group_num)
      this.view_pages(div_group, Data.groups[i])
    }
  }

  view_pages(elm_group, pages){
    for(const page_num of pages){
      const img = Data.pages.find(e => e.page === page_num)
      const div_page = document.createElement("div")
      div_page.className = "page"
      if(img.single){
        div_page.setAttribute("data-single","true")
      }
      div_page.setAttribute("data-page-num" , img.page)
      div_page.appendChild(img.img)
      elm_group.appendChild(div_page)
    }
  }

  finish(){
    if(this.options.callback){
      this.options.callback(this)
    }
  }

  static set_active(group_num){
    const groups = View.area.querySelectorAll(`:scope > .group`)
    for(const group of groups){
      if(Number(group.getAttribute("data-group")) === Number(group_num)){
        group.setAttribute("data-status" , "active")
      }
      else{
        group.setAttribute("data-status" , "passive")
      }
    }
  }
}