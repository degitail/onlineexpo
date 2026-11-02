// 投票シートに紐づける Apps Script。サイトの「投票する」ボタンから作品IDを受け取り、1行追記する
// 1行目の見出しは「タイムスタンプ」「作品ID」（build.py がこの見出しで読む）
function doPost(e) {
  const id = (e.parameter.id || "").trim();
  if (/^[0-9a-f]{8}$/.test(id)) {
    const t = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");
    SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].appendRow([t, id]);
  }
  return ContentService.createTextOutput("ok");
}
