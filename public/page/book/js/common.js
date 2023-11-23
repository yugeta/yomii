import { Urlinfo } from '../../../asset/js/lib/urlinfo.js'

export class Common{
  static page_name = new Urlinfo().queries.p || 'book'
  static book      = new Urlinfo().queries.book || null
  static btn_left  = document.querySelector(`.control .page-turn-over[data-type="left"]`)
  static btn_right = document.querySelector(`.control .page-turn-over[data-type="right"]`)

}