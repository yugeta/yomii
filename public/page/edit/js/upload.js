// import { Common }  from './common.js'
// import { Book }    from './book.js'
import { Data }    from './data.js'
import { Img }     from '../../book/js/img.js'

export class Upload{
  constructor(options){
    this.options = options || {}
    this.set_event()
  }
  data = null

  elm_input_upload = document.querySelector(`input[type="file"][name="book"]`)

  set_event(){
    if(this.elm_input_upload){
      this.elm_input_upload.addEventListener("change" , this.book_up.bind(this))
    }
  }

  book_up(e){
    const filepath = e.target.value
    const fileReader = new FileReader();
    fileReader.onload = (e => {
      // Common.main.setAttribute("rel" , "book")
			const json = e.target.result
      Data.data = JSON.parse(json)
      Data.data.filepath = filepath
      // Common.data = data
      // this.change_url(data)
      // new Book()
      new Img({
        data     : Data.data,
        callback : this.loaded_image.bind(this)
      })
      
      // this.finish()
		})
		fileReader.readAsText(e.target.files[0])
  }

  loaded_image(datas){
    Data.pages = datas
    this.finish()
  }

  // change_url(data){
  //   console.log(data)
  //   const name = data.name
  //   new Urlinfo().add_query("book" , name)
  // }

  finish(){
    if(this.options.callback){
      this.options.callback()
    }
  }
}