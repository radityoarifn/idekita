<?php
header('Content-Type: application/json');
require_once '../classes/Database.php';

$db = new Database();
echo json_encode([
    'status' => $db->connect() ? 'success' : 'error',
    'message' => $db->connect() ? 'Koneksi berhasil' : 'Koneksi gagal'
]);