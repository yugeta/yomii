import { Data }    from "./data.js"
import { Element } from "./element.js"
import { Book }    from "./book.js"
import { Info }    from "./info.js"
import { Zip }     from "./zip.js"
import { Pdf }     from "./pdf.js"

export class Upload{
  constructor(e){
    if(!e 
      || !e.target 
      || !e.target.files 
      || !e.target.files.length){return}

    this.clear()
    Data.file_info = new Info(e.target.files[0])
    this.name_view(Data.file_info.name)
    this.set_data(e.target.files[0])
  }

  clear(){
    Element.book.innerHTML = ""
    Data.images    = []
    Data.file_info = {}
  }

  ext(filename){
    const sp = filename ? filename.split(".") : []
    return sp.length ? sp.pop() : null
  }

  set_data(filedata){
    switch(this.ext(filedata.name)){
      case "yomii":
      case "zip":
        new Zip(filedata).promise.then(this.loaded_images.bind(this))
      break

      case "pdf":
        new Pdf(filedata).promise.then(this.loaded_images.bind(this))
      break
    }
  }

  loaded_images(images){
    Data.images = images
    Data.pages  = this.get_pages(images)
    new Book()
  }

  get_pages(images){
    const datas = []
    let group_id = 0
    let page_id = 0
    for(let img_id=0; img_id<images.length; img_id++){
      const img = images[img_id]

      // landscape
      if(img.naturalWidth > img.naturalHeight){
        for(let i=0; i<2; i++){
          datas.push({
            group_id : group_id,
            page_id  : page_id,
            img_id   : img_id,
            img      : images[img_id],
          })
          page_id++
        }
        group_id++
      }

      // portrait
      else{
        const page_count = Data.file_info.singles.indexOf(img_id) !== -1 ? 1 : 2
        for(let i=0; i<page_count; i++){
          const current_img_id = img_id + i
          datas.push({
            group_id : group_id,
            page_id  : page_id,
            img_id   : current_img_id,
            img      : images[current_img_id],
          })
          page_id++
        }
        if(page_count === 2){
          img_id++
        }
        group_id++
      }
    }
    return datas
  }

  name_view(name){
    Element.file_name.textContent = name
  }

  
}



