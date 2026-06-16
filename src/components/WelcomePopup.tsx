import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Modal } from './ui/Modal';
import { X } from 'lucide-react';

export const WelcomePopup: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [htmlContent, setHtmlContent] = useState('');
    const [cssContent, setCssContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettingsAndShowPopup = async () => {
            // Check if we already showed it today
            const lastShown = localStorage.getItem('welcomePopupLastShown');
            const today = new Date().toDateString();
            
            if (lastShown === today) {
                setLoading(false);
                return;
            }

            try {
                const settingsRef = doc(db, 'settings', 'system');
                const settingsSnap = await getDoc(settingsRef);
                if (settingsSnap.exists()) {
                    const data = settingsSnap.data();
                    if (data.enableWelcomePopup) {
                        setHtmlContent(data.welcomePopupHtml || '');
                        setCssContent(data.welcomePopupCss || '');
                        setIsOpen(true);
                        localStorage.setItem('welcomePopupLastShown', today);
                    }
                }
            } catch (error) {
                console.error("Error fetching popup settings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettingsAndShowPopup();
    }, []);

    if (loading || !isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="" maxWidth="max-w-2xl">
            <div className="relative">
                {cssContent && <style dangerouslySetInnerHTML={{ __html: cssContent }} />}
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
        </Modal>
    );
};
