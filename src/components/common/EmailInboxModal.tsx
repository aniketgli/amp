import React, { useState, useEffect } from 'react';
import {
  DispatchedEmail,
  getDispatchedEmails,
  activateUserAccount,
  saveDispatchedEmails,
} from '../../utils/emailService';
import { WiiLogo } from './WiiLogo';
import {
  Mail,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  Trash2,
  Clock,
  Send,
  Building2,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface EmailInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountActivated?: (email: string) => void;
}

export const EmailInboxModal: React.FC<EmailInboxModalProps> = ({
  isOpen,
  onClose,
  onAccountActivated,
}) => {
  const [emails, setEmails] = useState<DispatchedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<DispatchedEmail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadEmails = () => {
    const list = getDispatchedEmails();
    setEmails(list);
    if (list.length > 0 && !selectedEmail) {
      setSelectedEmail(list[0]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEmails();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleDispatched = (e: Event) => {
      loadEmails();
      const custom = e as CustomEvent<DispatchedEmail>;
      if (custom.detail) {
        setSelectedEmail(custom.detail);
      }
    };
    window.addEventListener('wii_email_dispatched', handleDispatched);
    return () => window.removeEventListener('wii_email_dispatched', handleDispatched);
  }, []);

  if (!isOpen) return null;

  const handleSelectEmail = (eml: DispatchedEmail) => {
    setSelectedEmail(eml);
    if (!eml.read) {
      const updated = emails.map((e) => (e.id === eml.id ? { ...e, read: true } : e));
      setEmails(updated);
      saveDispatchedEmails(updated);
    }
  };

  const handleActivateClick = (eml: DispatchedEmail) => {
    setActionSuccess(null);
    setActionError(null);

    const token = eml.activationToken || eml.to;
    const res = activateUserAccount(token);

    if (res.success) {
      setActionSuccess(`Account (${eml.to}) has been ACTIVATED successfully! You can now log in to your account.`);
      if (onAccountActivated) {
        onAccountActivated(eml.to);
      }
      loadEmails();
    } else {
      setActionError(res.message);
    }
  };

  const filtered = emails.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      e.to.toLowerCase().includes(q) ||
      e.toName.toLowerCase().includes(q) ||
      e.subject.toLowerCase().includes(q) ||
      (e.requisitionId && e.requisitionId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2.5 sm:p-4 overflow-hidden">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-md border border-emerald-400/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> WII Transactional Email Notification Gateway
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                Official Email Outbox & Inbox Viewer ({emails.length})
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Email Viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Feedbacks */}
        {actionSuccess && (
          <div className="bg-emerald-500 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between gap-2 shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span>{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-white hover:underline cursor-pointer text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {actionError && (
          <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between gap-2 shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-white" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-white hover:underline cursor-pointer text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Body Split Panel */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          
          {/* Left Column: Email List */}
          <div className="md:col-span-5 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900/60">
            {/* Search Box */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search recipient, ID, subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Email List Feed */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/60">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No dispatched email transactions found.
                </div>
              ) : (
                filtered.map((eml) => {
                  const isSelected = selectedEmail?.id === eml.id;
                  const isRegistration = eml.transactionType === 'REGISTRATION_LINK';

                  return (
                    <button
                      key={eml.id}
                      onClick={() => handleSelectEmail(eml)}
                      className={`w-full text-left p-3.5 transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-l-4 border-emerald-600 dark:border-emerald-500'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">
                          To: {eml.toName} ({eml.to})
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
                          {new Date(eml.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {eml.subject}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-tight ${
                            isRegistration
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300'
                              : eml.transactionType.includes('REJECT')
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {eml.transactionType.replace(/_/g, ' ')}
                        </span>

                        {eml.requisitionId && (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold">
                            {eml.requisitionId}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Full Email View */}
          <div className="md:col-span-7 flex flex-col min-h-0 bg-white dark:bg-slate-900">
            {selectedEmail ? (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                
                {/* Official Letterhead Header */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <WiiLogo size="sm" />
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Official System Dispatch</span>
                      <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400">
                        {new Date(selectedEmail.sentAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 dark:text-slate-500 font-bold w-12 shrink-0">From:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">WII Access Governance Cell &lt;noreply@wii.gov.in&gt;</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 dark:text-slate-500 font-bold w-12 shrink-0">To:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{selectedEmail.toName} &lt;{selectedEmail.to}&gt;</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 dark:text-slate-500 font-bold w-12 shrink-0">Subject:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{selectedEmail.subject}</span>
                    </div>
                  </div>
                </div>

                {/* Email Body Content */}
                <div className="bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 font-sans text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedEmail.bodyText}
                </div>

                {/* CRITICAL: Verification Link Action Box for Registration Emails */}
                {selectedEmail.transactionType === 'REGISTRATION_LINK' && (
                  <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white p-5 rounded-2xl shadow-lg border border-emerald-500/40 space-y-3 animate-pulse">
                    <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      Email Account Verification Action Required
                    </div>

                    <p className="text-xs text-slate-200 leading-normal">
                      Click the activation button below to confirm registration for <strong>{selectedEmail.to}</strong> and activate portal login access immediately.
                    </p>

                    <button
                      onClick={() => handleActivateClick(selectedEmail)}
                      className="w-full sm:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-300"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      🔗 ACTIVATE ACCOUNT NOW ({selectedEmail.to})
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-xs">
                Select an email from the left pane to view details.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
