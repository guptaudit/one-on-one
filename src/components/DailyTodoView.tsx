import { useState, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Trash2,
  AlertCircle,
  Tag,
  ArrowRight,
  Flame,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Inbox,
  ListTodo,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react';
import { DailyTask, TaskPriority } from '../types';
import { TODO_CATEGORIES } from './Sidebar';
import { exportDailyTasksToExcel, getAvailableTaskYears } from '../utils/excelExport';

interface DailyTodoViewProps {
  tasks: DailyTask[];
  onAddTask: (task: Omit<DailyTask, 'id' | 'createdAt'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onCarryOverTasks: (taskIds: string[], targetDate: string) => void;

  // Controlled Filter & Navigation State
  selectedDate: string;
  onSelectDate: (date: string) => void;
  viewMode: 'date' | 'overdue' | 'all';
  onSelectViewMode: (mode: 'date' | 'overdue' | 'all') => void;
  statusFilter: 'all' | 'active' | 'completed';
  onSelectStatusFilter: (status: 'all' | 'active' | 'completed') => void;
  priorityFilter: 'all' | TaskPriority;
  onSelectPriorityFilter: (priority: 'all' | TaskPriority) => void;
  categoryFilter: string;
  onSelectCategoryFilter: (category: string) => void;
}

export default function DailyTodoView({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onCarryOverTasks,
  selectedDate,
  onSelectDate,
  viewMode,
  onSelectViewMode,
  statusFilter,
  onSelectStatusFilter,
  priorityFilter,
  onSelectPriorityFilter,
  categoryFilter,
  onSelectCategoryFilter,
}: DailyTodoViewProps) {
  // Current local ISO date for "Today"
  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Quick task creation form states
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newCategory, setNewCategory] = useState<string>('Deep Work');

  // Excel export dropdown menu state
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const availableYears = useMemo(() => getAvailableTaskYears(tasks), [tasks]);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Compute overdue / unfinished tasks from dates before today
  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => t.date < todayIso && !t.completed);
  }, [tasks, todayIso]);

  // Tasks matching the current view mode
  const baseTasks = useMemo(() => {
    if (viewMode === 'overdue') {
      return overdueTasks;
    }
    if (viewMode === 'all') {
      return tasks;
    }
    // Default: 'date' mode
    return tasks.filter((t) => t.date === selectedDate);
  }, [tasks, viewMode, selectedDate, overdueTasks]);

  // Filtered tasks by status, priority, category
  const filteredTasks = useMemo(() => {
    return baseTasks.filter((t) => {
      if (statusFilter === 'active' && t.completed) return false;
      if (statusFilter === 'completed' && !t.completed) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      return true;
    });
  }, [baseTasks, statusFilter, priorityFilter, categoryFilter]);

  // Metrics for active date
  const dateTasks = useMemo(() => tasks.filter((t) => t.date === selectedDate), [tasks, selectedDate]);
  const completedCount = dateTasks.filter((t) => t.completed).length;
  const totalCount = dateTasks.length;
  const pendingCount = dateTasks.filter((t) => !t.completed).length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Date Shift Helpers
  const shiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    const newYear = dateObj.getFullYear();
    const newMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newDay = String(dateObj.getDate()).padStart(2, '0');
    onSelectViewMode('date');
    onSelectDate(`${newYear}-${newMonth}-${newDay}`);
  };

  const isToday = selectedDate === todayIso;

  const formatDateDisplay = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Form submit handler
  const handleCreateTask = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Target date for task creation: if in overdue or all mode, default to today
    const targetDate = viewMode === 'date' ? selectedDate : todayIso;

    onAddTask({
      title: newTitle.trim(),
      date: targetDate,
      completed: false,
      priority: newPriority,
      category: newCategory || undefined,
    });

    setNewTitle('');
  };

  const handleCarryOverAll = () => {
    const ids = overdueTasks.map((t) => t.id);
    onCarryOverTasks(ids, selectedDate);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header Strip & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-rule">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-soft">
              {viewMode === 'overdue'
                ? 'Action Required'
                : viewMode === 'all'
                ? 'Master Index'
                : isToday
                ? 'Today’s Agenda'
                : 'Daily Schedule'}
            </span>
            {viewMode === 'date' && isToday && (
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                Today
              </span>
            )}
            {viewMode === 'overdue' && (
              <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                Overdue Filter
              </span>
            )}
            {viewMode === 'all' && (
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                All Dates
              </span>
            )}
          </div>

          <h2 className="font-serif text-3xl font-bold tracking-tight text-ink">
            {viewMode === 'overdue'
              ? 'Overdue & Past Due'
              : viewMode === 'all'
              ? 'All Personal Tasks'
              : formatDateDisplay(selectedDate)}
          </h2>
        </div>

        {/* Date Navigation & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {viewMode !== 'date' ? (
            <button
              onClick={() => {
                onSelectViewMode('date');
                onSelectDate(todayIso);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-raised hover:bg-paper border border-rule-strong rounded-xl text-xs font-semibold text-ink transition-colors cursor-pointer shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span>Back to Today</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-paper-raised border border-rule-strong rounded-xl p-0.5 shadow-xs">
                <button
                  onClick={() => shiftDate(-1)}
                  className="p-1.5 rounded-lg hover:bg-paper text-ink transition-colors cursor-pointer"
                  title="Previous Day"
                  aria-label="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onSelectViewMode('date');
                    onSelectDate(todayIso);
                  }}
                  disabled={isToday}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    isToday
                      ? 'bg-primary text-paper-raised shadow-xs'
                      : 'text-ink-soft hover:text-ink hover:bg-paper'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => shiftDate(1)}
                  className="p-1.5 rounded-lg hover:bg-paper text-ink transition-colors cursor-pointer"
                  title="Next Day"
                  aria-label="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Date Input */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    onSelectViewMode('date');
                    onSelectDate(e.target.value);
                  }
                }}
                className="px-2.5 py-1.5 bg-paper-raised border border-rule-strong rounded-xl text-xs font-mono text-ink focus:outline-none focus:border-primary cursor-pointer shadow-xs"
              />
            </div>
          )}

          {/* Quick Export Tasks to Excel with Year-End options */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen((prev) => !prev)}
              disabled={tasks.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-raised hover:bg-paper border border-rule-strong disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-semibold text-ink transition-colors cursor-pointer shadow-xs"
              title="Export tasks to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Export Excel</span>
              <ChevronDown className="w-3 h-3 text-ink-soft" />
            </button>

            {exportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setExportMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-68 bg-paper-raised border border-rule-strong rounded-xl shadow-xl z-40 p-2 text-xs divide-y divide-rule/60 animate-in fade-in slide-in-from-top-1">
                  <div className="pb-1.5">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                      Export Scope
                    </div>
                    <button
                      onClick={() => {
                        exportDailyTasksToExcel(tasks, { selectedYear: 'all' });
                        setExportMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-paper transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-ink">All-Time Archive</div>
                        <div className="text-[11px] text-ink-soft">All {tasks.length} tasks recorded</div>
                      </div>
                      <span className="text-[10px] text-ink-soft font-mono font-semibold">.xlsx</span>
                    </button>
                  </div>

                  <div className="pt-1.5 space-y-1">
                    <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Annual / Year-End Review
                    </div>
                    {availableYears.map((year) => {
                      const countForYear = tasks.filter((t) => t.date && t.date.startsWith(year.toString())).length;
                      return (
                        <button
                          key={year}
                          onClick={() => {
                            exportDailyTasksToExcel(tasks, { selectedYear: year });
                            setExportMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/10 text-ink transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <div className="font-semibold text-ink flex items-center gap-1.5">
                              <span>{year} Year-End Review</span>
                              {year === currentYear && (
                                <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded font-bold">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-ink-soft">With monthly velocity breakdown</div>
                          </div>
                          <span className="font-mono text-[11px] text-ink-soft tabular-nums font-semibold">{countForYear}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Productivity Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-paper-raised border border-rule-strong/60 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
              Day Completion
            </span>
            <p className="font-mono text-xl font-bold text-ink tabular-nums">
              {percentComplete}%
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-paper-raised border border-rule-strong/60 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
              Completed Today
            </span>
            <p className="font-mono text-xl font-bold text-ink tabular-nums">
              {completedCount} <span className="text-xs text-ink-soft font-normal">of {totalCount}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-paper-raised border border-rule-strong/60 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
              Remaining Focus
            </span>
            <p className="font-mono text-xl font-bold text-ink tabular-nums">
              {pendingCount} <span className="text-xs text-ink-soft font-normal">pending</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Overdue / Carry-over Banner */}
      {overdueTasks.length > 0 && viewMode === 'date' && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 shadow-xs"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-amber-900 dark:text-amber-200">
                {overdueTasks.length} unfinished personal task{overdueTasks.length > 1 ? 's' : ''} from previous days
              </p>
              <p className="text-amber-800/80 dark:text-amber-300/80 text-[11px]">
                Bring these forward to keep your daily focus on track.
              </p>
            </div>
          </div>
          <button
            onClick={handleCarryOverAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Carry Over to {isToday ? 'Today' : 'This Date'}</span>
          </button>
        </motion.div>
      )}

      {/* Personal Task Creation Form */}
      <form
        onSubmit={handleCreateTask}
        className="bg-paper-raised border border-rule-strong rounded-2xl p-4 shadow-xs space-y-3"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={`Add a personal task for ${viewMode === 'date' ? (isToday ? 'today' : selectedDate) : 'today'}...`}
            className="flex-1 px-3.5 py-2.5 bg-paper border border-rule-strong rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all text-ink placeholder:text-ink-soft/40"
          />
          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="px-4 py-2.5 bg-primary hover:bg-primary-strong disabled:opacity-40 disabled:cursor-not-allowed text-paper-raised font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Priority & Category Tag Selectors */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-ink-soft">
          {/* Priority selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider">Priority:</span>
            <div className="flex bg-paper border border-rule-strong rounded-lg p-0.5">
              {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setNewPriority(p)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-all cursor-pointer ${
                    newPriority === p
                      ? p === 'high'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : p === 'medium'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-600 text-white shadow-xs'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Category tag selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider">Category:</span>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="bg-paper border border-rule-strong rounded-lg px-2.5 py-1 text-xs text-ink focus:outline-none focus:border-primary cursor-pointer"
            >
              {TODO_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {/* Filter and View Mode Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1 bg-paper border border-rule-strong rounded-xl p-1 w-fit shadow-xs">
          {(['all', 'active', 'completed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => onSelectStatusFilter(filter)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === filter
                  ? 'bg-primary text-paper-raised shadow-xs'
                  : 'text-ink-soft hover:text-ink hover:bg-paper-raised'
              }`}
            >
              {filter === 'all' ? `All (${baseTasks.length})` : filter}
            </button>
          ))}
        </div>

        {/* Priority & Category filter dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={priorityFilter}
            onChange={(e) => onSelectPriorityFilter(e.target.value as any)}
            className="bg-paper border border-rule-strong rounded-xl px-2.5 py-1 text-xs text-ink focus:outline-none focus:border-primary cursor-pointer shadow-xs"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => onSelectCategoryFilter(e.target.value)}
            className="bg-paper border border-rule-strong rounded-xl px-2.5 py-1 text-xs text-ink focus:outline-none focus:border-primary cursor-pointer shadow-xs"
          >
            <option value="all">All Categories</option>
            {TODO_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-rule-strong rounded-2xl bg-paper/40 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-paper-raised border border-rule-strong/80 text-ink-soft/40 mx-auto flex items-center justify-center">
              <ListTodo className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif text-sm font-semibold text-ink">
                No personal tasks found
              </h4>
              <p className="text-xs text-ink-soft max-w-sm mx-auto">
                {baseTasks.length > 0
                  ? 'No tasks match your active status or category filter.'
                  : viewMode === 'overdue'
                  ? 'Awesome! You have zero overdue tasks.'
                  : 'Capture what you want to achieve today and stay in flow.'}
              </p>
            </div>
          </div>
        ) : (
          filteredTasks.map((task) => {
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex items-start gap-3 p-4 bg-paper-raised border rounded-2xl transition-all shadow-xs group ${
                  task.completed
                    ? 'border-rule/60 bg-paper/50 opacity-75'
                    : 'border-rule-strong hover:border-rule-strong'
                }`}
              >
                {/* Completion Checkbox */}
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  className={`w-5 h-5 rounded-lg border shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer ${
                    task.completed
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-rule-strong bg-paper group-hover:border-primary'
                  }`}
                  aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {task.completed && <Check className="w-3.5 h-3.5 font-bold" />}
                </button>

                {/* Content body */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p
                    className={`text-sm leading-relaxed ${
                      task.completed
                        ? 'line-through text-ink-soft/60'
                        : 'text-ink font-medium'
                    }`}
                  >
                    {task.title}
                  </p>

                  {/* Metadata Row: Priority, Category, Assigned Date */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-soft">
                    {/* Priority Indicator */}
                    <span
                      className={`font-semibold capitalize flex items-center gap-1 ${
                        task.priority === 'high'
                          ? 'text-rose-600 dark:text-rose-400'
                          : task.priority === 'medium'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          task.priority === 'high'
                            ? 'bg-rose-500'
                            : task.priority === 'medium'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      {task.priority}
                    </span>

                    {task.category && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-ink-soft">{task.category}</span>
                      </>
                    )}

                    {viewMode !== 'date' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[10px] text-ink-soft bg-paper border border-rule px-1.5 py-0.5 rounded">
                          {task.date}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Delete task control */}
                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-ink-soft hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer shrink-0"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
