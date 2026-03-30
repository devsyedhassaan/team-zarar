// ═══════════════════════════════════════════════════════════════════
//  TEAM ZARAR — Google Apps Script Backend
//  Saves registration data to Google Sheets + payment screenshots to Drive
// ═══════════════════════════════════════════════════════════════════
//
//  SETUP STEPS:
//  1. Go to https://script.google.com → New Project
//  2. Paste this entire file
//  3. Replace SHEET_ID and DRIVE_FOLDER_ID below with your values
//  4. Click Deploy → New Deployment → Web App
//     - Execute as: Me
//     - Who has access: Anyone
//  5. Copy the Web App URL → paste into your app's APPS_SCRIPT_URL
// ═══════════════════════════════════════════════════════════════════

const SHEET_ID = "1aR4gZBAlNRDvKUdkr0aGrRIIihZVbMuhMpAXAgMrA9g";
// How to get: Open your Google Sheet → look at URL:
// https://docs.google.com/spreadsheets/d/  >>>THIS_PART<<<  /edit

const DRIVE_FOLDER_ID = "1VRokvaSru9BKFABugsvnkGi2RCW3PhNh";
// How to get: Open your Drive folder → look at URL:
// https://drive.google.com/drive/folders/  >>>THIS_PART<<<

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

    // 1. Open sheet
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName("Registrations") || ss.insertSheet("Registrations");

    // 2. Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    // 3. Upload screenshot to Drive (if provided)
    let screenshotLink = "No screenshot";
    if (data.screenshotBase64 && data.screenshotName) {
      screenshotLink = uploadScreenshot(
        data.screenshotBase64,
        data.screenshotName,
        data.fullName,
        data.eventTitle
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
function uploadScreenshot(base64Data, fileName, participantName, eventTitle) {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);

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

// ─── TEST FUNCTION (run manually to verify setup) ────────────────────────────
function testSetup() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  Logger.log("✅ Sheet connected: " + ss.getName());

  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  Logger.log("✅ Drive folder connected: " + folder.getName());

  Logger.log("✅ Setup looks good! Deploy as Web App now.");
}
