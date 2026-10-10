import { useMemo } from 'react';
import { Person, ActionItem, RelationshipType, DailyTask, TaskPriority } from '../types';
import {
  Settings,
  ClipboardList,
  Plus,
  UserCheck,
  Shield,
  Users,
  Radio,
  CheckSquare,
  BookOpen,
  Calendar,
  AlertCircle,
  Tag,
  Flame,
  CheckCircle2,
  Clock,
  Inbox,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export const TODO_CATEGORIES = [
  'Deep Work',
  'Personal',
  'Health & Habits',
  'Focus',
  'Admin & Chores',
  'Errands',
  'Learning',
];

interface SidebarProps {
  // 1:1 Ledger Props
  people: Person[];
  selectedPersonId: string | null;
  onSelectPerson: (id: string) => void;
  onAddPersonClick: (relationship: RelationshipType) => void;
  onOpenBacklogClick: () => void;
  onOpenSettingsClick: () => void;
  actionItems: ActionItem[];

  // Workspace Mode Switcher
  activeTab?: 'ledger' | 'todo';
  onSelectTab?: (tab: 'ledger' | 'todo') => void;

  // Daily To-Do Props (Strictly Personal)
  dailyTasks?: DailyTask[];
  selectedTodoDate?: string;
  onSelectTodoDate?: (date: string) => void;
  todoViewMode?: 'date' | 'overdue' | 'all';
  onSelectTodoViewMode?: (mode: 'date' | 'overdue' | 'all') => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  selectedPriority?: 'all' | TaskPriority;
  onSelectPriority?: (priority: 'all' | TaskPriority) => void;
}

export default function Sidebar({
  people,
  selectedPersonId,
  onSelectPerson,
  onAddPersonClick,
  onOpenBacklogClick,
  onOpenSettingsClick,
  actionItems,
  activeTab = 'ledger',
  onSelectTab,
  dailyTasks = [],
  selectedTodoDate,
  onSelectTodoDate,
  todoViewMode = 'date',
  onSelectTodoViewMode,
  selectedCategory = 'all',
  onSelectCategory,
  selectedPriority = 'all',
  onSelectPriority,
}: SidebarProps) {
  // Current ISO dates
  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const tomorrowIso = useMemo(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const yesterdayIso = useMemo(() => {
    const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // 1:1 Ledger Profile Groups
  const activePeople = useMemo(() => people.filter((p) => !p.archived), [people]);
  const managers = useMemo(() => activePeople.filter((p) => p.relationship === 'manager'), [activePeople]);
  const reportees = useMemo(() => activePeople.filter((p) => p.relationship === 'reportee'), [activePeople]);
  const others = useMemo(() => activePeople.filter((p) => p.relationship === 'other'), [activePeople]);

  // 1:1 Action Items counts
  const openItemCountsMap = useMemo(() => {
    const map = new Map<string, number>();
    actionItems.forEach((item) => {
      if (item.status === 'open') {
        map.set(item.personId, (map.get(item.personId) || 0) + 1);
      }
    });
    return map;
  }, [actionItems]);

  const totalOpenActionCount = useMemo(() => actionItems.filter((i) => i.status === 'open').length, [actionItems]);

  // Daily Tasks metrics
  const todayTasks = useMemo(() => dailyTasks.filter((t) => t.date === todayIso), [dailyTasks, todayIso]);
  const todayPendingCount = useMemo(() => todayTasks.filter((t) => !t.completed).length, [todayTasks]);
  const todayCompletedCount = useMemo(() => todayTasks.filter((t) => t.completed).length, [todayTasks]);
  const todayTotalCount = todayTasks.length;
  const todayPercent = todayTotalCount > 0 ? Math.round((todayCompletedCount / todayTotalCount) * 100) : 0;

  const tomorrowTasksCount = useMemo(() => dailyTasks.filter((t) => t.date === tomorrowIso).length, [dailyTasks, tomorrowIso]);
  const yesterdayTasksCount = useMemo(() => dailyTasks.filter((t) => t.date === yesterdayIso).length, [dailyTasks, yesterdayIso]);
  const overdueTasksCount = useMemo(
    () => dailyTasks.filter((t) => t.date < todayIso && !t.completed).length,
    [dailyTasks, todayIso]
  );

  const renderPersonList = (list: Person[]) => {
    if (list.length === 0) {
      return (
        <div className="px-3 py-2 text-xs text-slate-400/60 italic">
          No profiles logged
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {list.map((p) => {
          const isActive = p.id === selectedPersonId;
          const openCount = openItemCountsMap.get(p.id) || 0;

          return (
            <button
              key={p.id}
              onClick={() => onSelectPerson(p.id)}
              className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-left text-sm transition-all cursor-pointer relative group ${
                isActive
                  ? 'bg-slate-800 text-slate-100 font-medium border border-slate-700 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-md" />
              )}

              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${openCount > 0 ? 'bg-amber-400' : 'bg-transparent'}`} />
                <span className="truncate">{p.name}</span>
              </div>

              {openCount > 0 && (
                <span
                  className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-amber-400/20 text-amber-300 border border-amber-400/25' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {openCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col h-full shrink-0 select-none">
      {/* Sidebar Header Brand */}
      <div className="px-6 py-5 border-b border-slate-800 shrink-0 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="bg-slate-800 border border-slate-700 text-primary text-[10px] font-bold font-mono tracking-wider uppercase px-2 py-0.5 rounded">
            {activeTab === 'ledger' ? '1:1' : 'Personal'}
          </span>
          <h1 className="font-serif text-xl font-bold tracking-tight text-white">
            {activeTab === 'ledger' ? 'Ledger' : 'To-Do'}
          </h1>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
          <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-slate-400">Local</span>
        </div>
      </div>

      {/* Main Workspace Mode Nav (1:1 Ledger vs Daily To-Do) */}
      {onSelectTab && (
        <div className="px-4 py-3 border-b border-slate-800 shrink-0 bg-slate-950/60">
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => onSelectTab('ledger')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span>1:1s</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('todo')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
                activeTab === 'todo'
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>To-Do</span>
              {todayPendingCount > 0 && (
                <span className="font-mono text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                  {todayPendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area: Conditioned by Active Workspace Mode */}
      {activeTab === 'ledger' ? (
        /* 1:1 Ledger Mode: Team & Direct Reports Navigation */
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* Manager Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-3">
              <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-primary/80" />
                Reporting To
              </h3>
              {managers.length === 0 && (
                <button
                  onClick={() => onAddPersonClick('manager')}
                  className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                  title="Add Manager"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {renderPersonList(managers)}
          </div>

          {/* Direct Reports Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-3">
              <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
                <Users className="w-3 h-3 text-primary/80" />
                Direct Reports
              </h3>
              <button
                onClick={() => onAddPersonClick('reportee')}
                className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                title="Add Direct Report"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {renderPersonList(reportees)}
          </div>

          {/* Stakeholders Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-3">
              <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
                <UserCheck className="w-3 h-3 text-primary/80" />
                Others & Peers
              </h3>
              <button
                onClick={() => onAddPersonClick('other')}
                className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                title="Add Stakeholder / Peer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {renderPersonList(others)}
          </div>
        </div>
      ) : (
        /* Daily To-Do Mode: Strictly Personal Daily Task Navigation & Filters */
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* Timeline & Views */}
          <div className="space-y-1.5">
            <div className="px-3">
              <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-emerald-400" />
                Timeline & Views
              </h3>
            </div>

            <div className="space-y-1">
              {/* Today */}
              <button
                type="button"
                onClick={() => {
                  onSelectTodoViewMode?.('date');
                  onSelectTodoDate?.(todayIso);
                }}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-left text-sm transition-all cursor-pointer relative ${
                  todoViewMode === 'date' && selectedTodoDate === todayIso
                    ? 'bg-slate-800 text-slate-100 font-medium border border-slate-700 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                {todoViewMode === 'date' && selectedTodoDate === todayIso && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r-md" />
                )}
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Today</span>
                </div>
                {todayPendingCount > 0 ? (
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {todayPendingCount}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-medium">All done</span>
                )}
              </button>

              {/* Tomorrow */}
              <button
                type="button"
                onClick={() => {
                  onSelectTodoViewMode?.('date');
                  onSelectTodoDate?.(tomorrowIso);
                }}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-left text-sm transition-all cursor-pointer relative ${
                  todoViewMode === 'date' && selectedTodoDate === tomorrowIso
                    ? 'bg-slate-800 text-slate-100 font-medium border border-slate-700 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                {todoViewMode === 'date' && selectedTodoDate === tomorrowIso && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r-md" />
                )}
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Tomorrow</span>
                </div>
                {tomorrowTasksCount > 0 && (
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {tomorrowTasksCount}
                  </span>
                )}
              </button>

              {/* Yesterday */}
              <button
                type="button"
                onClick={() => {
                  onSelectTodoViewMode?.('date');
                  onSelectTodoDate?.(yesterdayIso);
                }}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-left text-sm transition-all cursor-pointer relative ${
                  todoViewMode === 'date' && selectedTodoDate === yesterdayIso
                    ? 'bg-slate-800 text-slate-100 font-medium border border-slate-700 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                {todoViewMode === 'date' && selectedTodoDate === yesterdayIso && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r-md" />
                )}
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Yesterday</span>
                </div>
                {yesterdayTasksCount > 0 && (
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
                    {yesterdayTasksCount}
                  </span>
                )}
              </button>

              {/* Overdue / Carry-Over */}
              <button
                type="button"
                onClick={() => onSelectTodoViewMode?.('overdue')}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-left text-sm transition-all cursor-pointer relative ${
                  todoViewMode === 'overdue'
                    ? 'bg-slate-800 text-slate-100 font-medium border border-slate-700 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                {todoViewMode === 'overdue' && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-500 rounded-r-md" />
                )}
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Overdue</span>
                </div>
                {overdueTasksCount > 0 ? (
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {overdueTasksCount}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-medium">None</span>
                )}
              </button>

              {/* All Tasks */}
              <button
                type="button"
                onClick={() => onSelectTodoViewMode?.('all')}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-left text-sm transition-all cursor-pointer relative ${
                  todoViewMode === 'all'
                    ? 'bg-slate-800 text-slate-100 font-medium border border-slate-700 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                {todoViewMode === 'all' && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-md" />
                )}
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>All Tasks</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                  {dailyTasks.length}
                </span>
              </button>
            </div>
          </div>

          {/* Categories & Tags */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-3">
              <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-emerald-400" />
                Categories
              </h3>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => onSelectCategory?.('all')}
                  className="text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => onSelectCategory?.('all')}
                className={`flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span>All Categories</span>
                <span className="text-[10px] font-mono opacity-60">{dailyTasks.length}</span>
              </button>

              {TODO_CATEGORIES.map((cat) => {
                const count = dailyTasks.filter((t) => t.category === cat).length;
                const isSelected = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onSelectCategory?.(isSelected ? 'all' : cat)}
                    className={`flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <span className="text-[10px] font-mono opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Quick Filter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-3">
              <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-rose-400" />
                Priority
              </h3>
              {selectedPriority !== 'all' && (
                <button
                  type="button"
                  onClick={() => onSelectPriority?.('all')}
                  className="text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1 px-1">
              {(
                [
                  { label: 'High', value: 'high', dot: 'bg-rose-500' },
                  { label: 'Med', value: 'medium', dot: 'bg-amber-500' },
                  { label: 'Low', value: 'low', dot: 'bg-slate-400' },
                ] as const
              ).map((p) => {
                const isSelected = selectedPriority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => onSelectPriority?.(isSelected ? 'all' : p.value)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 text-white border border-slate-700 shadow-xs'
                        : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today's Productivity Mini Widget */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Today's Focus
              </span>
              <span className="font-mono text-emerald-400 font-bold text-xs">{todayPercent}%</span>
            </div>
            {/* Progress Track */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${todayPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {todayCompletedCount} of {todayTotalCount} completed
            </p>
          </div>
        </div>
      )}

      {/* Footer Controls: Adapted for Active Workspace */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0 space-y-3">
        {activeTab === 'ledger' ? (
          <>
            {/* Master Backlog checklist trigger button for 1:1 items */}
            <button
              onClick={onOpenBacklogClick}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 hover:text-white text-slate-300 transition-all cursor-pointer shadow-sm group font-medium"
            >
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-4.5 h-4.5 text-primary group-hover:scale-105 transition-transform shrink-0" />
                <span className="text-xs">Master Backlog</span>
              </div>
              {totalOpenActionCount > 0 ? (
                <span className="bg-primary hover:bg-primary-strong text-white text-[10px] font-bold font-mono px-2 py-0.5 rounded-full shadow-md shrink-0">
                  {totalOpenActionCount} open
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-medium shrink-0">0 items</span>
              )}
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettingsClick}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Ledger Settings</span>
            </button>
          </>
        ) : (
          <>
            {/* Settings button */}
            <button
              onClick={onOpenSettingsClick}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold shadow-xs"
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Theme & Preferences</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
