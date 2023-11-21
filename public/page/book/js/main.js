import { Upload }  from './upload.js'
import { Book }    from './book.js'
import { Urlinfo } from '../../../asset/js/lib/urlinfo.js'

export class Main{
  constructor(){
    this.upload()
  }
  static page_name = new Urlinfo().queries.p || 'book'
  static book      = new Urlinfo().queries.book || null

  upload(){
    new Upload({
      callback : this.uploaded.bind(this)
    })
  }
  uploaded(e){
    new Book({
      book: e.book,
    })
  }
}


switch(document.readyState){
  case "complete":
  case "interactive":
    new Main()
    break
  default:
    window.addEventListener("DOMContentLoaded" , (()=>new Main()))
    break
}
