import { Data } from './data.js'

export class Info{
  constructor(options){
    this.options = options || {}
    Info.clear()
    this.view()
  }

  static elm = document.querySelector(`.info`)

  get group_num(){
    return this.options.group_num
  }

  get pages(){
    const elms = document.querySelectorAll(`.group[data-group="${this.group_num}"] .page`)
    const pages = []
    for(const elm of elms){
      pages.push(Number(elm.getAttribute("data-page-num")))
    }
    return pages
  }

  static clear(){
    Info.elm.innerHTML = ""
  }

  view(){
    let html = []
    for(const page_num of this.pages){
      const page_data = Data.pages.find(e => e.page === page_num)
      if(!page_data){continue}
      const num = page_data.page + 1
      const checked = page_data.single ? " checked" : ""
      let page_html = "";
      page_html += `page : ${num}`+"\n"
      page_html += `<label class="single-page">single : <input type="checkbox" name="page_num" value="${page_data.page}" ${checked}/></label>`+"\n"

      html.push(page_html)
    }
    Info.elm.innerHTML = html.join("<hr>")
  }
}