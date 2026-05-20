// import { Header }  from "./header.js"
// import { Footer }  from "./footer.js"
import { Content } from "./content.js"
import { SvgImport } from '../../../asset/js/lib/svg_import.js'
import { Auth } from './auth.js'

class Main{
  constructor(){
    // new Header({callback:this.loaded.bind(this)})
    // new Footer({callback:this.loaded.bind(this)})
    new Content({callback:this.loaded.bind(this)})
    new SvgImport()
    this.update_auth_menu()
  }

  loaded(e){
    // console.log(Object.name(e))
  }

  update_auth_menu(){
    const link = document.querySelector('.auth-link')
    if(!link) return

    if(Auth.is_logged_in()){
      const user = Auth.get_user()
      link.href = '?p=mypage'
      link.textContent = user?.name || 'マイページ'
      link.setAttribute('data-auth', 'mypage')
    }else{
      link.href = '?p=login'
      link.textContent = 'ログイン'
      link.setAttribute('data-auth', 'login')
    }
  }
}

switch(document.readyState){
  case 'complete':
  case 'interactive':
    new Main()
    break
  default:
    window.addEventListener('DOMContentLoaded' , (()=>new Main()))
    break
}