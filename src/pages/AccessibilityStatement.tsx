import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Accessibility, Mail, Phone, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AccessibilityStatement: React.FC = () => {
    return (
        <div className="min-h-screen bg-bg-light" dir="rtl">
            <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <div className="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shrink-0">
                            <Accessibility size={32} />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-text-main tracking-tight">
                            הצהרת נגישות
                        </h1>
                    </div>

                    <div className="prose prose-lg prose-slate text-text-main font-medium max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-black text-slate-800 mb-4">מחויבות לנגישות</h2>
                            <p>
                                אתר "עובדים בצ'יק" רואה חשיבות רבה במתן שירות שוויוני, מכבד, נגיש וללא אפליה לכלל הציבור, ובפרט לאנשים עם מוגבלות. הושקעו משאבים רבים בהנגשת האתר ובהתאמתו, על מנת לאפשר חוויית שימוש נגישה, נוחה ושוויונית לכל המשתמשים.
                            </p>
                            <p className="mt-4">
                                בהתאם לנתוני עמותת "נגישות ישראל", כ־20%–25% מהאוכלוסייה נתקלים בקשיי נגישות באינטרנט. אנו פועלים מתוך שליחות לצמצום פערים אלו ולהתאמת השירותים הדיגיטליים שלנו לכולם.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-slate-800 mb-4">מה בוצע באתר לשם הנגשה?</h2>
                            <p className="mb-4">התאמות הנגישות באתר בוצעו בהתאם לחוק וכוללות, בין היתר:</p>
                            <ul className="list-disc pr-6 space-y-2">
                                <li><strong>מבנה ותוכן:</strong> מבנה תוכן סמנטי ושימוש בכותרות היררכיות ברורות (H1 עד H6).</li>
                                <li><strong>רכיבים חזותיים:</strong> הטמעת טקסט חלופי (Alt Text) לתמונות ותיאורי קישורים ברורים.</li>
                                <li><strong>ניווט מקלדת:</strong> תמיכה מלאה בניווט באמצעות המקלדת בלבד (שימוש במקשים Tab, Shift+Tab, ו-Enter).</li>
                                <li><strong>צבעוניות:</strong> ניגודיות צבעים ברורה התואמת לדרישות התקן, המקילה על קריאה וצפייה.</li>
                                <li><strong>תצוגה והגדלה:</strong> תמיכה בהגדלת גופן וטקסט עד 200% באמצעות הגדרות הדפדפן, ללא שבירת פריסת האתר (Layout).</li>
                                <li><strong>טכנולוגיות מסייעות:</strong> תאימות לקוראי מסך נפוצים (כגון NVDA ו-JAWS) ולמכשירים ניידים (טאבלטים וסמארטפונים).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-slate-800 mb-4">רמת נגישות ותקינה</h2>
                            <p>
                                האתר עומד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשנ"ג-2013. התאמות הנגישות בוצעו בהתאם להנחיות התקן הישראלי (ת"י 5568) לנגישות תכנים באינטרנט ברמת AA, ובהלימה למסמך WCAG 2.0 הבינלאומי.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-slate-800 mb-4">מגבלות נגישות ידועות</h2>
                            <p>
                                אנו פועלים באופן שוטף להנגשת כלל הדפים והתכנים באתר. עם זאת, ייתכן כי חלק מהתכנים (כגון תכנים היסטוריים, קובצי מסמכים ישנים או רכיבים/תכנים המוטמעים מאתרים וצדדים שלישיים) טרם הונגשו במלואם.
                            </p>
                            <p className="mt-4">
                                אם נתקלתם ברכיב אינו נגיש או בתקלה, נשמח אם תפנו אלינו כדי שנוכל לתקן ולשפר את הטעון שיפור בהקדם.
                            </p>
                        </section>

                        <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h2 className="text-xl font-black text-slate-800 mb-4">פרטי התקשרות ופניות בנושא נגישות</h2>
                            <p className="mb-6">
                                אם במהלך הגלישה באתר נתקלתם בקושי, או אם יש לכם הצעה לשיפור, נשמח מאוד לעמוד לרשותכם ולסייע.
                            </p>
                            
                            <div className="space-y-4 font-bold text-slate-700">
                                <div className="flex items-center gap-3">
                                    <Mail className="text-primary shrink-0" size={20} />
                                    <span>דוא"ל: <a href="mailto:Ovdimbechik@gmail.com" className="hover:text-primary transition-colors">Ovdimbechik@gmail.com</a></span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="text-primary shrink-0" size={20} />
                                    <span dir="ltr">טלפון: 055-6867356</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ExternalLink className="text-primary shrink-0" size={20} />
                                    <span>פנייה מקוונת: <Link to="/contact" className="text-primary hover:underline">טופס יצירת קשר</Link></span>
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-200">
                                    <p>אחראי פניות נגישות בעסק: אליאב יעקובוב</p>
                                </div>
                            </div>
                        </section>

                        <p className="text-sm font-bold text-slate-400 mt-12 text-center">
                            תאריך עדכון אחרון של ההצהרה: 18.08.2025
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
