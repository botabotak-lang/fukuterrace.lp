<?php
// fukuterrace-LP/send.php
// 入力内容をメール送信するハンドラー（自動返信機能付き）

declare(strict_types=1);

mb_language('Japanese');
mb_internal_encoding('UTF-8');

header('Access-Control-Allow-Origin: *');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo 'Method Not Allowed';
    exit;
}

// --- 設定エリア ---
// 管理者送信先
define('ADMIN_TO', 'info@fukuterrace.jp, yamasa@sanosekizai.com');
define('ADMIN_BCC', 'h.shiga69@gmail.com, botabotak@gmail.com');
define('MAIL_SUBJECT_PREFIX', '[福てらす墓園LP]');
define('FROM_EMAIL', 'info@fukuterrace.jp');
define('FROM_NAME', '福てらす墓園');

// --- 入力値の取得 ---
$mode = isset($_POST['mode']) && $_POST['mode'] === 'material' ? 'material' : 'visit';
$lastName = trim((string)($_POST['lastName'] ?? ''));
$firstName = trim((string)($_POST['firstName'] ?? ''));
$fullName = trim($lastName . ' ' . $firstName);
$email = trim((string)($_POST['email'] ?? ''));
$phone = trim((string)($_POST['phone'] ?? ''));
$zipcode = trim((string)($_POST['zipcode'] ?? ''));
$address = trim((string)($_POST['address'] ?? ''));

// 日付と時間を結合
$vDate1 = trim((string)($_POST['visitDate1'] ?? ''));
$vTime1 = trim((string)($_POST['visitTime1'] ?? ''));
$visitDate1 = $vDate1 . ($vTime1 ? ' ' . $vTime1 : '');

$vDate2 = trim((string)($_POST['visitDate2'] ?? ''));
$vTime2 = trim((string)($_POST['visitTime2'] ?? ''));
$visitDate2 = $vDate2 . ($vTime2 ? ' ' . $vTime2 : '');

$note = trim((string)($_POST['note'] ?? ''));

// --- バリデーション ---
$errors = [];
if ($lastName === '') $errors[] = 'お名前（氏）を入力してください。';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'メールアドレスを正しく入力してください。';

if ($mode === 'visit') {
    if ($phone === '') $errors[] = '電話番号を入力してください。';
} else {
    if ($zipcode === '') $errors[] = '郵便番号を入力してください。';
    if ($address === '') $errors[] = '住所を入力してください。';
}

if ($errors) {
    http_response_code(400);
    echo implode("\n", $errors);
    exit;
}

// --- 管理者宛メール作成 ---
$subject = MAIL_SUBJECT_PREFIX . ' ' . ($mode === 'visit' ? '見学予約' : '資料請求') . 'のお申し込み';

$body = "----- フォーム送信内容 -----\n";
$body .= "区分: " . ($mode === 'visit' ? '見学予約' : '資料請求') . "\n";
$body .= "氏名: {$fullName}\n";
$body .= "メール: {$email}\n";
if ($mode === 'visit') {
    $body .= "電話番号: {$phone}\n";
    $body .= "第1希望日: {$visitDate1}\n";
    $body .= "第2希望日: {$visitDate2}\n";
} else {
    $body .= "郵便番号: {$zipcode}\n";
    $body .= "住所: {$address}\n";
}
$body .= "ご相談内容:\n{$note}\n";
$body .= "-----------------------------\n";
$body .= "送信日時: " . date('Y-m-d H:i:s') . "\n";
$body .= "送信元IP: " . $_SERVER['REMOTE_ADDR'] . "\n";

$headers = [
    'From: ' . mb_encode_mimeheader(FROM_NAME) . ' <' . FROM_EMAIL . '>',
    'Reply-To: ' . $email,
    'Bcc: ' . ADMIN_BCC,
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion()
];

// 管理者へ送信
// 第5引数に -f を追加して送信元の信頼性を高める
$adminSent = mb_send_mail(ADMIN_TO, $subject, $body, implode("\n", $headers), "-f " . FROM_EMAIL);

// --- お客様宛自動返信メール作成 ---
if ($adminSent) {
    $autoSubject = "【福てらす墓園】お申込みいただきありがとうございました";
    $autoBody = "{$fullName} 様\n\n";
    $autoBody .= "この度は「福てらす墓園」へお問い合わせいただき、誠にありがとうございます。\n";
    $autoBody .= "以下の内容でお申し込みを承りました。\n\n";
    $autoBody .= "内容を確認の上、担当者より改めてご連絡させていただきます。\n";
    $autoBody .= "今しばらくお待ちくださいませ。\n\n";
    $autoBody .= "-----------------------------\n";
    $autoBody .= $body; // 同じ内容を添付
    $autoBody .= "-----------------------------\n\n";
    $autoBody .= "※本メールは自動配信専用です。心当たりがない場合は破棄してください。\n\n";
    $autoBody .= "福てらす墓園（最林寺内）\n";
    $autoBody .= "住所：静岡県藤枝市下藪田３２２\n";
    $autoBody .= "電話：0120-955-427\n";

    $autoHeaders = [
        'From: ' . mb_encode_mimeheader(FROM_NAME) . ' <' . FROM_EMAIL . '>',
        'Content-Type: text/plain; charset=UTF-8',
        'X-Mailer: PHP/' . phpversion()
    ];

    mb_send_mail($email, $autoSubject, $autoBody, implode("\n", $autoHeaders), "-f " . FROM_EMAIL);
}

if (!$adminSent) {
    http_response_code(500);
    echo '送信に失敗しました。';
    exit;
}

echo 'OK';
