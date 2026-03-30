// ═══════════════════════════════════════════════════════════════════
//  TEAM ZARAR — Google Apps Script Backend (Dynamic Version)
//  Each event sends its own sheetId + folderId → data goes to correct place
// ═══════════════════════════════════════════════════════════════════

// ─── HEADERS (auto-created on first run) ────────────────────────────────────
const HEADERS = [
  "Timestamp",
  "Event Title",
  "Event Date",
  "Full Name",
  "Contact Number",
  "Email",
  "University / Institute",
  "Field of Study",
  "Payment Screenshot Link",
];

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // ✅ Read sheetId and folderId sent dynamically from App.jsx per event
    const sheetId = data.sheetId;
    const folderId = data.folderId;

    if (!sheetId || !folderId) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: "error", message: "Missing sheetId or folderId" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Open that event's specific sheet
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName("Registrations") || ss.insertSheet("Registrations");

    // 2. Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    // 3. Upload screenshot to that event's specific Drive folder (if provided)
    let screenshotLink = "No screenshot";
    if (data.screenshotBase64 && data.screenshotName) {
      screenshotLink = uploadScreenshot(
        data.screenshotBase64,
        data.screenshotName,
        data.fullName,
        data.eventTitle,
        folderId
      );
    }

    // 4. Write row to sheet
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.eventTitle || "",
      data.eventDate || "",
      data.fullName || "",
      data.phone || "",
      data.email || "",
      data.institute || "",
      data.fieldOfStudy || "",
      screenshotLink,
    ]);

    // 5. Auto-resize columns
    sheet.autoResizeColumns(1, HEADERS.length);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── SCREENSHOT UPLOADER ─────────────────────────────────────────────────────
function uploadScreenshot(base64Data, fileName, participantName, eventTitle, folderId) {
  try {
    const folder = DriveApp.getFolderById(folderId);

    // Determine MIME type
    const ext = fileName.split(".").pop().toLowerCase();
    const mimeMap = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };
    const mimeType = mimeMap[ext] || "image/jpeg";

    // Decode base64 and create file
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);

    // Name: EventTitle_ParticipantName_timestamp
    const safeName = `${eventTitle}_${participantName}_${Date.now()}.${ext}`
      .replace(/[^a-zA-Z0-9_\-\.]/g, "_");

    const file = folder.createFile(blob.setName(safeName));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return file.getUrl();
  } catch (err) {
    Logger.log("Screenshot upload failed: " + err);
    return "Upload failed: " + err.toString();
  }
}

// ─── TEST FUNCTION ────────────────────────────────────────────────────────────
// Replace these with any one of your event's IDs just to test connection
function testSetup() {
  const testSheetId = "PASTE_ANY_ONE_SHEET_ID_HERE";
  const testFolderId = "PASTE_ANY_ONE_FOLDER_ID_HERE";

  const ss = SpreadsheetApp.openById(testSheetId);
  Logger.log("✅ Sheet connected: " + ss.getName());

  const folder = DriveApp.getFolderById(testFolderId);
  Logger.log("✅ Drive folder connected: " + folder.getName());

  Logger.log("✅ Dynamic setup looks good!");
}
