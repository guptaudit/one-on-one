import { motion, AnimatePresence } from 'motion/react';
import { X, CheckSquare, Sparkles, Check } from 'lucide-react';
import { Person, ActionItem } from '../types';

interface OpenItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  actionItems: ActionItem[];
  onToggleStatus: (id: string, currentStatus: 'open' | 'done') => void;
}

export default function OpenItemsModal({
  isOpen,
  onClose,
  people,
  actionItems,
  onToggleStatus,
}: OpenItemsModalProps) {
  if (!isOpen) return null;

  // Filter only active, non-archived people's open items
  const activePeopleMap = new Map(people.filter((p) => !p.archived).map((p) => [p.id, p]));
  const openItems = actionItems.filter((item) => item.status === 'open' && activePeopleMap.has(item.personId));

  // Group items by person
  const groupedItems: { [personId: string]: { person: Person; items: ActionItem[] } } = {};
  openItems.forEach((item) => {
    const person = activePeopleMap.get(item.personId);
    if (!person) return;
    if (!groupedItems[item.personId]) {
      groupedItems[item.personId] = { person, items: [] };
    }
    groupedItems[item.personId].items.push(item);
  });

  const groupedArray = Object.values(groupedItems).sort((a, b) =>
    a.person.name.localeCompare(b.person.name)
  );

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
          className="relative w-full max-w-xl bg-paper-raised text-ink border border-rule-strong rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-rule shrink-0">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />
              <h3 className="font-serif text-lg font-semibold">Master Actions Backlog</h3>
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
            {openItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center text-emerald-500 shadow-inner">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-md font-medium text-ink">All caught up!</h4>
                  <p className="text-xs text-ink-soft max-w-xs">There are no open action items across your team ledger. Great job managing follow-ups!</p>
                </div>
              </div>
            ) : (
              groupedArray.map(({ person, items }) => (
                <div key={person.id} className="space-y-2.5">
                  <div className="flex items-baseline gap-2 pb-1 border-b border-rule shrink-0">
                    <h4 className="font-serif text-sm font-semibold text-ink">{person.name}</h4>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-ink-soft/60">
                      {person.relationship === 'manager' ? 'VP / Manager' : person.relationship === 'reportee' ? 'Direct Report' : 'Other Sync'}
                    </span>
                    <span className="text-xs text-ink-soft font-mono ml-auto">
                      {items.length} item{items.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Grouped Actions List */}
                  <div className="space-y-2">
                    {items.map((item) => (
                      <motion.div
                        layoutId={`open-item-${item.id}`}
                        key={item.id}
                        className="flex items-start gap-3 p-3 bg-paper hover:bg-primary-soft/10 border border-rule-strong rounded-xl transition-all group"
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => onToggleStatus(item.id, 'open')}
                          className="w-5 h-5 rounded-md border-1.5 border-rule-strong hover:border-primary shrink-0 mt-0.5 flex items-center justify-center bg-paper-raised transition-all cursor-pointer hover:bg-emerald-500 hover:border-emerald-500 group-hover:scale-105"
                          title="Complete Item"
                        >
                          <Check className="w-3 h-3 text-transparent hover:text-white" />
                        </button>

                        {/* Description */}
                        <span className="flex-1 text-sm leading-relaxed text-ink font-medium">
                          {item.description}
                        </span>

                        {/* Owner Badge */}
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md self-center shrink-0 ${
                            item.owner === 'me'
                              ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border border-violet-200/10'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/10'
                          }`}
                        >
                          {item.owner === 'me' ? 'Me' : 'Them'}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-rule bg-paper shrink-0 flex items-center justify-between">
            <span className="text-xs text-ink-soft font-medium">
              {openItems.length} total active action item{openItems.length !== 1 ? 's' : ''}.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-primary text-paper-raised rounded-xl hover:bg-primary-strong transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
