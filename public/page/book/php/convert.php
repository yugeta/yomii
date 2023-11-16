<?php

class Convert{
  var $shelf = "data/shelf/";
  var $temp  = "data/tmp/";
  var $file  = null;
  var $ext   = null;

  function __construct($file=null){
    $this->file  = $file;
    $this->ext = $this->ext();
    switch($this->ext){
      case "zip":
        $this->zip();
        break;

      case "pdf":
        $this->pdf();
        break;

      case "epub":
        $this->epub();
        break;
    }
  }

  function ext(){
    return pathinfo($this->file, PATHINFO_EXTENSION);
  }

  function path(){
    return "{$this->shelf}{$this->file}";
  }

  function zip(){
    require_once "zip.php";
    $zip = new Zip($this->path());
    $zip->convert_book();
  }

  function pdf(){
    require_once "pdf.php";
    $pdf = new Pdf($this->path());
    // $pdf->convert_book();
  }

  function epub(){
    die("Unimplemented");
  }

}
