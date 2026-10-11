import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Settings,
  Download,
  Upload,
  AlertTriangle,
  ShieldCheck,
  FileSpreadsheet,
  Check,
  Users,
  CheckSquare,
  Sparkles,
  Calendar,
  Palette,
  Database,
} from 'lucide-react';
import { ThemeName, ThemePreset, Person, Meeting, ActionItem, DailyTask } from '../types';
import { exportMeetingsAndActionsToExcel, exportDailyTasksToExcel, getAvailableTaskYears } from '../utils/excelExport';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeName;
  onSelectTheme: (theme: ThemeName) => void;
  onBackup: () => void;
  onRestore: (file: File) => void;
  onClear: () => void;
  themePresets: ThemePreset[];
  people: Person[];
  meetings: Meeting[];
  actionItems: ActionItem[];
  dailyTasks: DailyTask[];
}

export type SettingsTab = 'general' | 'export' | 'data';

export default function SettingsModal({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  onBackup,
  onRestore,
  onClear,
  themePresets,
  people,
  meetings,
  actionItems,
  dailyTasks,
}: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active top navigation tab (General by default)
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Set of selected person IDs for 1:1 Excel export (default all selected)
  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<string>>(() => {
    return new Set(people.map((p) => p.id));
  });

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isExporting1on1, setIsExporting1on1] = useState(false);
  const [isExportingTasks, setIsExportingTasks] = useState(false);
  const [selectedTaskYear, setSelectedTaskYear] = useState<number | 'all'>('all');

  // Synchronize selection and default tab when the modal is opened
  useEffect(() => {
    if (isOpen) {
      setSelectedPersonIds(new Set(people.map((p) => p.id)));
      setActiveTab('general');
    }
  }, [isOpen, people]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onRestore(file);
    }
  };

  const handleTogglePerson = (personId: string) => {
    setSelectedPersonIds((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  };

  const handleSelectAllPeople = () => {
    setSelectedPersonIds(new Set(people.map((p) => p.id)));
  };

  const handleClearPeople = () => {
    setSelectedPersonIds(new Set());
  };

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 3500);
  };

  const handleExport1on1ToExcel = () => {
    if (selectedPersonIds.size === 0) return;
    setIsExporting1on1(true);
    try {
      const selected = people.filter((p) => selectedPersonIds.has(p.id));
      const success = exportMeetingsAndActionsToExcel(selected, meetings, actionItems);
      if (success) {
        showNotification(`Exported ${selected.length} 1:1 dossier${selected.length > 1 ? 's' : ''} to Excel (.xlsx)`);
      }
    } catch (err) {
      console.error('Failed to export 1:1 to Excel', err);
    } finally {
      setIsExporting1on1(false);
    }
  };

  const availableYears = getAvailableTaskYears(dailyTasks);

  const tasksInScope = selectedTaskYear === 'all'
    ? dailyTasks
    : dailyTasks.filter((t) => t.date && t.date.startsWith(selectedTaskYear.toString()));

  const completedTasksCount = tasksInScope.filter((t) => t.completed).length;
  const pendingTasksCount = tasksInScope.length - completedTasksCount;

  const handleExportTasksToExcel = () => {
    if (tasksInScope.length === 0) return;
    setIsExportingTasks(true);
    try {
      const success = exportDailyTasksToExcel(dailyTasks, { selectedYear: selectedTaskYear });
      if (success) {
        const scopeLabel = selectedTaskYear === 'all' ? 'all-time' : `year ${selectedTaskYear}`;
        showNotification(`Exported ${tasksInScope.length} tasks (${scopeLabel}) to Excel (.xlsx)`);
      }
    } catch (err) {
      console.error('Failed to export tasks to Excel', err);
    } finally {
      setIsExportingTasks(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="relative w-full max-w-2xl bg-paper-raised text-ink border border-rule-strong rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-rule shrink-0 bg-paper/60">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold leading-tight">Settings & Preferences</h3>
                <p className="text-xs text-ink-soft">Spreadsheet export, visual themes, and local storage backup</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-rule transition-colors text-ink-soft hover:text-ink cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Flash Notification Banner */}
          {notificationMsg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{notificationMsg}</span>
            </motion.div>
          )}

          {/* Top Horizontal Tab Navigation */}
          <div className="flex items-center gap-1 px-6 border-b border-rule bg-paper/50 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-all cursor-pointer -mb-px ${
                activeTab === 'general'
                  ? 'border-primary text-primary bg-primary-soft/20'
                  : 'border-transparent text-ink-soft hover:text-ink hover:bg-rule/30'
              }`}
            >
              <Palette className={`w-4 h-4 ${activeTab === 'general' ? 'text-primary' : 'text-ink-soft'}`} />
              <span>General</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-all cursor-pointer -mb-px ${
                activeTab === 'export'
                  ? 'border-primary text-primary bg-primary-soft/20'
                  : 'border-transparent text-ink-soft hover:text-ink hover:bg-rule/30'
              }`}
            >
              <FileSpreadsheet className={`w-4 h-4 ${activeTab === 'export' ? 'text-primary' : 'text-ink-soft'}`} />
              <span>Export</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-medium bg-rule text-ink-soft">
                .xlsx
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-all cursor-pointer -mb-px ${
                activeTab === 'data'
                  ? 'border-primary text-primary bg-primary-soft/20'
                  : 'border-transparent text-ink-soft hover:text-ink hover:bg-rule/30'
              }`}
            >
              <Database className={`w-4 h-4 ${activeTab === 'data' ? 'text-primary' : 'text-ink-soft'}`} />
              <span>Data & Backup</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* ======================================================== */}
            {/* TAB 1: GENERAL (Themes & Appearance)                     */}
            {/* ======================================================== */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-semibold text-ink">Visual Themes & Color Palette</h4>
                  </div>
                  <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                    Choose your preferred canvas theme. Themes configure typography contrast, paper warmth, and accent highlights for comfortable reading and focused 1:1 sessions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {themePresets.map((preset) => {
                    const isSelected = preset.name === currentTheme;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => onSelectTheme(preset.name)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer group ${
                          isSelected
                            ? 'border-primary bg-primary-soft/50 ring-2 ring-primary/20 shadow-xs'
                            : 'border-rule hover:border-rule-strong bg-paper/30 hover:bg-paper/80'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-xs font-semibold truncate ${isSelected ? 'text-primary' : 'text-ink'}`}>
                              {preset.label}
                            </p>
                            {isSelected && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-primary text-paper-raised">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-ink-soft leading-tight line-clamp-1">
                            {preset.description}
                          </p>
                        </div>

                        {/* Color dots preview */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-rule-strong/40 shadow-xs"
                            style={{ backgroundColor: preset.colors.paper }}
                            title="Paper background"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-rule-strong/40 shadow-xs"
                            style={{ backgroundColor: preset.colors.primary }}
                            title="Primary Accent"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-rule-strong/40 shadow-xs"
                            style={{ backgroundColor: preset.colors.navy }}
                            title="Sidebar Background"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Information callout */}
                <div className="p-3.5 rounded-xl border border-rule bg-paper/60 text-xs text-ink-soft flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-ink">Zero Setup Required:</span> Visual preferences are automatically stored in your local browser and persist across sessions.
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: EXPORT (Spreadsheet Workbooks)                    */}
            {/* ======================================================== */}
            {activeTab === 'export' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-sm font-semibold text-ink">Spreadsheet Export Center (.xlsx)</h4>
                  </div>
                  <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                    Download formatted Excel workbooks locally. Compatible with Microsoft Excel, Google Sheets, and Apple Numbers.
                  </p>
                </div>

                {/* Quick stats pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-xl border border-rule bg-paper/60 text-center">
                    <div className="text-sm font-bold text-ink tabular-nums">{people.length}</div>
                    <div className="text-[10px] text-ink-soft uppercase font-medium tracking-wider">Team Members</div>
                  </div>
                  <div className="p-2.5 rounded-xl border border-rule bg-paper/60 text-center">
                    <div className="text-sm font-bold text-ink tabular-nums">{meetings.length}</div>
                    <div className="text-[10px] text-ink-soft uppercase font-medium tracking-wider">1:1 Meetings</div>
                  </div>
                  <div className="p-2.5 rounded-xl border border-rule bg-paper/60 text-center">
                    <div className="text-sm font-bold text-ink tabular-nums">{actionItems.length}</div>
                    <div className="text-[10px] text-ink-soft uppercase font-medium tracking-wider">Action Items</div>
                  </div>
                  <div className="p-2.5 rounded-xl border border-rule bg-paper/60 text-center">
                    <div className="text-sm font-bold text-ink tabular-nums">{dailyTasks.length}</div>
                    <div className="text-[10px] text-ink-soft uppercase font-medium tracking-wider">Daily Tasks</div>
                  </div>
                </div>

                {/* Card 1: 1:1 Ledger Excel Export */}
                <div className="p-4 rounded-xl border border-rule-strong/80 bg-paper/40 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <h5 className="text-sm font-semibold text-ink">1:1 Meeting & Action Ledger Export</h5>
                      </div>
                      <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                        Select people to export. Generates a multi-sheet Excel file with an index overview and a dedicated sheet per person containing meeting logs and action items.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={handleSelectAllPeople}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-rule hover:border-rule-strong text-ink-soft hover:text-ink transition-colors cursor-pointer"
                      >
                        Select All
                      </button>
                      <button
                        onClick={handleClearPeople}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-rule hover:border-rule-strong text-ink-soft hover:text-ink transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* People Multi-select list */}
                  <div className="border border-rule rounded-xl overflow-hidden bg-paper-raised/70">
                    <div className="px-3 py-2 bg-paper/80 border-b border-rule flex items-center justify-between text-xs text-ink-soft font-medium">
                      <span>Select people to include in the workbook</span>
                      <span className="tabular-nums font-semibold text-ink">
                        {selectedPersonIds.size} of {people.length} selected
                      </span>
                    </div>

                    <div className="max-h-48 overflow-y-auto divide-y divide-rule/60">
                      {people.length === 0 ? (
                        <div className="p-4 text-center text-xs text-ink-soft">
                          No team members registered in the database yet.
                        </div>
                      ) : (
                        people.map((person) => {
                          const isSelected = selectedPersonIds.has(person.id);
                          const personMeetings = meetings.filter((m) => m.personId === person.id);
                          const personActions = actionItems.filter((i) => i.personId === person.id);
                          const openActions = personActions.filter((i) => i.status === 'open');

                          const relationshipBadge =
                            person.relationship === 'manager'
                              ? 'Manager'
                              : person.relationship === 'reportee'
                              ? 'Report'
                              : 'Peer';

                          return (
                            <div
                              key={person.id}
                              onClick={() => handleTogglePerson(person.id)}
                              className={`px-3 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-primary-soft/30 hover:bg-primary-soft/45'
                                  : 'hover:bg-paper/80 opacity-70'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Custom checkbox */}
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                    isSelected
                                      ? 'bg-primary border-primary text-paper-raised'
                                      : 'border-rule-strong bg-paper'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-ink truncate">{person.name}</span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-rule text-ink-soft">
                                      {relationshipBadge}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-ink-soft truncate">
                                    {person.role || 'Team Member'} · {personMeetings.length} meetings ·{' '}
                                    {personActions.length} actions ({openActions.length} open)
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Export 1:1 Button */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-ink-soft">
                      {selectedPersonIds.size === 0
                        ? 'Select at least 1 person to export'
                        : `Workbook will contain ${selectedPersonIds.size + 1} worksheets`}
                    </span>
                    <button
                      onClick={handleExport1on1ToExcel}
                      disabled={selectedPersonIds.size === 0 || isExporting1on1}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>{isExporting1on1 ? 'Generating Workbook...' : 'Export 1:1 to Excel (.xlsx)'}</span>
                    </button>
                  </div>
                </div>

                {/* Card 2: Daily Tasks & Year-End Excel Export */}
                <div className="p-4 rounded-xl border border-rule-strong/80 bg-paper/40 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <h5 className="text-sm font-semibold text-ink">Personal Daily Tasks & Year-End Export</h5>
                      </div>
                      <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                        Export your daily personal tasks to Excel. Choose <strong>All-Time Archive</strong> or filter by year for an <strong>End-of-Year Performance Review</strong> with monthly productivity trends.
                      </p>
                    </div>
                  </div>

                  {/* Timeframe / Year Selector Tabs */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-ink-soft font-medium">
                      <span>Export Scope & Timeframe:</span>
                      <span className="text-[11px] font-semibold text-primary">
                        {selectedTaskYear === 'all' ? 'Complete Archive' : `${selectedTaskYear} Year-End Review`}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-paper border border-rule rounded-xl">
                      <button
                        onClick={() => setSelectedTaskYear('all')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                          selectedTaskYear === 'all'
                            ? 'bg-paper-raised text-ink font-semibold shadow-xs border border-rule-strong'
                            : 'text-ink-soft hover:text-ink'
                        }`}
                      >
                        All-Time Archive ({dailyTasks.length})
                      </button>

                      {availableYears.map((year) => {
                        const countForYear = dailyTasks.filter(
                          (t) => t.date && t.date.startsWith(year.toString())
                        ).length;
                        return (
                          <button
                            key={year}
                            onClick={() => setSelectedTaskYear(year)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                              selectedTaskYear === year
                                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                                : 'text-ink-soft hover:text-ink'
                            }`}
                          >
                            {year} Year-End Review ({countForYear})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Helpful Year-End Explainer Banner */}
                  {selectedTaskYear !== 'all' && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Annual Retrospective Included:
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        The exported workbook will contain your {selectedTaskYear} task inventory, full velocity statistics, plus a dedicated <strong>Month-by-Month (Jan–Dec)</strong> breakdown with completion rates and priority counts.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-rule/50">
                    <div className="flex items-center gap-3 text-xs text-ink-soft">
                      <span className="font-semibold text-ink tabular-nums">{tasksInScope.length}</span> in scope
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                        {completedTasksCount} completed
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium tabular-nums">
                        {pendingTasksCount} pending
                      </span>
                    </div>

                    <button
                      onClick={handleExportTasksToExcel}
                      disabled={tasksInScope.length === 0 || isExportingTasks}
                      className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-strong disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-paper-raised text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {isExportingTasks
                          ? 'Generating...'
                          : selectedTaskYear === 'all'
                          ? 'Export All Tasks to Excel (.xlsx)'
                          : `Export ${selectedTaskYear} Year-End Review (.xlsx)`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: DATA & BACKUP (Database, Restore, Clean Slate)    */}
            {/* ======================================================== */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-semibold text-ink">Database Storage & Local Backup</h4>
                  </div>
                  <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                    This applet runs <strong className="text-ink">100% locally in your browser</strong>. All team members, meetings, action items, and personal tasks remain private on your machine.
                  </p>
                </div>

                {/* Database Summary Box */}
                <div className="p-4 rounded-xl border border-rule bg-paper/50 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-ink">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Current Local Storage Inventory
                    </span>
                    <span className="text-[11px] text-ink-soft font-normal">Browser LocalStorage</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-paper-raised border border-rule">
                      <div className="text-base font-bold text-ink tabular-nums">{people.length}</div>
                      <div className="text-[10px] text-ink-soft uppercase font-medium">People</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-paper-raised border border-rule">
                      <div className="text-base font-bold text-ink tabular-nums">{meetings.length}</div>
                      <div className="text-[10px] text-ink-soft uppercase font-medium">Meetings</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-paper-raised border border-rule">
                      <div className="text-base font-bold text-ink tabular-nums">{actionItems.length}</div>
                      <div className="text-[10px] text-ink-soft uppercase font-medium">Action Items</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-paper-raised border border-rule">
                      <div className="text-base font-bold text-ink tabular-nums">{dailyTasks.length}</div>
                      <div className="text-[10px] text-ink-soft uppercase font-medium">Daily Tasks</div>
                    </div>
                  </div>
                </div>

                {/* Backup & Restore Controls */}
                <div className="p-4 rounded-xl border border-rule-strong/80 bg-paper/40 space-y-3">
                  <div>
                    <h5 className="text-sm font-semibold text-ink">Full Database JSON Backup & Restore</h5>
                    <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                      Export your entire database snapshot to a file to move between browsers, keep backups, or restore at any time.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={onBackup}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-rule-strong hover:bg-paper rounded-xl text-xs font-semibold text-ink cursor-pointer transition-colors shadow-xs"
                    >
                      <Download className="w-4 h-4 text-primary" />
                      <span>Backup JSON Database</span>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-rule-strong hover:bg-paper rounded-xl text-xs font-semibold text-ink cursor-pointer transition-colors shadow-xs"
                    >
                      <Upload className="w-4 h-4 text-primary" />
                      <span>Restore JSON Database</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="p-4 rounded-xl border border-rose-300/80 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 space-y-3">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <h5 className="text-xs font-bold uppercase tracking-wider">Danger Zone</h5>
                  </div>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    Permanently clear all logged meetings, action items, team member profiles, and daily tasks from this browser. This action cannot be reversed.
                  </p>

                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          'CRITICAL ACTION: This permanently clears all logged meetings, action items, people profiles, and daily tasks from this browser. This cannot be undone. Proceed?'
                        )
                      ) {
                        onClear();
                        onClose();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 hover:border-rose-300 bg-rose-50/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold text-rose-600 dark:text-rose-400 cursor-pointer transition-all"
                  >
                    Reset Database Clean Slate
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-rule bg-paper shrink-0 flex items-center justify-between">
            <span className="text-[11px] text-ink-soft">
              All exports & backups process in your browser.
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold bg-primary text-paper-raised rounded-xl hover:bg-primary-strong transition-colors cursor-pointer shadow-sm"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
