
export class Common{
  static php_book      = "book.php"
  static form_upload   = document.forms.upload
  static button_upload = document.querySelector(`button[name="upload"]`)
  static input_file    = document.querySelector(`input[type="file"][name="book"]`)
  static img_area      = document.querySelector(".pages")
  static download_area = document.querySelector(".control .download")
  static download_ext  = "yomii"
  
  static max_size      = 1000
  static adjust_size(size){
    switch(size.w > size.h){
      // landscape
      case true:
        if(size.w <= Common.max_size){return size}
        return {
          w : Common.max_size,
          h : ~~(size.h * (Common.max_size / size.w)),
        }

      // horizon
      case  false:
        if(size.h <= Common.max_size){return size}
        return {
          w : ~~(size.w * (Common.max_size / size.h)),
          h : Common.max_size,
        }
      break
    }
  }
}
