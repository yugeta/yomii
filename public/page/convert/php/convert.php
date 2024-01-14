<?php

require_once dirname(__FILE__). "/common.php";

class Convert{
  var $uuid    = null;
  var $setting = null;

  function __construct($query=[]){
    if(!$query["uuid"]){return;}
    $setting = Common::get_setting_data($query["uuid"]);
    if(!$setting){return;}

    switch($setting["ext"]){
      case "pdf":
        require_once dirname(__FILE__)."/pdf.php";
        $pdf = new Pdf($setting);
        $pdf->convert();
        break;

      case "zip":
        require_once dirname(__FILE__)."/zip.php";
        $zip = new Zip($setting);
        $zip->convert();
        break;

      case "epub":
        die("Unimplemented");
        break;
    }
  }

}
