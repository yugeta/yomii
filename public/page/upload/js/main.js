import { Event } from "./event.js"

class Main{
  constructor(){
    new Event()
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
