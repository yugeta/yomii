import { Data }    from "./data.js"
import { Element } from "./element.js"
import { Img }     from "./img.js"
import { Book }    from "./book.js"
import { Common }  from "./common.js"

export class Upload{
  constructor(options){
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
// console.log(data)
      // Data.book_name = this.filepath2name(Data.data.filepath)

      // ファイル名確定(book_name)
      Data.set_name()

      // localStorageデータの読み込み
      new Data()

      new Img({
        callback : (()=>{
          Common.header_menu_close()
          new Book()
        })
      })
      this.name_view()
		})
		fileReader.readAsText(file_data)
  }

  name_view(){
    if(!Data.data){return}
    // Element.file_name.textContent = Data.data.setting.files.name
    Element.file_name.textContent = Data.book_name
  }

  // filepath2name(filepath=""){
  //   const sp = filepath.split("\\")
  //   const name = sp.pop()
  //   const sp2 = name.split(".")
  //   sp2.pop()
  //   return sp2.join(".")
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

