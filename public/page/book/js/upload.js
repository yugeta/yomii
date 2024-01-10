import { Data }    from "./data.js"
import { Element } from "./element.js"
import { Img }     from "./img.js"
// import { List }    from "./list.js"
import { Book }    from "./book.js"
import { Common }  from "./common.js"

export class Upload{
  constructor(options){
    // this.options = options || {}
    // new Event({
    //   uploaded : this.uploaded.bind(this)
    // })
    this.uploaded(options)
  }

  uploaded(e){
    if(!e 
    || !e.target 
    || !e.target.files 
    || !e.target.files.length){return}

    const file_data = e.target.files[0]
    const fileReader = new FileReader();
    fileReader.onload = (e => {
			const json = e.target.result
      const data = JSON.parse(json)
      Data.data = data
      new Img({
        callback : (()=>{
          Common.header_menu_close()
          // new List()
          new Book()
        })
      })
      console.log(Data.data)
      this.name_view()
      // this.finish()
		})
		fileReader.readAsText(file_data)
  }

  name_view(){
    if(!Data.data){return}
    Element.file_name.textContent = Data.data.setting.files.name
  }

  // finish(){
  //   if(this.options.callback){
  //     this.options.callback()
  //   }
  // }
}

const UploadElement = {
  input : document.querySelector(`input[name="book"][type="file"]`)
}

// class Event{
//   constructor(options){
//     if(Element.upload && options.uploaded){
//       Element.upload.addEventListener("change" , options.uploaded)
//     }
//     // if(UploadElement.input && options.uploaded){
//     //   UploadElement.input.addEventListener("change" , options.uploaded)
//     // }
//   }
// }

