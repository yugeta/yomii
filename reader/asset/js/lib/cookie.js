/**
 * Cookie-library
 * # init
 * new $$cookie("service-name" , %time);
 * %time @
 *   1week  : 60*60*24*7
 *   30days : 60*60*24*30
 */

export class Cookie{
  constructor(name , sec){
    this.name = name
    this.sec  = sec || (24 * 60 * 60 * 1000)
  }
  
  get_expires(){
    const exp = new Date()
    exp.setTime(exp.getTime() + (this.sec  * 1000))
    return exp.toGMTString()
  }

  check_secure(){
    if (location.href.match(/^https/)) {
      return true
    }
    else {
      return false
    }
  }

  set(val){
    const cookie_val = this.name + '=' + this.secure_encode(val) + ';expires=' + this.get_expires()
    this.save(cookie_val)
  }

  save(val){
    if (this.check_secure()) {
      document.cookie = val + ';secure'
    }
    else {
      document.cookie = val
    }
  }

  get(){
    const ck0 = document.cookie.split(' ').join('')
    const ck1 = ck0.split(';')
    for (const val of ck1) {
      const ck2 = val.split("=")
      if (ck2[0] == this.name) {
        ck2[1] = this.secure_encode(ck2[1])
        return ck2[1]
      }
    }
    return ''
  }

  secure_encode(val){
    if (!val) {return ""}
    val = val.split('\r') .join('')
    val = val.split('\n') .join('')
    val = val.split('<')  .join('-')
    val = val.split('%3c').join('-')
    val = val.split('%3C').join('-')
    val = val.split('>')  .join('-')
    val = val.split('%3e').join('-')
    val = val.split('%3E').join('-')
    return val
  }

  del(){
    this.sec = (24 * 60 * 60 * 1000) * -1
    const cookie_val = this.name + '=' + ';max-age=0'
    if (this.check_secure()) {
      document.cookie = cookie_val + ';secure'
    }
    else {
      document.cookie = cookie_val
    }
  }
}

//  ;$$cookie = (function(){

// 	var $$ = function(name,sec){
//     if(!name){return;}
//     // name = (name) ? name : "temporary_cookie";
//     this.options = {
// 			name : name,
// 			sec  : sec || (24*60*60*1000)
//     };
//   };

//   $$.prototype.getExpires = function(){
//     var exp = new Date();
//     exp.setTime(exp.getTime() + (this.options.sec  * 1000));
//     return exp.toGMTString();
//   };

//   $$.prototype.checkSecure = function(){
//     if (location.href.match(/^https/)) {
//       return true;
//     }
//     else {
//       return false;
//     }
//   };

//   $$.prototype.set = function(val){
//     name = this.options.name;
//     val  = this.encode(val);

//     if (this.checkSecure()) {
//       document.cookie = name + "=" + val + ";expires=" + this.getExpires() + ";secure";
//     }
//     else {
//       document.cookie = name + "=" + val + ";expires=" + this.getExpires();
//     }
//   };

  // $$.prototype.get = function(){
  //   name = this.options.name;
  //   var ck0 = document.cookie.split(" ").join("");
  //   var ck1 = ck0.split(";");
  //   for ( var i = 0; i < ck1.length; i++) {
  //     var ck2 = ck1[i].split("=");
  //     if (ck2[0] == name) {
  //       ck2[1] = this.encode(ck2[1]);
  //       return ck2[1];
  //     }
  //   }
  //   return '';
  // };

//   $$.prototype.encode = function(val){
//     if (!val) {return ""}
//     val = val.split("¥r") .join("");
//     val = val.split("¥n") .join("");
//     val = val.split("<")  .join("-");
//     val = val.split("%3c").join("-");
//     val = val.split("%3C").join("-");
//     val = val.split(">")  .join("-");
//     val = val.split("%3e").join("-");
//     val = val.split("%3E").join("-");
//     return val;
//   };

//   return $$;
// })();


/*
var $$cookie = (function(){

	var $$ = function(name,sec){
		if(!name){return;}
		this.options = {
			name : name,
			sec  : sec || (24*60*60*1000)
		};
	};

  $$.prototype.getExpires = function(){
    var exp = new Date();
    exp.setTime(exp.getTime() + (this.options.sec  * 1000));
    return exp.toGMTString();
  };

  $$.prototype.checkSecure = function(){
    if (location.href.match(/^https/)) {
      return true;
    }
    else {
      return false;
    }
  };

  $$.prototype.set = function(val){
    name = this.options.name;
    val  = this.encode(val);

    if (this.checkSecure()) {
      document.cookie = name + "=" + val + ";expires=" + this.getExpires() + ";secure";
    }
    else {
      document.cookie = name + "=" + val + ";expires=" + this.getExpires();
    }
  };

  $$.prototype.get = function(){
    name = this.options.name;
    var ck0 = document.cookie.split(" ").join("");
    var ck1 = ck0.split(";");
    for ( var i = 0; i < ck1.length; i++) {
      var ck2 = ck1[i].split("=");
      if (ck2[0] == name) {
        ck2[1] = this.encode(ck2[1]);
        return ck2[1];
      }
    }
    return '';
  };

  $$.prototype.encode = function(val){
    if (!val) {return ""}
    val = val.split("¥r") .join("");
    val = val.split("¥n") .join("");
    val = val.split("<")  .join("-");
    val = val.split("%3c").join("-");
    val = val.split("%3C").join("-");
    val = val.split(">")  .join("-");
    val = val.split("%3e").join("-");
    val = val.split("%3E").join("-");
    return val;
  };

  return $$;
})();

new $$cookie("sample" , 60000).set("hoge");

*/