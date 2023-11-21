import { Urlinfo }  from '../lib/urlinfo.js'

export class Loading{
  static time_start = 0
  static time_end   = 0
  static time_range = 0

  constructor(){
    Loading.clear()
    Loading.set_css()
    Loading.set_elm()
    Loading.set_progress()
    Loading.set_bar()
    Loading.set_rate(0)
    Loading.set_status()
  }
  static class_name_root     = 'loading'
  static class_name_progress = 'loading-progress'
  static class_name_bar      = 'loading-bar'

  static get page_name(){
    return new Urlinfo().queries.p || 'index'
  }

  static get root(){
    return document.querySelector(`div.${Loading.class_name_root}`)
  }
  static get progress(){
    return Loading.root.querySelector(`div.${Loading.class_name_progress}`)
  }
  static get bar(){
    return Loading.progress.querySelector(`div.${Loading.class_name_bar}`)
  }

  static set_css(){
    if(document.querySelector(`link.${Loading.class_name_root}`)){return}
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.className = Loading.class_name_root
    const path = import.meta.url.split('/').slice(0,-1).join('/')
    link.href = `${path}/loading.css`
    document.head.appendChild(link)
  }
  
  static set_elm(){
    if(Loading.root){return}
    const div = document.createElement('div')
    div.className = Loading.class_name_root
    document.body.appendChild(div)
  }
  
   static set_progress(){
    if(!Loading.root){return}
    const div = document.createElement('div')
    div.className = Loading.class_name_progress
    Loading.root.appendChild(div)
  }

  static set_bar(){
    if(!Loading.progress){return}
    const div = document.createElement('div')
    div.className = Loading.class_name_bar
    Loading.progress.appendChild(div)
  }

  static set_rate(rate){
    if(!Loading.progress || !Loading.bar){return}
    rate = rate || 0
    Loading.bar.style.setProperty('width' , `${rate}%` , '')
    this.get_current_loading_time()
  }

  static set_status(status){
    if(!Loading.root){return}
    Loading.root.setAttribute('data-status' , status || 'passive')
    
    Loading.calc_time(status)
  }
  static calc_time(status){
    switch(status){
      case "active":
        Loading.time_start = (+new Date())
        break
      case "passive":
        Loading.time_end = (+new Date())
        Loading.set_rate(0)
        break
    }
    if(Loading.time_start && Loading.time_end){
      Loading.time_range = (Loading.time_end - Loading.time_start )/ 1000
    }
  }

  static get_current_loading_time(){
    const current_date = (+new Date())
    const time = current_date - Loading.time_start / 1000
  }

  static clear(){
    // this.set_rate(0)
    if(!Loading.root){return}
    Loading.root.parentNode.removeChild(Loading.root)
  }
}