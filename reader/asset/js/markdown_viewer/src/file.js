import { Markdown } from './markdown.js'

export class File{
  constructor(filepath , selector){
    this.filepath = filepath
    this.selector = selector
    this.load()
    this.set_markdown()
  }
  get elm(){
    return document.querySelector(this.selector)
  }
  load(){
    const xhr = new XMLHttpRequest()
    xhr.open('get' , this.filepath , true)
    xhr.setRequestHeader('Content-Type', 'text/html');
    xhr.onload = this.loaded.bind(this)
    xhr.send()
  }
  loaded(e){
    this.elm.innerHTML = new Markdown(e.target.response).text
  }
  set_markdown(){
    this.elm.setAttribute('data-markdown' , 'converted')
  }
}

