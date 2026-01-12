import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { AppConfig, Student, RubricItem } from './wizard/store';

// Register a font that supports Turkish characters if possible
// Ideally we load a font like Roboto or Open Sans. 
// For now, default fonts might have issues with 'ğ, ş, ı'. 
// We will register a standard font.

// Register a font that supports Turkish characters
// We use local fonts to avoid network crashes/hanging during PDF generation
Font.register({
    family: 'Roboto',
    fonts: [
        { src: '/fonts/Roboto-Regular.ttf' },
        { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' }
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: 15,
        paddingBottom: 50,
        fontFamily: 'Roboto',
        fontSize: 8
    },
    header: {
        marginBottom: 8,
        textAlign: 'center',
        fontWeight: 'bold'
    },
    table: {
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderColor: '#000',
        marginBottom: 5
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
        minHeight: 12
    },
    tableColHeader: {
        width: '12%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#000',
        backgroundColor: '#fff',
        padding: 1,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center'
    },
    tableColNameHeader: {
        width: '30%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
        height: 80
    },
    tableCol: {
        width: '12%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#000',
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center'
    },
    tableColName: {
        width: '30%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#000',
        padding: 2,
        paddingLeft: 4,
        justifyContent: 'center'
    },
    tableColTotal: {
        width: '10%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#000',
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9'
    },
    cellText: {
        fontSize: 7,
        textAlign: 'center'
    },
    nameText: {
        fontSize: 7,
        textAlign: 'left'
    },
    footer: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20
    }
});

interface PdfProps {
    students: Student[];
    config: AppConfig;
    meta: { lessonName: string; className: string };
    type: 'P1' | 'P2' | 'ALL';
}

const PerformancePage = ({ students, config, meta, type }: { students: Student[], config: AppConfig, meta: { lessonName: string, className: string }, type: 'P1' | 'P2' }) => {
    const rubrics = type === 'P1' ? config.rubricsP1 : config.rubricsP2;
    const pName = type === 'P1' ? config.p1Name : config.p2Name;

    // Dynamic column width calculation
    const NAME_COL_WIDTH = 24; // Fixed 24% (increased from 20%)
    const TOTAL_COL_WIDTH = 8; // Fixed 8%
    const remainingWidth = 100 - NAME_COL_WIDTH - TOTAL_COL_WIDTH; // 68%
    const criteriaColWidth = rubrics.length > 0 ? remainingWidth / rubrics.length : 10;

    // Group students by Class + Lesson
    const groups: { [key: string]: Student[] } = {};
    students.forEach(s => {
        const key = `${s.className || meta.className}-${s.lessonName || meta.lessonName}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(s);
    });

    const pages: any[] = [];

    Object.keys(groups).forEach((groupKey) => {
        const groupStudents = groups[groupKey];
        const firstStudent = groupStudents[0];

        const schoolName = (firstStudent.schoolName || 'Okul Adı').toUpperCase();
        const academicYear = (firstStudent.academicYear || '2015-2016').toUpperCase();
        const className = (firstStudent.className || meta.className).toUpperCase();
        const lessonName = (firstStudent.lessonName || meta.lessonName).toUpperCase();
        const pNameUpper = pName.toUpperCase();

        // Chunk students (max 40 per page)
        const CHUNK_SIZE = 40;
        for (let i = 0; i < groupStudents.length; i += CHUNK_SIZE) {
            const chunk = groupStudents.slice(i, i + CHUNK_SIZE);

            pages.push(
                <Page key={`${groupKey}-${i}`} size="A4" orientation="portrait" style={styles.page}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={{ fontSize: 10, marginBottom: 3 }}>{academicYear} EĞİTİM ÖĞRETİM YILI {schoolName}</Text>
                        <Text style={{ fontSize: 10 }}>{className} {lessonName} {pNameUpper} PERFORMANS DEĞERLENDİRME ÇİZELGESİ</Text>
                    </View>

                    {/* Table */}
                    <View style={styles.table}>
                        {/* Header Row */}
                        <View style={styles.tableRow}>
                            <View style={[styles.tableColNameHeader, { width: `${NAME_COL_WIDTH}%` }]}>
                                <Text style={[styles.cellText, { fontWeight: 'bold' }]}>NO - AD SOYAD</Text>
                            </View>
                            {rubrics.map((r, idx) => (
                                <View key={r.id} style={[styles.tableColHeader, { width: `${criteriaColWidth}%` }]}>
                                    <View style={{ transform: 'rotate(-90deg)', width: 75, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 7, textAlign: 'center' }}>{r.label}</Text>
                                        <Text style={{ fontSize: 7, marginTop: 1 }}>({r.maxScore}P)</Text>
                                    </View>
                                </View>
                            ))}
                            <View style={[styles.tableColTotal, { width: `${TOTAL_COL_WIDTH}%`, height: 80, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }]}>
                                <View style={{ transform: 'rotate(-90deg)', width: 75, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 7, fontWeight: 'bold' }}>TOPLAM</Text>
                                </View>
                            </View>
                        </View>

                        {/* Data Rows */}
                        {chunk.map((student) => {
                            const studentScores = student.generatedScores || {};
                            const currentTotal = rubrics.reduce((acc, r) => acc + (studentScores[r.id] || 0), 0);

                            return (
                                <View key={student.id} style={styles.tableRow}>
                                    <View style={[styles.tableColName, { width: `${NAME_COL_WIDTH}%` }]}>
                                        <Text style={styles.nameText}>{student.id} - {student.name}</Text>
                                    </View>
                                    {rubrics.map((r) => (
                                        <View key={r.id} style={[styles.tableCol, { width: `${criteriaColWidth}%` }]}>
                                            <Text style={styles.cellText}>{studentScores[r.id] || 0}</Text>
                                        </View>
                                    ))}
                                    <View style={[styles.tableColTotal, { width: `${TOTAL_COL_WIDTH}%` }]}>
                                        <Text style={[styles.cellText, { fontWeight: 'bold' }]}>{currentTotal}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Footer - Teacher on Left, Principal on Right */}
                    <View style={styles.footer}>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 8 }}>DERS ÖĞRETMENİ</Text>
                            <Text style={{ fontSize: 8, marginTop: 2, fontWeight: 'bold' }}>{(config.teacherName || '...........................').toLocaleUpperCase('tr-TR')}</Text>
                            <Text style={{ fontSize: 8 }}>{(config.teacherBranch || '...........................').toLocaleUpperCase('tr-TR')}</Text>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 8 }}>UYGUNDUR</Text>
                            <Text style={{ fontSize: 8, marginTop: 2 }}>.... / .... / 20....</Text>
                            <Text style={{ fontSize: 8, marginTop: 10, fontWeight: 'bold' }}>{(config.principalName || 'Okul Müdürü').toLocaleUpperCase('tr-TR')}</Text>
                        </View>
                    </View>
                </Page>
            );
        }
    });

    return <>{pages}</>;
};

export const PerformanceChartPdf = ({ students, config, meta, type }: PdfProps) => {
    return (
        <Document>
            {type === 'ALL' ? (
                <>
                    <PerformancePage students={students} config={config} meta={meta} type="P1" />
                    <PerformancePage students={students} config={config} meta={meta} type="P2" />
                </>
            ) : (
                <PerformancePage students={students} config={config} meta={meta} type={type as 'P1' | 'P2'} />
            )}
        </Document>
    );
};
