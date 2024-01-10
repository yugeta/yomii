import { Element }  from "../model/element.js"
// import { BookList } from "./book_list.js"

export class Header{
  constructor(){
    this.set_event()
  }

  set_event(){
    if(Element.menu_pages){
      Element.menu_pages.onclick = (()=>{return false})
      Element.menu_pages.addEventListener("click" , this.click_pages.bind(this))
    }
  }

  // // pagesリンクをクリックした
  // click_pages(){
  //   BookList.set_active()
  //   if(Element.list.getAttribute("data-status") === "active"){
  //     Element.list.removeAttribute("data-status")
  //   }
  //   else{
  //     Element.list.setAttribute("data-status", "active")
  //   }
  // }
}