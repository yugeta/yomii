<?php

$shelf = "data/shelf/";
$dir   = @$_GET['dir'];
$book  = @$_GET['book'];
$path  = "{$shelf}{$dir}{$book}";
$page  = @$_GET["page"];


// require_once "page/book/php/zip.php";
// $zip = new Zip($path);
// echo "-".$_POST.PHP_EOL;
// print_r($_POST);

switch(@$_POST["mode"]){
  case "upload":
    echo "+";
    print_r($_FILES);
    break;

  case "convert":
    require_once "page/book/php/convert.php";
    new Convert("{$dir}{$book}");
    // $zip->convert_book($dir, $book);
    // echo $json;
    break;

  case "json":
    $res = $zip->convert_json();
    echo $res;
    break;

  case "view":
    $zip->img($page);
    break;

  case "lists":
    echo "<pre>";
    print_r($zip->datas);
    break;
}

// if(is_numeric($page)){
//   // echo $zip->webp($page);
//   $zip->img($page);
// }
// else{
//   echo "<pre>";
//   print_r($zip->datas);
// }
