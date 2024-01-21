// import { Data }    from "./data.js"
import { Element } from "./element.js"
import { Img }     from "./img.js"
import { Book }    from "./book.js"
// import { Common }  from "./common.js"
import { Zip }     from "./zip.js"
import { Pdf }     from "./pdf.js"

export class Upload{
  constructor(e){
    // this.uploaded(options)
    if(!e 
      || !e.target 
      || !e.target.files 
      || !e.target.files.length){return}
    const filedata = e.target.files[0]
    const filename = filedata.name
    this.fileinfo = this.fileinfo(filename)
    this.name_view(this.fileinfo.name)
    this.set_data(filedata)
    // const fileReader = new FileReader();
    // fileReader.onload = this.set_data.bind(this)
    // fileReader.readAsArrayBuffer(filedata)
  }

  fileinfo(filename){
    const sp = filename.split(".")
    const ext = sp.pop()
    return {
      ext : ext,
      name : sp.join(".")
    }
  }

  set_data(filedata){
    if(!filedata){return}
    switch(this.fileinfo.ext){
      case "yomii":
      case "zip":
        new Zip(filedata, this.set_book.bind(this))
      break

      case "pdf":
        new Pdf(filedata, this.set_book.bind(this))
      break
    }
  }

  // set_img(){
  //   new Img({
  //     callback : this.set_book.bind(this)
  //   })
  // }

  set_book(){
    Img.set_page_groups()
    new Book()
  }



//   data(e){
//     if(!e 
//     || !e.target 
//     || !e.target.files 
//     || !e.target.files.length){return}

//     const file_data = e.target.files[0]
//     const fileReader = new FileReader();
//     fileReader.onload = (e => {
//       if(!e || !e.target || !e.target.result){return}
      
// 			// const json = e.target.result
//       // const data = JSON.parse(json)
//       const data = this.get_data(e.target.result)
//       Data.data = data
// // console.log(data)
//       // Data.book_name = this.filepath2name(Data.data.filepath)

//       // ファイル名確定(book_name)
//       Data.set_name()

//       // localStorageデータの読み込み
//       new Data()

//       new Img({
//         callback : (()=>{
//           Common.header_menu_close()
//           new Book()
//         })
//       })
//       this.name_view()
// 		})
// 		fileReader.readAsText(file_data)
//   }

  name_view(name){
    Element.file_name.textContent = name
  }

  
}



