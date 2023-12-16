import { Urlinfo } from '../../../asset/js/lib/urlinfo.js'

export class Common{
  // Data
  static data       = null
  static images     = []
  static pages      = []
  static groups     = []
  static page_name  = new Urlinfo().queries.p || 'book'
  static book       = new Urlinfo().queries.book || null
  static group_num  = 0
  static page_num   = 0
  static page_sub   = null

  // Element
  static btn_left   = document.querySelector(`.control .page-turn-over[data-type="left"]`)
  static btn_right  = document.querySelector(`.control .page-turn-over[data-type="right"]`)
  static menu_pages = document.querySelector(`.menu a[href="#pages"`)
  static main       = document.querySelector(`main`)
  static list       = document.querySelector(`.book-list`)
  static area       = document.querySelector(`.book-area`)
  static direction  = document.getElementById("direction")
  static page_elm   = document.getElementById("page_num")
  static page_count = document.getElementById("page_count")
  static dimension  = document.getElementById("dimension")
  static page_nums  = document.querySelector(".page-numbers")
  // static get area_group(){return Common.area.querySelector(`.group`)}
  static get area_page(){return Common.area.querySelector(`.page`)}

}