/**
 * SHREAZ MARKETING — Leads → Google Sheet (mini CRM)
 * ---------------------------------------------------
 * This is a Google Apps Script. It receives each Book/Apply form
 * submission from book.html and appends it as a row in your sheet.
 *
 * SETUP (5 minutes, one time):
 *  1. Create a new Google Sheet (sheets.new). Name it e.g. "SHREAZ Leads".
 *  2. In that sheet: Extensions ▸ Apps Script. Delete any sample code.
 *  3. Paste EVERYTHING from this file into the editor. Save (💾).
 *  4. Click Deploy ▸ New deployment ▸ (gear) Web app.
 *       - Description: "Leads endpoint"
 *       - Execute as:  Me
 *       - Who has access:  Anyone
 *     Click Deploy, then Authorize access (allow your own account).
 *  5. Copy the "Web app URL" (ends in /exec).
 *  6. Open book.html, find SHEET_ENDPOINT, and paste that URL between
 *     the quotes. Re-upload book.html to Hostinger. Done.
 *
 *  Test it: open the /exec URL in a browser — it should say the API is live.
 *  Then submit the form on your site; a new row appears in the sheet.
 *
 *  NOTE: if you ever change this script, you must Deploy ▸ Manage
 *  deployments ▸ edit ▸ Version: "New version" for changes to go live.
 */

var SHEET_NAME = 'Leads';
var HEADERS = [
  'Timestamp', 'Name', 'Email', 'Phone', 'Website',
  'Monthly Revenue', 'Ad Budget', 'Business Type', 'Primary Goal'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // avoid two submissions writing at once

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // Write header row the first time
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var p = (e && e.parameter) ? e.parameter : {};
    sheet.appendRow([
      new Date(),
      p.fullName || '',
      p.email || '',
      p.phone || '',
      p.website || '',
      p.monthlyRevenue || '',
      p.adBudget || '',
      p.businessType || '',
      p.primaryGoal || ''
    ]);

    return json({ result: 'success' });
  } catch (err) {
    return json({ result: 'error', error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the /exec URL in a browser hits this — handy sanity check.
function doGet() {
  return json({ result: 'ok', message: 'SHREAZ leads endpoint is live. Submit the form to add a row.' });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
