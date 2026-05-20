import { Load }  from './load.js'
import { View }  from './view.js'
import { Event } from './event.js'
import { Breadcrumps } from './breadcrumps.js'
import { Urlinfo } from "../../../asset/js/lib/urlinfo.js"

export class Main{
  constructor(options){
    this.options = options || {}
    if(!options){
      new Event()
      this.bind_tabs()
    }
    new Breadcrumps()

    const source = new Urlinfo().queries.source || "local"
    this.set_active_tab(source)

    new Load({
      source   : source,
      dir      : new Urlinfo().queries.dir || '',
      callback : this.view.bind(this),
    })
  }

  view(load_cls){
    const empty_el = document.querySelector(".shelf-empty")

    if(load_cls.error_message){
      document.querySelector("ul.lists").innerHTML = ""
      if(empty_el){
        empty_el.style.display = ""
        empty_el.textContent = load_cls.error_message
      }
      return
    }

    if(!load_cls.datas || load_cls.datas.length === 0){
      document.querySelector("ul.lists").innerHTML = ""
      if(empty_el){
        empty_el.style.display = ""
        empty_el.textContent = "書籍がありません。"
      }
      return
    }

    if(empty_el){
      empty_el.style.display = "none"
    }

    new View({
      datas: load_cls.datas,
    })
  }

  bind_tabs(){
    const tabs = document.querySelectorAll(".shelf-tab")
    for(const tab of tabs){
      tab.addEventListener("click", this.on_tab_click.bind(this))
    }
  }

  on_tab_click(e){
    const source = e.currentTarget.getAttribute("data-source")
    const urlinfo = new Urlinfo()
    
    // URL を更新してリロード
    const params = new URLSearchParams(location.search)
    params.set("p", "shelf")
    params.set("source", source)
    params.delete("dir")
    location.search = params.toString()
  }

  set_active_tab(source){
    const tabs = document.querySelectorAll(".shelf-tab")
    for(const tab of tabs){
      if(tab.getAttribute("data-source") === source){
        tab.classList.add("active")
      }else{
        tab.classList.remove("active")
      }
    }
  }
}

switch(document.readyState){
  case 'complete':
  case 'interactive':
    new Main()
    break
  default:
    window.addEventListener('DOMContentLoaded' , (()=>new Main()))
    break
}
