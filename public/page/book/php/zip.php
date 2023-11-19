<?php

require_once dirname(__FILE__). "/common.php";

class Zip{
  public static $info = [];
  var $temp_dir = "data/tmp/";
  var $setting  = [];
  var $quality  = 50;
  var $max_size = 1000;

  function __construct($setting=null){
    if(!$setting){return;}
    $this->setting = $setting;

    // $this->zip = new ZipArchive;
    // $this->set_lists();

    // $this->get_info();

    // echo "<pre>";
    // print_r(Zip::$info);
  }

  function convert(){
    echo $this->setting["page_count"]." ";
    $zip      = new ZipArchive;
    $dir      = $this->setting["tmp_dir"];
    $file     = $dir .DIRECTORY_SEPARATOR. $this->setting["origin_file"];
    $zip->open($file);
    $jsons    = [];

    // $test = $zip;
    // print_r($test);

    for($i=0; $i<$this->setting["page_count"]; $i++){
      echo PHP_EOL. $i." ";
      $name = $zip->getNameIndex($i);
      $name = trim($name);
      // フォルダの場合は処理を飛ばす
      if(!$name || preg_match("/\/$/", $name)){continue;}
      // 画像ファイルのみをたいしょうにする。
      $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
      echo $name." ".$ext." ";
      if(!$this->is_target_ext($ext)){continue;}
      $data = $zip->getFromIndex($i);
      $image = imagecreatefromstring($data);
      $image = $this->resize_image($image, $ext);
      $num = sprintf("%05d" , $i);
      $webp_path = "{$dir}/out-{$num}.webp";
      echo $webp_path." ";
      imagewebp($image , $webp_path , $this->quality);
      imagedestroy($image);
      $base64 = base64_encode(file_get_contents($webp_path));
      $jsons[] = $base64;
      // echo count($base64);
    }
    $zip->close();
    $json_path = $this->setting["tmp_dir"].".json";
    $this->setting["page_count"] = count($jsons);
    $datas = [
      "setting" => $this->setting,
      "datas"   => $jsons,
    ];
    $json = json_encode($datas , JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    file_put_contents($json_path, $json);
    $this->delete_tmp_dir();
  }

  function is_target_ext($ext=null){
    switch($ext){
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return true;
        // $data = $zip->statIndex($i);
        // $data["ext"] = $ext;
        // $pages[] = $data;
        // // $page_num++;
      default:
       return false;
    }
  }

  function resize_image($image=null, $ext=null){
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

  function delete_tmp_dir(){
    if(!is_dir($this->setting["tmp_dir"])){return;}
    exec("rm -rf ".$this->setting["tmp_dir"] , $res);
    return $res;
  }




  // function get_info(){
  //   Zip::$info = [
  //     "file" => $this->filepath,
  //     "uuid" => $this->uuid,
  //   ];
    
  // }

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

  function page2index($page=null){
    return $this->datas[$page]["index"];
  }

  function page2info($page=null){
    return $this->datas[$page];
  }

  // function get_ext($file_name=null){
  //   if(!$file_name){return;}
  //   if(!strstr($file_name, ".")){return;}
  //   $sp = explode(".", $file_name);
  //   return $sp[count($sp)-1];
  // }

  function page2ext($page=null){
    if($page===null){return;}
    return $this->datas[$page]['ext'];
  }

  function get_page($page=null){
    if($page === null){return;}
    $index = $this->page2index($page);
    $zip->open($this->filepath);
    $data = $zip->getFromIndex($index);
    $this->zip->close();
    return $data;
  }

  function img($page=null){
    if($page === null){return;}
    $ext    = $this->page2ext($page);
    $data   = $this->get_page($page);
    $image = imagecreatefromstring($data);
    header('Content-Type: image/webp');
    imagewebp($image);
  }

  function page($page=null){
    return [
      "data" => $this->get_page($page),
      "ext"  => $this->page2ext($page),
    ];
  }

  function get_temp_dir($uuid=null){
    $uuid = date("YmdHis") ."_". ($uuid ? $uuid : uniqid());
    if(!is_dir($this->temp_dir. $uuid)){
      mkdir($this->temp_dir. $uuid , 0777 , true);
    }
    return $this->temp_dir. $uuid."/";
  }

  function convert_book(){
    $dir = dirname(__FILE__) ."/../../../";
    $tmp_dir = $this->create_temp();
    $json = $this->create_json($dir.$tmp_dir);
    echo $json;
    // $this->delete_temp($dir.$tmp_dir);
    file_put_contents($dir.$tmp_dir."data.json" , $json);
    return;
  }

  function create_temp(){
    $start_time = microtime(true);
    $quality = 30;
    $tmp_dir = $this->get_temp_dir();
    for($i=0; $i<count($this->datas); $i++){
      $data  = $this->get_page($i);
      $ext   =  $this->page2ext($i);
      $image = imagecreatefromstring($data);
      $image = $this->resize_image($image, $ext);

      $num = sprintf("%05d" , $i);
      imagewebp($image , "{$tmp_dir}{$num}.webp" , $quality);
      imagedestroy($image);
    }
    return $tmp_dir;
    // return $tmp_dir." @ ".count($this->datas)." @ ". (microtime(true) - $start_time);
  }

  

  function create_json($tmp_dir=null){
    // $dir = dirname(__FILE__) ."/../../../";
    $files = scandir($tmp_dir);
    $datas = [];
    for($i=0; $i<count($files); $i++){
      if(!preg_match("/\.webp$/", $files[$i])){continue;}
      $data = file_get_contents($tmp_dir. $files[$i]);
      $datas[] = base64_encode($data);
    }
    return json_encode($datas , JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  }

  function delete_temp($tmp_dir=null){
    if(!is_dir($tmp_dir)){return;}
    die($tmp_dir);
    exec("rm -rf {$tmp_dir}");
  }


  // function convert_json(){
  //   $start_time = microtime(true);
    
  //   // $dir = dirname(__FILE__) ."/../../../";
  //   // $tmp_dir = $this->create_temp();
  //   // $json = $this->create_json($dir.$tmp_dir);
  //   // $this->delete_temp($dir.$tmp_dir);
  //   // file_put_contents($dir.$tmp_dir."data.json" , $json);
  //   $datas = [];
  //   $quality = 30;
  //   // $tmp_dir = $this->get_temp_dir();
  //   for($i=0; $i<count($this->datas); $i++){
  //     $data  = $this->get_page($i);
  //     $ext   =  $this->page2ext($i);
  //     $image = imagecreatefromstring($data);
  //     $image = $this->resize_image($image, $ext);
  //     $base64 = base64_encode($image);
  //     $datas[] = $base64;
  //     // $datas[] = $image;

  //     $num = sprintf("%05d" , $i);
  //     echo "{$i}: {$num}: {$ext}: ";
  //     // imagewebp($image , "{$tmp_dir}{$num}.webp" , $quality);
  //     // imagedestroy($image);
  //   }

  //   // time
  //   echo "convert-time" . (microtime(true) - $start_time) .PHP_EOL;
  //   $json = json_encode($datas , JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  //   return $json;
  // }


}