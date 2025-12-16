const regex = /^(תיקון|Learn|Correction)[:\-\s]*\s+(.+)/i;

const tests = [
    "תיקון: צריך ליישר רגליים", // Should match
    "תיקון לא נכון", // Should match
    "Correction: keep legs straight", // Should match
    "לא נכון", // Should NOT match
    "שגוי", // Should NOT match
    "תיקון: שגוי", // Should match -> 'שגוי'
];

tests.forEach(t => {
    const match = t.trim().match(regex);
    console.log(`Input: "${t}"`);
    console.log(`Matches? ${!!match}`);
    if (match) {
        console.log(`Captured Group 1 (Trigger): "${match[1]}"`);
        console.log(`Captured Group 2 (Rule): "${match[2]}"`);
    }
    console.log('---');
});
