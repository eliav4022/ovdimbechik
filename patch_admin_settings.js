const fs = require('fs');
const file = 'src/pages/admin/AdminSettings.tsx';
let content = fs.readFileSync(file, 'utf8');

const processCSVFunc = `
    const processCSVResults = async (results: any, errorMsg: string) => {
        if (results.errors.length > 0 && results.data.length === 0) {
            toast(errorMsg, 'error');
            return;
        }

        let existingJobs: any[] = [];
        try {
            const snap = await getDocs(collection(db, 'jobs'));
            existingJobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.error("Failed to fetch jobs for duplication check", e);
        }

        const parsed = results.data.map((row: any) => {
            const defaultUploader = employers.find(e => e.name === 'שיוך משרות (משתמש כללי)');
            const jobData: any = {
                id: row.id || '',
                _ownerId: defaultUploader ? defaultUploader.id : (user?.uid || '')
            };
            Object.keys(row).forEach(h => {
                if (h === 'id') return;
                const val = row[h] ? String(row[h]).trim() : '';
                if (h === 'tags') {
                    jobData[h] = val ? val.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
                } else if (h === 'isImmediate' || h === 'requireCV' || h === 'isCasual') {
                    jobData[h] = val.toLowerCase() === 'true' || val === 'TRUE';
                } else if (h === 'type') {
                    jobData.type = mapHebrewJobType(val);
                } else if (h === 'workMode') {
                    jobData.workMode = mapHebrewWorkMode(val);
                } else if (h === 'experienceLevel') {
                    jobData.experienceLevel = mapHebrewExp(val);
                } else {
                    jobData[h] = val;
                }
            });

            const isDuplicate = existingJobs.some(existing => {
                const sameLocation = existing.location?.trim() === jobData.location?.trim();
                const sameCompany = existing.companyName?.trim() === jobData.companyName?.trim();
                const sameDesc = existing.description?.trim() === jobData.description?.trim();
                return sameLocation && sameCompany && sameDesc && !!jobData.description;
            });

            if (isDuplicate) {
                jobData._isDuplicate = true;
                jobData._skip = true;
            } else {
                jobData._skip = false;
            }

            return jobData;
        });

        setPreviewJobs(parsed);
    };
`;

content = content.replace('    if (previewJobs) {', processCSVFunc + '\n    if (previewJobs) {');

// Replace Papa.parse block 1 (paste)
const block1Start = content.indexOf('Papa.parse(text, {');
const block1End = content.indexOf('setTimeout(() => {', block1Start);
const newBlock1 = `Papa.parse(text, {
                                                        header: true,
                                                        skipEmptyLines: true,
                                                        complete: (results) => {
                                                            processCSVResults(results, 'שגיאה בפענוח הנתונים המודבקים');
                                                        }
                                                    });
                                                    // `;
content = content.substring(0, block1Start) + newBlock1 + content.substring(block1End);

// Replace Papa.parse block 2 (file)
const block2Start = content.indexOf('Papa.parse(file, {');
const block2End = content.indexOf('e.target.value = \'\';', block2Start);
const newBlock2 = `Papa.parse(file, {
                                                    header: true,
                                                    skipEmptyLines: true,
                                                    complete: (results) => {
                                                        processCSVResults(results, 'שגיאה בפענוח הקובץ');
                                                        `;
content = content.substring(0, block2Start) + newBlock2 + content.substring(block2End);

fs.writeFileSync(file, content);
