import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Popup, UserRole } from '../types';
import { useAuth } from '../lib/AuthContext';
import { Modal } from './ui/Modal';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PopupsManager: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [popups, setPopups] = useState<Popup[]>([]);
    const [activePopups, setActivePopups] = useState<Popup[]>([]);
    const [closedPopups, setClosedPopups] = useState<Set<string>>(new Set());

    // Load popups from Firestore (only active ones) on mount
    useEffect(() => {
        const fetchPopups = async () => {
            try {
                const q = query(collection(db, 'popups'), where('isActive', '==', true));
                const snapshot = await getDocs(q);
                const popupsData = snapshot.docs.map(doc => doc.data() as Popup);
                setPopups(popupsData);
            } catch (error) {
                console.error("Error fetching popups for manager:", error);
            }
        };
        fetchPopups();
    }, []);

    // Load closed popups from session storage on mount
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem('closed_popups');
            if (stored) {
                setClosedPopups(new Set(JSON.parse(stored)));
            }
        } catch (e) {
            // ignore
        }
    }, []);

    // Evaluate which popups should be shown when route or user changes
    useEffect(() => {
        if (popups.length === 0) return;

        const currentPath = location.pathname;
        
        const matchingPopups = popups.filter(popup => {
            // Check if already closed in this session
            if (closedPopups.has(popup.id)) return false;

            // Check page targeting
            const pageMatches = popup.targetPage === 'all' || popup.targetPage === currentPath;
            if (!pageMatches) return false;

            // Check user targeting
            let userMatches = false;
            switch (popup.targetUserType) {
                case 'all':
                    userMatches = true;
                    break;
                case 'guest':
                    userMatches = !user;
                    break;
                case 'seeker':
                    userMatches = !!user && user.role === UserRole.SEEKER;
                    break;
                case 'employer':
                    userMatches = !!user && user.role === UserRole.EMPLOYER;
                    break;
                default:
                    // For admin or unknown, fallback to false unless targeted 'all'
                    userMatches = false;
            }
            if (!userMatches) return false;

            return true;
        });

        // Update active popups based on the match
        setActivePopups(matchingPopups);
    }, [popups, location.pathname, user, closedPopups]);

    const handleClose = (popupId: string) => {
        setActivePopups(prev => prev.filter(p => p.id !== popupId));
        setClosedPopups(prev => {
            const next = new Set(prev);
            next.add(popupId);
            sessionStorage.setItem('closed_popups', JSON.stringify(Array.from(next)));
            return next;
        });
    };

    if (activePopups.length === 0) return null;

    // Group popups by position
    const centerPopups = activePopups.filter(p => p.position === 'center');
    const topPopups = activePopups.filter(p => p.position === 'top');
    const bottomPopups = activePopups.filter(p => p.position === 'bottom');

    return (
        <>
            {/* Top Banners */}
            <AnimatePresence>
                {topPopups.map(popup => (
                    <motion.div
                        key={popup.id}
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-md"
                    >
                        <div className="relative">
                            <button 
                                onClick={() => handleClose(popup.id)}
                                className="absolute top-2 right-2 p-2 text-slate-500 hover:bg-slate-100 rounded-full z-10 transition-colors"
                            >
                                <X size={20} />
                            </button>
                            {popup.cssContent && <style dangerouslySetInnerHTML={{ __html: popup.cssContent }} />}
                            <div className="w-full max-h-[40vh] overflow-y-auto" dangerouslySetInnerHTML={{ __html: popup.htmlContent }} />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Bottom Banners */}
            <AnimatePresence>
                {bottomPopups.map(popup => (
                    <motion.div
                        key={popup.id}
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
                    >
                        <div className="relative">
                            <button 
                                onClick={() => handleClose(popup.id)}
                                className="absolute top-2 right-2 p-2 text-slate-500 hover:bg-slate-100 rounded-full z-10 transition-colors"
                            >
                                <X size={20} />
                            </button>
                            {popup.cssContent && <style dangerouslySetInnerHTML={{ __html: popup.cssContent }} />}
                            <div className="w-full max-h-[40vh] overflow-y-auto" dangerouslySetInnerHTML={{ __html: popup.htmlContent }} />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Center Modals */}
            {centerPopups.map((popup, index) => (
                // Use a standard modal for center popups but we need to render them safely 
                // Only one modal can comfortably be presented at the top layer, 
                // but if there are multiple, they will stack visually. We render them with z-indexes incrementally.
                <Modal 
                    key={popup.id} 
                    isOpen={true} 
                    onClose={() => handleClose(popup.id)} 
                    title="" 
                >
                    <div className="relative">
                        {popup.cssContent && <style dangerouslySetInnerHTML={{ __html: popup.cssContent }} />}
                        <div dangerouslySetInnerHTML={{ __html: popup.htmlContent }} />
                    </div>
                </Modal>
            ))}
        </>
    );
};
