import { Book } from './book.js'
import { Main } from './main.js'
import { Urlinfo } from '../../../asset/js/lib/urlinfo.js'

export class Upload{
  constructor(options){
    this.options = options || {}
    this.set_event()
  }
  book = null

  elm_input_upload = document.querySelector(`input[type="file"][name="book"]`)

  set_event(){
    if(this.elm_input_upload){
      this.elm_input_upload.addEventListener("change" , this.book_up.bind(this))
    }
  }

  book_up(e){
    // console.log(e.target.files[0])
    const fileReader = new FileReader();
    fileReader.onload = (e => {
			const json = e.target.result
      const data = JSON.parse(json)
      this.book = data

      this.finish()
		})
		fileReader.readAsText(e.target.files[0])
  }

  finish(){
    if(this.options.callback){
      this.options.callback(this)
    }
  }
}