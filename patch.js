const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminAudit.tsx', 'utf8');

code = code.replace(
  'const [loading, setLoading] = useState(true);',
  'const [loading, setLoading] = useState(true);\n    const [errorMsg, setErrorMsg] = useState<string | null>(null);'
);

code = code.replace(
  'console.error("Error fetching logs:", err);',
  'console.error("Error fetching logs:", err);\n                setErrorMsg(err instanceof Error ? err.message : String(err));'
);

code = code.replace(
  '<div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 overflow-x-auto">',
  '{errorMsg && <div className="bg-red-100 text-red-600 p-4 rounded-xl mb-4 font-bold">{errorMsg}</div>}\n            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 overflow-x-auto">'
);

fs.writeFileSync('src/pages/admin/AdminAudit.tsx', code);
