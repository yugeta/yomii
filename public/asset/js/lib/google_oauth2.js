export class GoogleOAuth2{
  constructor(options){
    this.options   = options || {}
    this.callback  = this.options.callback
    this.check_mode()
  }

  get parent_id(){
    return this.options.parent_id || ''
  }

  get client_id(){
    return this.options.google_oauth2.client_id
    // const data = Main.auth.get_auth_data()
    // return data.google_oauth2 ? data.google_oauth2.client_id : ''
  }

  get google_module(){
    return window.google
  }

  get google_client_src(){
    return 'https://accounts.google.com/gsi/client'
  }

  check_mode(){
    switch(this.options.mode){
      case 'view_header_login':
        this.view_header_login()
        break
      default:
        this.check_module()
        break
    }
  }

  check_module(){
    if(this.is_script_tag()){
      // this.button()
      this.login()
    }
    else{
      this.load_module()
    }
  }
  load_module(){
    const script = document.createElement('script')
    const dt = (+new Date())
    script.src = `${this.google_client_src}?temp=${dt}`
    script.async = true
    script.defer = true
    script.addEventListener('load' , this.loaded.bind(this))
    document.querySelector('head').appendChild(script)
  }
  is_script_tag(){
    const reg = new RegExp(`^${this.google_client_src}(.*?)`)
    const scripts = document.getElementsByTagName('script')
    for(const script of scripts){
      if(!script.src){continue}
      if(script.getAttribute('src').match(reg)){
        return true
      }
    }
    return false
  }
  check_ui_cancel(e){
    // console.log(e)
    // alert(e)
    // console.log(this.google_module.accounts.id)
    if(e.l === 'suppressed_by_user'){
      /**
       * error
       * h: "display"
       * i: false
       * l: "suppressed_by_user"
       */
      // console.log(
      //   e.getDismissedReason(),
      //   e.getNotDisplayedReason(),
      //   e.getSkippedReason(),
      //   e.getMomentType(),
      // )
      // this.google_module.accounts.id.cancel(e=>{console.log('cencel',e)})
      // this.google_module.accounts.id.prompt((e)=>{console.log('2',e)})
      // return {h:'display',i : true}
    }
    else{
      /**
       * success
       * h: "display"
       * i: true
       */
    }
    return true
  }

  loaded(){
    switch(this.options.mode){
      case 'logout':
        setTimeout(this.logout.bind(this) , 100)
        break

      case 'login':
      default:
        setTimeout(this.login.bind(this) , 100)
        break
    }
  }
  cancel(e){
    console.log(e)
    console.log(this.google_module.accounts.id)
    this.google_module.accounts.id.cancel()
  }

  login(){
    if(!this.google_module){return}
    this.google_module.accounts.id.initialize({
      prompt_parent_id      : this.parent_id,
      client_id             : this.client_id,
      prompt_close_button   : false,
      callback              : this.login_callback.bind(this),
    })
    this.button()
  }
  prompt(){
    this.google_module.accounts.id.prompt(this.check_ui_cancel.bind(this))
  }
  button(){
    const elm = this.options.parent_elm || document.getElementById(this.parent_id)
    if(!elm){return}
    this.google_module.accounts.id.renderButton(
      /** @type{!HTMLElement} */ elm,
      /** @type{!GsiButtonConfiguration} */ {
        // theme : 'filled_blue',
        logo_alignment : 'center',
        // width : 280,
        size : 'large',
      }
    )
  }
  
  login_callback(e){
    this.data = e
    this.finish()
  }
  
  finish(){
    this.login_close()
    if(!this.callback){return}
    this.callback(this.data)
  }

  logout(){
    this.google_module.accounts.id.disableAutoSelect()
    this.finish()
  }
}