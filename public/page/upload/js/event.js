
export class Event{

  button_upload = document.querySelector(`button[name='upload']`)
  input_file    = document.querySelector(`input[type='file']`)

  constructor(){
    if(this.button_upload){
      this.button_upload.addEventListener("click" , this.upload.bind(this))
    }
  }

  upload(){
    console.log(this.input_file.value)
  }
}