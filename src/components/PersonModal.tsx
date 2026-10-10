import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, UserCheck, Trash2 } from 'lucide-react';
import { Person, RelationshipType } from '../types';

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  personToEdit: Person | null;
  initialRelationship: RelationshipType;
  onSave: (name: string, role: string, relationship: RelationshipType) => void;
  onRemove?: (id: string) => void;
}

export default function PersonModal({
  isOpen,
  onClose,
  personToEdit,
  initialRelationship,
  onSave,
  onRemove,
}: PersonModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>('reportee');

  useEffect(() => {
    if (personToEdit) {
      setName(personToEdit.name);
      setRole(personToEdit.role);
      setRelationship(personToEdit.relationship);
    } else {
      setName('');
      setRole('');
      setRelationship(initialRelationship);
    }
  }, [personToEdit, initialRelationship, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), role.trim(), relationship);
    onClose();
  };

  if (!isOpen) return null;

  const relationshipLabels = {
    manager: 'Manager',
    reportee: 'Reportee',
    other: 'Stakeholder / Peer',
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
          className="relative w-full max-w-md bg-paper-raised text-ink border border-rule-strong rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-rule">
            <div className="flex items-center gap-2">
              {personToEdit ? (
                <UserCheck className="w-5 h-5 text-primary" />
              ) : (
                <UserPlus className="w-5 h-5 text-primary" />
              )}
              <h3 className="font-serif text-lg font-semibold">
                {personToEdit ? 'Edit Profile' : `Add ${relationshipLabels[relationship]}`}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-rule transition-colors text-ink-soft hover:text-ink"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="person-name" className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
                Full Name
              </label>
              <input
                id="person-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Lee"
                className="w-full px-3.5 py-2.5 bg-paper border border-rule-strong rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all text-ink placeholder:text-ink-soft/40"
              />
            </div>

            <div>
              <label htmlFor="person-role" className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
                Role / Title <span className="text-xs font-normal lowercase italic text-ink-soft/60">(optional)</span>
              </label>
              <input
                id="person-role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Staff Software Engineer"
                className="w-full px-3.5 py-2.5 bg-paper border border-rule-strong rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all text-ink placeholder:text-ink-soft/40"
              />
            </div>

            {!personToEdit && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
                  Relationship Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['manager', 'reportee', 'other'] as RelationshipType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRelationship(type)}
                      className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                        relationship === type
                          ? 'border-primary bg-primary-soft text-primary font-semibold'
                          : 'border-rule-strong hover:bg-paper text-ink-soft'
                      }`}
                    >
                      {type === 'manager' ? 'Manager' : type === 'reportee' ? 'Reportee' : 'Other / Peer'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-rule mt-6">
              {personToEdit && onRemove ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Archive ${personToEdit.name}? This hides them from the active team list but keeps all logged meeting history.`)) {
                      onRemove(personToEdit.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Archive</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium border border-rule-strong rounded-xl hover:bg-paper transition-colors text-ink-soft hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-4 py-2 text-xs font-medium bg-primary text-paper-raised rounded-xl hover:bg-primary-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm font-semibold"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
