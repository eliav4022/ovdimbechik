import fs from 'fs';
const file = 'src/pages/admin/AdminSettings.tsx';
let content = fs.readFileSync(file, 'utf8');

const tHeadRegex = /<th key={h} className="px-4 py-3 min-w-\[128px\]">\s*\{h === '_ownerId' \? 'שיוך מעסיק' : h\}\s*<\/th>/;
const newTHead = `
    {h === '_isDuplicate' || h === '_skip' ? null : (
        <th key={h} className="px-4 py-3 min-w-[128px]">
            {h === '_ownerId' ? 'שיוך מעסיק' : h}
        </th>
    )}
`;

content = content.replace(tHeadRegex, newTHead);

const trRegex = /<tr key={idx} className="hover:bg-slate-50 transition-colors">/;
const newTr = `<tr key={idx} className={\`hover:bg-slate-50 transition-colors \${job._isDuplicate ? 'bg-amber-50/50' : ''}\`}>`;

content = content.replace(trRegex, newTr);

const tdRegex = /<td key={h} className="px-2 py-2 max-w-\[300px\]">/;
const newTd = `
    {h === '_isDuplicate' || h === '_skip' ? null : (
        <td key={h} className="px-2 py-2 max-w-[300px]">
`;

content = content.replace(tdRegex, newTd);

const tdEndRegex = /<\/td>\s*\)\)}/m;
const newTdEnd = `</td>\n    )}\n))}`;

content = content.replace(tdEndRegex, newTdEnd);

const actionThRegex = /<th className="px-4 py-3 sticky left-0 bg-slate-50 w-\[50px\]"><\/th>/;
const newActionTh = `
    <th className="px-4 py-3 min-w-[100px]">סטטוס / ייבוא</th>
    <th className="px-4 py-3 sticky left-0 bg-slate-50 w-[50px]"></th>
`;

content = content.replace(actionThRegex, newActionTh);

const actionTdRegex = /<td className="px-4 py-3 sticky left-0 bg-slate-50">/m;
const newActionTd = `
    <td className="px-2 py-2">
        {job._isDuplicate && (
            <div className="flex flex-col gap-1 items-start">
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                    <Info size={12} />
                    חשד לכפילות
                </span>
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                    <input type="checkbox" checked={!job._skip} onChange={(e) => updateJobField(idx, '_skip', !e.target.checked)} />
                    ייבא בכל זאת
                </label>
            </div>
        )}
        {!job._isDuplicate && (
            <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input type="checkbox" checked={!job._skip} onChange={(e) => updateJobField(idx, '_skip', !e.target.checked)} />
                ייבא
            </label>
        )}
    </td>
    <td className="px-4 py-3 sticky left-0 bg-slate-50">
`;

content = content.replace(actionTdRegex, newActionTd);

const loopStartRegex = /for \(const jobData of previewJobs\) {/;
const newLoopStart = `
for (const jobData of previewJobs) {
    if (jobData._skip) continue;
`;
content = content.replace(loopStartRegex, newLoopStart);

const loopCleanRegex = /const { _ownerId, \.\.\.cleanData } = jobData;/;
const newLoopClean = `const { _ownerId, _isDuplicate, _skip, ...cleanData } = jobData;`;
content = content.replace(loopCleanRegex, newLoopClean);

fs.writeFileSync(file, content);
