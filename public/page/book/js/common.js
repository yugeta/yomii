import { Urlinfo } from '../../../asset/js/lib/urlinfo.js'

export class Common{
  static page_name  = new Urlinfo().queries.p || 'book'
  static book       = new Urlinfo().queries.book || null
  static btn_left   = document.querySelector(`.control .page-turn-over[data-type="left"]`)
  static btn_right  = document.querySelector(`.control .page-turn-over[data-type="right"]`)
  static menu_pages = document.querySelector(`.menu a[href="#pages"`)
  static main       = document.querySelector(`main`)
  static list       = document.querySelector(`.book-list`)
  static area       = document.querySelector(`.book-area`)
  static direction  = document.getElementById("direction")
  static page_num   = document.getElementById("page_num")
  static page_count = document.getElementById("page_count")
}