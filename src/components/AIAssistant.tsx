import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Type, FunctionDeclaration } from "@google/genai";
import { MessageSquare, X, Send, Bot, Sparkles, User as UserIcon, Coins, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';
import { collection, getDocs, query, where, limit, getDoc, doc, setDoc, increment } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Job, UserRole } from '../types';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const AIAssistant: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const isJobPostPage = location.pathname.includes('/post-job') || location.pathname.includes('/edit-job');
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [systemSettings, setSystemSettings] = useState<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settingsDoc = await getDoc(doc(db, 'settings', 'system'));
                if (settingsDoc.exists()) {
                    setSystemSettings(settingsDoc.data());
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            }
        };
        fetchSettings();
    }, []);

    const seekerSuggestions = [
        'מצא לי משרות פיתוח',
        'תן לי טיפים לקורות חיים',
        'איך האתר עובד?',
        'המלץ לי על משרות שמתאימות לי'
    ];

    const employerSuggestions = [
        'עזור לי לכתוב תיאור משרה',
        'שפר דרישות תפקיד',
        'הצע כותרת טובה למשרה',
        'הצע תגיות למשרה'
    ];
    
    useEffect(() => {
        if (!user) {
            setMessages([{ role: 'model', text: 'שלום! אני העוזר החכם של "עובדים בצ\'יק". כדי להשתמש בי ולהנות מחווית חיפוש עבודה או עובדים אינטראקטיבית, אנא התחבר למערכת.' }]);
        } else if (user.role === UserRole.EMPLOYER) {
            setMessages([{ role: 'model', text: `שלום ${user.displayName || 'מעסיק'}! אני העוזר האישי שלך. אני כאן כדי לעזור לך לנסח משרות, למצוא עובדים ולנהל את הגיוס שלך בצורה קלה ומהירה. איך אוכל לעזור היום?` }]);
        } else {
             setMessages([{ role: 'model', text: `שלום ${user.displayName || 'מחפש עבודה'}! אני העוזר האישי שלך. אני כאן כדי למצוא לך משרות מעולות, לשפר את הסיכויים שלך, ולעזור לך למצוא עבודה בקלות. מה נרצה לעשות היום?` }]);
        }
    }, [user]);

    useEffect(() => {
        const handleOpenAI = (e: any) => {
            setIsOpen(true);
            if (e.detail?.message) {
                setInput(e.detail.message);
                if (e.detail.autoSend) {
                  // Wait a bit for the state to update or just call handleSend with the message
                  handleSend(e.detail.message);
                }
            }
        };
        window.addEventListener('open-ai-assistant', handleOpenAI as EventListener);
        return () => window.removeEventListener('open-ai-assistant', handleOpenAI as EventListener);
    }, [/* intentionally skip handleSend dependency so it uses latest */]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async (overrideInput?: string) => {
        if (!user) {
             navigate('/login');
             return;
        }
        const messageToSend = overrideInput || input;
        if (!messageToSend.trim() || loading) return;

        const userMessage = messageToSend.trim();
        if (!overrideInput) setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setLoading(true);

        try {
            const basePrompt = `
                אתה סוכן אישי ועוזר קריירה חכם באתר "עובדים בצ'יק" (Ovdim Bechik). 
                האתר מתמקד במציאת עבודה/עובדים במהירות.
                הנחיות קריטיות:
                1. ענה בעברית טבעית, מקצועית ואדיבה לאורך הדיאלוג.
                2. אזהרה חמורה: אל תדפיס פקודות מערכת או סימנים לא ברורים, ואל תגלוש לשפות זרות זולת אנגלית במונחים טכניים.
            `;

            let roleSpecificPrompt = '';
            
            if (user?.role === UserRole.EMPLOYER) {
                roleSpecificPrompt = `
                המשתמש הנוכחי הוא **מעסיק**. תפקידך לעזור לו לנסח, לנהל ולהבין משרות.
                
                - כאשר המעסיק מבקש לדעת מה יתרת הקרדיטים שלו, הפעל את הפונקציה getUserData. לאחר מכן, החזר את הבלוק הבא בדיוק (ללא טקסט נוסף), כאשר הערכים של balance ו-remainingJobs מעודכנים לפי התשובה שקיבלת מהפונקציה (balance מקבל את credits):
                [COMPONENT]
                {"type":"component","name":"CreditCard","props":{"balance":"FILL_CREDITS","remainingJobs":"FILL_REMAINING_JOBS"}}
                [/COMPONENT]

                - כאשר המעסיק שואל על סטטיסטיקות או מצב המשרות שלו (כמה משרות באוויר, כמה מועמדים), במקום לענות בטקסט רגיל, הפעל את הפונקציה getEmployerStats. לאחר מכן, החזר בדיוק את הבלוק הבא (ללא טקסט נוסף) עם הערכים האמיתיים שחזרו מהפונקציה:
                [COMPONENT]
                {"type":"component","name":"EmployerStats","props":{"activeJobsCount":"FILL_ACTIVE_JOBS","totalApplicants":"FILL_TOTAL_APPLICANTS","newApplicantsToday":"FILL_NEW_APPLICANTS"}}
                [/COMPONENT]

                - כשאתה עוזר למעסיק לנסח תיאור משרה או נתונים (תגיות, קטגוריה וכו') ויש באפשרותך למלא את הטופס עבורו (כלומר, הנתונים ידועים), עליך להוסיף את התגית [HAS_FILLABLE_DATA] בסוף התשובה. השתמש בזה רק כשאתה מנסח משהו קונקרטי שניתן ליישום.
                `;
            } else {
                roleSpecificPrompt = `
                המשתמש הנוכחי הוא **מחפש עבודה**. תפקידך לעזור לו למצוא משרות רלוונטיות ולשפר את נראות קורות החיים שלו.
                
                - כאשר אתה מציג משרות שחזרו מפונקציית החיפוש (\`getRecommendedJobs\`), חובה לייצר בלוק עבור **כל** משרה בנפרד ולעטוף את אובייקט ה-JSON שלה בתגיות \`[COMPONENT]\` בתחילתו ו-\`[/COMPONENT]\` בסופו. השתדל להציג שורת פתיחה קצרה ואז מיד את המשרות.
                החזר את הבלוק הבא עבור **כל משרה שברצונך להציג** מתוך הרשימה שקיבלת (אם קיבלת 3 משרות, החזר 3 בלוקים כאלה), כאשר אתה מחליף את כל הערכים לדוגמה (title, company, location, etc.) בנתונים האמיתיים של המשרה:
                [COMPONENT]
                {"type":"component","name":"JobCard","props":{"id":"FILL_ID","title":"FILL_TITLE","company":"FILL_COMPANY","location":"FILL_LOCATION","salary":"FILL_SALARY","type":"FILL_TYPE"}}
                [/COMPONENT]
                `;
            }

            const systemPrompt = basePrompt + roleSpecificPrompt;

            const getUserDataDecl: FunctionDeclaration = {
                name: "getUserData",
                description: "מחזיר את פרטי המשתמש המחובר, התפקיד שלו והיסטוריית הפעולות.",
                parameters: { 
                    type: Type.OBJECT, 
                    properties: {
                        includeHistory: { type: Type.BOOLEAN, description: "האם לכלול היסטוריית פעולות" }
                    } 
                }
            };

            const getRecommendedJobsDecl: FunctionDeclaration = {
                name: "getRecommendedJobs",
                description: "מחפש ומחזיר אוסף משרות ממסד הנתונים בהתאם למילות מפתח רצויות.",
                parameters: { 
                    type: Type.OBJECT, 
                    properties: {
                        searchTerm: { type: Type.STRING, description: "מילת חיפוש ממוקדת ותמציתית (ללא מילות קישור, לדוגמה: 'גבס', 'תוכנה', 'מכירות')" },
                        location: { type: Type.STRING, description: "אזור או עיר (לדוגמה: תל אביב, ירושלים, מרכז)" }
                    } 
                }
            };

            const getEmployerStatsDecl: FunctionDeclaration = {
                name: "getEmployerStats",
                description: "מחזיר סיכום למעסיק: כמות משרות פעילות, כמות מועמדים חדשים וכללית.",
                parameters: { 
                    type: Type.OBJECT, 
                    properties: {
                        timeframe: { type: Type.STRING }
                    } 
                }
            };

            const fillJobFormDecl: FunctionDeclaration = {
                name: "fillJobForm",
                description: "ממלא עבור המעסיק שדות בעמוד פרסום משרה לאור התיאור שסיכמתם. הפסק פעולה זו במידה ולא נתבקשת במפורש או שאין הצעה ממשית.",
                parameters: { 
                    type: Type.OBJECT, 
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        category: { type: Type.STRING }
                    } 
                }
            };

            let tonePrompt = '';
            if (systemSettings?.aiTone === 'professional') tonePrompt = 'הקפד על סגנון דיבור רשמי ומקצועי.';
            else if (systemSettings?.aiTone === 'friendly') tonePrompt = 'הקפד על סגנון דיבור ידידותי, מזמין ובגובה העיניים.';
            else if (systemSettings?.aiTone === 'humorous') tonePrompt = 'הקפד על סגנון דיבור קליל והומוריסטי.';

            let activeTools = [getUserDataDecl];
            
            if (user?.role === UserRole.EMPLOYER) {
                activeTools.push(fillJobFormDecl);
                if (systemSettings?.aiEnableRAG !== false) {
                    activeTools.push(getEmployerStatsDecl);
                }
            } else {
                if (systemSettings?.aiEnableRAG !== false) {
                    activeTools.push(getRecommendedJobsDecl);
                }
            }
            
            const tools = [{ functionDeclarations: activeTools }];

            // Convert previous messages to correct History format for @google/genai
            let history = messages
                .filter((m, i) => i !== 0 && m.text && !m.text.includes('מצטער, אני חווה קשיים טכניים'))
                .map(m => ({
                    role: m.role === 'model' ? 'model' : 'user',
                    parts: [{ text: m.text }]
                }));
            
            const windowSize = systemSettings?.aiHistoryWindow || 10;
            if (history.length > windowSize) {
                history = history.slice(history.length - windowSize);
            }

            let contents = [
                ...history,
                { role: "user", parts: [{ text: userMessage }] }
            ];

            const extraPrompt = (systemSettings?.aiAdditionalPrompt ? `\n\nהנחיות נוספות מנהל המערכת:\n${systemSettings.aiAdditionalPrompt}` : '') + `\n${tonePrompt}`;
            const config = {
                systemInstruction: systemPrompt + extraPrompt,
                tools: tools,
                temperature: systemSettings?.aiTemperature ?? 0.7
            };
            const validModels = ['gemini-3-flash-preview', 'gemini-3.1-pro-preview'];
            const modelName = systemSettings?.aiModel && validModels.includes(systemSettings.aiModel) ? systemSettings.aiModel : 'gemini-3-flash-preview';

            const getGeminiResponse = async (reqContents: any[]) => {
                let token = '';
                if (auth.currentUser) {
                     token = await auth.currentUser.getIdToken();
                }

                const res = await fetch('/api/gemini/generate', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ contents: reqContents, config, model: modelName })
                });
                
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to contact AI Assistant");
                }
                const data = await res.json();
                
                // Track usage
                if (data.usageMetadata) {
                    try {
                        const totalTokens = data.usageMetadata.totalTokenCount || 0;
                        if (totalTokens > 0) {
                            const today = new Date().toISOString().split('T')[0];
                            const statsRef = doc(db, 'ai_stats', today);
                            setDoc(statsRef, {
                                date: today,
                                tokens: increment(totalTokens),
                                queries: increment(1)
                            }, { merge: true }).catch(err => console.error("Failed to track AI usage", err));
                        }
                    } catch (e) {
                         console.error("Error setting AI usage", e);
                    }
                }
                return data;
            };

            let responseData = await getGeminiResponse(contents);
            let functionCalls = responseData.functionCalls;

            if (functionCalls && functionCalls.length > 0) {
                const functionResponses: any[] = [];
                const modelParts: any[] = [];

                for (const call of functionCalls) {
                    modelParts.push({ functionCall: { id: call.id, name: call.name, args: call.args } });
                    let functionResult: any = {};
                    
                    try {
                        if (call.name === "getUserData") {
                            if (!user) {
                                functionResult = { error: "המשתמש אינו מחובר" };
                            } else {
                                if (user.role === UserRole.SEEKER) {
                                    const appsSnap = await getDocs(query(collection(db, 'applications'), where('seekerId', '==', user.uid)));
                                    const applications = appsSnap.docs.map(d => d.data());
                                    functionResult = {
                                        name: user.displayName,
                                        role: user.role,
                                        preferredCategories: user.preferredCategories || [],
                                        savedJobsCount: user.savedJobs?.length || 0,
                                        applicationsCount: applications.length,
                                        applicationsStatusSummary: applications.map((a: any) => `${a.jobId}: ${a.status}`)
                                    };
                                } else if (user.role === UserRole.EMPLOYER) {
                                    functionResult = {
                                        name: user.displayName,
                                        role: user.role,
                                        credits: user.credits || 0,
                                        remainingJobs: Math.floor((user.credits || 0) / 5)
                                    };
                                }
                            }
                        } else if (call.name === "getRecommendedJobs") {
                            const args = call.args as { searchTerm?: string, location?: string } | undefined;
                            
                            // Query by status first
                            const jobsSnap = await getDocs(query(collection(db, 'jobs'), where('status', 'in', ['active', 'Published', 'approved'])));
                            
                            let jobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Job));
                            
                            // Fuzzy filtering to increase chances of finding jobs
                            if (args?.searchTerm) {
                                const searchWords = args.searchTerm.toLowerCase().trim().split(/\s+/).filter(w => w.length > 1);
                                if (searchWords.length > 0) {
                                    jobs = jobs.filter(j => {
                                        const textToSearch = `${j.category || ''} ${j.title || ''} ${j.description || ''} ${j.companyName || ''}`.toLowerCase();
                                        // Match if any of the search words is found in the text
                                        return searchWords.some(word => textToSearch.includes(word));
                                    });
                                }
                            }
                            if (args?.location) {
                                const locTerm = args.location.toLowerCase().trim();
                                jobs = jobs.filter(j => j.location && j.location.toLowerCase().includes(locTerm));
                            }
                            
                            functionResult = {
                                recommendedJobs: jobs.slice(0, 10).map(j => ({ 
                                    id: j.id, 
                                    title: j.title, 
                                    company: j.companyName, 
                                    location: j.location,
                                    salary: j.salary,
                                    type: j.type,
                                    description: j.description || '',
                                    category: j.category || ''
                                }))
                            };
                        } else if (call.name === "getEmployerStats") {
                            if (!user || user.role !== UserRole.EMPLOYER) {
                                functionResult = { error: "רק מעסיק יכול לראות סטטיסטיקות" };
                            } else {
                                const myJobsSnap = await getDocs(query(collection(db, 'jobs'), where('employerId', '==', user.uid)));
                                const myJobIds = myJobsSnap.docs.map(d => d.id);
                                const appsSnap = await getDocs(query(collection(db, 'applications'), where('employerId', '==', user.uid)));
                                const myApplicants = appsSnap.docs.map(a => a.data());
                                const newApplicants = myApplicants.filter((a: any) => a.status === 'New').length;
                                
                                functionResult = {
                                    activeJobsCount: myJobIds.length,
                                    totalApplicants: myApplicants.length,
                                    newApplicantsToday: newApplicants,
                                };
                            }
                        } else if (call.name === "fillJobForm") {
                            // Emit event to be caught by JobPost
                            const event = new CustomEvent('fill-job-form', { detail: call.args });
                            window.dispatchEvent(event);
                            functionResult = { success: "השדות מולאו בהצלחה בטופס." };
                        }
                    } catch (e: any) {
                        console.error("Function tool error:", e);
                        functionResult = { error: `שגיאה בשליפת המידע: ${e.message}` };
                    }

                    functionResponses.push({
                        functionResponse: {
                            id: call.id || call.name, // Fallback if GenAI id is missing
                            name: call.name,
                            response: functionResult
                        }
                    });
                }

                // Append model's functional call and our answers
                contents.push({ role: "model", parts: modelParts });
                contents.push({ role: "user", parts: functionResponses });

                // Send the results back
                responseData = await getGeminiResponse(contents);
            }

            let rawText = responseData.text || '';
            if (!rawText) {
                 rawText = 'אה, זה מעניין. משהו קטן השתבש, לחץ כאן או שנה ניסוח ואבדוק שוב.';
            }
            // Clean up any leaked default_api or chinese characters that gemini sometimes hallucinates
            rawText = rawText.replace(/高度回.*getRecommendedJobs.*/g, '');
            rawText = rawText.replace(/\{?\}?:?default_api:[a-zA-Z]+/g, '');

            setMessages(prev => [...prev, { role: 'model', text: rawText.trim() || 'אוקיי, הנה מה שמצאתי עבורך.' }]);
        } catch (error: any) {
            console.error("AI Error:", error);
            const errMsg = error?.message || 'מצטער, אני חווה קשיים טכניים כרגע.';
            setMessages(prev => [...prev, { role: 'model', text: errMsg }]);
        } finally {
            setLoading(false);
        }
    };

    const suggestions = user?.role === UserRole.EMPLOYER ? employerSuggestions : seekerSuggestions;

    const renderMessageContent = (text: string) => {
        const cleanText = text.replace(/\[HAS_FILLABLE_DATA\]/g, '').trim();
        const componentRegex = /\[COMPONENT\]([\s\S]*?)\[\/COMPONENT\]/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = componentRegex.exec(cleanText)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: cleanText.slice(lastIndex, match.index) });
            }
            try {
                // In case the AI still wraps the JSON in markdown blocks inside the tag
                let jsonStr = match[1].trim();
                jsonStr = jsonStr.replace(/^```(json)?/, '').replace(/```$/, '').trim();
                
                const data = JSON.parse(jsonStr);
                if (data.type === 'component' && data.name === 'JobCard') {
                    parts.push({ type: 'component', componentName: 'JobCard', data: data.props });
                } else if (data.type === 'component' && data.name === 'CreditCard') {
                    parts.push({ type: 'component', componentName: 'CreditCard', data: data.props });
                } else if (data.type === 'component' && data.name === 'EmployerStats') {
                    parts.push({ type: 'component', componentName: 'EmployerStats', data: data.props });
                } else {
                    parts.push({ type: 'text', content: match[0] });
                }
            } catch (e) {
                parts.push({ type: 'text', content: match[0] });
            }
            lastIndex = componentRegex.lastIndex;
        }

        if (lastIndex < cleanText.length) {
            parts.push({ type: 'text', content: cleanText.slice(lastIndex) });
        }

        if (parts.length === 0 || (parts.length === 1 && parts[0].type === 'text')) {
             return (
                <div className="markdown-body text-sm font-medium">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanText}</ReactMarkdown>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-3 w-full">
                {parts.map((p, i) => {
                    if (p.type === 'text') {
                        const content = p.content.trim();
                        if (!content) return null;
                        return (
                            <div key={i} className="markdown-body text-sm font-medium">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                            </div>
                        );
                    }
                    if (p.type === 'component') {
                        if (p.componentName === 'JobCard') {
                            return (
                                <div key={i} className="bg-white border text-right border-brand-teal/30 p-4 rounded-2xl shadow-sm mt-1 mb-2 w-full min-w-[220px]">
                                    <h4 className="font-black text-slate-800 text-base leading-tight mb-2">{p.data.title}</h4>
                                    <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px] text-slate-600 font-bold">
                                        <span className="bg-slate-100 px-2 py-1 rounded-md">{p.data.company}</span>
                                        {p.data.location && <span className="bg-slate-100 px-2 py-1 rounded-md">{p.data.location}</span>}
                                    </div>
                                    {(p.data.salary || p.data.type) && (
                                        <div className="flex items-center gap-3 mb-4 text-[11px] text-slate-500 font-bold border-t border-slate-100 pt-3">
                                            {p.data.salary && <span className="flex items-center gap-1">💰 {p.data.salary}</span>}
                                            {p.data.type && <span className="flex items-center gap-1">💼 {p.data.type}</span>}
                                        </div>
                                    )}
                                    <Link onClick={() => setIsOpen(false)} to={`/job/${p.data.id}`} className="text-xs bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold block hover:bg-brand-teal active:scale-95 transition-all w-full text-center shadow-md">לפרטי המשרה</Link>
                                </div>
                            );
                        } else if (p.componentName === 'CreditCard') {
                            return (
                                <div key={i} className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-5 rounded-2xl shadow-md mt-1 mb-2 w-full min-w-[220px] text-right">
                                    <div className="flex items-center gap-2 mb-2 justify-start">
                                        <h4 className="font-black text-lg">יתרת קרדיטים</h4>
                                    </div>
                                    <div className="text-3xl font-black mb-1">{p.data.balance || 0}</div>
                                    <div className="text-indigo-100 text-xs font-medium mb-4">קרדיטים זמינים לשימוש</div>
                                    
                                    <div className="bg-white/10 rounded-xl p-3 border border-white/20">
                                        <p className="text-sm font-bold">מספיק לפרסום של:</p>
                                        <p className="text-xl font-black">{p.data.remainingJobs || 0} משרות</p>
                                    </div>
                                    <Link onClick={() => setIsOpen(false)} to={`/employer/dashboard`} className="mt-4 text-xs bg-white text-indigo-700 px-4 py-2.5 rounded-xl font-bold block hover:bg-indigo-50 active:scale-95 transition-all w-full text-center shadow-md">לפאנל ניהול משרות</Link>
                                </div>
                            );
                        } else if (p.componentName === 'EmployerStats') {
                            return (
                                <div key={i} className="bg-white border border-brand-teal/30 p-5 rounded-2xl shadow-sm mt-1 mb-2 w-full min-w-[220px] text-right">
                                    <h4 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
                                        <Sparkles size={16} className="text-brand-teal" />
                                        ביצועי המשרות שלך
                                    </h4>
                                    
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[10px] text-slate-500 font-bold mb-1">פעילות</p>
                                            <p className="text-lg font-black text-brand-teal">{p.data.activeJobsCount} משרות</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[10px] text-slate-500 font-bold mb-1">מועמדים חדשים (היום)</p>
                                            <p className="text-lg font-black text-indigo-600">{p.data.newApplicantsToday}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-900 rounded-xl p-3 mb-4 text-white">
                                        <p className="text-[10px] text-slate-400 font-bold mb-1">סה"כ מועמדים (כל הזמן)</p>
                                        <p className="text-xl font-black">{p.data.totalApplicants}</p>
                                    </div>
                                    
                                    <Link onClick={() => setIsOpen(false)} to={`/employer/dashboard`} className="text-xs bg-brand-teal text-white px-4 py-2.5 rounded-xl font-bold block hover:bg-teal-500 active:scale-95 transition-all w-full text-center shadow-md">צפה בכל הנתונים</Link>
                                </div>
                            );
                        }
                    }
                    return null;
                })}
            </div>
        );
    };

    if (systemSettings && systemSettings.enableAIAssistant === false) {
        return null;
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                aria-label="פתח עוזר חכם"
                className="fixed bottom-6 left-6 z-50 bg-brand-teal text-white p-3 md:p-4 rounded-full shadow-xl hover:scale-105 transition-transform active:scale-95 flex items-center justify-center border-2 border-white/20 hover:bg-teal-500"
                id="ai-toggle-btn"
            >
                <Sparkles size={24} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95, x: 20 }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95, x: 20 }}
                        className="fixed bottom-24 left-6 z-50 w-[90vw] md:w-96 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden h-[600px] max-h-[80vh]"
                        id="ai-chat-window"
                    >
                        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-teal/20 rounded-xl">
                                    <Bot size={22} className="text-brand-teal" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black leading-none">עוזר חכם AI</span>
                                    <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Online & Ready</span>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} aria-label="סגור צ'אט" className="hover:bg-white/10 p-2 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-5 space-y-5 bg-slate-50/50 scroll-smooth" ref={scrollRef}>
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`p-2 rounded-xl h-fit shadow-sm ${msg.role === 'user' ? 'bg-slate-200' : 'bg-brand-teal/10'}`}>
                                            {msg.role === 'user' ? <UserIcon size={16} className="text-slate-600" /> : <Sparkles size={16} className="text-brand-teal" />}
                                        </div>
                                        <div className={`p-4 rounded-2xl text-sm font-bold leading-relaxed ${
                                            msg.role === 'user' 
                                                ? 'bg-slate-900 text-white rounded-tr-none shadow-lg' 
                                                : 'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-tl-none -mr-1'
                                        }`}>
                                            {renderMessageContent(msg.text)}
                                            {isJobPostPage && msg.role === 'model' && i > 0 && i === messages.length - 1 && !loading && msg.text.includes('[HAS_FILLABLE_DATA]') && (
                                                <button 
                                                    onClick={() => handleSend("מעולה, אכלס את השדות לאור מה שדיברנו הרגע")}
                                                    className="mt-3 bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal px-3 py-1.5 rounded-lg text-xs font-bold transition-colors w-full text-center flex items-center justify-center gap-2"
                                                >
                                                    <Sparkles size={14} />
                                                    אכלס את השדות בטופס
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-brand-teal rounded-full" />
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-brand-teal rounded-full" />
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-brand-teal rounded-full" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {messages.length === 1 && user && (
                            <div className="px-5 pb-4 bg-slate-50/50">
                                <p className="text-[10px] font-black text-slate-400 mb-3 pr-1 uppercase tracking-widest text-right">הצעות להתחלה</p>
                                <div className="flex flex-wrap gap-2 justify-end">
                                    {suggestions.map((suggestion, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSend(suggestion)}
                                            className="px-4 py-2 bg-white border border-slate-100 rounded-full text-xs font-black text-slate-600 hover:border-brand-teal hover:text-brand-teal transition-all shadow-sm active:scale-95"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="p-5 border-t border-slate-100 bg-white">
                            {!user ? (
                                <Link onClick={() => setIsOpen(false)} to="/login" className="bg-brand-teal text-white w-full h-12 rounded-2xl flex items-center justify-center font-bold gap-2 hover:bg-brand-teal/90 transition-all shadow-lg active:scale-95">
                                    <LogIn size={20} />
                                    התחברות למערכת
                                </Link>
                            ) : (
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="מה תרצה לדעת?"
                                        aria-label="הקלד הודעה לעוזר החכם"
                                        className="flex-grow text-sm border-none bg-slate-50 rounded-2xl focus:ring-4 focus:ring-brand-teal/10 px-5 font-bold text-slate-700 shadow-inner h-12"
                                    />
                                    <button
                                        onClick={() => handleSend()}
                                        disabled={loading || !input.trim()}
                                        aria-label="שלח הודעה"
                                        className="bg-brand-teal text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-brand-teal/90 disabled:opacity-50 transition-all shadow-lg shadow-teal-500/20 active:scale-90"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
