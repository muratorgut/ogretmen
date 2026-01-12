import * as XLSX from 'xlsx';

interface ParsedResult {
    meta: {
        lessonName: string;
        className: string;
    };
    students: any[];
}

export const parseESchoolXls = async (file: File): Promise<ParsedResult> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    let lessonName = '';
    let className = '';
    let headerRowIndex = -1;

    // 1. Scan for Metadata in first 20 rows
    for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
        const row = jsonData[i];
        if (!row || !Array.isArray(row)) continue;
        const rowStr = row.join(' ').toUpperCase();

        // Try to find "Dersin Adı"
        if (rowStr.includes('DERSİN ADI')) {
            const parts = rowStr.split(':');
            if (parts.length > 1) {
                lessonName = parts[1].trim();
            } else {
                const match = rowStr.match(/DERSİN ADI\s*[:]\s*(.*)/);
                if (match && match[1]) lessonName = match[1].trim();
            }
        }

        if (rowStr.includes('SINIFI') || rowStr.includes('ŞUBE')) {
            const match = rowStr.match(/(?:SINIFI|ŞUBE).*?[:]\s*(.*)/);
            if (match && match[1]) className = match[1].trim();
            // Fallback: look for cell content like "12 / A"
            if (!className) {
                row.forEach(cell => {
                    if (typeof cell === 'string' && /\d+\s*\/\s*[A-Z]/.test(cell)) {
                        className = cell;
                    }
                });
            }
        }

        // Identify Header Row for Students Table
        // Look for "ADI SOYADI" or "AD SOYAD" as the anchor
        if (rowStr.includes('ADI SOYADI') || rowStr.includes('AD SOYAD')) {
            headerRowIndex = i;
        }
    }

    if (headerRowIndex === -1) {
        // Fallback: Try looking for "OKUL NO" or "NUMARA" if name header is split or weird
        for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
            const row = jsonData[i];
            if (!row || !Array.isArray(row)) continue;

            const rowStr = row.join(' ').toUpperCase();
            if ((rowStr.includes('OKUL') && rowStr.includes('NO')) || rowStr.includes('NUMARASI')) {
                // If we find Number but not name, maybe Name is in the same row?
                headerRowIndex = i;
                break;
            }
        }


        if (headerRowIndex === -1) {
            throw new Error('Öğrenci listesi başlık satırı (Adı Soyadı veya Okul No) bulunamadı.');
        }
    }

    // 2. Parse Students
    const students = [];
    const rawHeaderRow = jsonData[headerRowIndex] || [];
    // Array.from ensures sparse arrays are filled with undefined, so map can process them
    const headerRow = Array.from(rawHeaderRow).map(h => String(h || '').trim().toUpperCase());

    // Find column indices
    // "Okul Numarası" might be split. We look for "NO", "NUMARA", "OKUL"
    let idxNo = headerRow.findIndex(h => h.includes('NO') || h.includes('NUMARA') || h.includes('OKUL'));

    // If not found in this row, maybe the row above had "OKUL" and this row has "NUMARASI"?
    // But usually checking current row for "NUMARASI" or "NO" is enough. 
    // In the user's screenshot, "Numarası" is likely in this row.

    let idxName = headerRow.findIndex(h => h.includes('ADI') || h.includes('SOYAD'));

    // Exams: Y1, Y2
    // We look for exact match "Y1" or "1.YAZILI"
    let idxY1 = headerRow.findIndex(h => h === 'Y1' || h.includes('1.YAZILI') || h.includes('1.SINAV') || h.includes('S1'));
    let idxY2 = headerRow.findIndex(h => h === 'Y2' || h.includes('2.YAZILI') || h.includes('2.SINAV') || h.includes('S2'));

    // Performance: P1, P2
    // User screenshot shows "P1", "P2" explicitly
    let idxP1 = headerRow.findIndex(h => h === 'P1' || h.includes('1.PERF') || h.includes('1.DERS'));
    let idxP2 = headerRow.findIndex(h => h === 'P2' || h.includes('2.PERF') || h.includes('2.DERS'));

    // Fallback for No/Name if still -1 (e.g. if header text is empty but position is standard)
    if (idxNo === -1) idxNo = 1; // Usually 2nd column
    if (idxName === -1) idxName = 2; // Usually 3rd column

    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const studentNo = row[idxNo];

        // Stop if no student number or it's not a number-like string
        if (!studentNo) continue;
        // Basic check: is it a valid row?
        const nameStr = row[idxName];
        if (!nameStr || nameStr.toString().trim() === '') continue;

        const student = {
            id: String(studentNo),
            name: String(nameStr),
            y1: parseScore(row[idxY1]),
            y2: parseScore(row[idxY2]),
            p1: parseScore(row[idxP1]),
            p2: parseScore(row[idxP2]),
        };

        students.push(student);
    }

    return {
        meta: { lessonName: lessonName || 'Ders', className: className || 'Sınıf' },
        students
    };
};

function parseScore(val: any): number | undefined {
    if (val === undefined || val === null || val === '') return undefined;
    // Handle "G" (Girmedi) -> 0 or null? Usually 0 for calculation.
    if (String(val).toUpperCase() === 'G') return 0;
    const num = parseFloat(val);
    return isNaN(num) ? undefined : num;
}
