// import { Common }  from './common.js'
import { Info }    from './info.js'
import { Data }    from './data.js'
import { Img }     from '../../book/js/img.js'

export class Upload{
  constructor(options){
    this.options = options || {}
    this.set_event()
  }
  data = null

  static elm_input_upload = document.querySelector(`input[type="file"][name="book"]`)

  set_event(){
    if(Upload.elm_input_upload){
      Upload.elm_input_upload.addEventListener("change" , this.book_up.bind(this))
    }
  }

  book_up(e){
    const filepath = e.target.value
    const fileReader = new FileReader();
    fileReader.onload = (e => {
			const json = e.target.result
      Data.data = JSON.parse(json)
      Data.data.filepath = filepath
      new Img({
        data     : Data.data,
        callback : this.loaded_image.bind(this)
      })
		})
		fileReader.readAsText(e.target.files[0])
  }

  loaded_image(datas){
    Data.pages = datas
    Info.clear()
    this.finish()
  }

  finish(){
    if(this.options.callback){
      this.options.callback()
    }
  }
}