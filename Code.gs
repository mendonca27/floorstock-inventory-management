/**
 * Google Apps Script backend for FLOORSTOCK app.
 * Uses Google Spreadsheet as data store.
 */

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your Spreadsheet ID

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Sheet names
const SHEET_KELOMPOK = 'Kelompok';
const SHEET_BARANG = 'Barang';
const SHEET_TRANSAKSI = 'Transaksi';

// Utility to get sheet by name
function getSheet(name) {
  const ss = getSpreadsheet();
  return ss.getSheetByName(name);
}

// Utility to get all data from a sheet as array of objects
function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  return data.map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}

// Utility to append a row to a sheet
function appendRow(sheetName, row) {
  const sheet = getSheet(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  sheet.appendRow(row);
}

// Utility to update a row by id in a sheet
function updateRowById(sheetName, id, idColumn, updateObj) {
  const sheet = getSheet(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf(idColumn)] == id) {
      // Update row
      for (let key in updateObj) {
        const colIndex = headers.indexOf(key);
        if (colIndex >= 0) {
          sheet.getRange(i + 1, colIndex + 1).setValue(updateObj[key]);
        }
      }
      return true;
    }
  }
  return false;
}

// Generate next ID for a sheet (numeric auto-increment)
function getNextId(sheetName, idColumn) {
  const data = getSheetData(sheetName);
  let maxId = 0;
  data.forEach(row => {
    const id = parseInt(row[idColumn]);
    if (!isNaN(id) && id > maxId) maxId = id;
  });
  return maxId + 1;
}

// doGet to serve data or frontend (if needed)
function doGet(e) {
  const params = e.parameter;
  const action = params.action;

  if (!action) {
    return ContentService.createTextOutput('FLOORSTOCK Google Apps Script Backend');
  }

  try {
    switch (action) {
      case 'getKelompok':
        return jsonResponse(getSheetData(SHEET_KELOMPOK));
      case 'getBarang':
        return jsonResponse(getSheetData(SHEET_BARANG));
      case 'getTransaksi':
        return jsonResponse(getSheetData(SHEET_TRANSAKSI));
      default:
        return jsonResponse({ error: 'Unknown action' }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

// doPost to handle create/update operations
function doPost(e) {
  const params = JSON.parse(e.postData.contents);
  const action = params.action;

  if (!action) {
    return jsonResponse({ error: 'Missing action' }, 400);
  }

  try {
    switch (action) {
      case 'addKelompok':
        return addKelompok(params);
      case 'addBarang':
        return addBarang(params);
      case 'addTransaksi':
        return addTransaksi(params);
      case 'updateTransaksi':
        return updateTransaksi(params);
      default:
        return jsonResponse({ error: 'Unknown action' }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

// Add new kelompok
function addKelompok(params) {
  const name = params.name;
  if (!name) return jsonResponse({ error: 'Missing kelompok name' }, 400);

  // Check if kelompok exists
  const kelompokList = getSheetData(SHEET_KELOMPOK);
  if (kelompokList.some(k => k.name.toLowerCase() === name.toLowerCase())) {
    return jsonResponse({ error: 'Kelompok already exists' }, 400);
  }

  const id = getNextId(SHEET_KELOMPOK, 'id');
  appendRow(SHEET_KELOMPOK, [id, name]);
  return jsonResponse({ success: true, id, name });
}

// Add new barang
function addBarang(params) {
  const name = params.name;
  const kelompokId = params.kelompokId;
  if (!name || !kelompokId) return jsonResponse({ error: 'Missing barang name or kelompokId' }, 400);

  // Check if kelompok exists
  const kelompokList = getSheetData(SHEET_KELOMPOK);
  if (!kelompokList.some(k => k.id == kelompokId)) {
    return jsonResponse({ error: 'Kelompok not found' }, 400);
  }

  // Check if barang exists in kelompok
  const barangList = getSheetData(SHEET_BARANG);
  if (barangList.some(b => b.name.toLowerCase() === name.toLowerCase() && b.kelompokId == kelompokId)) {
    return jsonResponse({ error: 'Barang already exists in kelompok' }, 400);
  }

  const id = getNextId(SHEET_BARANG, 'id');
  appendRow(SHEET_BARANG, [id, name, kelompokId, 0]);
  return jsonResponse({ success: true, id, name, kelompokId, saldo: 0 });
}

// Add new transaksi
function addTransaksi(params) {
  const barangId = params.barangId;
  const tanggal = params.tanggal;
  const masuk = parseInt(params.masuk) || 0;
  const keluar = parseInt(params.keluar) || 0;
  const pencatat = params.pencatat || '';

  if (!barangId || !tanggal) return jsonResponse({ error: 'Missing barangId or tanggal' }, 400);

  // Get barang data
  const barangList = getSheetData(SHEET_BARANG);
  const barang = barangList.find(b => b.id == barangId);
  if (!barang) return jsonResponse({ error: 'Barang not found' }, 400);

  // Calculate saldoAkhir
  let saldo = parseInt(barang.saldo) || 0;
  let saldoAkhir = saldo + masuk - keluar;
  if (saldoAkhir < 0) saldoAkhir = 0;

  // Generate riwayatId
  const riwayatId = 'r' + new Date().getTime();

  // Append transaksi
  appendRow(SHEET_TRANSAKSI, [riwayatId, barangId, tanggal, masuk, keluar, saldoAkhir, pencatat]);

  // Update saldo in barang sheet
  updateRowById(SHEET_BARANG, barangId, 'id', { saldo: saldoAkhir });

  return jsonResponse({ success: true, riwayatId, barangId, tanggal, masuk, keluar, saldoAkhir, pencatat });
}

// Update transaksi
function updateTransaksi(params) {
  const riwayatId = params.riwayatId;
  const tanggal = params.tanggal;
  const masuk = parseInt(params.masuk) || 0;
  const keluar = parseInt(params.keluar) || 0;
  const pencatat = params.pencatat || '';

  if (!riwayatId || !tanggal) return jsonResponse({ error: 'Missing riwayatId or tanggal' }, 400);

  const sheet = getSheet(SHEET_TRANSAKSI);
  if (!sheet) return jsonResponse({ error: 'Transaksi sheet not found' }, 500);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('riwayatId')] === riwayatId) {
      rowIndex = i + 1;
      break;
    }
  }
  if (rowIndex === -1) return jsonResponse({ error: 'Transaksi not found' }, 400);

  // Update row values
  sheet.getRange(rowIndex, headers.indexOf('tanggal') + 1).setValue(tanggal);
  sheet.getRange(rowIndex, headers.indexOf('masuk') + 1).setValue(masuk);
  sheet.getRange(rowIndex, headers.indexOf('keluar') + 1).setValue(keluar);
  sheet.getRange(rowIndex, headers.indexOf('pencatat') + 1).setValue(pencatat);

  // Recalculate saldoAkhir for this and subsequent transactions of the same barang
  const barangId = data[rowIndex - 1][headers.indexOf('barangId')];
  recalculateSaldo(barangId);

  return jsonResponse({ success: true });
}

// Recalculate saldoAkhir for all transactions of a barang in chronological order
function recalculateSaldo(barangId) {
  const sheet = getSheet(SHEET_TRANSAKSI);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Filter transactions for barangId and sort by tanggal ascending
  let transactions = data.slice(1).filter(row => row[headers.indexOf('barangId')] == barangId);
  transactions.sort((a, b) => new Date(a[headers.indexOf('tanggal')]) - new Date(b[headers.indexOf('tanggal')]));

  // Get initial saldo from barang sheet
  const barangList = getSheetData(SHEET_BARANG);
  const barang = barangList.find(b => b.id == barangId);
  let saldo = barang ? parseInt(barang.saldo) : 0;

  // Recalculate saldoAkhir for each transaction
  transactions.forEach((row, idx) => {
    saldo = saldo + (parseInt(row[headers.indexOf('masuk')]) || 0) - (parseInt(row[headers.indexOf('keluar')]) || 0);
    if (saldo < 0) saldo = 0;
    // Update saldoAkhir in sheet
    const rowIndex = data.findIndex(r => r[headers.indexOf('riwayatId')] === row[headers.indexOf('riwayatId')]) + 1;
    sheet.getRange(rowIndex, headers.indexOf('saldoAkhir') + 1).setValue(saldo);
  });

  // Update saldo in barang sheet to last saldoAkhir
  if (barang) {
    updateRowById(SHEET_BARANG, barangId, 'id', { saldo: saldo });
  }
}

// Helper to create JSON response
function jsonResponse(data, statusCode) {
  statusCode = statusCode || 200;
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setStatusCode(statusCode);
}
