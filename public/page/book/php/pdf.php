<?php

require_once dirname(__FILE__). "/common.php";

class Pdf{
  var $temp_dir = "data/tmp/";
  var $setting  = [];
  var $uuid     = null;
  var $ext      = null;
  var $path     = null;
  var $datas    = [];
  public static $info = [];

  var $quality  = 30;
  var $max_size = 1000;

  function __construct($setting=[]){
    if(!$setting){return;}
    $this->setting = $setting;
    // $this->path = $setting["path"];
    // $this->uuid = $setting["uuid"];
    // $this->ext  = $setting["ext"];

    // Pdf::$info["file"] = $filepath;
    // Pdf::$info["uuid"] = $this->uuid;
    // $info = $this->get_pdfinfo();
    // print_r($info);
    // Pdf::$info = array_merge(Pdf::$info , $info);

    // $out_path = $this->temp_dir.$this->uuid."/";
    // $this->make_dir($out_path);
    // $this->pdf2png($this->filepath , $out_path);
    // $this->png2webp($out_path, $this->quality);

    // echo "<pre>";
    // print_r(Pdf::$info);
  }

  // function get_pdfinfo(){
  //   $cmd = "pdfinfo {$this->path}";
  //   $datas = [];
  //   exec($cmd , $res);
  //   for($i=0; $i<count($res); $i++){
  //     if(!$res[$i]){continue;}
  //     $sp = explode(":", $res[$i]);
  //     $key = trim($sp[0]);
  //     $val = trim($sp[1]);
  //     // blank
  //     if($val === ""){
  //       $datas[$key] = null;
  //     }
  //     // number
  //     else if(preg_match("/^\d+?$/" , $val)){
  //       $datas[$key] = (int)$val;
  //     }
  //     // string
  //     else{
  //       $datas[$key] = $val;
  //     }
  //   }
  //   return $datas;
  // }

  // function make_dir($dir=null){
  //   if(!is_dir($dir)){
  //     mkdir($dir , 0777 , true);
  //   }
  // }

  function convert(){
    $dir  = $this->setting["tmp_dir"];
    $out  = "{$dir}/out-singlefile";
    $file = $dir .DIRECTORY_SEPARATOR. $this->setting["origin_file"];
    $jsons = [];
    for($i=0; $i<$this->setting["page_count"]; $i++){
      $page_num = $i+1;
      $page_str = sprintf("%05d", $page_num);
      // png変換
      $out_path = "{$dir}/out-{$page_str}";
      $png_path = "{$out_path}.png";
      $this->pdf2png($file , $out_path , $page_num);
      // webp変換
      $webp_path = "{$dir}/out-{$page_str}.webp";
      $this->png2webp($png_path, $webp_path);
      // json変換
      $json = $this->webp2json($webp_path);
      $jsons[$i] = $json;
      echo $i ." @ ". $png_path ." @ ". $webp_path .PHP_EOL;
    }
    $json_path = $this->setting["tmp_dir"].".json";
    $datas = [
      "setting" => $this->setting,
      "datas"   => $jsons,
    ];
    $json = json_encode($datas , JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    file_put_contents($json_path, $json);
    $this->delete_tmp_dir();
  }

  function pdf2png($pdf_file=null, $out_path=null , $page=1){
    $cmd = "pdftoppm -png {$pdf_file} {$out_path} -f {$page} -l {$page} -cropbox -singlefile";
    exec($cmd);
    $num = sprintf("%03d" , $page);
    return "{$out_path}-{$num}.png";
  }
  
  function png2webp($png_path=null, $webp_path=null, $quality=50){
    if(!is_file($png_path)){return;}
    $png_image = imagecreatefrompng($png_path);
    $png_image = $this->resize_image($png_image);
    imagewebp($png_image , $webp_path, $quality);
    unlink($png_path);
  }

  function resize_image($image=null){
    $max_size = 1000;
    $x1 = imagesx($image);
    $y1 = imagesy($image);
    $x2 = $y2 = $max_size;
    // landscape
    if($x1 > $y1){
      if($x1 < $max_size){
        return $image;
      }
      $rate = $x1 / $max_size;
      $x2 = $max_size;
      $y2 = floor($y1 / $rate);

    }
    // horizontal
    else{
      if($y1 < $max_size){
        return $image;
      }
      $rate = $y1 / $max_size;
      $y2 = $max_size;
      $x2 = floor($x1 / $rate);
    }
    $image2 = imagecreatetruecolor($x2, $y2);
    imagecopyresampled($image2, $image, 0, 0, 0, 0, $x2, $y2, $x1, $y1);
    return $image2;
  }

  function webp2json($webp_path=null){
    if(!$webp_path || !is_file($webp_path)){return;}
    $num  = sprintf("%03d" , $page);
    $base64 = base64_encode(file_get_contents($webp_path));
    unlink($webp_path);
    return $base64;
  }

  function delete_tmp_dir(){
    if(!is_dir($this->setting["tmp_dir"])){return;}
    exec("rm -rf ".$this->setting["tmp_dir"] , $res);
    return $res;
  }



  // function set_lists(){
  //   $this->zip->open($this->filepath);
  //   $page_count = $this->zip->numFiles;
  //   $pages = [];
  //   for($i=0; $i<$page_count; $i++){
  //     $name = $this->zip->getNameIndex($i);
  //     $name = trim($name);
  //     if(preg_match("/\/$/", $name)){continue;}
  //     $ext = $this->get_ext($name);
  //     switch($ext){
  //       case "jpg":
  //       case "jpeg":
  //       case "png":
  //       case "gif":
  //       case "webp":
  //         $data = $this->zip->statIndex($i);
  //         $data["ext"] = $ext;
  //         $pages[] = $data;
  //         break;
  //     }
  //   }
  //   $this->zip->close();
  //   $this->datas = $pages;
  //   return $pages;
  // }

  // function page2index($page=null){
  //   return $this->datas[$page]["index"];
  // }

  // function page2info($page=null){
  //   return $this->datas[$page];
  // }

  // function get_ext($file_name=null){
  //   if(!$file_name){return;}
  //   if(!strstr($file_name, ".")){return;}
  //   $sp = explode(".", $file_name);
  //   return $sp[count($sp)-1];
  // }

  // function page2ext($page=null){
  //   if($page===null){return;}
  //   return $this->datas[$page]['ext'];
  // }

  // function get_page($page=null){
  //   if($page === null){return;}
  //   $index = $this->page2index($page);
  //   $this->zip->open($this->filepath);
  //   $data = $this->zip->getFromIndex($index);
  //   $this->zip->close();
  //   return $data;
  // }

  // function img($page=null){
  //   if($page === null){return;}
  //   $ext    = $this->page2ext($page);
  //   $data   = $this->get_page($page);
  //   $image = imagecreatefromstring($data);
  //   header('Content-Type: image/webp');
  //   imagewebp($image);
  // }

  // function page($page=null){
  //   return [
  //     "data" => $this->get_page($page),
  //     "ext"  => $this->page2ext($page),
  //   ];
  // }

  // function get_temp_dir($uuid=null){
  //   $uuid = date("YmdHis") ."_". ($uuid ? $uuid : uniqid());
  //   if(!is_dir($this->temp_dir. $uuid)){
  //     mkdir($this->temp_dir. $uuid , 0777 , true);
  //   }
  //   return $this->temp_dir. $uuid."/";
  // }

  // function convert_book(){
  //   $dir = dirname(__FILE__) ."/../../../";
  //   $tmp_dir = $this->create_temp();
  //   $json = $this->create_json($dir.$tmp_dir);
  //   echo $json;
  //   // $this->delete_temp($dir.$tmp_dir);
  //   file_put_contents($dir.$tmp_dir."data.json" , $json);
  //   return;
  // }

  // function create_temp(){
  //   $start_time = microtime(true);
  //   $quality = 30;
  //   $tmp_dir = $this->get_temp_dir();
  //   for($i=0; $i<count($this->datas); $i++){
  //     $data  = $this->get_page($i);
  //     $ext   =  $this->page2ext($i);
  //     $image = imagecreatefromstring($data);
  //     $image = $this->resize_image($image, $ext);

  //     $num = sprintf("%05d" , $i);
  //     imagewebp($image , "{$tmp_dir}{$num}.webp" , $quality);
  //     imagedestroy($image);
  //   }
  //   return $tmp_dir;
  //   // return $tmp_dir." @ ".count($this->datas)." @ ". (microtime(true) - $start_time);
  // }

  

  // function create_json($tmp_dir=null){
  //   $files = scandir($tmp_dir);
  //   $datas = [];
  //   for($i=0; $i<count($files); $i++){
  //     if(!preg_match("/\.webp$/", $files[$i])){continue;}
  //     $data = file_get_contents($tmp_dir. $files[$i]);
  //     $datas[] = base64_encode($data);
  //   }
  //   return json_encode($datas , JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  // }

  function delete_temp($tmp_dir=null){
    if(!is_dir($tmp_dir)){return;}
    die($tmp_dir);
    exec("rm -rf {$tmp_dir}");
  }
}