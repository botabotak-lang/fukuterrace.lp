<?php
// test_mail.php
// メール送信機能の単体テスト

mb_language("Japanese");
mb_internal_encoding("UTF-8");

// エラーを表示する設定
ini_set('display_errors', 1);
error_reporting(E_ALL);

$to = "info@fukuterrace.jp"; // テスト送信先
$subject = "【テスト】メール送信テスト";
$message = "これはテストメールです。\nこのメールが届けば、サーバーの送信機能は正常です。\n日時: " . date("Y-m-d H:i:s");
$headers = "From: info@fukuterrace.jp\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8";

echo "<h1>メール送信テスト</h1>";
echo "<p>送信先: {$to}</p>";
echo "<p>送信元: info@fukuterrace.jp</p>";

// 送信実行
if (mb_send_mail($to, $subject, $message, $headers)) {
    echo "<p style='color: green; font-weight: bold;'>送信成功（関数は true を返しました）</p>";
    echo "<p>メールボックスを確認してください。迷惑メールフォルダも確認してください。</p>";
} else {
    echo "<p style='color: red; font-weight: bold;'>送信失敗（関数は false を返しました）</p>";
    echo "<p>サーバーの設定や制限を確認する必要があります。</p>";
}
?>

