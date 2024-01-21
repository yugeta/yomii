import { Data } from "./data.js"

export class Groups{
  constructor(pages){
    this.pages = pages || []
    this.datas = this.get_groups()
  }

  get_groups(){
    const pages  = this.pages
    const groups = []
    let group_num = 0
    for(let page_num = 0; page_num < pages.length; page_num++){
      const page_info  = pages[page_num]
      groups[group_num] = [page_num]
      // 見開き処理
      if(page_info.img.naturalWidth <= page_info.img.naturalHeight  // check landscape
      && !this.is_single_flg(page_num)
      && pages[page_num+1]){
        const next_info = pages[page_num+1] || null
        if(next_info.img.naturalWidth <= next_info.img.naturalHeight
        && !this.is_single_flg(page_num+1)){
          page_num++ // ページを進める
          groups[group_num].push(page_num)
        }
      }
      group_num++
    }
    return groups
  }

  // get_groups(images){
  //   const groups = []
  //   let group_num = 0
  //   for(let page_num=0; page_num<images.length; page_num++){
  //     const img  = images[page_num]
  //     groups[group_num] = [page_num]
  //     // 見開き処理
  //     if(img.naturalWidth <= img.naturalHeight  // check landscape
  //     && !this.is_single_flg(page_num)
  //     && images[page_num+1]){
  //       const next_img = images[page_num+1] || null
  //       if(next_img.naturalWidth <= next_img.naturalHeight
  //       && !this.is_single_flg(page_num+1)){
  //         page_num++ // ページを進める
  //         groups[group_num].push(page_num)
  //       }
  //     }
  //     group_num++
  //   }
  //   return groups
  // }

  is_single_flg(num){
    if(!Data.file_info.singles){
      return false
    }
    if(Data.file_info.singles.indexOf(num) !== -1){
      return true
    }
    return false
  }
}