import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, ClipboardList, Plus, Trash, User, Check, Trash2, Tag, Sparkles } from 'lucide-react';
import { Person, Meeting, ActionItem, ActionItemOwner, ActionItemStatus } from '../types';

interface PendingActionItem {
  id?: string; // If existing
  description: string;
  owner: ActionItemOwner;
  status: ActionItemStatus;
  isCarriedOver?: boolean;
}

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  meetingToEdit: Meeting | null;
  actionItemsForMeeting: ActionItem[];
  historicalOpenItems: ActionItem[]; // Items to carry over on creation
  onSave: (
    meetingDate: string,
    notes: string,
    actionItems: { id?: string; description: string; owner: ActionItemOwner; status: ActionItemStatus }[],
    tags?: string[]
  ) => void;
  onDeleteMeeting?: (meetingId: string) => void;
}

const PRESET_TAGS = ['Career', 'Feedback', 'Engineering', 'Planning', 'Budget', 'Compensation', 'Personal'];

export default function MeetingModal({
  isOpen,
  onClose,
  person,
  meetingToEdit,
  actionItemsForMeeting,
  historicalOpenItems,
  onSave,
  onDeleteMeeting,
}: MeetingModalProps) {
  const [meetingDate, setMeetingDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingActionItem[]>([]);
  const actionItemsListRef = useRef<HTMLDivElement>(null);

  // Load / Reset State
  useEffect(() => {
    if (meetingToEdit) {
      setMeetingDate(meetingToEdit.meetingDate);
      setNotes(meetingToEdit.notes);
      setSelectedTags(meetingToEdit.tags || []);
      setPendingItems(
        actionItemsForMeeting.map((item) => ({
          id: item.id,
          description: item.description,
          owner: item.owner,
          status: item.status,
          isCarriedOver: false,
        }))
      );
    } else {
      // Setup default creation values
      const today = new Date().toISOString().slice(0, 10);
      setMeetingDate(today);
      setNotes('');
      setSelectedTags([]);

      // Auto-carry forward open action items
      const carried = historicalOpenItems.map((item) => ({
        description: item.description,
        owner: item.owner,
        status: 'open' as ActionItemStatus,
        isCarriedOver: true,
      }));
      setPendingItems(carried);
    }
  }, [meetingToEdit, actionItemsForMeeting, historicalOpenItems, isOpen]);

  const handleAddItem = () => {
    setPendingItems((prev) => [...prev, { description: '', owner: 'me', status: 'open' }]);
    // Scroll and focus next turn
    setTimeout(() => {
      if (actionItemsListRef.current) {
        const inputs = actionItemsListRef.current.querySelectorAll('input[type="text"]');
        if (inputs.length > 0) {
          (inputs[inputs.length - 1] as HTMLInputElement).focus();
        }
      }
    }, 50);
  };

  const handleUpdateItem = (index: number, field: keyof PendingActionItem, value: any) => {
    setPendingItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setPendingItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImportScratchpad = () => {
    if (person.scratchpad) {
      const delimiter = notes.trim() ? '\n\n' : '';
      setNotes((prev) => `${prev}${delimiter}${person.scratchpad}`);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validItems = pendingItems
      .map((item) => ({
        id: item.id,
        description: item.description.trim(),
        owner: item.owner,
        status: item.status,
      }))
      .filter((item) => item.description.length > 0);

    onSave(meetingDate, notes, validItems, selectedTags);
    onClose();
  };

  if (!isOpen) return null;

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
              <ClipboardList className="w-5 h-5 text-primary" />
              <h3 className="font-serif text-lg font-semibold">
                {meetingToEdit ? 'Edit Meeting Entry' : `Log a 1:1 with ${person.name}`}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-rule transition-colors text-ink-soft hover:text-ink cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Date Picker */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-full md:w-1/3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Meeting Date
                </label>
                <input
                  type="date"
                  required
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-paper border border-rule-strong rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all text-ink cursor-pointer"
                />
              </div>
              <div className="md:pt-5">
                <span className="text-xs bg-primary-soft text-primary px-2.5 py-1 rounded-full font-medium border border-primary/10">
                  {person.relationship === 'manager' ? 'Reporting to' : person.relationship === 'reportee' ? 'Direct Report' : 'Other sync'}
                </span>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Discussion Notes
                </label>
                {!meetingToEdit && person.scratchpad?.trim() && (
                  <button
                    type="button"
                    onClick={handleImportScratchpad}
                    className="text-[11px] font-bold text-primary hover:text-primary-strong bg-primary-soft border border-primary/25 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Import Scratchpad Agenda</span>
                  </button>
                )}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you talk about? Wins, blockers, feedback, and architectural contexts worth remembering..."
                rows={5}
                className="w-full px-4 py-3 bg-paper border border-rule-strong rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all text-ink placeholder:text-ink-soft/40 leading-relaxed font-sans"
              />
            </div>

            {/* Tag Selection Row */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                Select Discussion Categories (Tags)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TAGS.map((tag) => {
                  const isActive = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary text-paper-raised border-primary shadow-xs font-bold'
                          : 'border-rule-strong/60 hover:border-rule-strong text-ink-soft hover:text-ink bg-paper hover:bg-paper-raised'
                      }`}
                    >
                      {isActive ? `✓ ${tag}` : tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Items Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Action Items
                </label>
                {!meetingToEdit && historicalOpenItems.length > 0 && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-md border border-amber-200/20">
                    {historicalOpenItems.length} carried over
                  </span>
                )}
              </div>

              {/* Action Item Rows Container */}
              <div ref={actionItemsListRef} className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {pendingItems.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-rule-strong rounded-xl bg-paper/50">
                    <p className="text-xs text-ink-soft italic">No action items defined yet. Add some to track followups.</p>
                  </div>
                ) : (
                  pendingItems.map((item, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={index}
                      className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-paper border rounded-xl relative group transition-colors ${
                        item.isCarriedOver
                          ? 'border-amber-200 bg-amber-50/10 dark:border-amber-900/30'
                          : 'border-rule-strong hover:border-rule-strong'
                      }`}
                    >
                      {item.isCarriedOver && (
                        <div className="absolute top-0 left-4 -translate-y-1/2 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-amber-200">
                          Carried over
                        </div>
                      )}

                      {/* Description Input */}
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                        placeholder="e.g. Confirm performance spec and share benchmark schema"
                        className="flex-1 bg-transparent px-1 py-1 text-sm focus:outline-none text-ink placeholder:text-ink-soft/40 border-b border-transparent focus:border-primary/30"
                      />

                      {/* Configuration Controls */}
                      <div className="flex items-center gap-2 justify-between sm:justify-end border-t sm:border-t-0 border-rule/50 pt-2 sm:pt-0 shrink-0">
                        {/* Owner Selection */}
                        <div className="flex items-center bg-paper-raised border border-rule-strong rounded-lg p-0.5 shadow-xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(index, 'owner', 'me')}
                            className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all ${
                              item.owner === 'me'
                                ? 'bg-primary text-paper-raised shadow-xs'
                                : 'text-ink-soft hover:text-ink'
                            }`}
                          >
                            Me
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(index, 'owner', 'them')}
                            className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all ${
                              item.owner === 'them'
                                ? 'bg-amber-600 text-white dark:bg-amber-700 shadow-xs'
                                : 'text-ink-soft hover:text-ink'
                            }`}
                          >
                            Them
                          </button>
                        </div>

                        {/* Status Toggle (only when editing) */}
                        {meetingToEdit && (
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(index, 'status', item.status === 'open' ? 'done' : 'open')}
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                              item.status === 'done'
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-rule-strong hover:bg-paper-raised text-ink-soft'
                            }`}
                            title={item.status === 'done' ? 'Completed' : 'Open'}
                          >
                            <Check className="w-4 h-4 font-bold" />
                          </button>
                        )}

                        {/* Delete Row button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="w-7 h-7 rounded-lg border border-transparent hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-ink-soft hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Add row trigger button */}
              <button
                type="button"
                onClick={handleAddItem}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-strong transition-colors bg-primary-soft/40 hover:bg-primary-soft border border-dashed border-primary/20 hover:border-primary/40 w-full py-2.5 rounded-xl justify-center cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Action Item</span>
              </button>
            </div>
          </form>

          {/* Footer controls */}
          <div className="px-6 py-4 border-t border-rule bg-paper shrink-0 flex items-center justify-between">
            {meetingToEdit && onDeleteMeeting ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Delete this meeting entry permanently? This action cannot be undone.')) {
                    onDeleteMeeting(meetingToEdit.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Entry</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold border border-rule-strong rounded-xl hover:bg-paper-raised text-ink-soft hover:text-ink cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2.5 text-xs font-semibold bg-primary text-paper-raised rounded-xl hover:bg-primary-strong transition-colors cursor-pointer shadow-md"
              >
                {meetingToEdit ? 'Save Changes' : 'Log 1:1 Entry'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
