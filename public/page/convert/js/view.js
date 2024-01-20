import { Common } from "./common.js"

export class View{
  constructor(){
    this.clear()
    this.images()
  }

  clear(){
    Common.img_area.innerHTML = ""
  }

  // images(){
  //   for(let i=0; i<Common.images.length; i++){
  //     const img = Common.images[i]
  //     const w = img.naturalWidth
  //     const h = img.naturalHeight
  //     const dimension = w > h || Common.file_info.singles.indexOf(i) !== -1 ? "landscape" : "portrait"
  //     const single = Common.file_info.singles.indexOf(i) !== -1 ? 1 : 0
  //     const page = document.createElement(dimension === "landscape" ? "div" : "span")
  //     page.className = "page"
  //     page.setAttribute("data-width",  w)
  //     page.setAttribute("data-height", h)
  //     page.setAttribute("data-dimension" , dimension)
  //     if(dimension === "portrait"){
  //       page.setAttribute("data-single" , single)
  //     }
  //     Common.img_area.appendChild(page)
  //     page.appendChild(img)
  //   }
  // }

  images(){
    for(let i=0; i<Common.images.length; i++){
      const data = this.image(i)
      // console.log(data)
      // const dimension = this.dimension(data.img)
      const page = this.create_page()
      page.appendChild(data.img)
      if(this.check_single(data)){
        i++
        const data2 = this.image(i)
        page.appendChild(data2.img)
      }
      Common.img_area.appendChild(page)
      const img_count = page.getElementsByTagName("img").length
      page.setAttribute("data-img-count" , img_count)
    }
  }

  create_page(){
    const page = document.createElement("div")
    page.className = "page"
    return page
  }

  image(num){
    const img = Common.images[num]
    const dimension = this.dimension(img)
    img.setAttribute("data-dimension" , dimension)
    return {
      num       : num,
      img       : img,
      w         : img.naturalWidth,
      h         : img.naturalHeight,
      dimension : dimension,
    }
  }

  dimension(img){
    if(!img){return}
    return img.naturalWidth > img.naturalHeight ? "landscape" : "portrait"
  }

  check_single(data){
    if(data.dimension === "landscape"){
      return false
    }
    if(Common.file_info.singles.indexOf(data.num) !== -1){
      return false
    }
    if(Common.file_info.singles.indexOf(data.num+1) !== -1){
      return false
    }

    const next_img = Common.images[data.num+1]
    if(!next_img){return false}
    if(this.dimension(next_img) === "landscape"){
      return true
    }

    return true
  }

}