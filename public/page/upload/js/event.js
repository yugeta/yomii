
export class Event{

  button_upload = document.querySelector(`button[name='upload']`)
  input_file    = document.querySelector(`input[type='file']`)

  constructor(){
    if(this.button_upload){
      this.button_upload.addEventListener("click" , this.upload.bind(this))
    }
  }

  form_upload = document.forms.upload

  upload(){
    if(!this.input_file.value){
      alert("ファイルが選択されていません。")
      return
    }
    const form_data = new FormData(this.form_upload)
    // form.append("mode", "upload")
    const xhr = new XMLHttpRequest()
    // xhr.withCredentials = true;
    xhr.open('POST' , 'book.php' , true)
    // xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    // xhr.setRequestHeader("Content-Type", "multipart/form-data");
    // xhr.onreadystatechange = this.posted.bind(this)
    xhr.onload = this.posted.bind(this)
    xhr.send(form_data)
  }
  posted(e){
    console.log(e.target.response)
  }

}