import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = 'c:\\Users\\Server Admin\\Documents\\GitHub\\UNEFA_DASHBOARD\\docs\\docs-unefa\\Documentos UNEFA_\\listo ANEXO 4_FORMATO_RELACION TUTORES ACADEMICOS INGENIERIA.xls';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with headers
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(JSON.stringify({
        sheetName,
        data: data.slice(0, 20), // Only first 20 rows for structural overview
        merges: worksheet['!merges'],
        cols: worksheet['!cols'],
        rows: worksheet['!rows']
    }, null, 2));
} catch (error) {
    console.error('Error reading file:', error);
}
