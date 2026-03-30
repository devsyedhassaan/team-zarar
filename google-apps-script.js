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

    // ✅ Reads IDs dynamically from each event in App.jsx
    const sheetId = data.sheetId;
    const folderId = data.folderId;

    if (!sheetId || !folderId) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: "error", message: "Missing sheetId or folderId" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName("Registrations") || ss.insertSheet("Registrations");

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    let screenshotLink = "No screenshot";
    if (data.screenshotBase64 && data.screenshotName) {
      screenshotLink = uploadScreenshot(data.screenshotBase64, data.screenshotName, data.fullName, data.eventTitle, folderId);
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

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function uploadScreenshot(base64Data, fileName, participantName, eventTitle, folderId) {
  try {
    const folder = DriveApp.getFolderById(folderId);
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
  Logger.log("✅ Dynamic script ready! No fixed IDs needed.");
}