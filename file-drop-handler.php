<?php 
header("Content-type: application/json");
$ret = array();

$filename = isset($_SERVER['HTTP_X_FILENAME']) ? $_SERVER['HTTP_X_FILENAME'] : false;

if($filename)
{
    $ret["fileID"] = rand(1000, 9999);
    $ext = pathinfo($filename, PATHINFO_EXTENSION);
    
    file_put_contents(
		'uploads/' . $ret['fileID'] . "." . $ext,
		file_get_contents('php://input')
	);
}

echo json_encode($ret);
?>