import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, BookOpen, AlertCircle, HelpCircle, CheckSquare } from 'lucide-react';
import {
  AppState,
  Person,
  Meeting,
  ActionItem,
  ThemeName,
  ThemePreset,
  RelationshipType,
  ActionItemStatus,
  ActionItemOwner,
  DailyTask,
  TaskPriority,
} from './types';
import {
  getInitialState,
  saveState,
  clearState,
  exportBackup,
  importBackupFile,
} from './utils/storage';

import Sidebar from './components/Sidebar';
import LedgerView from './components/LedgerView';
import DailyTodoView from './components/DailyTodoView';
import MeetingModal from './components/MeetingModal';
import PersonModal from './components/PersonModal';
import EmailDraftModal from './components/EmailDraftModal';
import OpenItemsModal from './components/OpenItemsModal';
import SettingsModal from './components/SettingsModal';
import Toast, { ToastMessage } from './components/Toast';

const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'neutral-violet',
    label: 'Neutral Violet',
    description: 'Clean light slate canvas with professional violet accents.',
    colors: {
      paper: '#F8FAFC',
      paperRaised: '#FFFFFF',
      ink: '#0F172A',
      inkSoft: '#475569',
      rule: '#E2E8F0',
      ruleStrong: '#CBD5E1',
      primary: '#6D28D9',
      primarySoft: '#F5F3FF',
      primaryStrong: '#4C1D95',
      navy: '#1E293B',
      navySoft: '#64748B',
      badgeMe: '#EDE9FE',
      badgeThem: '#FEE2E2',
    },
  },
  {
    name: 'purple-mood',
    label: 'Purple Dream',
    description: 'Deep royal purple contrast for creative focus.',
    colors: {
      paper: '#FAF5FF',
      paperRaised: '#FFFFFF',
      ink: '#1E1B4B',
      inkSoft: '#4F46E5',
      rule: '#EEF2F6',
      ruleStrong: '#E0E7FF',
      primary: '#9333EA',
      primarySoft: '#FAF5FF',
      primaryStrong: '#7E22CE',
      navy: '#312E81',
      navySoft: '#6366F1',
      badgeMe: '#F3E8FF',
      badgeThem: '#FFEDD5',
    },
  },
  {
    name: 'forest-emerald',
    label: 'Forest Emerald',
    description: 'Warm natural tones reflecting growth and mentorship.',
    colors: {
      paper: '#F0FDF4',
      paperRaised: '#FFFFFF',
      ink: '#064E3B',
      inkSoft: '#0F766E',
      rule: '#DCFCE7',
      ruleStrong: '#BBF7D0',
      primary: '#10B981',
      primarySoft: '#ECFDF5',
      primaryStrong: '#047857',
      navy: '#022C22',
      navySoft: '#065F46',
      badgeMe: '#D1FAE5',
      badgeThem: '#FEF3C7',
    },
  },
  {
    name: 'midnight-slate',
    label: 'Midnight Slate',
    description: 'Low-fatigue charcoal canvas with electric highlights.',
    colors: {
      paper: '#0B0F19',
      paperRaised: '#161E2F',
      ink: '#F8FAFC',
      inkSoft: '#94A3B8',
      rule: '#1E293B',
      ruleStrong: '#334155',
      primary: '#C084FC',
      primarySoft: '#2E1065',
      primaryStrong: '#A78BFA',
      navy: '#020617',
      navySoft: '#475569',
      badgeMe: '#3B0764',
      badgeThem: '#451A03',
    },
  },
];

export default function App() {
  // Global App States
  const [db, setDb] = useState<AppState>({ people: [], meetings: [], actionItems: [], dailyTasks: [] });
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ledger' | 'todo'>('ledger');
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('neutral-violet');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Daily To-Do Navigation & Filter States (Strictly Personal)
  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const [todoDate, setTodoDate] = useState<string>(todayIso);
  const [todoViewMode, setTodoViewMode] = useState<'date' | 'overdue' | 'all'>('date');
  const [todoStatusFilter, setTodoStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [todoPriorityFilter, setTodoPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [todoCategoryFilter, setTodoCategoryFilter] = useState<string>('all');

  // Modals Visibility
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [emailDraftOpen, setEmailDraftOpen] = useState(false);
  const [backlogOpen, setBacklogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Focus targets for edit modes
  const [activeRelationship, setActiveRelationship] = useState<RelationshipType>('reportee');
  const [meetingToEdit, setMeetingToEdit] = useState<Meeting | null>(null);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Bootstrapping State
  useEffect(() => {
    const initialState = getInitialState();
    setDb(initialState);

    // Set initial active profile
    const activePeople = initialState.people.filter((p) => !p.archived);
    if (activePeople.length > 0) {
      // Prefer manager first, otherwise first direct report
      const mgr = activePeople.find((p) => p.relationship === 'manager');
      setSelectedPersonId(mgr ? mgr.id : activePeople[0].id);
    }

    // Load theme
    const savedTheme = (localStorage.getItem('one_on_one_ledger_theme') as ThemeName) || 'neutral-violet';
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const triggerToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ id: crypto.randomUUID(), text, type });
  };

  const handleSelectTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
    localStorage.setItem('one_on_one_ledger_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    triggerToast(`Theme set to ${theme.split('-').join(' ')}`, 'info');
  };

  const selectedPerson = db.people.find((p) => p.id === selectedPersonId && !p.archived) || null;

  // Active items for selected person
  const activeMeetings = selectedPerson
    ? db.meetings.filter((m) => m.personId === selectedPerson.id)
    : [];

  const activeActionItems = selectedPerson
    ? db.actionItems.filter((item) => item.personId === selectedPerson.id)
    : [];

  const activeOpenActionItems = activeActionItems.filter((i) => i.status === 'open');

  // Trigger Person modal for creation
  const handleAddPersonTrigger = (rel: RelationshipType) => {
    setPersonToEdit(null);
    setActiveRelationship(rel);
    setPersonModalOpen(true);
    setMobileMenuOpen(false);
  };

  // Trigger Person modal for edit
  const handleEditPersonTrigger = () => {
    if (!selectedPerson) return;
    setPersonToEdit(selectedPerson);
    setPersonModalOpen(true);
  };

  // Trigger Meeting modal for edit
  const handleEditMeetingTrigger = (meeting: Meeting) => {
    setMeetingToEdit(meeting);
    setMeetingModalOpen(true);
  };

  // Trigger Meeting modal for creation
  const handleLogMeetingTrigger = () => {
    setMeetingToEdit(null);
    setMeetingModalOpen(true);
  };

  // CRUD: Save Person
  const handleSavePerson = (name: string, role: string, relationship: RelationshipType) => {
    setDb((prev) => {
      let updatedPeople = [...prev.people];

      if (personToEdit) {
        // Edit existing profile
        updatedPeople = updatedPeople.map((p) =>
          p.id === personToEdit.id ? { ...p, name, role, relationship } : p
        );
        triggerToast('Profile updated successfully');
      } else {
        // Create new profile
        const newId = crypto.randomUUID();
        const newPerson: Person = {
          id: newId,
          name,
          role,
          relationship,
          archived: false,
          sortOrder: prev.people.length,
          createdAt: new Date().toISOString(),
        };
        updatedPeople.push(newPerson);
        // Auto select newly created person
        setSelectedPersonId(newId);
        triggerToast(`Added ${name} successfully`);
      }

      const newState = { ...prev, people: updatedPeople };
      saveState(newState);
      return newState;
    });
  };

  // CRUD: Archive / Remove Person
  const handleRemovePerson = (id: string) => {
    setDb((prev) => {
      const updatedPeople = prev.people.map((p) => (p.id === id ? { ...p, archived: true } : p));
      
      // Pivot to another active person
      const remainingActive = updatedPeople.filter((p) => !p.archived);
      setSelectedPersonId(remainingActive.length > 0 ? remainingActive[0].id : null);
      
      triggerToast('Profile archived');
      const newState = { ...prev, people: updatedPeople };
      saveState(newState);
      return newState;
    });
  };

  // CRUD: Save Meeting Sync & Actions
  const handleSaveMeeting = (
    meetingDate: string,
    notes: string,
    validItems: { id?: string; description: string; owner: ActionItemOwner; status: ActionItemStatus }[],
    tags?: string[]
  ) => {
    if (!selectedPerson) return;

    setDb((prev) => {
      let updatedMeetings = [...prev.meetings];
      let updatedActions = [...prev.actionItems];

      let targetMeetingId = meetingToEdit?.id;

      if (meetingToEdit) {
        // Edit existing meeting
        updatedMeetings = updatedMeetings.map((m) =>
          m.id === meetingToEdit.id ? { ...m, meetingDate, notes, tags, updatedAt: new Date().toISOString() } : m
        );

        // Sync actions
        const inputItemIds = new Set(validItems.map((i) => i.id).filter(Boolean));
        // Remove original items that were deleted from modal
        updatedActions = updatedActions.filter(
          (item) => item.meetingId !== meetingToEdit.id || inputItemIds.has(item.id)
        );

        // Update existing / Insert new
        validItems.forEach((input) => {
          if (input.id) {
            updatedActions = updatedActions.map((act) =>
              act.id === input.id ? { ...act, description: input.description, owner: input.owner, status: input.status } : act
            );
          } else {
            const newAct: ActionItem = {
              id: crypto.randomUUID(),
              meetingId: meetingToEdit.id,
              personId: selectedPerson.id,
              description: input.description,
              status: input.status,
              owner: input.owner,
              createdAt: new Date().toISOString(),
            };
            updatedActions.push(newAct);
          }
        });

        triggerToast('Meeting logs updated');
      } else {
        // Create new meeting
        const newMeetingId = crypto.randomUUID();
        targetMeetingId = newMeetingId;

        const newMeeting: Meeting = {
          id: newMeetingId,
          personId: selectedPerson.id,
          meetingDate,
          notes,
          tags,
          createdAt: new Date().toISOString(),
        };
        updatedMeetings.push(newMeeting);

        // Save actions
        validItems.forEach((input) => {
          if (input.id) {
            // This was a carried-over open action item! Let's update its original record in place.
            updatedActions = updatedActions.map((act) =>
              act.id === input.id
                ? {
                    ...act,
                    description: input.description,
                    owner: input.owner,
                    status: input.status,
                    completedAt: input.status === 'done' ? new Date().toISOString() : undefined,
                  }
                : act
            );
          } else {
            // This is a brand new action item created in this meeting
            const newAct: ActionItem = {
              id: crypto.randomUUID(),
              meetingId: newMeetingId,
              personId: selectedPerson.id,
              description: input.description,
              status: input.status,
              owner: input.owner,
              createdAt: new Date().toISOString(),
            };
            updatedActions.push(newAct);
          }
        });

        // Upon logging a new meeting, clear the scratchpad!
        const updatedPeople = prev.people.map((p) =>
          p.id === selectedPerson.id ? { ...p, scratchpad: '' } : p
        );

        triggerToast('1:1 meeting logged');
        const newState = { ...prev, people: updatedPeople, meetings: updatedMeetings, actionItems: updatedActions };
        saveState(newState);
        return newState;
      }

      const newState = { ...prev, meetings: updatedMeetings, actionItems: updatedActions };
      saveState(newState);
      return newState;
    });
  };

  // CRUD: Update Person Scratchpad
  const handleUpdateScratchpad = (personId: string, text: string) => {
    setDb((prev) => {
      const updatedPeople = prev.people.map((p) =>
        p.id === personId ? { ...p, scratchpad: text } : p
      );
      const newState = { ...prev, people: updatedPeople };
      saveState(newState);
      return newState;
    });
  };

  // CRUD: Delete Meeting
  const handleDeleteMeeting = (meetingId: string) => {
    setDb((prev) => {
      const updatedMeetings = prev.meetings.filter((m) => m.id !== meetingId);
      const updatedActions = prev.actionItems.filter((i) => i.meetingId !== meetingId);
      
      triggerToast('Entry deleted', 'info');
      const newState = { ...prev, meetings: updatedMeetings, actionItems: updatedActions };
      saveState(newState);
      return newState;
    });
  };

  // CRUD: Toggle Action Item status inline
  const handleToggleActionItemStatus = (itemId: string, currentStatus: ActionItemStatus) => {
    const nextStatus = currentStatus === 'open' ? 'done' : 'open';
    setDb((prev) => {
      const updatedActions = prev.actionItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: nextStatus,
              completedAt: nextStatus === 'done' ? new Date().toISOString() : undefined,
            }
          : item
      );

      triggerToast(nextStatus === 'done' ? 'Action item completed' : 'Action item reopened', 'success');
      const newState = { ...prev, actionItems: updatedActions };
      saveState(newState);
      return newState;
    });
  };

  // CRUD: Daily Tasks
  const handleAddDailyTask = (taskData: Omit<DailyTask, 'id' | 'createdAt'>) => {
    const newTask: DailyTask = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setDb((prev) => {
      const updatedTasks = [newTask, ...(prev.dailyTasks || [])];
      const newState = { ...prev, dailyTasks: updatedTasks };
      saveState(newState);
      return newState;
    });
    triggerToast('Task added to daily schedule');
  };

  const handleToggleDailyTask = (taskId: string) => {
    setDb((prev) => {
      const updatedTasks = (prev.dailyTasks || []).map((t) => {
        if (t.id === taskId) {
          const isDone = !t.completed;
          return {
            ...t,
            completed: isDone,
            completedAt: isDone ? new Date().toISOString() : undefined,
          };
        }
        return t;
      });
      const newState = { ...prev, dailyTasks: updatedTasks };
      saveState(newState);
      return newState;
    });
  };

  const handleDeleteDailyTask = (taskId: string) => {
    setDb((prev) => {
      const updatedTasks = (prev.dailyTasks || []).filter((t) => t.id !== taskId);
      const newState = { ...prev, dailyTasks: updatedTasks };
      saveState(newState);
      return newState;
    });
    triggerToast('Task removed', 'info');
  };

  const handleCarryOverDailyTasks = (taskIds: string[], targetDate: string) => {
    setDb((prev) => {
      const updatedTasks = (prev.dailyTasks || []).map((t) => {
        if (taskIds.includes(t.id)) {
          return { ...t, date: targetDate };
        }
        return t;
      });
      const newState = { ...prev, dailyTasks: updatedTasks };
      saveState(newState);
      return newState;
    });
    triggerToast(`Carried ${taskIds.length} task${taskIds.length > 1 ? 's' : ''} over to today`);
  };


  // Backups
  const handleBackupDatabase = () => {
    exportBackup(db);
    triggerToast('Backup JSON downloaded successfully');
  };

  const handleRestoreDatabase = async (file: File) => {
    try {
      const restoredState = await importBackupFile(file);
      setDb(restoredState);
      
      // Reset selected view safely
      const activePeople = restoredState.people.filter((p) => !p.archived);
      setSelectedPersonId(activePeople.length > 0 ? activePeople[0].id : null);
      
      triggerToast('Database restored successfully', 'success');
      setSettingsOpen(false);
    } catch (err: any) {
      triggerToast(err.message || 'Restore failed', 'error');
    }
  };

  const handleClearDatabase = () => {
    const cleared = clearState();
    setDb(cleared);
    setSelectedPersonId(null);
    triggerToast('Database reset successfully', 'info');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-paper text-ink">
      {/* Toast Alert overlay */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Side rail navigation (visible on desktop, slides on mobile) */}
      <div className="hidden md:block h-full">
        <Sidebar
          people={db.people}
          selectedPersonId={selectedPersonId}
          onSelectPerson={(id) => {
            setSelectedPersonId(id);
            setActiveTab('ledger');
          }}
          onAddPersonClick={handleAddPersonTrigger}
          onOpenBacklogClick={() => setBacklogOpen(true)}
          onOpenSettingsClick={() => setSettingsOpen(true)}
          actionItems={db.actionItems}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          dailyTasks={db.dailyTasks || []}
          selectedTodoDate={todoDate}
          onSelectTodoDate={setTodoDate}
          todoViewMode={todoViewMode}
          onSelectTodoViewMode={setTodoViewMode}
          selectedCategory={todoCategoryFilter}
          onSelectCategory={setTodoCategoryFilter}
          selectedPriority={todoPriorityFilter}
          onSelectPriority={setTodoPriorityFilter}
        />
      </div>

      {/* Mobile Drawer Slide-in Backdrop & Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-xs md:hidden"
            />
            {/* Slide menu panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 z-40 w-72 md:hidden"
            >
              <Sidebar
                people={db.people}
                selectedPersonId={selectedPersonId}
                onSelectPerson={(id) => {
                  setSelectedPersonId(id);
                  setActiveTab('ledger');
                  setMobileMenuOpen(false);
                }}
                onAddPersonClick={handleAddPersonTrigger}
                onOpenBacklogClick={() => {
                  setBacklogOpen(true);
                  setMobileMenuOpen(false);
                }}
                onOpenSettingsClick={() => {
                  setSettingsOpen(true);
                  setMobileMenuOpen(false);
                }}
                actionItems={db.actionItems}
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  setActiveTab(tab);
                  setMobileMenuOpen(false);
                }}
                dailyTasks={db.dailyTasks || []}
                selectedTodoDate={todoDate}
                onSelectTodoDate={setTodoDate}
                todoViewMode={todoViewMode}
                onSelectTodoViewMode={setTodoViewMode}
                selectedCategory={todoCategoryFilter}
                onSelectCategory={setTodoCategoryFilter}
                selectedPriority={todoPriorityFilter}
                onSelectPriority={setTodoPriorityFilter}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content body canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar for Desktop & Mobile */}
        <header className="shrink-0 px-6 sm:px-12 py-3.5 border-b border-rule bg-paper-raised/80 backdrop-blur-xs flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-xl hover:bg-paper transition-colors text-ink cursor-pointer"
              aria-label="Toggle Side Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Segmented Tab Bar Switcher */}
            <div className="flex items-center gap-1 p-1 bg-paper border border-rule-strong/60 rounded-xl shadow-2xs">
              <button
                onClick={() => setActiveTab('ledger')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'ledger'
                    ? 'bg-paper-raised text-ink shadow-xs border border-rule-strong/80 font-bold'
                    : 'text-ink-soft hover:text-ink hover:bg-paper-raised/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>1:1 Meeting Ledger</span>
              </button>

              <button
                onClick={() => setActiveTab('todo')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'todo'
                    ? 'bg-paper-raised text-ink shadow-xs border border-rule-strong/80 font-bold'
                    : 'text-ink-soft hover:text-ink hover:bg-paper-raised/60'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                <span>Personal To-Do</span>
                {(db.dailyTasks || []).filter((t) => t.date === todayIso && !t.completed).length > 0 && (
                  <span className="font-mono text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 px-1.5 py-0.2 rounded-full">
                    {(db.dailyTasks || []).filter((t) => t.date === todayIso && !t.completed).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold border border-rule hover:border-rule-strong text-ink-soft hover:text-ink bg-paper hover:bg-paper-raised rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              Theme & Settings
            </button>
          </div>
        </header>

        {/* Scrollable Main Slate */}
        <main className="flex-1 overflow-y-auto px-6 sm:px-12 py-8">
          {activeTab === 'todo' ? (
            <DailyTodoView
              tasks={db.dailyTasks || []}
              onAddTask={handleAddDailyTask}
              onToggleTask={handleToggleDailyTask}
              onDeleteTask={handleDeleteDailyTask}
              onCarryOverTasks={handleCarryOverDailyTasks}
              selectedDate={todoDate}
              onSelectDate={setTodoDate}
              viewMode={todoViewMode}
              onSelectViewMode={setTodoViewMode}
              statusFilter={todoStatusFilter}
              onSelectStatusFilter={setTodoStatusFilter}
              priorityFilter={todoPriorityFilter}
              onSelectPriorityFilter={setTodoPriorityFilter}
              categoryFilter={todoCategoryFilter}
              onSelectCategoryFilter={setTodoCategoryFilter}
            />
          ) : selectedPerson ? (
            <LedgerView
              person={selectedPerson}
              meetings={activeMeetings}
              actionItems={db.actionItems}
              onEditPersonClick={handleEditPersonTrigger}
              onEmailDraftClick={() => setEmailDraftOpen(true)}
              onLogMeetingClick={handleLogMeetingTrigger}
              onEditMeetingClick={handleEditMeetingTrigger}
              onToggleActionItem={handleToggleActionItemStatus}
              onUpdateScratchpad={handleUpdateScratchpad}
            />
          ) : (
            <div className="max-w-md mx-auto text-center py-20 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary-soft text-primary mx-auto flex items-center justify-center border border-primary/10">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold">No profile active</h3>
                <p className="text-xs text-ink-soft">Add your manager or a direct report to log discussions and track mutual actions.</p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => handleAddPersonTrigger('manager')}
                  className="px-4 py-2 border border-rule-strong hover:bg-paper-raised text-xs font-semibold rounded-xl cursor-pointer"
                >
                  + Add Manager
                </button>
                <button
                  onClick={() => handleAddPersonTrigger('reportee')}
                  className="px-4 py-2 bg-primary text-paper-raised hover:bg-primary-strong text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  + Add Direct Report
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- ALL MODALS OVERLAYS --- */}
      
      {/* Profile Add / Edit Person Modal */}
      <PersonModal
        isOpen={personModalOpen}
        onClose={() => setPersonModalOpen(false)}
        personToEdit={personToEdit}
        initialRelationship={activeRelationship}
        onSave={handleSavePerson}
        onRemove={handleRemovePerson}
      />

      {/* Meeting Logging Sync Modal */}
      {selectedPerson && (
        <MeetingModal
          isOpen={meetingModalOpen}
          onClose={() => setMeetingModalOpen(false)}
          person={selectedPerson}
          meetingToEdit={meetingToEdit}
          actionItemsForMeeting={meetingToEdit ? db.actionItems.filter((i) => i.meetingId === meetingToEdit.id) : []}
          historicalOpenItems={activeOpenActionItems}
          onSave={handleSaveMeeting}
          onDeleteMeeting={handleDeleteMeeting}
        />
      )}

      {/* HTML Email Summary Generation Modal */}
      {selectedPerson && (
        <EmailDraftModal
          isOpen={emailDraftOpen}
          onClose={() => setEmailDraftOpen(false)}
          person={selectedPerson}
          latestMeeting={activeMeetings[0] || null}
          actionItems={activeActionItems}
          onShowToast={triggerToast}
        />
      )}

      {/* Unified Master Actions Backlog modal */}
      <OpenItemsModal
        isOpen={backlogOpen}
        onClose={() => setBacklogOpen(false)}
        people={db.people}
        actionItems={db.actionItems}
        onToggleStatus={handleToggleActionItemStatus}
      />

      {/* Preferences & Theme Settings modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        onBackup={handleBackupDatabase}
        onRestore={handleRestoreDatabase}
        onClear={handleClearDatabase}
        themePresets={THEME_PRESETS}
        people={db.people}
        meetings={db.meetings}
        actionItems={db.actionItems}
        dailyTasks={db.dailyTasks}
      />
    </div>
  );
}
