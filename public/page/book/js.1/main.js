// import { Init }     from "./book/init.js"
// import { Control }  from "./control.js"
// import { Header }   from "./controller/header.js"

class Main{
  constructor(){
    // new Header()
    // new Control()
    // new Init()
  }
}


switch(document.readyState){
  case "complete":
  case "interactive":
    new Main()
    break
  default:
    window.addEventListener("DOMContentLoaded" , (()=>new Main()))
    break
}
