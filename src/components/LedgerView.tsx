import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Person, Meeting, ActionItem, ActionItemStatus } from '../types';
import { 
  Edit2, 
  Mail, 
  Plus, 
  AlertCircle, 
  Calendar, 
  CalendarCheck, 
  Check, 
  UserPen, 
  Sparkles, 
  Lightbulb, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  FlameKindling,
  FileSpreadsheet
} from 'lucide-react';
import { exportMeetingsAndActionsToExcel } from '../utils/excelExport';

interface LedgerViewProps {
  person: Person;
  meetings: Meeting[];
  actionItems: ActionItem[];
  onEditPersonClick: () => void;
  onEmailDraftClick: () => void;
  onLogMeetingClick: () => void;
  onEditMeetingClick: (meeting: Meeting) => void;
  onToggleActionItem: (id: string, currentStatus: ActionItemStatus) => void;
  onUpdateScratchpad: (personId: string, text: string) => void;
}

const COACHING_PROMPTS = [
  { text: 'What was your biggest win or proudest achievement recently?', label: 'Highlight Wins' },
  { text: 'Where are you currently feeling most challenged or blocked?', label: 'Check Blockers' },
  { text: 'What goals or skills do you want to prioritize in the next 3 months?', label: 'Career Growth' },
  { text: 'What feedback do you have for me or the team this week?', label: 'Ask Feedback' },
];

export default function LedgerView({
  person,
  meetings,
  actionItems,
  onEditPersonClick,
  onEmailDraftClick,
  onLogMeetingClick,
  onEditMeetingClick,
  onToggleActionItem,
  onUpdateScratchpad,
}: LedgerViewProps) {
  // Local toggles for coaching suggestions and scratchpad section collapse
  const [scratchpadExpanded, setScratchpadExpanded] = useState(true);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Get meetings in descending order (newest first)
  const sortedMeetings = [...meetings]
    .filter((m) => m.personId === person.id)
    .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate) || b.createdAt.localeCompare(a.createdAt));

  // Extract all unique tags used across this person's meetings
  const allUniqueTags = Array.from(
    new Set(sortedMeetings.flatMap((m) => m.tags || []))
  ).sort();

  // Filter meetings if tag filter is active
  const filteredMeetings = selectedTagFilter
    ? sortedMeetings.filter((m) => m.tags?.includes(selectedTagFilter))
    : sortedMeetings;

  // Get action items for this person
  const personActionItems = actionItems.filter((item) => item.personId === person.id);
  const openActionItems = personActionItems.filter((item) => item.status === 'open');

  // Compute carried counters
  const mineCount = openActionItems.filter((i) => i.owner === 'me').length;
  const theirsCount = openActionItems.filter((i) => i.owner === 'them').length;

  const formatDateLong = (iso: string) => {
    const dateObj = new Date(iso + 'T00:00:00');
    return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getRelativeDate = (iso: string) => {
    const then = new Date(iso + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - then.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays === -1) return 'tomorrow';
    if (diffDays > 1 && diffDays < 14) return `${diffDays} days ago`;
    if (diffDays < -1 && diffDays > -14) return `in ${-diffDays} days`;

    const weeks = Math.round(diffDays / 7);
    if (diffDays > 0) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    return `in ${-weeks} week${-weeks === 1 ? '' : 's'}`;
  };

  const handleAppendPrompt = (promptText: string) => {
    const currentText = person.scratchpad || '';
    const delimiter = currentText.trim() ? '\n\n' : '';
    const newText = `${currentText}${delimiter}- ${promptText}`;
    onUpdateScratchpad(person.id, newText);
  };

  const relationshipLabels = {
    manager: 'VP / Manager',
    reportee: 'Direct Report',
    other: 'Stakeholder / Peer',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Selected Person Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-rule">
        <div className="space-y-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-soft">
            {relationshipLabels[person.relationship]}
          </span>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-ink">
            {person.name}
          </h2>
          {person.role && (
            <p className="text-sm text-ink-soft">{person.role}</p>
          )}
        </div>

        {/* Header CTA Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onEditPersonClick}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-rule-strong hover:bg-paper-raised text-ink transition-colors cursor-pointer rounded-xl shadow-xs"
            title="Edit Person Profile"
          >
            <UserPen className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => exportMeetingsAndActionsToExcel([person], meetings, actionItems)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-rule-strong hover:bg-paper-raised text-ink transition-colors cursor-pointer rounded-xl shadow-xs"
            title="Export this person's 1:1 dossier to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={onEmailDraftClick}
            disabled={sortedMeetings.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary-soft text-primary hover:bg-primary/15 border border-primary/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary-soft transition-colors cursor-pointer rounded-xl"
            title="Generate Email Draft Summary"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Summary</span>
          </button>

          <button
            onClick={onLogMeetingClick}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-primary hover:bg-primary-strong text-paper-raised transition-colors cursor-pointer rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Log a 1:1</span>
          </button>
        </div>
      </div>

      {/* Preparation Agenda Scratchpad Card */}
      <div className="bg-paper border border-rule-strong/60 rounded-2xl overflow-hidden shadow-xs">
        <button
          onClick={() => setScratchpadExpanded(!scratchpadExpanded)}
          className="w-full flex items-center justify-between px-5 py-4 bg-paper hover:bg-paper-raised transition-colors cursor-pointer border-b border-rule/50"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-ink select-none">
              1:1 Agenda Scratchpad
            </span>
            {person.scratchpad?.trim() && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-ink-soft bg-paper-raised border border-rule px-1.5 py-0.5 rounded-md">
              {person.scratchpad?.trim() ? 'Draft Active' : 'Ready'}
            </span>
            {scratchpadExpanded ? (
              <ChevronUp className="w-4 h-4 text-ink-soft" />
            ) : (
              <ChevronDown className="w-4 h-4 text-ink-soft" />
            )}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {scratchpadExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <p className="text-[11px] text-ink-soft leading-relaxed">
                  Draft discussion ideas, feedback, or coaching questions before meeting. 
                  When you log the 1:1, you can import this draft with a single click. 
                  Your scratchpad clears automatically once logged!
                </p>

                <textarea
                  value={person.scratchpad || ''}
                  onChange={(e) => onUpdateScratchpad(person.id, e.target.value)}
                  placeholder="Review Jordan's promo proposal criteria, check on database bottleneck speed, ask about growth bottlenecks..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-paper-raised border border-rule-strong focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all text-sm rounded-xl text-ink placeholder:text-ink-soft/40 font-sans leading-relaxed"
                />

                {/* Question prompts / Spark seeds */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-ink-soft font-semibold">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Inspiration: Add Coaching Prompts</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {COACHING_PROMPTS.map((prompt) => (
                      <button
                        key={prompt.label}
                        type="button"
                        onClick={() => handleAppendPrompt(prompt.text)}
                        className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-rule hover:border-primary/25 hover:bg-primary-soft transition-colors cursor-pointer text-ink-soft hover:text-primary"
                        title={prompt.text}
                      >
                        + {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Carried action items notification banner */}
      {openActionItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-300 shadow-xs"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Active Actions Carried Forward
            </p>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
              {openActionItems.length} active follow-up{openActionItems.length !== 1 ? 's' : ''} ({mineCount} on you, {theirsCount} on them) will be brought into your next discussion automatically.
            </p>
          </div>
        </motion.div>
      )}

      {/* Timeline Section Title & Topic Tags Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-serif text-lg font-bold text-ink">
            Discussion History
          </h3>

          {/* Filter row */}
          {allUniqueTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-ink-soft tracking-wider flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3 text-primary" />
                Filter by Topic:
              </span>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSelectedTagFilter(null)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                    selectedTagFilter === null
                      ? 'bg-primary text-paper-raised border-primary shadow-xs'
                      : 'border-rule text-ink-soft hover:bg-paper-raised'
                  }`}
                >
                  All
                </button>
                {allUniqueTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTagFilter(tag)}
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer ${
                      selectedTagFilter === tag
                        ? 'bg-primary text-paper-raised border-primary shadow-xs'
                        : 'border-rule text-ink-soft hover:bg-paper-raised'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected tag notification */}
        {selectedTagFilter && (
          <div className="flex items-center gap-2 bg-primary-soft border border-primary/10 rounded-xl px-3.5 py-1.5 text-xs text-primary font-medium animate-fadeIn">
            <span>Showing discussions tagged with: <strong>{selectedTagFilter}</strong></span>
            <button
              onClick={() => setSelectedTagFilter(null)}
              className="ml-auto p-0.5 rounded hover:bg-primary/10 text-primary cursor-pointer"
              title="Clear Filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Timeline Ledger List Section */}
        <div className="relative pl-7 border-l border-rule-strong/60 space-y-8 py-2">
          {filteredMeetings.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-rule-strong bg-paper/30 rounded-2xl space-y-3">
              <Calendar className="w-8 h-8 text-ink-soft/40 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-serif text-sm font-semibold text-ink">
                  {selectedTagFilter ? 'No items match filter' : 'No 1:1s recorded yet'}
                </h4>
                <p className="text-xs text-ink-soft max-w-xs mx-auto">
                  {selectedTagFilter 
                    ? 'Try selecting "All" or picking a different topic filter.'
                    : 'Keep a dated log of discussions, align on promotion goals, and track action items seamlessly.'
                  }
                </p>
              </div>
              {selectedTagFilter ? (
                <button
                  onClick={() => setSelectedTagFilter(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold border border-rule-strong rounded-xl hover:bg-paper-raised text-ink cursor-pointer"
                >
                  Clear Tag Filter
                </button>
              ) : (
                <button
                  onClick={onLogMeetingClick}
                  className="px-4 py-2 text-xs font-bold bg-primary text-paper-raised hover:bg-primary-strong rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Log your first meeting
                </button>
              )}
            </div>
          ) : (
            filteredMeetings.map((meeting) => {
              const meetingItems = personActionItems.filter((i) => i.meetingId === meeting.id);
              const activeCount = meetingItems.filter((i) => i.status === 'open').length;

              return (
                <div key={meeting.id} className="relative group space-y-3">
                  {/* Timeline node marker - colored amber if meeting has incomplete actions, transparent-hollow if none */}
                  <span className={`absolute -left-[35px] top-[6px] w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                    activeCount > 0
                      ? 'bg-amber-400 border-amber-400'
                      : 'bg-paper border-primary'
                  }`} />

                  {/* Entry Date Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xs font-bold text-ink flex items-center gap-1.5">
                        <CalendarCheck className="w-3.5 h-3.5 text-primary" />
                        {formatDateLong(meeting.meetingDate)}
                      </span>
                      <span className="text-[11px] text-ink-soft">
                        • {getRelativeDate(meeting.meetingDate)}
                      </span>
                    </div>

                    {/* Inline Edit button */}
                    <button
                      onClick={() => onEditMeetingClick(meeting)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center gap-1 text-[11px] text-ink-soft hover:text-primary cursor-pointer border border-rule hover:border-primary/20 rounded-lg px-2 py-1 bg-paper-raised shadow-xs"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Log</span>
                    </button>
                  </div>

                  {/* Entry Body Notes */}
                  <div className="space-y-4 bg-paper-raised border border-rule-strong/40 rounded-2xl p-5 shadow-xs">
                    {/* Render Category Badges */}
                    {meeting.tags && meeting.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pb-1">
                        {meeting.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-semibold uppercase tracking-wider bg-primary-soft text-primary px-2 py-0.5 rounded-md border border-primary/10"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {meeting.notes.trim() ? (
                      <div className="text-sm leading-relaxed text-ink whitespace-pre-wrap font-sans">
                        {meeting.notes}
                      </div>
                    ) : (
                      <p className="text-xs text-ink-soft italic">No notes recorded for this discussion.</p>
                    )}

                    {/* Inline Action Items Sub list */}
                    {meetingItems.length > 0 && (
                      <div className="pt-3 border-t border-rule/50 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                          Discussion Actions
                        </p>
                        
                        <div className="space-y-1.5">
                          {meetingItems.map((item) => {
                            const isDone = item.status === 'done';
                            return (
                              <div
                                key={item.id}
                                className="flex items-start gap-2.5 text-xs bg-paper border border-rule-strong/30 rounded-lg p-2.5 group/item hover:border-rule-strong"
                              >
                                {/* Inline check toggle */}
                                <button
                                  onClick={() => onToggleActionItem(item.id, item.status)}
                                  className={`w-4 h-4 rounded border shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer ${
                                    isDone
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'border-rule-strong bg-paper-raised group-hover/item:border-primary'
                                  }`}
                                >
                                  {isDone && <Check className="w-2.5 h-2.5 font-bold" />}
                                </button>

                                {/* Description Text */}
                                <span className={`flex-1 text-xs leading-relaxed ${isDone ? 'line-through text-ink-soft/60' : 'text-ink font-medium'}`}>
                                  {item.description}
                                </span>

                                {/* Owner Indicator badge */}
                                <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md self-center shrink-0 ${
                                  item.owner === 'me'
                                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}>
                                  {item.owner === 'me' ? 'Me' : 'Them'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
