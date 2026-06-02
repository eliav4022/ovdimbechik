import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Inquiry } from '../../types';
import { AdminTable } from '../../components/admin/AdminTable';
import { Badge } from '../../components/ui/Badge';
import { Mail, Clock, CheckCircle, PackageOpen } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

export const AdminContacts: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inquiry));
      setInquiries(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching inquiries:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'NEW': return 'brand';
      case 'RESOLVED': return 'success';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NEW': return 'חדש';
      case 'RESOLVED': return 'טופל';
      default: return status;
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
     switch(status) {
         case 'NEW': return <Mail size={14} className="mr-1" />;
         case 'RESOLVED': return <CheckCircle size={14} className="mr-1" />;
         default: return null;
     }
  };

  const columns = [
    { 
      key: 'sender', 
      header: 'שולח', 
      render: (i: Inquiry) => (
          <div className="flex flex-col">
              <span className="font-bold text-slate-800">{i.senderName}</span>
              <span className="text-xs text-slate-500 font-mono">{i.senderEmail}</span>
          </div>
      )
    },
    { key: 'subject', header: 'נושא', render: (i: Inquiry) => <div className="font-medium text-slate-700 truncate max-w-xs">{i.subject}</div> },
    { 
      key: 'status', 
      header: 'סטטוס', 
      render: (i: Inquiry) => (
          <Badge variant={getStatusBadgeVariant(i.status)} className="flex w-fit items-center px-2 py-0.5 whitespace-nowrap">
              <StatusIcon status={i.status} />
              {getStatusLabel(i.status)}
          </Badge>
      ) 
    },
    { 
      key: 'createdAt', 
      header: 'תאריך', 
      render: (i: Inquiry) => <div className="text-sm font-medium text-slate-500 whitespace-nowrap">{new Date(i.createdAt).toLocaleDateString('he-IL')}</div>
    },
    {
      key: 'actions',
      header: 'פעולות',
      render: (i: Inquiry) => (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSelectedInquiry(i)}
          >
              צפה וטפל
          </Button>
      )
    }
  ];

  const handleReplyByEmail = () => {
      if (!selectedInquiry) return;
      const mailtoLink = `mailto:${selectedInquiry.senderEmail}?subject=Re: ${selectedInquiry.subject}&body=שלום ${selectedInquiry.senderName},%0D%0A%0D%0Aבנוגע לפנייתך:%0D%0A"${selectedInquiry.message}"%0D%0A%0D%0A`;
      window.open(mailtoLink, '_blank');
  };

  const handleMarkAsResolved = async () => {
      if (!selectedInquiry) return;
      try {
          await updateDoc(doc(db, 'inquiries', selectedInquiry.id), {
              status: 'RESOLVED'
          });
          // Update local state for modal immediately (the list updates via onSnapshot)
          setSelectedInquiry({ ...selectedInquiry, status: 'RESOLVED' });
      } catch (error) {
          console.error("Error updating inquiry status:", error);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">פניות ומרכז תמיכה</h1>
          <p className="text-slate-500 font-medium mt-1">נהל פניות שנתקבלו ממחפשי עבודה ומעסיקים</p>
        </div>
      </div>

      <AdminTable 
        title="פניות אחרונות"
        data={inquiries} 
        columns={columns} 
        searchFields={['senderName', 'senderEmail', 'subject']}
      />

      <Modal
        isOpen={!!selectedInquiry}
        onClose={() => setSelectedInquiry(null)}
        title="פרטי הפנייה"
      >
          {selectedInquiry && (
              <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-start">
                      <div>
                          <p className="font-bold text-slate-800 text-lg">{selectedInquiry.senderName}</p>
                          <a href={`mailto:${selectedInquiry.senderEmail}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-mono mt-1 inline-block">
                              {selectedInquiry.senderEmail}
                          </a>
                      </div>
                      <Badge variant={getStatusBadgeVariant(selectedInquiry.status)}>
                          {getStatusLabel(selectedInquiry.status)}
                      </Badge>
                  </div>
                  <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">נושא הפנייה</h4>
                      <p className="text-slate-900 font-medium bg-white border border-slate-200 p-3 rounded-lg">{selectedInquiry.subject}</p>
                  </div>
                  <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">תוכן ההודעה</h4>
                      <div className="text-slate-700 font-medium whitespace-pre-wrap bg-white border border-slate-200 p-4 rounded-xl min-h-[120px] leading-relaxed">
                          {selectedInquiry.message}
                      </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 flex-wrap">
                      <Button variant="ghost" onClick={() => setSelectedInquiry(null)}>
                          סגור
                      </Button>
                      
                      {selectedInquiry.status === 'NEW' && (
                          <Button variant="outline" onClick={handleMarkAsResolved} className="flex items-center gap-2">
                              <CheckCircle size={18} />
                              סמן כטופל
                          </Button>
                      )}

                      <Button onClick={handleReplyByEmail} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
                          <Mail size={18} />
                          השב במייל
                      </Button>
                  </div>
              </div>
          )}
      </Modal>
    </div>
  );
};
