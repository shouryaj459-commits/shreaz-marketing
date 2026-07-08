/**
 * SHREAZ MARKETING — Leads → Google Sheet (mini CRM)
 * ---------------------------------------------------
 * Receives each Book/Apply form submission from book.html and appends
 * it as a row, and includes a one-time formatter to make the sheet
 * look like a clean, professional CRM.
 *
 * TO UPDATE (you already have an older version pasted in):
 *  1. Extensions ▸ Apps Script. Select all, delete, and paste THIS whole file. Save (💾).
 *  2. Run the formatter once:  in the toolbar function dropdown pick  setupSheet  ▸ Run.
 *     (Authorize if asked.) Your Leads tab is now styled — header, colours,
 *     column widths, banded rows, a Status dropdown, and colour-coded statuses.
 *  3. Push the new-lead logic live:  Deploy ▸ Manage deployments ▸ ✏️ Edit ▸
 *     Version: "New version" ▸ Deploy. (Same URL — nothing changes in book.html.)
 *
 *  From now on every new lead lands with Status = "New" automatically.
 */

var SHEET_NAME = 'Leads';
var HEADERS = [
  'Timestamp', 'Name', 'Email', 'Phone', 'Website',
  'Monthly Revenue', 'Ad Budget', 'Business Type', 'Primary Goal',
  'Status', 'Notes'
];
var STATUS_OPTIONS = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

/* ---------- Receives a new lead from the website ---------- */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      styleHeader(sheet);
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
      p.primaryGoal || '',
      'New',   // Status
      ''       // Notes
    ]);

    return json({ result: 'success' });
  } catch (err) {
    return json({ result: 'error', error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json({ result: 'ok', message: 'SHREAZ leads endpoint is live. Submit the form to add a row.' });
}

/* ============================================================
   ONE-TIME FORMATTER — run this once from the editor
   ============================================================ */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  var maxRows = sheet.getMaxRows();

  // 1) Headers
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  styleHeader(sheet);

  // 2) Freeze header + first two columns (Timestamp, Name)
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);

  // 3) Column widths
  var widths = [155, 165, 215, 140, 170, 140, 120, 150, 190, 130, 260];
  for (var c = 0; c < widths.length; c++) sheet.setColumnWidth(c + 1, widths[c]);

  // 4) Keep phone as text (so +country codes survive) and format the timestamp
  sheet.getRange(2, 4, maxRows - 1, 1).setNumberFormat('@');                 // Phone
  sheet.getRange(2, 1, maxRows - 1, 1).setNumberFormat('yyyy-mm-dd  hh:mm'); // Timestamp

  // 5) Alternating row banding across all columns
  sheet.getBandings().forEach(function (b) { b.remove(); });
  var banding = sheet.getRange(1, 1, maxRows, HEADERS.length)
    .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
  banding.setHeaderRowColor('#11332a').setFirstRowColor('#ffffff').setSecondRowColor('#eef7f1');

  // 6) Status dropdown
  var statusCol = HEADERS.indexOf('Status') + 1;
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_OPTIONS, true).setAllowInvalid(false).build();
  sheet.getRange(2, statusCol, maxRows - 1, 1).setDataValidation(rule);

  // 7) Colour-code the statuses
  var scRange = sheet.getRange(2, statusCol, maxRows - 1, 1);
  function cf(text, bg, fg) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(text).setBackground(bg).setFontColor(fg).setRanges([scRange]).build();
  }
  sheet.setConditionalFormatRules([
    cf('New', '#e8f0fe', '#1a56db'),
    cf('Contacted', '#fef3c7', '#92400e'),
    cf('Qualified', '#e0f2fe', '#075985'),
    cf('Proposal Sent', '#ede9fe', '#5b21b6'),
    cf('Won', '#dcfce7', '#166534'),
    cf('Lost', '#fee2e2', '#991b1b')
  ]);

  // 8) Default any existing blank statuses to "New"
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var r = sheet.getRange(2, statusCol, lastRow - 1, 1);
    var v = r.getValues();
    for (var i = 0; i < v.length; i++) if (!v[i][0]) v[i][0] = 'New';
    r.setValues(v);
  }

  // 9) Wrap the Notes column, tidy alignment
  var notesCol = HEADERS.indexOf('Notes') + 1;
  sheet.getRange(1, notesCol, maxRows, 1).setWrap(true);
  sheet.getRange(2, 1, maxRows - 1, HEADERS.length).setVerticalAlignment('middle');

  ss.toast('Leads sheet formatted ✓', 'SHREAZ CRM', 4);
}

function styleHeader(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setBackground('#11332a')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('left');
  sheet.setRowHeight(1, 36);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
