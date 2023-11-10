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
    }
    new Breadcrumps()
    new Load({
      dir : new Urlinfo().queries.dir || '',
      callback: this.view.bind(this),
    })
  }
  view(load_cls){
    new View({
      datas: load_cls.datas,
      // callback : this.event.bind(this),
    })
  }
  event(view_cls){
    new Event()
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
