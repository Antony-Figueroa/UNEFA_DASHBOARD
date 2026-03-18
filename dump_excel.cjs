const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'c:\\Users\\Server Admin\\Documents\\GitHub\\UNEFA_DASHBOARD\\docs\\docs-unefa\\Documentos UNEFA_\\listo ANEXO 4_FORMATO_RELACION TUTORES ACADEMICOS INGENIERIA.xls';

try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    fs.writeFileSync('excel_dump.json', JSON.stringify(data.slice(0, 10), null, 2));
    console.log('Success');
} catch (e) {
    fs.writeFileSync('excel_error.txt', e.toString());
    console.error(e);
}
