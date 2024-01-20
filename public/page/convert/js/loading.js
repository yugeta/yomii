

export class Loading{
  constructor(options){
    this.options = options || {}
    this.page_count = this.options.page_count || 0

    Loading.clear()
    this.view()
  }

  view(){
    for(let i=0; i<this.page_count; i++){
      const div = document.createElement("div")
      div.setAttribute("data-num" , i)
      Loading.elm_root.appendChild(div)
    }
  }

  static get elm_root(){
    return document.querySelector(".loading")
  }

  static clear(){
    if(!Loading.elm_root){return}
    Loading.elm_root.innerHTML = ""
  }

  static set_active(num){
    const target = Loading.elm_root.querySelector(`:scope > *:nth-of-type(${num+1})`)
    if(!target){return}
    target.setAttribute("data-active" , "true")
  }

}