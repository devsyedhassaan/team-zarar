const SHEET_ID = "1aR4gZBAlNRDvKUdkr0aGrRIIihZVbMuhMpAXAgMrA9g";
const DRIVE_FOLDER_ID = "1VRokvaSru9BKFABugsvnkGi2RCW3PhNh";

const HEADERS = [
  "Timestamp",
  "Event Title",
  "Event Date",
  "Full Name",
  "Contact Number",
  "Email",
  "University / Institute",
  "Field of Study",
  "Semester / Year",
  "Status",
  "Payment Screenshot Link",
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName("Registrations") || ss.insertSheet("Registrations");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    let screenshotLink = "No screenshot";
    if (data.screenshotBase64 && data.screenshotName) {
      screenshotLink = uploadScreenshot(data.screenshotBase64, data.screenshotName, data.fullName, data.eventTitle);
    }
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.eventTitle || "",
      data.eventDate || "",
      data.fullName || "",
      data.phone || "",
      data.email || "",
      data.institute || "",
      data.fieldOfStudy || "",
      data.semester || "",
      data.status || "",
      screenshotLink,
    ]);
    sheet.autoResizeColumns(1, HEADERS.length);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function uploadScreenshot(base64Data, fileName, participantName, eventTitle) {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const ext = fileName.split(".").pop().toLowerCase();
    const mimeMap = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };
    const mimeType = mimeMap[ext] || "image/jpeg";
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    const safeName = (eventTitle + "_" + participantName + "_" + Date.now() + "." + ext).replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    const file = folder.createFile(blob.setName(safeName));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    return "Upload failed: " + err.toString();
  }
}

function testSetup() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  Logger.log("Sheet connected: " + ss.getName());
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  Logger.log("Drive folder connected: " + folder.getName());
  Logger.log("Setup is working! Deploy as Web App now.");
}
