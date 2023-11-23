import { Common } from "./common.js"
import { Urlinfo } from '../../../asset/js/lib/urlinfo.js'

export class Header{
  constructor(){
    this.set_event()
  }

  set_event(){
    if(Common.menu_pages){
      Common.menu_pages.onclick = (()=>{return false})
      Common.menu_pages.addEventListener("click" , this.click_pages.bind(this))

    }
  }

  // pagesリンクをクリックした
  click_pages(){
    // const urlinfo = new Urlinfo()
    if(Common.list.getAttribute("data-status") === "active"){
      // const url = `${urlinfo.url}?${urlinfo.query}`
      // history.pushState(null , null , url);
      // this.visible(false)
      Common.list.removeAttribute("data-status")
    }
    else{
      // const url = `${urlinfo.url}?${urlinfo.query}#pages`
      // history.pushState(null , null , url);
      // this.visible(true)
      Common.list.setAttribute("data-status", "active")
    }
  }

  // visible(flg){
  //   switch(flg){
  //     case true:
  //       Common.menu_pages.setAttribute("data-status", "active")
  //       break
  //     default:
  //       Common.menu_pages.removeAttribute("data-status")
  //       break
  //   }
  // }
}