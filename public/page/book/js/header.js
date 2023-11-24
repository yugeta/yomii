import { Common } from "./common.js"
import { List }   from "./list.js"

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
    List.set_active()
    if(Common.list.getAttribute("data-status") === "active"){
      Common.list.removeAttribute("data-status")
    }
    else{
      Common.list.setAttribute("data-status", "active")
    }
  }
}