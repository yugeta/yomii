import { Common } from "./common.js"
import { View }   from "./view.js"

export class Popup{
  constructor(){
    this.set_event()
  }

  set_event(){
    if(Common.img_area){
      Common.img_area.addEventListener("click" , this.click_img_area.bind(this))
    }
    if(this.elm_single){
      this.elm_single.addEventListener("click" , this.click_single.bind(this))
    }
  }

  click_img_area(e){
    this.clear()
    this.img = e.target.closest(".page img")
    if(!this.img){return}
    this.view_image()
    this.view_tooltip()
    this.set_event()
  }

  view_image(){
    const img = this.img
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
    const close = e.target.closest(".close")
    if(!close){
      return
    }
    const base = e.target.closest(".base")
    base.parentNode.removeChild(base)
  }

  view_tooltip(){
    const img       = this.img
    const num        = Common.images.findIndex(e => e === img)
    const w         = img.naturalWidth
    const h         = img.naturalHeight
    const dimension = w > h ? "landscape" : "portrait"
    const single    = Common.file_info.singles.find(e => e === num) !== undefined ? true : false

    let html = ""
    html += `<div class="close"></div>`
    html += `<div>Num : ${num}</div>`
    html += `<div>Width : ${w}</div>`
    html += `<div>Height : ${h}</div>`
    html += `<div>Dimension : ${dimension}</div>`
    if(dimension === "portrait"){
      const checked = single ? "checked" : ""
      html += `<label>Single : <input type="checkbox" name="single" ${checked}></label>`
    }

    const div = document.createElement("div")
    div.className = "tooltip"
    div.innerHTML = html
    
    const base = document.querySelector(".base")
    base.appendChild(div)
  }

  get elm_single(){
    return document.querySelector(`input[name="single"]`)
  }

  click_single(e){
    const single_flg = e.target.checked
    const img        = this.img
    const num        = Common.images.findIndex(e => e === img)
    if(single_flg){
      Common.file_info.singles.push(num)
    }
    else{
      Common.file_info.singles = Common.file_info.singles.filter(e => e !== num)
    }
    
    new View()
  }

  clear(){
    const base = document.querySelector(`.base`)
    if(!base){return}
    base.parentNode.removeChild(base)
  }
}