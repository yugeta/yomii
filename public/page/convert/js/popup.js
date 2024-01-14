import { Common } from "./common.js"

export class Popup{
  constructor(){
    this.set_event()
  }

  set_event(){
    if(Common.img_area){
      Common.img_area.addEventListener("click" , this.click_img_area.bind(this))
    }
  }

  click_img_area(e){
    this.clear()
    const img = e.target.closest(".page img")
    if(!img){return}
    this.view_image(img)
  }

  view_image(img){
    const base = document.createElement("div")
    base.className = "base"
    document.body.appendChild(base)
    base.addEventListener("click" , this.click_base.bind(this));

    const popup_img = new Image()
    popup_img.src = img.src
    base.appendChild(popup_img)

    const info = document.createElement("div")
    info.className = "info"
    const page = img.closest(".page")
    info.textContent = page.getAttribute("data-num")
    base.appendChild(info)
  }

  click_base(e){
    const base = e.target.closest(".base")
    // if(e.target.className !== "base"){return}
    base.parentNode.removeChild(base)
  }

  clear(){

  }
}