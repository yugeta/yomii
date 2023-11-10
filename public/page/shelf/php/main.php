<?php

// echo '["hoge"]';
require_once "lists.php";

switch(@$_POST["mode"]){
  case "lists":
    Lists::json($_POST);
    break;
}
