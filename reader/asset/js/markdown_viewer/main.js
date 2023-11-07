import { Init }      from './init.js'
import { SvgImport } from './lib/svg_import.js'
import { Menu }      from './menu.js'
// import { Login }     from './login.js'
import { Urlinfo }   from './lib/urlinfo.js'

window.loaded_callbacks = []
const urlinfo = new Urlinfo()

export const Main = {
  urlinfo  : urlinfo,
  php_path : `${urlinfo.origin}${urlinfo.path}php/main.php`,
  assets   : [
    {type : 'menu'    , file : 'assets/html/menu.html',   selector : 'menu'},
    {type : 'header'  , file : 'assets/html/header.html', selector : 'header'},
    {type : 'footer'  , file : 'assets/html/footer.html', selector : 'footer'},
    {type : 'content' , file : get_content_path(),        selector : 'main'},
  ],
}

function start(){
  new Init({
    assets : Main.assets,
  }).then(e => {
    new SvgImport()
    new Menu()
    // new Login()
    callbacks()
  })
}

// auth,login,customのページ表示を確認してコンテンツを読み込む為のパスを取得する。
function get_content_path(){
  const pagename = urlinfo.queries.p ? `${urlinfo.queries.p}` : `index`
  const filename = urlinfo.queries.f ? `${urlinfo.queries.f}` : `index`
  const path     = `page/${pagename}/${filename}.html`
  return path
}

function callbacks(){
  for(const callback of window.loaded_callbacks){
    callback()
  }
  window.loaded_callbacks = null
  // is_content_view()
}

// function is_content_view(){
//   const elms = document.querySelectorAll(`header nav .menu a, menu nav a`)
//   console.log(elms)
//   // for(const elm of elms){
//   //   console.log(elm)
//   // }
// }

switch(document.readyState){
  case 'complete':
  case 'interactive':
    start()
    break
  default:
    window.addEventListener('DOMContentLoaded' , start)
    break
}