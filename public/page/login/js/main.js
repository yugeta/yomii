import { GoogleOAuth2 } from "../../../asset/js/lib/google_oauth2.js"
import { Auth }        from "../../common/js/auth.js"

class LoginPage{
  constructor(){
    this.init()
  }

  async init(){
    // .env から設定読み込み
    await Auth.init()

    // 既にログイン済みならマイページへ
    if(Auth.is_logged_in()){
      location.href = "./?p=mypage"
      return
    }

    this.setup_google_login()
  }

  setup_google_login(){
    new GoogleOAuth2({
      parent_id    : "google-login-button",
      google_oauth2: {
        client_id : Auth.GOOGLE_CLIENT_ID,
      },
      callback : this.on_google_login.bind(this),
    })
  }

  on_google_login(response){
    if(!response || !response.credential){
      console.error("Google login failed: no credential")
      return
    }

    // JWT をデコードしてユーザー情報を取得
    const payload = Auth.decode_jwt(response.credential)
    if(!payload){
      console.error("Google login failed: invalid JWT")
      return
    }

    // ログイン情報を保存
    const user_data = {
      provider   : "google",
      id         : payload.sub,
      name       : payload.name,
      email      : payload.email,
      picture    : payload.picture,
      credential : response.credential,
      logged_in_at : Date.now(),
    }

    Auth.save_user(user_data)

    // マイページへ遷移
    location.href = "./?p=mypage"
  }
}

new LoginPage()
