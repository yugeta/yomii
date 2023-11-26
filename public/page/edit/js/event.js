import { View } from "./view.js"
import { Info } from "./info.js"
import { Data } from "./data.js"

export class Event{
  constructor(){
    this.set_event()
  }

  set_event(){
    if(View.area){
      View.area.addEventListener("click" , this.click_list.bind(this))
    }
    if(Info.elm){
      Info.elm.addEventListener("click" , this.click_info.bind(this))
    }
  }

  click_list(e){
    const group_elm = e.target.closest(`.group`)
    if(!group_elm){return}
    const group_num = group_elm.getAttribute("data-group")
    // console.log(group_num)
    View.set_active(group_num)
    group_elm.setAttribute("data-status" , "active")
    new Info({
      group_num : group_num
    })
  }

  click_info(e){
    const checkbox = e.target.closest(`input[type="checkbox"][name="page_num"]`)
    if(!checkbox){return}
    // const group = check.closest(".group")
    // const group_num = group.getAttribute("data-group")
    const page_num = Number(checkbox.value)
    if(checkbox.checked === true){
      Data.pages[page_num].single = true
    }
    else{
      if(Data.pages[page_num].single){
        delete Data.pages[page_num].single
      }
    }
    new View()
    
    const group_num = Data.groups.findIndex(e => e.find(e2 => e2 === 0) !== undefined)
    // console.log(group_num,page_num,Data.groups)
    View.set_active(group_num)
  }

}