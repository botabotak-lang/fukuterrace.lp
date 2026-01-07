<?php
// fukuterrace-LP/send.php
// 文面反映・文字化け修正（UTF-8固定）・ログ出力あり

// ログ設定
ini_set('log_errors', 'On');
ini_set('error_log', __DIR__ . '/php_error.log');
$debug_log = __DIR__ . '/debug_log.txt';

function writeLog($msg) {
    global $debug_log;
    $date = date('Y-m-d H:i:s');
    file_put_contents($debug_log, "[$date] $msg\n", FILE_APPEND);
}

writeLog("--- Access Started (Template Version) ---");

// 【重要】文字化け対策: UTF-8で統一して送る設定
mb_language("uni"); 
mb_internal_encoding("UTF-8");

header('Access-Control-Allow-Origin: *');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

// 送信先リスト
$recipients = [
    'info@fukuterrace.jp',
    'yamasa@sanosekizai.com',
    'h.shiga69@gmail.com',
    'botabotak@gmail.com'
];

$from_email = 'info@fukuterrace.jp';
$from_name = '福てらす墓園';

// 入力取得
$mode = $_POST['mode'] ?? 'unknown';
$lastName = trim($_POST['lastName'] ?? '');
$firstName = trim($_POST['firstName'] ?? '');
$fullName = "$lastName $firstName";
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
if ($mode === 'material') {
    $phone = trim($_POST['phone-material'] ?? '');
}
$zipcode = trim($_POST['zipcode'] ?? '');
$address = trim($_POST['address'] ?? '');
$note = trim($_POST['note'] ?? '');

$vDate1 = trim($_POST['visitDate1'] ?? '');
$vTime1 = trim($_POST['visitTime1'] ?? '');
$visitDate1 = $vDate1 . ($vTime1 ? ' ' . $vTime1 : '');

$vDate2 = trim($_POST['visitDate2'] ?? '');
$vTime2 = trim($_POST['visitTime2'] ?? '');
$visitDate2 = $vDate2 . ($vTime2 ? ' ' . $vTime2 : '');

$modeText = ($mode === 'visit' ? '見学予約' : '資料請求');

// バリデーション
if (!$email) {
    http_response_code(400);
    echo "メールアドレスが必要です";
    exit;
}

// --- 共通の「入力内容」ブロック作成 ---
$details = "区分: $modeText\n";
$details .= "氏名: $fullName 様\n";
$details .= "メール: $email\n";
$details .= "電話番号: $phone\n";

if ($mode === 'visit') {
    $details .= "第1希望日時: $visitDate1\n";
    $details .= "第2希望日時: $visitDate2\n";
} else {
    $details .= "郵便番号: $zipcode\n";
    $details .= "住所: $address\n";
}
$details .= "ご相談・ご質問:\n$note";


// --- 1. 管理者（自社）宛メール作成 ---
$adminSubject = "[福てらす墓園LP] {$modeText}のお申込み";
$adminBody = "ホームページよりお申し込みがありました。\n";
$adminBody .= "対応をお願いします。\n\n";
$adminBody .= "-----------------------------\n";
$adminBody .= "【送信内容】\n";
$adminBody .= $details . "\n";
$adminBody .= "-----------------------------\n";
$adminBody .= "送信日時: " . date('Y-m-d H:i:s') . "\n";
$adminBody .= "-----------------------------\n";

// ヘッダー（UTF-8明記）
$headers = "From: $from_email\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8";

// 管理者へ送信（個別ループ）
$success_count = 0;
foreach ($recipients as $to) {
    if (mb_send_mail($to, $adminSubject, $adminBody, $headers, "-f $from_email")) {
        $success_count++;
    }
}

// --- 2. お客様宛自動返信メール（サンクスメール）作成 ---
$customerSubject = "【福てらす墓園】お問い合わせありがとうございます";
$customerBody = "$fullName 様\n\n";
$customerBody .= "この度は「福てらす墓園」へお問い合わせいただき、誠にありがとうございます。\n";
$customerBody .= "以下の内容でお申し込みを承りました。\n\n";
$customerBody .= "内容を確認の上、担当者より改めてご連絡させていただきます。\n";
$customerBody .= "恐れ入りますが、今しばらくお待ちくださいませ。\n\n";
$customerBody .= "-----------------------------\n";
$customerBody .= "【お申込み内容】\n";
$customerBody .= $details . "\n";
$customerBody .= "-----------------------------\n\n";
$customerBody .= "※本メールは自動配信専用です。\n";
$customerBody .= "お心当たりがない場合は、削除をお願いいたします。\n\n";
$customerBody .= "福てらす墓園（最林寺内）\n";
$customerBody .= "住所：静岡県藤枝市下藪田３２２\n";
$customerBody .= "電話：0120-955-427\n";
$customerBody .= "Web：https://fukuterrace.jp/\n";

$autoHeaders = "From: $from_email\r\n";
$autoHeaders .= "Content-Type: text/plain; charset=UTF-8";

// お客様へ送信
mb_send_mail($email, $customerSubject, $customerBody, $autoHeaders, "-f $from_email");

if ($success_count > 0) {
    echo "OK";
} else {
    http_response_code(500);
    echo "Mail Error";
}
