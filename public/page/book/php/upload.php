<?php

require_once dirname(__FILE__). "/info.php";

class Upload{
  var $shelf = "data/shelf/";
  var $temp  = "data/tmp/";
  var $files = [];
  var $info  = null;

  function __construct($files=[]){
    // if(!$files || !$files["name"]){return;}
    $this->files = $files;
    $this->files["ext"] = pathinfo($files["name"], PATHINFO_EXTENSION);

    // print_r($this->files);exit();
    $info = new Info($this->files["name"], $this->files["tmp_name"]);
    $this->info = $info->info;
    $this->info["uuid"] = date("YmdHis") ."_". uniqid();
    // echo "-";
    // print_r($info->info);
    // print_r($files);
    
  }


  function path(){
    return "{$this->shelf}{$this->file}";
  }

  function zip(){
    // require_once "zip.php";
    // $zip = new Zip($this->path());
    // $zip->convert_book();
  }

  function pdf(){
    // require_once "pdf.php";
    // $pdf = new Pdf($this->path());
    // $pdf->convert_book();
  }

  function epub(){
    // die("Unimplemented");
  }

}
