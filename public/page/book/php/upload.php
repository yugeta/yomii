<?php

require_once dirname(__FILE__). "/common.php";
require_once dirname(__FILE__). "/info.php";

class Upload{
  var $files = [];
  var $info  = [];
  var $path  = null;

  function __construct($files=[]){
    if(!$files || !$files["name"]){return;}
    $this->files = $files;
    $this->init();
    $this->set_info();
    $this->mk_dir();
    $this->file_move();
    // $this->save_info();
    // $this->add_task();
  }

  function init(){
    $this->files["ext"]     = pathinfo($this->files["name"], PATHINFO_EXTENSION);
    $this->info["date"]     = date("Y-m-d");
    $this->info["time"]     = date("H:i:s");
    $this->info["timezone"] = date("T");
    $this->info["uuid"]     = $this->create_uuid();
    $this->path             = Common::get_uuid_dir($this->info["uuid"]);
  }

  function create_uuid(){
    return date("YmdHis") ."_". uniqid();
  }

  function set_info(){
    $info = new Info($this->files["name"], $this->files["tmp_name"]);
    $this->info = array_merge($this->info, $info->info);
  }

  function mk_dir(){
    if(!is_dir($this->path)){
      mkdir($this->path , 0777 , true);
      $this->info["path"] = realpath($this->path);
    }
  }

  function file_move(){
    // move_uploaded_file($this->files["tmp_name"] , $this->path. Common::$origin .".". $this->files["ext"]);
    $ext = $this->files["ext"];
    move_uploaded_file($this->files["tmp_name"] , $this->path .DIRECTORY_SEPARATOR. Common::get_original_file($ext));
  }

  function save_json($datas=[]){
    $json = json_encode($datas , JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    $save_path = $this->info["path"] . DIRECTORY_SEPARATOR .Common::$setting_file;
    return file_put_contents($save_path , $json);
  }

  // function add_task(){
  //   $cmd = "php book.php mode=convert uuid={$this->info["uuid"]} ext={$this->files["ext"]}";
  //   exec($cmd , $res);
  //   // コマンド確認用（）

  //   // $this->info["path"] = $this->path;
  //   $this->info["cmd"] = $cmd;
  //   $this->info["res"] = $res;
  // }
}
