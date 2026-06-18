import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { Helmet } from 'react-helmet-async';
import { FileQuestion, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const FileView = () => {
  const params = useParams();
  const navigate = useNavigate();
  const targetPath = params['*'];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'other' | null>(null);

  useEffect(() => {
    const fetchFile = async () => {
      if (!targetPath) {
        setError('נתיב קובץ חסר');
        setLoading(false);
        return;
      }

      try {
        const fileRef = ref(storage, targetPath);
        const url = await getDownloadURL(fileRef);
        setFileUrl(url);
        
        // Determine type based on extension
        const lowerPath = targetPath.toLowerCase();
        if (lowerPath.match(/\.(jpeg|jpg|gif|png|webp|svg)$/)) {
            setFileType('image');
        } else if (lowerPath.match(/\.(pdf)$/)) {
            setFileType('pdf');
        } else {
            setFileType('other');
        }
      } catch (err: any) {
        console.error("Error fetching file:", err);
        if (err.code === 'storage/unauthorized') {
            setError('אין לך הרשאה לצפות בקובץ זה');
        } else if (err.code === 'storage/object-not-found') {
            setError('הקובץ לא נמצא');
        } else {
            setError('שגיאה בטעינת הקובץ');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [targetPath]);

  // If it's another file type that browsers can't easily inline, or if user prefers download
  useEffect(() => {
     if (!loading && !error && fileType === 'other' && fileUrl) {
         // Auto redirect to download if it's not an image or pdf
         window.location.href = fileUrl;
     }
  }, [loading, error, fileType, fileUrl]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-brand-teal animate-spin mb-4" />
            <p className="text-slate-500 font-bold">טוען קובץ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4" dir="rtl">
        <Helmet>
            <title>שגיאה בטעינת קובץ | עובדים בצ'יק</title>
        </Helmet>
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center border border-slate-100"
        >
          <div className="mx-auto w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
             <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">לא ניתן לגשת לקובץ</h2>
          <p className="text-slate-500 font-medium mb-8">{error}</p>
          <button 
             onClick={() => navigate(-1)}
             className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-2xl transition-colors"
          >
             חזור אחורה
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <Helmet>
            <title>צפייה בקובץ | עובדים בצ'יק</title>
        </Helmet>
        
        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 p-4 flex justify-end bg-gradient-to-b from-black/50 to-transparent z-10">
            {fileUrl && (
                <a 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white/10 hover:bg-white/20 text-white placeholder-slate-400 font-bold py-2 px-6 rounded-xl backdrop-blur-sm transition-all"
                >
                    פתח קישור מקורי
                </a>
            )}
        </div>

        {/* Content */}
        <div className="w-full h-screen p-4 flex items-center justify-center">
            {fileType === 'image' && (
                <img 
                    src={fileUrl} 
                    alt="File view" 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
            )}
            
            {fileType === 'pdf' && (
                <iframe 
                    src={fileUrl} 
                    className="w-full h-full max-w-5xl bg-white rounded-xl shadow-2xl border-none"
                    title="PDF Viewer"
                />
            )}

            {fileType === 'other' && (
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 text-center border border-white/10">
                    <FileQuestion className="w-20 h-20 text-white/50 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">הקובץ מוכן להורדה</h2>
                    <p className="text-white/70 mb-8">הורדת הקובץ תתחיל באופן אוטומטי</p>
                    <a 
                        href={fileUrl}
                        className="inline-block bg-brand-teal text-white font-bold py-3 px-8 rounded-2xl hover:bg-teal-600 transition-colors shadow-lg"
                    >
                        לחץ כאן אם ההורדה לא התחילה
                    </a>
                </div>
            )}
        </div>
    </div>
  );
};

export default FileView;
