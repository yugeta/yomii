<?php

// CLI処理用(book.php mode=@@ uuid=@@)
if(!isset($_SERVER['SCRIPT_URI']) && isset($argv)){
  for($i=0; $i<count($argv); $i++){
    if(!$argv[$i]){continue;}
    $q = explode("=", $argv[$i]);
    if(count($q)<2){continue;}
    if($q[0]!=''){
      $key = $q[0];
      $val = join("=",array_slice($q,1));
      $_POST[$key]=$val;
    }
  }
}

require_once dirname(__FILE__). "/page/upload/php/common.php";

switch(@$_POST["mode"]){
  case "upload":
    require_once dirname(__FILE__). "/page/upload/php/upload.php";
    $upload = new Upload($_FILES['book']);
    $datas = [
      "status"       => $upload->info ? "success" : "error",
      "query"        => $_POST,
      "files"        => $upload->files,
      "info"         => $upload->info,

      "setting_file" => Common::$setting_file,
      "origin_file"  => Common::get_original_file($upload->files["ext"]),
      "tmp_dir"      => $upload->info["path"],
      "page_count"   => $upload->info["pages"],
      "uuid"         => $upload->info["uuid"],
      "ext"          => $upload->files["ext"],
    ];
    $upload->save_json($datas);
    echo json_encode($datas , JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    break;

  case "convert_start":
    $uuid = $_POST['uuid'];
    // $cmd  = "nohup php book.php mode=convert uuid={$uuid} >/dev/null 2>&1 &";
    $cmd  = "nohup php book.php mode=convert uuid={$uuid} > data/tmp/{$uuid}/nohup.out &";
    exec($cmd , $res);
    $data = [
      "status" => $res ? "success" : "error",
      "data"   => $res,
    ];
    echo json_encode($data , JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    break;

  case "convert":
    require_once dirname(__FILE__). "/page/upload/php/convert.php";
    new Convert($_POST);
    break;

  case "convert_progress":
    echo Common::progress_load($_POST['uuid']);
    break;

  case "get_json":
    $json = "";
    if(is_file(Common::get_book_json($_POST['uuid']))){
      $json = file_get_contents(Common::get_book_json($_POST['uuid']));
      $data = json_decode($json , true);
      $name = pathinfo($data["setting"]["files"]["name"] , PATHINFO_FILENAME);
      $data["name"] = $name.".". Common::$output_ext;
      $json = json_encode($data , JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
    echo $json;
    break;

  case "view":
    $zip->img($page);
    break;

  case "lists":
    echo "<pre>";
    print_r($zip->datas);
    break;

  case "get_download_link":
    $path = Common::$temp . @$_POST["uuid"] . ".". Common::$output_ext;
    if(is_file($path)){
      $data = json_decode(file_get_contents($path),true);
      $name = pathinfo($data["setting"]["files"]["name"] , PATHINFO_FILENAME);
      $data = [
        "name" => $name .".". Common::$output_ext,
        "path" => $path,
      ];
      echo json_encode($data , JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    break;
}
