// ============================================================
// FILE: Code.gs — Google Apps Script Nhận Dữ Liệu Chatbot Lead (Nâng Cao)
// ============================================================
// BẢNG TÍNH CẦN CÓ 9 CỘT HEADER (dòng 1):
// A: Thời gian | B: Tên | C: SĐT | D: Email | E: Nguồn
// F: Session ID | G: Lịch sử Chat | H: Quan tâm | I: Mức độ
// ============================================================

// ⚠️ CẤU HÌNH — THAY CÁC GIÁ TRỊ BÊN DƯỚI
var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';  // Thay bằng ID Google Sheets của bạn
var SALES_EMAIL = 'your-email@gmail.com';     // Email nhận cảnh báo khách HOT

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    var newTime       = data.timestamp || new Date().toLocaleString('vi-VN');
    var newName       = data.name || '';
    var newPhone      = data.phone || '';
    var newEmail      = data.email || '';
    var newSource     = data.source || '';
    var newSessionId  = data.sessionId || '';
    var newHistory    = data.chatHistory || '';
    var newInterest   = data.interest || '';
    var newIntentLevel = data.intent_level || '';

    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    var rowIndexToUpdate = -1;

    // Tìm kiếm xem Session ID đã tồn tại chưa (Cột F - index 5)
    if (newSessionId) {
      for (var i = values.length - 1; i > 0; i--) {
        var rowSessionId = values[i][5] ? values[i][5].toString().trim() : '';
        if (rowSessionId === newSessionId) {
          rowIndexToUpdate = i + 1; // +1 vì getRange dùng 1-indexed
          break;
        }
      }
    }

    if (rowIndexToUpdate > -1) {
      // ===== CẬP NHẬT GỘP (chỉ ghi đè nếu thông tin cũ đang trống) =====
      var currentRow = values[rowIndexToUpdate - 1];

      if (!currentRow[1] && newName)  sheet.getRange(rowIndexToUpdate, 2).setValue(newName);     // Tên
      if (!currentRow[2] && newPhone) sheet.getRange(rowIndexToUpdate, 3).setValue(newPhone);    // SĐT
      if (!currentRow[3] && newEmail) sheet.getRange(rowIndexToUpdate, 4).setValue(newEmail);    // Email

      // Luôn cập nhật lịch sử chat bằng bản mới nhất
      if (newHistory) sheet.getRange(rowIndexToUpdate, 7).setValue(newHistory);

      // Cập nhật Quan tâm & Mức độ (ghi đè bằng bản phân tích mới nhất)
      if (newInterest)    sheet.getRange(rowIndexToUpdate, 8).setValue(newInterest);
      if (newIntentLevel) sheet.getRange(rowIndexToUpdate, 9).setValue(newIntentLevel);

      // Cập nhật thời gian tương tác mới nhất
      sheet.getRange(rowIndexToUpdate, 1).setValue(newTime);

    } else {
      // ===== TẠO DÒNG MỚI nếu chưa tồn tại session này =====
      sheet.appendRow([
        newTime, newName, newPhone, newEmail, newSource,
        newSessionId, newHistory, newInterest, newIntentLevel
      ]);
    }

    // ===== GỬI EMAIL CẢNH BÁO NẾU KHÁCH "HOT" =====
    if (newIntentLevel && newIntentLevel.toLowerCase() === 'hot') {
      sendHotLeadAlert(newName, newPhone, newEmail, newInterest, newTime);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ status: 'success' })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Gửi email cảnh báo khi phát hiện khách hàng "hot"
 */
function sendHotLeadAlert(name, phone, email, interest, timestamp) {
  try {
    var subject = '🔥 KHÁCH HÀNG NÓNG - CẦN LIÊN HỆ NGAY!';
    var body = '📢 KHÁCH HÀNG NÓNG - CẦN LIÊN HỆ NGAY!\n\n'
      + 'Tên: ' + (name || 'Chưa rõ') + '\n'
      + 'SĐT: ' + (phone || 'Chưa có') + '\n'
      + 'Email: ' + (email || 'Chưa có') + '\n'
      + 'Quan tâm: ' + (interest || 'Chưa xác định') + '\n'
      + 'Thời gian: ' + timestamp + '\n\n'
      + '⚡ Vui lòng liên hệ khách hàng này trong vòng 30 phút!\n'
      + '📋 Xem chi tiết: https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID;

    MailApp.sendEmail(SALES_EMAIL, subject, body);
    Logger.log('📧 Đã gửi email cảnh báo khách HOT: ' + name);
  } catch (err) {
    Logger.log('⚠️ Lỗi gửi email: ' + err.toString());
  }
}

// Hàm test: truy cập URL bằng trình duyệt sẽ thấy thông báo này
function doGet() {
  return ContentService.createTextOutput(
    "API Chatbot Leads Nâng Cao đang hoạt động! ✅ (Hỗ trợ phân loại Hot/Warm/Cold + Email Alert)"
  );
}
