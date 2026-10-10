import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Mail, Download, Check } from 'lucide-react';
import { useState } from 'react';
import { Person, Meeting, ActionItem } from '../types';

interface EmailDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  latestMeeting: Meeting | null;
  actionItems: ActionItem[];
  onShowToast: (text: string, type: 'success' | 'error') => void;
}

export default function EmailDraftModal({
  isOpen,
  onClose,
  person,
  latestMeeting,
  actionItems,
  onShowToast,
}: EmailDraftModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const meetingDateStr = latestMeeting
    ? new Date(latestMeeting.meetingDate + 'T00:00:00').toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  const subject = latestMeeting
    ? `1:1 Discussion Summary — ${person.name} (${meetingDateStr})`
    : `1:1 Summary — ${person.name}`;

  const notesHtml = latestMeeting
    ? latestMeeting.notes.trim()
      ? latestMeeting.notes
          .split('\n')
          .map((para) => (para.trim() ? `<p style="margin-bottom: 12px; font-size: 14px; line-height: 1.6; color: #334155;">${para.trim()}</p>` : ''))
          .join('')
      : '<p style="font-size: 14px; color: #64748b; font-style: italic;">No specific discussion notes captured.</p>'
    : '<p style="font-size: 14px; color: #64748b; font-style: italic;">No meetings logged yet.</p>';

  const openItems = actionItems.filter((i) => i.status === 'open');
  const actionItemsHtml =
    openItems.length > 0
      ? `<ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155;">
          ${openItems
            .map(
              (item) =>
                `<li style="margin-bottom: 8px;">
                  <strong style="color: ${item.owner === 'me' ? '#6d28d9' : '#b45309'}; text-transform: uppercase; font-size: 11px; padding: 2px 6px; background-color: ${item.owner === 'me' ? '#f5f3ff' : '#fef3c7'}; border-radius: 4px; margin-right: 6px;">${item.owner === 'me' ? 'Me' : 'Them'}</strong>
                  <span style="line-height: 1.5;">${item.description}</span>
                </li>`
            )
            .join('')}
        </ul>`
      : '<p style="font-size: 14px; color: #059669; font-style: italic; margin: 0;">No open action items at the moment. All caught up!</p>';

  const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 20px 10px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 4px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
      1:1 Summary Report
    </h2>
    
    <div style="margin-bottom: 24px; padding-top: 8px;">
      <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">With</p>
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #0f172a;">${person.name} <span style="font-size: 14px; font-weight: 400; color: #64748b;">${person.role ? `(${person.role})` : ''}</span></p>
      
      <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Date</p>
      <p style="margin: 0; font-size: 14px; color: #334155;">${meetingDateStr}</p>
    </div>

    <div style="margin-bottom: 28px;">
      <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
        Discussion Notes
      </h3>
      <div style="font-size: 14px; color: #334155; line-height: 1.6;">
        ${notesHtml}
      </div>
    </div>

    <div>
      <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
        Active Action Items
      </h3>
      ${actionItemsHtml}
    </div>

    <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center;">
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">Sent via Private 1:1 Ledger App</p>
    </div>
  </div>
</body>
</html>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailHtml);
      setCopied(true);
      onShowToast('HTML copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      onShowToast('Could not copy text', 'error');
    }
  };

  const handleDownloadEml = () => {
    try {
      const emlLines = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        `Subject: ${subject}`,
        'Content-Transfer-Encoding: 7bit',
        '',
        emailHtml,
      ];
      const blob = new Blob([emlLines.join('\r\n')], { type: 'message/rfc822' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const cleanName = person.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const cleanDate = latestMeeting ? latestMeeting.meetingDate : 'sync';
      anchor.download = `1on1_summary_${cleanName}_${cleanDate}.eml`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      onShowToast('Outlook draft (.eml) downloaded', 'success');
    } catch (err) {
      onShowToast('Failed to generate .eml file', 'error');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="relative w-full max-w-2xl bg-paper-raised text-ink border border-rule-strong rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-rule shrink-0">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              <h3 className="font-serif text-lg font-semibold">Generate Meeting Summary</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-rule transition-colors text-ink-soft hover:text-ink"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
                Draft Subject Line
              </label>
              <input
                type="text"
                readOnly
                value={subject}
                className="w-full px-3.5 py-2.5 bg-paper border border-rule-strong rounded-xl text-sm text-ink-soft focus:outline-none"
              />
            </div>

            {/* Live Preview Pane */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
                Email Live Preview
              </label>
              <div className="border border-rule-strong rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/50 p-4 max-h-72 overflow-y-auto shadow-inner">
                {/* Embedded render style of draft */}
                <div className="bg-white text-slate-800 p-6 rounded-xl shadow-xs border border-slate-100 max-w-lg mx-auto font-sans">
                  <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
                    1:1 Summary Report
                  </h2>
                  <div className="text-xs mb-4 text-slate-500">
                    <p className="mb-1"><span className="font-semibold text-slate-700">With:</span> {person.name} {person.role ? `(${person.role})` : ''}</p>
                    <p><span className="font-semibold text-slate-700">Date:</span> {meetingDateStr}</p>
                  </div>
                  <div className="mb-5 border-t border-slate-100 pt-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Discussion Notes</h3>
                    <div className="text-sm text-slate-600 space-y-2 leading-relaxed whitespace-pre-wrap">
                      {latestMeeting ? latestMeeting.notes : 'No meeting notes captured.'}
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Active Action Items</h3>
                    {openItems.length > 0 ? (
                      <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                        {openItems.map((item, idx) => (
                          <li key={idx} className="leading-relaxed">
                            <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded mr-2 ${
                              item.owner === 'me' ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.owner === 'me' ? 'Me' : 'Them'}
                            </span>
                            {item.description}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-emerald-600 italic">No open action items. Caught up!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Raw HTML Code box */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
                HTML Source Code <span className="lowercase font-normal italic text-ink-soft/60">(for expert pasting)</span>
              </label>
              <textarea
                readOnly
                rows={4}
                value={emailHtml}
                className="w-full px-3 py-2 bg-paper border border-rule-strong rounded-xl text-[11px] font-mono text-ink-soft focus:outline-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-rule bg-paper shrink-0 flex items-center justify-between">
            <span className="text-xs text-ink-soft italic">Copies styled HTML directly.</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border border-rule-strong rounded-xl hover:bg-paper-raised text-ink transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied HTML' : 'Copy HTML'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadEml}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-primary-soft text-primary hover:bg-primary/15 rounded-xl transition-colors cursor-pointer border border-primary/20"
              >
                <Download className="w-4 h-4" />
                <span>Download .eml</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold bg-primary text-paper-raised rounded-xl hover:bg-primary-strong transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
