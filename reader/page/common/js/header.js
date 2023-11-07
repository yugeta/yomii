import { SvgImport } from '../../../asset/js/lib/svg_import.js'

export class Header{
  constructor(options){
    this.options = options || {}
    this.load()
  }
  path = "page/common/html/header.html"

  load(){
    const xhr = new XMLHttpRequest()
    xhr.open('GET' , this.path , true)
    xhr.setRequestHeader("Content-Type", "text/html");
    xhr.onload = this.loaded.bind(this)
    xhr.send()
  }

  loaded(e){
    document.body.insertAdjacentHTML('afterbegin' , e.target.response)
    this.finish()
  }

  finish(){
    new SvgImport({root:document.querySelector('header')})
    if(this.options.callback){
      this.options.callback(this)
    }
  }
}