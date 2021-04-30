const configuration = require("./configuration.js");
const {google} = require('googleapis');
const credentials = require('./credentials.json');

const client = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
)

client.authorize(function(err, tokens) {
    if (err){
        console.log(err);
        return;
    }
    
    console.log('Connected Google Sheets Api!');
    gsrun(client);
});

let googleSheetsAPI;

async function gsrun(cl){
    googleSheetsAPI = google.sheets({version:'v4', auth:cl})
}

async function getNumberValue(range) 
{
    const opt = {
        spreadsheetId: configuration.spreadsheetId,
        range : range
    }

    let res = await googleSheetsAPI.spreadsheets.values.get(opt);
    const rows = res.data.values;
    if (rows.length) {
		return Number(rows[0][0]);
    } else {
      console.log('No data found.');
	  return 0;
    }
}

async function getStringValue(range) 
{
    const opt = {
        spreadsheetId: configuration.spreadsheetId,
        range : range
    }

    let res = await googleSheetsAPI.spreadsheets.values.get(opt);
    const rows = res.data.values;
    if (rows.length) {
		return rows[0][0];
    } else {
      console.log('No data found.');
	  return "";
    }
}

async function updateSheet(range, val)
{
    const opt = {
            spreadsheetId : configuration.spreadsheetId,
            range: range,
            valueInputOption:'USER_ENTERED',
            resource: {values: [[val]]}
    }
    await googleSheetsAPI.spreadsheets.values.update(opt);
}

function getNextCell(range){
	var cells = range.split('!');
	var cell = cells[cells.length - 1];
	var column = cell.replace(/[^a-zA-Z]+/g, '');
	var row = cell.replace(/[^0-9]+/g, '');
	return `${nextChar(column)}${row}`;
}

function nextChar(c) {
    var u = c.toUpperCase();
    if (same(u,'Z')){
        var txt = '';
        var i = u.length;
        while (i--) {
            txt += 'A';
        }
        return (txt+'A');
    } else {
        var p = "";
        var q = "";
        if(u.length > 1){
            p = u.substring(0, u.length - 1);
            q = String.fromCharCode(p.slice(-1).charCodeAt(0));
        }
        var l = u.slice(-1).charCodeAt(0);
        var z = nextLetter(l);
        if(z==='A'){
            return p.slice(0,-1) + nextLetter(q.slice(-1).charCodeAt(0)) + z;
        } else {
            return p + z;
        }
    }
}
    
function nextLetter(l){
    if(l<90){
        return String.fromCharCode(l + 1);
    }
    else{
        return 'A';
    }
}
    
function same(str,char){
    var i = str.length;
    while (i--) {
        if (str[i]!==char){
            return false;
        }
    }
    return true;
}

module.exports.updateSheet = updateSheet;
module.exports.getStringValue = getStringValue;
module.exports.getNumberValue = getNumberValue;
module.exports.getNextCell = getNextCell;