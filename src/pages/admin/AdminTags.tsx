import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Save, Tag as TagIcon, X, Plus, FolderTree, MapPin, Briefcase, Users, Lock, AlertTriangle, Cog, Edit2, CheckCircle2, Trash2 } from 'lucide-react';
import { doc, getDoc, setDoc, collection, getDocs, query, updateDoc } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { db, auth } from '../../lib/firebase';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';
import { Job, User } from '../../types';
import { predefinedTagsByCategory } from '../../lib/predefinedTags';

export const AdminTags: React.FC = () => {
    const { toast } = useToast();
    const [categories, setCategories] = useState<string[]>([]);
    const [tagsByCategory, setTagsByCategory] = useState<Record<string, string[]>>({});
    const [locations, setLocations] = useState<string[]>([]);
    
    // For legacy support / fallback
    const [legacyJobTags, setLegacyJobTags] = useState<string[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'categories' | 'tags' | 'pending-tags' | 'locations' | 'settings'>('categories');

    // Stats and Data for Modals
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [jobsMap, setJobsMap] = useState<{ categories: Record<string, number>, tags: Record<string, number>, locations: Record<string, number> }>({ categories: {}, tags: {}, locations: {} });
    const [usersMap, setUsersMap] = useState<{ categories: Record<string, number>, tags: Record<string, number>, locations: Record<string, number> }>({ categories: {}, tags: {}, locations: {} });

    // Modals state
    const [viewCategoryModal, setViewCategoryModal] = useState<string | null>(null);
    const [viewTagModal, setViewTagModal] = useState<string | null>(null);
    const [viewLocationModal, setViewLocationModal] = useState<string | null>(null);

    const [passwordModal, setPasswordModal] = useState<{ isOpen: boolean, action: (() => void) | null, error: string, input: string, title: string, description: string }>({
        isOpen: false,
        action: null,
        error: '',
        input: '',
        title: '',
        description: ''
    });

    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, text: string, action: (() => void) | null }>({
        isOpen: false,
        text: '',
        action: null
    });

    const requestPasswordAction = (title: string, description: string, action: () => void) => {
        setPasswordModal({ isOpen: true, action, error: '', input: '', title, description });
    };

    const confirmPasswordAction = async () => {
        const user = auth.currentUser;
        if (!user || (!user.email && !user.providerData[0]?.email)) {
             setPasswordModal(prev => ({ ...prev, error: 'לא נמצא משתמש מחובר לדרישת סיסמה.' }));
             return;
        }
        
        try {
            const email = user.email || user.providerData[0]?.email || '';
            const credential = EmailAuthProvider.credential(email, passwordModal.input);
            await reauthenticateWithCredential(user, credential);
            
            if (passwordModal.action) {
                passwordModal.action();
            }
            setPasswordModal(prev => ({ ...prev, isOpen: false, action: null, error: '', input: '' }));
        } catch (error: any) {
            console.error("Reauthentication err:", error);
            setPasswordModal(prev => ({ ...prev, error: 'סיסמה שגויה.' }));
        }
    };

    const requestConfirmAction = (text: string, action: () => void) => {
        setConfirmModal({ isOpen: true, text, action });
    };

    const confirmConfirmAction = () => {
        if (confirmModal.action) {
            confirmModal.action();
        }
        setConfirmModal({ isOpen: false, text: '', action: null });
    };

    const [newCategory, setNewCategory] = useState('');
    const [newTag, setNewTag] = useState('');
    const [newLocation, setNewLocation] = useState('');
    const [selectedCategoryForTag, setSelectedCategoryForTag] = useState('');
    
    // Search states for tags
    const [searchTag, setSearchTag] = useState('');
    const [minJobsFilter, setMinJobsFilter] = useState('');

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const docRef = doc(db, 'settings', 'tags');
                const docSnap = await getDoc(docRef);
                const data = docSnap.exists() ? docSnap.data() : { jobTags: [] };
                
                let loadedCategories: string[] = data.categories || [];
                let loadedTagsByCategory: Record<string, string[]> = data.tagsByCategory || {};
                let loadedLocations: string[] = data.locations || [];
                
                // Fallback / Initial seed if absolutely empty or missing categories
                if (loadedCategories.length === 0) {
                    const defaultMapping: Record<string, string[]> = {
                        "טכנולוגיה ופיתוח": [
                            "הייטק ופיתוח תוכנה", "בדיקות תוכנה (QA)", "אבטחת מידע וסייבר", 
                            "DevOps", "תמיכה טכנית (Help Desk)", "ניהול מוצר (Product)", 
                            "מפתח אתרים", "מפתח פול סטאק", "מנהל רשתות", "חומרת מחשבים"
                        ],
                        "מכירות, שירות וקמעונאות": [
                            "מכירות וניהול תיקי לקוחות", "שירות לקוחות", "קמעונאות ורשתות",
                            "ניהול סניף", "קופאי/ת", "נציג/ת טלמרקטינג"
                        ],
                        "כספים, אדמיניסטרציה ותפעול": [
                            "כספים וכלכלה", "אדמיניסטרציה ומזכירות", "משאבי אנוש (HR)", 
                            "לוגיסטיקה ותפעול", "ניהול פרויקטים", "הנהלת חשבונות", "רכש"
                        ],
                        "עיצוב, שיווק ודיגיטל": [
                            "שיווק ודיגיטל", "עיצוב ואנימציה", "מעצב אתרים", 
                            "מנהל סושיאל (PPC/SEO)", "קופירייטינג", "עיצוב גרפי"
                        ],
                        "מקצועות הבריאות": [
                            "מקצועות הבריאות והסיעוד", "רפואה", "סיעוד ואחיות", "רוקחות"
                        ],
                        "שיפוצים וכפיים": [
                            "שיפוצים", "הנדי מן", "בניית גבס", "חשמלאי", "אינסטלטור",
                            "צבעי", "קבלן", "מסגרות", "נגרות"
                        ],
                        "מסעדנות, אירועים ותיירות": [
                            "מסעדנות", "שף", "ברמן", "מלצרות", "טבח", 
                            "מנהל מסעדה", "מארח/ת", "תיירות ומלונאות"
                        ],
                        "הוראה, משפטים ואחר": [
                            "הוראה והדרכה", "רכב ותחבורה", "עריכת דין ומשפטים",
                            "אבטחה ושמירה", "ניקיון ומשק בית", "עבודה סוציאלית"
                        ]
                    };

                    loadedCategories = Object.keys(defaultMapping);
                    loadedTagsByCategory = defaultMapping;

                    // Automatically save the seeded data so it propagates to clients
                    await setDoc(docRef, {
                        categories: loadedCategories,
                        tagsByCategory: loadedTagsByCategory,
                        locations: loadedLocations,
                        jobTags: Array.from(new Set([
                            ...loadedCategories, 
                            ...Object.values(loadedTagsByCategory).flat(),
                            ...(data.jobTags || [])
                        ]))
                    }, { merge: true });
                }
                
                setCategories(loadedCategories);
                setTagsByCategory(loadedTagsByCategory);
                setLocations(loadedLocations);
                setLegacyJobTags(data.jobTags || []);

                // Load Jobs and Users for stats
                const jobsSnap = await getDocs(query(collection(db, 'jobs')));
                const jCats: Record<string, number> = {};
                const jTags: Record<string, number> = {};
                const jLocs: Record<string, number> = {};
                const fetchedJobs: Job[] = [];
                jobsSnap.forEach(snap => {
                    const j = { ...snap.data(), id: snap.id } as Job;
                    fetchedJobs.push(j);
                    let jobMappedToCategories = new Set<string>();
                    
                    if (j.category) {
                        jobMappedToCategories.add(j.category);
                        jCats[j.category] = (jCats[j.category] || 0) + 1;

                        Object.entries(loadedTagsByCategory).forEach(([catName, tags]) => {
                            // If job's category is one of the tags in this category
                            if (tags.includes(j.category as string) && j.category !== catName) {
                                if (!jobMappedToCategories.has(catName)) {
                                    jobMappedToCategories.add(catName);
                                    jCats[catName] = (jCats[catName] || 0) + 1;
                                }
                            }
                        });
                    }
                    
                    if (j.location) jLocs[j.location] = (jLocs[j.location] || 0) + 1;
                    
                    (j.tags || []).forEach(t => { 
                        jTags[t] = (jTags[t] || 0) + 1; 
                        
                        // Map job to category if its tag is in a category
                        Object.entries(loadedTagsByCategory).forEach(([catName, tags]) => {
                            if (tags.includes(t)) {
                                if (!jobMappedToCategories.has(catName)) {
                                    jobMappedToCategories.add(catName);
                                    jCats[catName] = (jCats[catName] || 0) + 1;
                                }
                            }
                        });
                    });
                });
                setAllJobs(fetchedJobs);
                setJobsMap({ categories: jCats, tags: jTags, locations: jLocs });

                if (loadedLocations.length === 0) {
                    const extractedLocs = Object.keys(jLocs).filter(Boolean);
                    if (extractedLocs.length > 0) {
                        setLocations(extractedLocs);
                        await setDoc(docRef, { locations: extractedLocs }, { merge: true });
                    }
                }

                const usersSnap = await getDocs(query(collection(db, 'users')));
                const uCats: Record<string, number> = {};
                const uTags: Record<string, number> = {};
                const uLocs: Record<string, number> = {};
                const fetchedUsers: User[] = [];
                usersSnap.forEach(snap => {
                    const u = { ...snap.data(), uid: snap.id } as User;
                    fetchedUsers.push(u);
                    (u.preferredLocations || []).forEach(l => { uLocs[l] = (uLocs[l] || 0) + 1; });
                    // users generally don't have tags saved, mostly categories and locations
                    
                    let userMappedToCategories = new Set<string>();
                    
                    (u.preferredCategories || []).forEach(c => { 
                        if (!userMappedToCategories.has(c)) {
                            userMappedToCategories.add(c);
                            uCats[c] = (uCats[c] || 0) + 1; 
                        }
                        
                        // Legacy matching: if their "category" is actually a tag
                        Object.entries(loadedTagsByCategory).forEach(([catName, tags]) => {
                            if (tags.includes(c) && c !== catName) {
                                if (!userMappedToCategories.has(catName)) {
                                    userMappedToCategories.add(catName);
                                    uCats[catName] = (uCats[catName] || 0) + 1;
                                }
                            }
                        });
                    });
                });
                setAllUsers(fetchedUsers);
                setUsersMap({ categories: uCats, tags: uTags, locations: uLocs });

            } catch (error) {
                console.error("Error fetching tags:", error);
                toast('שגיאה בטעינת תגיות', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchTags();
    }, [toast]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Also maintain legacy jobTags to avoid breaking other parts immediately
            const allTags = new Set([...categories, ...legacyJobTags]);
            Object.values(tagsByCategory).forEach(arr => arr.forEach(t => allTags.add(t)));
            
            await setDoc(doc(db, 'settings', 'tags'), { 
                categories,
                tagsByCategory,
                locations,
                jobTags: Array.from(allTags)
            }, { merge: true });
            
            toast('נשמר בהצלחה', 'success');
        } catch (error) {
            console.error("Error saving tags:", error);
            toast('שגיאה בשמירה', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSyncAndCleanup = async () => {
        
        setSaving(true);
        try {
            const jobsSnap = await getDocs(query(collection(db, 'jobs')));
            const usersSnap = await getDocs(query(collection(db, 'users')));
            
            const fetchedJobs = jobsSnap.docs.map(d => ({ ...d.data(), id: d.id }) as Job);
            const fetchedUsers = usersSnap.docs.map(d => d.data() as User);
            
            // Build reverse mapping mapping tag -> categories[]
            const tagToCats: Record<string, string[]> = {};
            Object.entries(tagsByCategory).forEach(([cat, tags]) => {
                tags.forEach(t => { 
                    if (!tagToCats[t]) tagToCats[t] = [];
                    tagToCats[t].push(cat); 
                });
            });

            // Keyword heuristics mapping (English/Hebrew to Hebrew Categorization)
            const heuristics: Record<string, { cat: string, tags: string[] }> = {
                'design': { cat: 'עיצוב, שיווק ודיגיטל', tags: ['עיצוב אתרים ואפליקציות'] },
                'ux/ui': { cat: 'עיצוב, שיווק ודיגיטל', tags: ['UX/UI Designer'] },
                'designer': { cat: 'עיצוב, שיווק ודיגיטל', tags: ['מעצב / ביצועיסט פרינט'] },
                'marketing': { cat: 'עיצוב, שיווק ודיגיטל', tags: ['ניהול מדיה וקמפיינר'] },
                'sales': { cat: 'מכירות, שירות וקמעונאות', tags: ['נציג מכירות'] },
                'developer': { cat: 'טכנולוגיה ופיתוח', tags: ['הייטק ופיתוח תוכנה'] },
                'full stack': { cat: 'טכנולוגיה ופיתוח', tags: ['מפתח פול סטאק'] },
                'frontend': { cat: 'טכנולוגיה ופיתוח', tags: ['מפתח אתרים'] },
                'backend': { cat: 'טכנולוגיה ופיתוח', tags: ['מפתח אתרים'] },
                'qa': { cat: 'טכנולוגיה ופיתוח', tags: ['בדיקות תוכנה (QA)'] },
                'automation': { cat: 'טכנולוגיה ופיתוח', tags: ['בדיקות תוכנה (QA)'] },
                'product': { cat: 'טכנולוגיה ופיתוח', tags: ['ניהול מוצר (Product)'] },
                'finance': { cat: 'כספים, אדמיניסטרציה ותפעול', tags: ['חשב ושכר'] },
                'accountant': { cat: 'כספים, אדמיניסטרציה ותפעול', tags: ['הנהלת חשבונות'] },
                'admin': { cat: 'כספים, אדמיניסטרציה ותפעול', tags: ['ניהול משרד / מזכירות'] },
            };

            let updatedJobsCount = 0;
            const usedCategories = new Set<string>();
            const usedTags = new Set<string>();
            const usedLocations = new Set<string>();

            // Process & fix all jobs
            for (const job of fetchedJobs) {
                let currentCat = job.category || "";
                let currentTags = [...(job.tags || [])];
                let currentLoc = job.location || "";
                let needsUpdate = false;

                // 0. Aggressive Heuristic mapping based on generic categories or title
                const titleLower = job.title.toLowerCase();
                const catLower = currentCat.toLowerCase();
                if (!tagsByCategory[currentCat] && !tagToCats[currentCat]) { // not recognized
                    for (const [key, matchData] of Object.entries(heuristics)) {
                        if (titleLower.includes(key) || catLower.includes(key)) {
                            currentCat = matchData.cat;
                            matchData.tags.forEach(t => {
                                if (!currentTags.includes(t)) currentTags.push(t);
                            });
                            needsUpdate = true;
                            break;
                        }
                    }
                }

                // 1. Is the current category actually a Tag?
                if (currentCat && tagToCats[currentCat] && tagToCats[currentCat].length > 0) {
                    const actualTag = currentCat;
                    const possibleCats = tagToCats[actualTag];
                    // Pick the first mapped category
                    currentCat = possibleCats[0];
                    if (!currentTags.includes(actualTag)) {
                        currentTags.push(actualTag);
                    }
                    needsUpdate = true;
                }
                
                // 2. Are there tags that map back to a category, and the job lacks a category?
                if (!currentCat && currentTags.length > 0) {
                    for (const t of currentTags) {
                        if (tagToCats[t] && tagToCats[t].length > 0) {
                            currentCat = tagToCats[t][0];
                            needsUpdate = true;
                            break;
                        }
                    }
                }
                
                // fallback to general
                if (!currentCat && currentTags.length === 0) {
                    currentCat = "כללי";
                    needsUpdate = true;
                }

                // 3. Keep unique tags
                const uniqueTags = Array.from(new Set(currentTags));
                if (uniqueTags.length !== currentTags.length) {
                    currentTags = uniqueTags;
                    needsUpdate = true;
                }
                
                if (currentCat) usedCategories.add(currentCat);
                if (currentLoc) usedLocations.add(currentLoc);
                currentTags.forEach(t => usedTags.add(t));
                
                if (needsUpdate) {
                    await updateDoc(doc(db, 'jobs', job.id!), {
                        category: currentCat,
                        tags: currentTags
                    });
                    updatedJobsCount++;
                }
            }

            // Process users (just tracking what they use)
            fetchedUsers.forEach(u => {
                (u.preferredCategories || []).forEach(c => usedCategories.add(c));
                (u.preferredLocations || []).forEach(l => usedLocations.add(l));
                // Users usually don't have preferred tags saved yet
            });

            // Rebuild maps keeping only those in use
            const newCategories = categories.filter(c => usedCategories.has(c));
            const newTagsByCategory: Record<string, string[]> = {};
            
            let removedCatsCount = categories.length - newCategories.length;
            let removedTagsCount = 0;
            
            Object.entries(tagsByCategory).forEach(([cat, tags]) => {
                if (usedCategories.has(cat)) {
                    const filteredTags = tags.filter(t => usedTags.has(t));
                    removedTagsCount += (tags.length - filteredTags.length);
                    // allow empty categories if it's used directly
                    newTagsByCategory[cat] = filteredTags;
                } else if (!categories.includes(cat)) { // if it wasn't even in the main categories list but existed as a key
                     removedCatsCount++;
                }
            });
            
            const newLocations = locations.filter(l => usedLocations.has(l));

            // Ensure categories list and newTagsByCategory map keys are in sync
            const finalCategories = Array.from(new Set([...newCategories, ...Object.keys(newTagsByCategory)]));

            await setDoc(doc(db, 'settings', 'tags'), {
                categories: finalCategories,
                tagsByCategory: newTagsByCategory,
                locations: newLocations,
                jobTags: Array.from(usedTags)
            }, { merge: true });

            toast(`סנכרון הושלם! עודכנו ${updatedJobsCount} משרות. מנקה ושומר... נא להמתין.`, 'success');
            setTimeout(() => window.location.reload(), 2500);

        } catch (error) {
            console.error("Error during sync:", error);
            toast('שגיאה במהלך הסנכרון', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleAddCategory = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = newCategory.trim();
        if (!trimmed) return;
        
        if (categories.includes(trimmed)) {
            toast('קטגוריה כבר קיימת', 'info');
            return;
        }

        setCategories([...categories, trimmed].sort((a, b) => a.localeCompare(b, 'he')));
        setNewCategory('');
    };

    const handleRemoveCategory = (cat: string) => {
        if (tagsByCategory[cat] && tagsByCategory[cat].length > 0) {
            toast('לא ניתן למחוק קטגוריה שיש לה תגיות מקושרות.', 'error');
            return;
        }
        if ((jobsMap.categories[cat] || 0) > 0) {
            toast('לא ניתן למחוק קטגוריה שיש משרות שמקושרות אליה.', 'error');
            return;
        }
        requestPasswordAction('מחיקת קטגוריה', `האם אתה בטוח שברצונך למחוק את הקטגוריה "${cat}"?`, () => {
            setCategories(categories.filter(c => c !== cat));
            const newTagsByCat = { ...tagsByCategory };
            delete newTagsByCat[cat];
            setTagsByCategory(newTagsByCat);
        });
    };

    const handleAddTag = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = newTag.trim();
        if (!trimmed) return;
        if (!selectedCategoryForTag) {
            toast('יש לבחור קטגוריה קודם', 'info');
            return;
        }

        const existingTags = tagsByCategory[selectedCategoryForTag] || [];
        if (existingTags.includes(trimmed)) {
            toast('התגית כבר קיימת בקטגוריה זו', 'info');
            return;
        }

        const updatedTags = [...existingTags, trimmed].sort((a, b) => a.localeCompare(b, 'he'));
        setTagsByCategory({ ...tagsByCategory, [selectedCategoryForTag]: updatedTags });
        setNewTag('');
    };

    const handleRemoveTagFromCategory = (cat: string, tag: string) => {
        requestConfirmAction(`האם אתה בטוח שברצונך למחוק את התגית "${tag}" מהקטגוריה "${cat}"?`, () => {
            const updatedTags = (tagsByCategory[cat] || []).filter(t => t !== tag);
            setTagsByCategory({ ...tagsByCategory, [cat]: updatedTags });
        });
    };

    const handleAddLocation = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = newLocation.trim();
        if (!trimmed) return;
        
        if (locations.includes(trimmed)) {
            toast('מיקום כבר קיים', 'info');
            return;
        }

        setLocations([...locations, trimmed].sort((a, b) => a.localeCompare(b, 'he')));
        setNewLocation('');
    };

    const handleRemoveLocation = (loc: string) => {
        if ((jobsMap.locations[loc] || 0) > 0) {
            toast('לא ניתן למחוק מיקום שיש משרות שמקושרות אליו.', 'error');
            return;
        }
        requestPasswordAction('מחיקת מיקום', `האם אתה בטוח שברצונך למחוק את המיקום "${loc}"?`, () => {
            setLocations(locations.filter(l => l !== loc));
        });
    };

    const handleApprovePendingTag = async (tag: string, assignToCategory: string | null) => {
        setSaving(true);
        try {
            // Update global settings
            const tagsRef = doc(db, 'settings', 'tags');
            const newJobTags = Array.from(new Set([...legacyJobTags, ...categories, ...Object.values(tagsByCategory).flat(), tag]));
            const updates: any = { jobTags: newJobTags };
            
            if (assignToCategory) {
                const currentCatTags = tagsByCategory[assignToCategory] || [];
                if (!currentCatTags.includes(tag)) {
                    updates[`tagsByCategory.${assignToCategory}`] = [...currentCatTags, tag];
                    setTagsByCategory(prev => ({ ...prev, [assignToCategory]: [...currentCatTags, tag] }));
                }
            } else {
                // If not assigning to a category, we still just add it to jobTags
                setLegacyJobTags(prev => Array.from(new Set([...prev, tag])));
            }
            await setDoc(tagsRef, updates, { merge: true });

            // Update all jobs that have this tag as pending
            const jobsToUpdate = allJobs.filter(j => j.hasPendingTags && j.pendingTags?.includes(tag));
            for (const j of jobsToUpdate) {
                const updatedPending = (j.pendingTags || []).filter(t => t !== tag);
                const updatedTags = Array.from(new Set([...(j.tags || []), tag]));
                await updateDoc(doc(db, 'jobs', j.id!), {
                    tags: updatedTags,
                    pendingTags: updatedPending,
                    hasPendingTags: updatedPending.length > 0
                });
                
                 j.pendingTags = updatedPending;
                 j.tags = updatedTags;
                 j.hasPendingTags = updatedPending.length > 0;
            }
            setAllJobs([...allJobs]);
            toast('התגית אושרה בהצלחה ונוספה למשרות', 'success');
        } catch (error) {
            console.error("Error approving pending tag:", error);
            toast('שגיאה באישור התגית', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleRejectPendingTag = async (tag: string) => {
        setSaving(true);
        try {
            const jobsToUpdate = allJobs.filter(j => j.hasPendingTags && j.pendingTags?.includes(tag));
            for (const j of jobsToUpdate) {
                const updatedPending = (j.pendingTags || []).filter(t => t !== tag);
                await updateDoc(doc(db, 'jobs', j.id!), {
                    pendingTags: updatedPending,
                    hasPendingTags: updatedPending.length > 0
                });
                 j.pendingTags = updatedPending;
                 j.hasPendingTags = updatedPending.length > 0;
            }
            setAllJobs([...allJobs]);
            toast('התגית נמחקה', 'success');
        } catch (error) {
            console.error("Error rejecting pending tag:", error);
            toast('שגיאה במחיקת התגית', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEditPendingTag = async (oldTag: string, newTag: string) => {
        if (!newTag.trim()) return;
        setSaving(true);
        try {
            const jobsToUpdate = allJobs.filter(j => j.hasPendingTags && j.pendingTags?.includes(oldTag));
            
            // Check if newTag is already approved globally
            const isApprovedGlobally = legacyJobTags.includes(newTag) || categories.includes(newTag) || Object.values(tagsByCategory).some(arr => arr.includes(newTag));
            
            for (const j of jobsToUpdate) {
                const updatedPending = (j.pendingTags || []).filter(t => t !== oldTag);
                const updatedTags = [...(j.tags || [])];
                
                if (isApprovedGlobally) {
                    if (!updatedTags.includes(newTag)) updatedTags.push(newTag);
                    await updateDoc(doc(db, 'jobs', j.id!), {
                        tags: updatedTags,
                        pendingTags: updatedPending,
                        hasPendingTags: updatedPending.length > 0
                    });
                    j.tags = updatedTags;
                } else {
                    if (!updatedPending.includes(newTag)) updatedPending.push(newTag);
                    await updateDoc(doc(db, 'jobs', j.id!), {
                        pendingTags: updatedPending,
                        hasPendingTags: updatedPending.length > 0
                    });
                }
                 j.pendingTags = updatedPending;
                 j.hasPendingTags = updatedPending.length > 0;
            }
            setAllJobs([...allJobs]);
            toast(isApprovedGlobally ? 'התגית נערכה, מוזגה לתגית קיימת ואושרה' : 'התגית נערכה בהצלחה', 'success');
        } catch (error) {
            console.error("Error editing pending tag:", error);
            toast('שגיאה בעריכת התגית', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full" /></div>;
    }

    return (
        <div dir="rtl" className="space-y-8 text-right pb-12 animate-in fade-in">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 sticky top-0 z-10">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">ניהול קטגוריות ותגיות</h2>
                    <p className="text-slate-500 mt-2">סדר את תחומי העניין והתגיות שיהיו זמינים למעסיקים ומחפשי עבודה.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => requestPasswordAction('סנכרון וניקוי נתונים', 'פעולה זו תעבור על כל המשרות, תתקן בעיות שיוך של תגיות/קטגוריות ותמחק מן המערכת תגיות וקטגוריות מתאימות שאינן בשימוש. הפעולה אינה ניתנת לביטול. האם להמשיך?', handleSyncAndCleanup)}
                        isLoading={saving}
                        variant="ghost"
                        className="font-bold px-4 text-orange-600 hover:bg-orange-50 border border-orange-200"
                    >
                        סנכרון וניקוי נתונים
                    </Button>
                    <Button
                        onClick={handleSave}
                        isLoading={saving}
                        variant="primary"
                        className="shadow-lg shadow-brand-teal/30 font-bold px-6 bg-brand-teal hover:bg-brand-dark"
                        leftIcon={<Save size={18} />}
                    >
                        שמור שינויים
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-1 sm:gap-4 border-b border-slate-200 mb-8 hide-scrollbar">
                <button
                    onClick={() => setActiveTab('categories')}
                    className={cn(
                        "px-4 sm:px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 min-w-max",
                        activeTab === 'categories' ? "border-brand-teal text-brand-dark" : "border-transparent text-slate-500 hover:text-slate-700"
                    )}
                >
                    <FolderTree size={16} /> קטגוריות
                </button>
                <button
                    onClick={() => setActiveTab('tags')}
                    className={cn(
                        "px-4 sm:px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 min-w-max",
                        activeTab === 'tags' ? "border-brand-teal text-brand-dark" : "border-transparent text-slate-500 hover:text-slate-700"
                    )}
                >
                    <TagIcon size={16} /> תגיות / מיומנויות
                </button>
                <button
                    onClick={() => setActiveTab('pending-tags')}
                    className={cn(
                        "px-4 sm:px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 min-w-max",
                        activeTab === 'pending-tags' ? "border-brand-teal text-brand-dark" : "border-transparent text-slate-500 hover:text-slate-700"
                    )}
                >
                    <AlertTriangle size={16} /> ממתינות לאישור {allJobs.some(j => j.hasPendingTags) ? <span className="bg-orange-500 text-white rounded-full px-2 py-0.5 text-[10px] mr-1">{Array.from(new Set(allJobs.filter(j => j.hasPendingTags).flatMap(j => j.pendingTags || []))).length}</span> : null}
                </button>
                <button
                    onClick={() => setActiveTab('locations')}
                    className={cn(
                        "px-4 sm:px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 min-w-max",
                        activeTab === 'locations' ? "border-brand-teal text-brand-dark" : "border-transparent text-slate-500 hover:text-slate-700"
                    )}
                >
                    <MapPin size={16} /> מיקומים חמים
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={cn(
                        "px-4 sm:px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 min-w-max",
                        activeTab === 'settings' ? "border-brand-teal text-brand-dark" : "border-transparent text-slate-500 hover:text-slate-700"
                    )}
                >
                    <Cog size={16} /> הגדרות כלליות
                </button>
            </div>

            {activeTab === 'categories' ? (
                <div className="space-y-6">
                    <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-brand-teal flex items-center justify-center">
                                <FolderTree size={20} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">יצירת קטגוריה (תחום רחב)</h3>
                        </div>
                        <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <Input
                                    type="text"
                                    placeholder="למשל: הייטק, שיפוצים, מסעדנות..."
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                />
                            </div>
                            <Button type="submit" variant="primary" className="bg-brand-teal hover:bg-brand-dark w-full sm:w-auto" leftIcon={<Plus size={18} />}>
                                הוסף קטגוריה
                            </Button>
                        </form>
                    </Card>

                    <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl max-w-4xl mx-auto">
                        <h3 className="text-xl font-black text-slate-800 mb-6">כל הקטגוריות ({categories.length})</h3>
                        <div className="space-y-4">
                            {categories.map((cat) => {
                                const linkedTags = tagsByCategory[cat] || [];
                                const jobCount = jobsMap.categories[cat] || 0;
                                const userCount = usersMap.categories[cat] || 0;
                                return (
                                    <div 
                                        key={cat} 
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl gap-4 cursor-pointer hover:border-brand-teal/50 hover:shadow-md transition-all group"
                                        onClick={() => setViewCategoryModal(cat)}
                                    >
                                        <div className="flex-1">
                                            <div className="font-black text-slate-800 text-lg group-hover:text-brand-teal transition-colors">{cat}</div>
                                            <div className="flex flex-wrap gap-2 sm:gap-4 mt-2">
                                                <div className="text-sm text-slate-600 font-bold flex items-center gap-1.5 bg-white px-2 py-1 rounded-md shadow-sm">
                                                    <TagIcon size={14} className="text-brand-teal" /> מקושר ל-{linkedTags.length} תגיות
                                                </div>
                                                <div className="text-sm text-slate-600 font-bold flex items-center gap-1.5 bg-white px-2 py-1 rounded-md shadow-sm">
                                                    <Briefcase size={14} className="text-indigo-500" /> {jobCount} משרות
                                                </div>
                                                <div className="text-sm text-slate-600 font-bold flex items-center gap-1.5 bg-white px-2 py-1 rounded-md shadow-sm">
                                                    <Users size={14} className="text-emerald-500" /> {userCount} מתעניינים
                                                </div>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-red-500 hover:bg-red-50 w-full sm:w-auto relative z-10"
                                            onClick={(e) => { e.stopPropagation(); handleRemoveCategory(cat); }}
                                        >
                                            מחק קטגוריה
                                        </Button>
                                    </div>
                                );
                            })}
                            {categories.length === 0 && (
                                <p className="text-slate-500 py-4 font-medium w-full text-center">לא הוגדרו קטגוריות.</p>
                            )}
                        </div>
                    </Card>
                </div>
            ) : activeTab === 'tags' ? (
                <div className="space-y-6">
                    <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                <TagIcon size={20} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">הוספת תגית לקטגוריה</h3>
                        </div>
                        <form onSubmit={handleAddTag} className="flex flex-col sm:flex-row gap-4">
                            <div className="sm:w-1/3">
                                <select
                                    value={selectedCategoryForTag}
                                    onChange={(e) => setSelectedCategoryForTag(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-teal/10 outline-none text-slate-700 font-bold"
                                >
                                    <option value="" disabled>-- בחר קטגוריה --</option>
                                    {Array.from(new Set([...categories, ...Object.keys(predefinedTagsByCategory)])).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <Input
                                    type="text"
                                    placeholder="הזן שם תגית (למשל: מפתח אתרים, שף, הנדי מן)..."
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                />
                            </div>
                            <Button type="submit" variant="primary" className="bg-brand-teal hover:bg-brand-dark w-full sm:w-auto" leftIcon={<Plus size={18} />}>
                                שייך תגית
                            </Button>
                        </form>
                    </Card>

                    <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl max-w-4xl mx-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                            <h3 className="text-xl font-black text-slate-800">מיפוי תגיות לקטגוריות</h3>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Input 
                                    placeholder="חיפוש תגית..." 
                                    className="w-full sm:w-48 bg-slate-50 border-slate-200 text-sm"
                                    value={searchTag}
                                    onChange={(e) => setSearchTag(e.target.value)}
                                />
                                <Input 
                                    type="number"
                                    placeholder="מינימום משרות" 
                                    className="w-full sm:w-36 bg-slate-50 border-slate-200 text-sm"
                                    value={minJobsFilter}
                                    onChange={(e) => setMinJobsFilter(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-8">
                            {Array.from(new Set([...categories, ...Object.keys(predefinedTagsByCategory)])).map(cat => {
                                const customTags = tagsByCategory[cat] || [];
                                const predefinedTags = predefinedTagsByCategory[cat] || [];
                                const allLinkedTags = Array.from(new Set([...customTags, ...predefinedTags]));
                                
                                const filteredTags = allLinkedTags.filter(tag => {
                                    const jobCount = jobsMap.tags[tag] || 0;
                                    const matchesSearch = tag.toLowerCase().includes(searchTag.toLowerCase());
                                    const minJobs = parseInt(minJobsFilter) || 0;
                                    const matchesJobs = jobCount >= minJobs;
                                    return matchesSearch && matchesJobs;
                                });

                                if (filteredTags.length === 0) return null;
                                return (
                                    <div key={cat} className="space-y-3">
                                        <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">{cat}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {filteredTags.map(tag => {
                                                const jobCount = jobsMap.tags[tag] || 0;
                                                const isPredefined = predefinedTags.includes(tag);
                                                return (
                                                <div 
                                                    key={tag} 
                                                    className={cn(
                                                        "flex items-center gap-2 border font-bold px-4 py-2 rounded-xl text-sm cursor-pointer transition-all shadow-sm hover:shadow",
                                                        isPredefined 
                                                          ? "bg-slate-100/50 border-slate-200 text-slate-600 hover:border-slate-300"
                                                          : "bg-slate-50 border-slate-200 text-slate-800 hover:border-brand-teal/50 hover:bg-white"
                                                    )}
                                                    onClick={() => setViewTagModal(tag)}
                                                >
                                                    <span>{tag}</span>
                                                    <span className={cn("px-1.5 py-0.5 rounded text-[10px]", jobCount > 0 ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500")}>
                                                        {jobCount} משרות
                                                    </span>
                                                    {!isPredefined && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveTagFromCategory(cat, tag); }}
                                                            className="text-slate-400 hover:text-red-500 transition-colors mr-2"
                                                            title="הסר תגית מקטגוריה זו"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            )})}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* Unassigned Tags Section */}
                            {(() => {
                                const allAssignedTags = new Set([
                                    ...Object.values(tagsByCategory).flat(),
                                    ...Object.values(predefinedTagsByCategory).flat()
                                ]);
                                const unassignedTags = legacyJobTags.filter(t => !allAssignedTags.has(t));
                                
                                const filteredUnassigned = unassignedTags.filter(tag => {
                                    const jobCount = jobsMap.tags[tag] || 0;
                                    const matchesSearch = tag.toLowerCase().includes(searchTag.toLowerCase());
                                    const minJobs = parseInt(minJobsFilter) || 0;
                                    const matchesJobs = jobCount >= minJobs;
                                    return matchesSearch && matchesJobs;
                                });

                                if (filteredUnassigned.length === 0) return null;

                                return (
                                    <div className="space-y-3 pt-6 border-t border-slate-100 mt-6">
                                        <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest text-orange-500 flex items-center gap-2">
                                            <AlertTriangle size={14} /> תגיות יתומות (ללא קטגוריה)
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {filteredUnassigned.map(tag => {
                                                const jobCount = jobsMap.tags[tag] || 0;
                                                return (
                                                    <div 
                                                        key={tag} 
                                                        className="flex items-center gap-2 border font-bold px-4 py-2 rounded-xl text-sm cursor-pointer transition-all shadow-sm hover:shadow bg-slate-50 border-orange-200 text-slate-800 hover:border-orange-500 hover:bg-orange-50/50"
                                                        onClick={() => setViewTagModal(tag)}
                                                    >
                                                        <span>{tag}</span>
                                                        <span className={cn("px-1.5 py-0.5 rounded text-[10px]", jobCount > 0 ? "bg-orange-100 text-orange-700" : "bg-slate-200 text-slate-500")}>
                                                            {jobCount} משרות
                                                        </span>
                                                        <button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                requestConfirmAction(`האם אתה בטוח שברצונך למחוק מכל המערכת את התגית היתומה "${tag}"? המחיקה תסיר את התגית גם מכל המשרות שקשורות אליה!`, async () => {
                                                                    setSaving(true);
                                                                    try {
                                                                        setLegacyJobTags(prev => prev.filter(t => t !== tag));
                                                                        const tagsRef = doc(db, 'settings', 'tags');
                                                                        const newJobTags = legacyJobTags.filter(t => t !== tag);
                                                                        await setDoc(tagsRef, { jobTags: newJobTags }, { merge: true });
                                                                        
                                                                        const jobsWithTag = allJobs.filter(j => j.tags?.includes(tag) || j.category === tag);
                                                                        let updatedCount = 0;
                                                                        for (const j of jobsWithTag) {
                                                                            if (j.id) {
                                                                                const updatedTags = (j.tags || []).filter((t: string) => t !== tag);
                                                                                await updateDoc(doc(db, 'jobs', j.id), { tags: updatedTags });
                                                                                updatedCount++;
                                                                            }
                                                                        }
                                                                        
                                                                        toast(`תגית נמחקה בהצלחה (הוסרה מ-${updatedCount} משרות)`, 'success');
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                        toast('שגיאה במחיקת תגית', 'error');
                                                                    } finally {
                                                                        setSaving(false);
                                                                    }
                                                                });
                                                            }}
                                                            className="text-slate-400 hover:text-red-500 transition-colors mr-2"
                                                            title="מחק הכל"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                            
                           {Array.from(new Set([...categories, ...Object.keys(predefinedTagsByCategory)])).length === 0 && legacyJobTags.length === 0 && (
                                <p className="text-slate-500 py-4 font-medium w-full text-center">לא שוייכו תגיות לאף קטגוריה עדיין ואין תגיות יתומות.</p>
                            )}
                        </div>
                    </Card>
                </div>
            ) : activeTab === 'pending-tags' ? (
                <div className="space-y-6">
                    <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">תגיות ממתינות לאישור </h3>
                        </div>
                        <p className="text-slate-500 mb-6 font-medium">כאשר מעסיק מוסיף תגית שאינה מוכרת במערכת, היא מגיעה לכאן. אישור התגית יוסיף אותה למשרות ויפתח אותה לחיפושים עתידיים. מחיקתה תסיר אותה גם מהמשרות שציינו אותה. עריכה תאפשר לאחד אותה לתגית קיימת ומוכרת.</p>
                        
                        <div className="space-y-4">
                            {Array.from(new Set(allJobs.filter(j => j.hasPendingTags).flatMap(j => j.pendingTags || []))).sort().map(tag => {
                                const relatedJobs = allJobs.filter(j => j.hasPendingTags && j.pendingTags?.includes(tag));
                                return (
                                    <div key={tag} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl gap-4 hover:border-brand-teal/50 hover:shadow-md transition-all">
                                        <div className="flex-1">
                                            <div className="font-black text-slate-800 text-lg flex items-center gap-2">
                                                {tag}
                                                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">{relatedJobs.length} משרות מבקשות</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-2 font-mono flex flex-col gap-1">
                                                {relatedJobs.slice(0, 3).map(j => <span key={j.id}>{j.title} ({j.companyName})</span>)}
                                                {relatedJobs.length > 3 && <span>...ועוד {relatedJobs.length - 3} משרות</span>}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => {
                                                    const newName = window.prompt('ערוך תגית או כתוב תגית קיימת כדי לאחד אליה:', tag);
                                                    if (newName && newName !== tag) handleEditPendingTag(tag, newName);
                                                }}
                                                className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200"
                                            >
                                                <Edit2 size={16} className="ml-1" /> ערוך
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => requestConfirmAction(`האם אתה בטוח שברצונך למחוק מכל המשרות את התגית "${tag}"?`, () => handleRejectPendingTag(tag))}
                                                className="text-red-500 hover:bg-red-50 border border-slate-200"
                                            >
                                                <Trash2 size={16} className="ml-1" /> דחה ומחק
                                            </Button>
                                            <Button 
                                                variant="primary" 
                                                size="sm"
                                                onClick={() => {
                                                    // Optional: specify category
                                                    const cat = window.prompt(`אישור תגית "${tag}" - ניתן להזין שם קטגוריה לשיוך או להשאיר ריק. קטגוריות קיימות: ${categories.slice(0, 3).join(', ')}...`);
                                                    if (cat !== null) { // null if cancelled
                                                        handleApprovePendingTag(tag, cat.trim() || null);
                                                    }
                                                }}
                                                className="bg-brand-teal hover:bg-brand-dark shadow-sm"
                                            >
                                                <CheckCircle2 size={16} className="ml-1" /> אשר תגית
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {Array.from(new Set(allJobs.filter(j => j.hasPendingTags).flatMap(j => j.pendingTags || []))).length === 0 && (
                                <p className="text-slate-500 py-8 font-medium w-full text-center bg-slate-50 rounded-xl border border-slate-100">אין תגיות ממתינות לאישור. המערכת תקינה ונאה!</p>
                            )}
                        </div>
                    </Card>
                </div>
            ) : activeTab === 'locations' ? (
                <div className="space-y-6">
                    <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <MapPin size={20} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">הוספת מיקום נפוץ</h3>
                        </div>
                        <form onSubmit={handleAddLocation} className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <Input
                                    type="text"
                                    placeholder="למשל: תל אביב, חיפה, מרכז..."
                                    value={newLocation}
                                    onChange={(e) => setNewLocation(e.target.value)}
                                />
                            </div>
                            <Button type="submit" variant="primary" className="bg-brand-teal hover:bg-brand-dark w-full sm:w-auto" leftIcon={<Plus size={18} />}>
                                הוסף מיקום
                            </Button>
                        </form>
                    </Card>

                    <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl max-w-4xl mx-auto">
                        <h3 className="text-xl font-black text-slate-800 mb-6">כל המיקומים ({locations.length})</h3>
                        <div className="space-y-4">
                            {locations.map((loc) => {
                                const jobCount = jobsMap.locations[loc] || 0;
                                const userCount = usersMap.locations[loc] || 0;
                                return (
                                    <div 
                                        key={loc} 
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl gap-4 cursor-pointer hover:border-brand-teal/50 hover:shadow-md transition-all group"
                                        onClick={() => setViewLocationModal(loc)}
                                    >
                                        <div className="flex-1">
                                            <div className="font-black text-slate-800 text-lg flex items-center gap-2 group-hover:text-brand-teal transition-colors">
                                                <MapPin size={18} className="text-slate-400 group-hover:text-brand-teal transition-colors" /> {loc}
                                            </div>
                                            <div className="flex gap-4 mt-2">
                                                <div className="text-sm text-slate-600 font-bold flex items-center gap-1.5 bg-white px-2 py-1 rounded-md shadow-sm">
                                                    <Briefcase size={14} className="text-indigo-500" /> {jobCount} משרות
                                                </div>
                                                <div className="text-sm text-slate-600 font-bold flex items-center gap-1.5 bg-white px-2 py-1 rounded-md shadow-sm">
                                                    <Users size={14} className="text-emerald-500" /> {userCount} מתעניינים
                                                </div>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-red-500 hover:bg-red-50 relative z-10"
                                            onClick={(e) => { e.stopPropagation(); handleRemoveLocation(loc); }}
                                        >
                                            מחק מיקום
                                        </Button>
                                    </div>
                                );
                            })}
                            {locations.length === 0 && (
                                <p className="text-slate-500 py-4 font-medium w-full text-center">לא הוגדרו מיקומים.</p>
                            )}
                        </div>
                    </Card>
                </div>
            ) : activeTab === 'settings' ? (
                <div className="space-y-6">
                    <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                                <Cog size={20} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">הגדרות כלליות</h3>
                        </div>
                        <div className="space-y-4">
                            <p className="text-slate-500 text-sm">כאן ניתן להגדיר אפשרויות מתקדמות עבור תגיות, מיקומים וקטגוריות.</p>
                            <label className="flex items-center gap-2 text-slate-700 font-bold cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 accent-brand-teal" />
                                <span>אפשר למעסיקים להוסיף תגיות מותאמות אישית</span>
                            </label>
                            <label className="flex items-center gap-2 text-slate-700 font-bold cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 accent-brand-teal" />
                                <span>השתמש ב-AI להציע תגיות למחפשי עבודה</span>
                            </label>
                            
                            <div className="pt-4 border-t border-slate-100">
                                <Button type="button" variant="primary" className="bg-brand-teal shadow-lg hover:bg-brand-dark px-8 font-bold">
                                    שמור הגדרות
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            ) : null}

            {/* Modals */}
            {viewCategoryModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <FolderTree className="text-brand-teal" size={24} /> 
                                קטגוריה: {viewCategoryModal}
                            </h3>
                            <button onClick={() => setViewCategoryModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full shadow-sm">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                            <div>
                                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2"><TagIcon size={16} /> תגיות מקושרות ({(tagsByCategory[viewCategoryModal] || []).length})</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(tagsByCategory[viewCategoryModal] || []).map(tag => (
                                        <span key={tag} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-bold border border-slate-200">
                                            {tag}
                                        </span>
                                    ))}
                                    {(tagsByCategory[viewCategoryModal] || []).length === 0 && <span className="text-slate-500 text-sm">אין תגיות לקטגוריה זו.</span>}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2"><Briefcase size={16} /> משרות מקושרות ({jobsMap.categories[viewCategoryModal] || 0})</h4>
                                <div className="space-y-3">
                                    {allJobs.filter(j => j.category === viewCategoryModal || (tagsByCategory[viewCategoryModal] || []).includes(j.category as string) || (j.tags || []).some(t => (tagsByCategory[viewCategoryModal] || []).includes(t))).map(job => (
                                        <Link key={job.id || Math.random()} to={job.id ? `/admin/jobs/${job.id}` : '#'} className="block p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                                            <div className="font-bold text-slate-800">{job.title}</div>
                                            <div className="text-sm text-slate-500 mt-1 flex gap-3">
                                                <span>{job.companyName}</span>
                                                <span>•</span>
                                                <span>{job.location}</span>
                                                <span>•</span>
                                                <span className="text-brand-teal font-semibold">{job.category}</span>
                                            </div>
                                        </Link>
                                    ))}
                                    {allJobs.filter(j => j.category === viewCategoryModal || (tagsByCategory[viewCategoryModal] || []).includes(j.category as string) || (j.tags || []).some(t => (tagsByCategory[viewCategoryModal] || []).includes(t))).length === 0 && <p className="text-slate-500 text-sm">אין משרות לקטגוריה זו.</p>}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2"><Users size={16} /> מתעניינים ({usersMap.categories[viewCategoryModal] || 0})</h4>
                                <div className="space-y-3">
                                    {allUsers.filter(u => u.preferredCategories?.includes(viewCategoryModal) || u.preferredCategories?.some(pc => (tagsByCategory[viewCategoryModal] || []).includes(pc))).map(user => (
                                        <div key={user.uid || Math.random()} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                                            <div className="font-bold text-slate-800">{user.fullName || user.displayName || 'משתמש אנונימי'}</div>
                                            <div className="text-sm text-slate-500 font-medium">{user.email}</div>
                                        </div>
                                    ))}
                                    {allUsers.filter(u => u.preferredCategories?.includes(viewCategoryModal) || u.preferredCategories?.some(pc => (tagsByCategory[viewCategoryModal] || []).includes(pc))).length === 0 && <p className="text-slate-500 text-sm">אין משתמשים שמתעניינים בקטגוריה זו.</p>}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {viewTagModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <TagIcon className="text-indigo-500" size={24} /> 
                                תגית/מיומנות: {viewTagModal}
                            </h3>
                            <button onClick={() => setViewTagModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full shadow-sm">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                            <div>
                                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2"><Briefcase size={16} /> משרות בעלות תגית זו ({jobsMap.tags[viewTagModal] || 0})</h4>
                                <div className="space-y-3">
                                    {allJobs.filter(j => j.tags?.includes(viewTagModal) || (j.category === viewTagModal && !Object.keys(tagsByCategory).includes(j.category as string))).map(job => (
                                        <Link key={job.id || Math.random()} to={job.id ? `/admin/jobs/${job.id}` : '#'} className="block p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                                            <div className="font-bold text-slate-800">{job.title}</div>
                                            <div className="text-sm text-slate-500 mt-1 flex gap-3">
                                                <span>{job.companyName}</span>
                                                <span>•</span>
                                                <span>{job.location}</span>
                                                <span>•</span>
                                                <span className="text-brand-teal font-semibold">{job.category}</span>
                                            </div>
                                        </Link>
                                    ))}
                                    {allJobs.filter(j => j.tags?.includes(viewTagModal) || (j.category === viewTagModal && !Object.keys(tagsByCategory).includes(j.category as string))).length === 0 && <p className="text-slate-500 text-sm">אין משרות עם תגית זו.</p>}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {viewLocationModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <MapPin className="text-purple-500" size={24} /> 
                                מיקום: {viewLocationModal}
                            </h3>
                            <button onClick={() => setViewLocationModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full shadow-sm">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                            <div>
                                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2"><Briefcase size={16} /> משרות באזור זה ({jobsMap.locations[viewLocationModal] || 0})</h4>
                                <div className="space-y-3">
                                    {allJobs.filter(j => j.location === viewLocationModal).map(job => (
                                        <Link key={job.id || Math.random()} to={job.id ? `/admin/jobs/${job.id}` : '#'} className="block p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                                            <div className="font-bold text-slate-800">{job.title}</div>
                                            <div className="text-sm text-slate-500 mt-1 flex gap-3">
                                                <span>{job.companyName}</span>
                                                <span>•</span>
                                                <span className="text-brand-teal font-semibold">{job.category}</span>
                                            </div>
                                        </Link>
                                    ))}
                                    {allJobs.filter(j => j.location === viewLocationModal).length === 0 && <p className="text-slate-500 text-sm">אין משרות באזור זה.</p>}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2"><Users size={16} /> מתעניינים באזור זה ({usersMap.locations[viewLocationModal] || 0})</h4>
                                <div className="space-y-3">
                                    {allUsers.filter(u => u.preferredLocations?.includes(viewLocationModal)).map(user => (
                                        <div key={user.uid || Math.random()} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                                            <div className="font-bold text-slate-800">{user.fullName || user.displayName || 'משתמש אנונימי'}</div>
                                            <div className="text-sm text-slate-500 font-medium">{user.email}</div>
                                        </div>
                                    ))}
                                    {allUsers.filter(u => u.preferredLocations?.includes(viewLocationModal)).length === 0 && <p className="text-slate-500 text-sm">אין משתמשים שמתעניינים באזור זה.</p>}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
            {passwordModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="bg-white rounded-[2rem] w-full max-w-md flex flex-col overflow-hidden shadow-2xl p-8 relative">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <Lock size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 text-center mb-2">
                            {passwordModal.title || 'אימות סיסמה'}
                        </h3>
                        <p className="text-slate-500 text-center mb-6 text-sm">
                            {passwordModal.description}
                        </p>
                        
                        <div className="space-y-4">
                            <Input 
                                type="password" 
                                placeholder="הזן סיסמת מנהל מערכת" 
                                value={passwordModal.input}
                                onChange={e => setPasswordModal(p => ({ ...p, input: e.target.value, error: '' }))}
                                onKeyDown={e => { if (e.key === 'Enter') confirmPasswordAction(); }}
                                autoFocus
                                className={cn("text-center font-bold tracking-widest", passwordModal.error && "border-red-500")}
                            />
                            {passwordModal.error && (
                                <p className="text-red-500 text-center text-sm font-semibold">{passwordModal.error}</p>
                            )}
                            <div className="flex gap-4 mt-6">
                                <Button variant="ghost" onClick={() => setPasswordModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 font-bold text-slate-500 hover:bg-slate-100 py-3">
                                    ביטול
                                </Button>
                                <Button 
                                    onClick={confirmPasswordAction} 
                                    variant="primary" 
                                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 font-bold py-3 shadow-lg shadow-red-500/30"
                                >
                                    אשר פעולה
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {confirmModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="bg-white rounded-[2rem] w-full max-w-md flex flex-col overflow-hidden shadow-2xl p-8 relative">
                        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 text-center mb-4">
                            אישור פעולה
                        </h3>
                        <p className="text-slate-500 text-center mb-8 text-base">
                            {confirmModal.text}
                        </p>
                        <div className="flex gap-4">
                            <Button variant="ghost" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 font-bold text-slate-500 hover:bg-slate-100 py-3">
                                ביטול
                            </Button>
                            <Button 
                                onClick={confirmConfirmAction} 
                                variant="primary" 
                                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 font-bold py-3 shadow-lg shadow-orange-500/30"
                            >
                                כן, הוסף / מחק
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

