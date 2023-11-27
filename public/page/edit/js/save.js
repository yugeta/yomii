import { Data }   from './data.js'
import { Upload } from './upload.js'

export class Save{
  constructor(){
    this.save(this.data)
  }

  static elm = document.getElementById(`save`)

  get data(){
    const data     = JSON.parse(JSON.stringify(Data.data))
    data.groups    = Data.groups
    data.pages     = this.pages2datas
    data.direction = this.get_direction
    return data
  }

  get pages2datas(){
    const pages = []
    for(const page of Data.pages){
      pages.push({
        dimension : page.dimension,
        w         : page.w,
        h         : page.h,
        single    : page.single ? true : false,
      })
    }
    return pages
  }

  get filename(){
    if(!Upload.elm_input_upload){return ""}
    const value = Upload.elm_input_upload.value
    const separate = value.indexOf("/") ? "/" : "\\";
    const sp = value.split(separate)
    return sp[sp.length-1];
  }

  get get_direction(){
    return document.getElementById(`direction`).checked ? "left" : "right";
  }

  save(data){
    const blob = new Blob([JSON.stringify(data)], {type: 'application\/json'})
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url
    a.download = this.filename
    a.click()
  }

}