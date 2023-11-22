import { Upload }  from './upload.js'
import { Book }    from './book.js'
import { Urlinfo } from '../../../asset/js/lib/urlinfo.js'

export class Main{
  constructor(){
    this.check_address()
    // this.upload()
  }
  static page_name = new Urlinfo().queries.p || 'book'
  static book      = new Urlinfo().queries.book || null

  check_address(){
    const urlinfo = new Urlinfo()
    if(!urlinfo.queries || !Object.keys(urlinfo.queries).length){
      this.upload()
    }
    else if(urlinfo.queries.book){
      if(Book.data){
        new Book()
      }
      // bookクエリが指定されていて、bookデータがない場合はクエリを取ってリダイレクト
      else{
        location.href = urlinfo.url
      }
    }
    else{
      this.upload()
    }
  }

  upload(){
    new Upload()
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
