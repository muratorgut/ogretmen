import ExcelJS from 'exceljs';
import { Student } from '@/components/wizard/store';

export const exportToOriginalExcel = async (originalFile: File, students: Student[]) => {
    const buffer = await originalFile.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
        throw new Error('Excel dosyasında sayfa bulunamadı.');
    }

    // Find columns again (similar logic to parser but we need to write)
    // We iterate rows to match student numbers and update P1/P2 columns

    // Quick scan for headers
    let headerRowIndex = -1;
    let idxNo = -1;
    let idxP1 = -1;
    let idxP2 = -1;

    worksheet.eachRow((row, rowNumber) => {
        if (headerRowIndex !== -1) return;

        let foundNo = false;
        let foundName = false;

        // Try to identify header row by common labels
        row.eachCell((cell, colNumber) => {
            const val = String(cell.value || '').toUpperCase();

            // Check for No column
            if (val.includes('NO') || val.includes('NUMARA') || val.includes('OKUL')) {
                foundNo = true;
            }
            // Check for Name column
            if (val.includes('ADI') || val.includes('SOYAD')) {
                foundName = true;
            }
        });

        // Use heuristic: if row has both NO and NAME, or standard "PUAN ÇİZELGESİ" headers
        if (foundNo || foundName) {
            headerRowIndex = rowNumber;

            // Now precisely find column indices in this row
            row.eachCell((cell, colNumber) => {
                const val = String(cell.value || '').toUpperCase();

                if (val.includes('NO') || val.includes('NUMARA') || val.includes('OKUL')) {
                    idxNo = colNumber;
                }
                // Match P1
                if (val === 'P1' || val.includes('1.PERF') || (val.includes('PERFORMANS') && idxP1 === -1)) {
                    idxP1 = colNumber;
                }
                // Match P2
                if (val === 'P2' || val.includes('2.PERF') || (val.includes('PERFORMANS') && colNumber !== idxP1)) {
                    idxP2 = colNumber;
                }
            });
        }
    });

    if (headerRowIndex !== -1 && idxNo === -1) {
        // Fallback: If header detected but NO col not marked, try first col
        idxNo = 1;
    }

    if (headerRowIndex === -1 || idxNo === -1 || idxP1 === -1 || idxP2 === -1) {
        console.error("Column mapping failed:", { headerRowIndex, idxNo, idxP1, idxP2 });
        throw new Error("Excel sütunları eşleştirilemedi. 'P1', 'P2' ve 'Numara' başlıklarının dosyada olduğundan emin olun.");
    }

    // Write Data
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= headerRowIndex) return;

        const studentNo = row.getCell(idxNo).value;
        if (!studentNo) return;

        const student = students.find(s => s.id == String(studentNo));
        if (student) {
            // Update P1
            if (student.p1 !== undefined) {
                row.getCell(idxP1).value = student.p1;
            }
            // Update P2
            if (student.p2 !== undefined) {
                row.getCell(idxP2).value = student.p2;
            }
        }
    });

    const outBuffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    return blob;
};
