import { Element }  from './element.js'
import { BookList } from './book_list.js'
import { BookImg }  from './book_img.js'
import { BookRead } from './book_read.js'
import { Urlinfo }  from '../../../asset/js/lib/urlinfo.js'

export class Book{
  static data       = null
  static images     = []
  static pages      = []
  static groups     = []
  static page_name  = new Urlinfo().queries.p || 'book'
  static book       = new Urlinfo().queries.book || null
  static group_num  = 0
  static page_num   = 0
  static page_sub   = null
  static duration   = 300

  constructor(options){
    this.options = options || {}
    this.img_load()
  }

  img_load(){
    this.set_direction()
    new BookImg({
      callback : this.img_loaded.bind(this)
    })
  }

  img_loaded(){
    new BookList()
    if(Book.is_portrait){
      BookRead.page()
    }
    else{
      BookRead.group()
    }
  }

  set_direction(){
    const elm = document.getElementById(`direction`)
    if(!elm){return}
    elm.checked = Book.data.direction === "right" ? false : true
  }

  // ページ送り
  static next_page(mode){
    // ページ戻り
    if((Element.direction.checked === true  && mode === "left")
    || (Element.direction.checked === false && mode === "right")){
      // 縦画面
      if(Book.is_portrait){
        if(Book.page_num === 0 && Book.page_sub === null){return}
        Book.page_num = Book.page_num || 0
        let go_page_num = Book.page_num
        if(Book.data.pages[Book.page_num].dimension === "vertical" && Common.page_sub){
          Book.page_sub = null
        }
        else{
          go_page_num--
          Book.page_sub = 1
        }
        Book.group_num = Book.get_page2group_num(go_page_num)
        go_page_num = go_page_num > 0 ? go_page_num : 0
        BookRead.page(mode, go_page_num , Book.page_sub)
      }
      // 横画面
      else{
        let go_group_num = Book.group_num - 1
        go_group_num = go_group_num > 0 ? go_group_num : 0
        BookRead.group(mode, go_group_num)
      }
    }
    // ページ進み
    else if((Element.direction.checked === true  && mode === "right")
         || (Element.direction.checked === false && mode === "left")){
      // 縦画面
      if(Book.is_portrait){
        Book.page_num = Book.page_num || 0
        let go_page_num = Book.page_num
        if(Book.data.pages[Book.page_num].dimension === "vertical" && !Book.page_sub){
          Book.page_sub = 1
        }
        else{
          go_page_num++
          Book.page_sub = null
        }
        Book.group_num = Book.get_page2group_num(go_page_num)
        go_page_num = go_page_num <= Book.images.length - 1 ? go_page_num : Book.images.length - 1
        Book.page(mode, go_page_num , Book.page_sub)
      }
      // 横画面
      else{
        let go_group_num = Book.group_num + 1
        go_group_num = go_group_num <= Book.groups.length - 1 ? go_group_num : Book.groups.length - 1
        Book.group(mode, go_group_num)
      }
    }
    else if(typeof mode === "number"){

    }
    List.set_active()
  }


  static clear_current_page(){
    const page = Element.area.querySelector(`.page`)
    if(!page){return}
    page.parentNode.removeChild(page)
  }

  // portrait処理
  static get is_portrait(){
    return screen.width < screen.height ? true : false
  }

  static get_group2page_num(group_num){
    return Book.groups[group_num] ? Book.groups[group_num][0] : 0
  }
  static get_page2group_num(page_num){
console.log(Book.groups, Book.pages, Book.images)
    return Book.groups.find(e => e.indexOf(page_num) !== -1)
  }

  static get is_first(){
    // page
    if(Book.is_portrait && Book.page_num === 0){
      return true
    }
    // group
    if(!Book.is_portrait && Book.group_num === 0){
      return true
    }
  }

  static get is_last(){
    // page
    if(Book.is_portrait && Book.page_num === Book.pages.length-1){
      return true
    }
    if(!Book.is_portrait && Book.group_num === Book.groups.length-1){
      return true
    }
  }

  static get_pageNum2pageInfo(page_num){
    return Book.images.find(e => e.page_num.indexOf(page_num) === -1)
  }
  
}
