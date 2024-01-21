import { Element } from "./element.js"
import { Data }    from "./data.js"
import { Info }    from "./info.js"

export class Common{
  static header_menu_close(){
    Element.menu_open.checked = false
  }

  // ページ番号から画像データを取得
  static page2Info(page_num){
    // return Data.images[page_num]
    return Data.pages[page_num]
    // return Data.images.find(e => typeof e.page_num === "number" ? e.page_num === page_num : e.page_num.indexOf(page_num) !== -1)
  }

  // 読み進める方向を取得 [left , right]
  static get direction(){
    return Element.direction.checked ? "left" : "right"
  }

  // 画面サイズ [landscape（横） , portrait（縦）]
  static get dimension(){
    return window.innerWidth > window.innerHeight ? "landscape" : "portrait"
  }

  static group_num2page_num(group_num){
    return Data.groups[group_num][0]
  }
  static page_num2group_num(page_num){
    return Data.groups.findIndex(e => e.indexOf(page_num) !== -1)
  }

  static set_file_info(datas){
    for(const key in Common.file_info){
      Common.file_info[key] = datas[key] !== undefined ? datas[key] : Common.file_info[key]
    }
  }
}