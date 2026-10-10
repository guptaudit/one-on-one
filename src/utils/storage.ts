import { AppState, Person, Meeting, ActionItem, DailyTask } from '../types';

const STORAGE_KEY = 'one_on_one_ledger_state';

const todayIso = new Date().toISOString().slice(0, 10);
const yesterdayIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const DEFAULT_DAILY_TASKS: DailyTask[] = [
  {
    id: 'dt-1',
    title: 'Review weekly roadmap priorities and outline top 3 goals',
    date: todayIso,
    completed: false,
    priority: 'high',
    category: 'Deep Work',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dt-2',
    title: 'Complete 30-minute cardio & stretch workout',
    date: todayIso,
    completed: true,
    priority: 'medium',
    category: 'Health & Habits',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
  {
    id: 'dt-3',
    title: 'Review project architecture draft and write notes',
    date: todayIso,
    completed: false,
    priority: 'medium',
    category: 'Focus',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dt-4',
    title: 'Organize desk workspace and clear personal inbox',
    date: yesterdayIso,
    completed: false,
    priority: 'low',
    category: 'Admin & Chores',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEFAULT_PEOPLE: Person[] = [
  {
    id: 'p-1',
    name: 'Evelyn Sterling',
    role: 'VP of Product Engineering',
    relationship: 'manager',
    archived: false,
    sortOrder: 0,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    scratchpad: 'Ask Evelyn about the Q4 promotion timeline and see if she has any early feedback on the mentor guidelines draft.',
  },
  {
    id: 'p-2',
    name: 'Jordan Vance',
    role: 'Senior Infrastructure Engineer',
    relationship: 'reportee',
    archived: false,
    sortOrder: 1,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    scratchpad: "- Follow up on the DB partitioning latency report.\n- Ask if he wants to register for the Advanced PostgreSQL course this month.",
  },
  {
    id: 'p-3',
    name: 'Aria Mercer',
    role: 'Lead Frontend Designer',
    relationship: 'reportee',
    archived: false,
    sortOrder: 2,
    createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
    scratchpad: 'Review design system progress for form inputs. Align on whether Jordan can support with state endpoint binding.',
  },
  {
    id: 'p-4',
    name: 'Marcus Thorne',
    role: 'Principal Product Manager',
    relationship: 'other',
    archived: false,
    sortOrder: 3,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    scratchpad: 'Review draft roadmap slide. Confirm if engineering buffer is aligned.',
  }
];

const DEFAULT_MEETINGS: Meeting[] = [
  {
    id: 'm-1',
    personId: 'p-1',
    meetingDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 2 days ago
    notes: 'Discussed alignment on H2 technical roadmap and my professional growth goals.\n\nEvelyn mentioned she is extremely happy with the stability of our recent cloud infrastructure rollout. Suggested I start focusing more on cross-functional mentorship and high-level architectural designs to strengthen my promotion track for next cycle.\n\nAlso discussed budget constraints for team training courses and set H2 targets.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['Career', 'Planning', 'Budget'],
  },
  {
    id: 'm-2',
    personId: 'p-2',
    meetingDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 3 days ago
    notes: 'Bi-weekly alignment. Jordan is making spectacular headway on the database migration plan.\n\nWe brainstormed a solution to the primary key indexing bottleneck on the ledger events table. Jordan proposed creating a partitioned secondary index to isolate historical records. This looks very promising.\n\nJordan requested support for a premium database certification program next quarter to level up on distributed systems.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['Engineering', 'Feedback', 'Training'],
  },
  {
    id: 'm-3',
    personId: 'p-3',
    meetingDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 4 days ago
    notes: 'Aria presented her final design proposals for the core component layout rewrite.\n\nShe built a highly tactile dashboard demo using beautiful spring animations and rich micro-interactions. The tactile layout feels extremely fluid and responsive.\n\nWe aligned on optimizing the main list render times before committing the changes. Aria requested pairing with Jordan next week on standard API endpoints.',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['Design', 'Performance'],
  },
  {
    id: 'm-4',
    personId: 'p-4',
    meetingDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 6 days ago
    notes: 'Monthly sync with Marcus to review Q3 feature definitions.\n\nWe discussed tech-debt trade-offs for the incoming dashboard modules. Aligned on allocating a dedicated 1-week sprint to performance refactoring before tackling the new product initiatives.\n\nMarcus will update the stakeholder roadmap timeline accordingly.',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['Planning', 'Tech Debt'],
  }
];

const DEFAULT_ACTION_ITEMS: ActionItem[] = [
  {
    id: 'a-1',
    meetingId: 'm-1',
    personId: 'p-1',
    description: 'Draft personal development plan focusing on technical leadership and junior engineer mentorship.',
    status: 'open',
    owner: 'me',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'a-2',
    meetingId: 'm-1',
    personId: 'p-1',
    description: 'Review and approve budget proposal for Jordan’s database partition courses.',
    status: 'open',
    owner: 'them',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'a-3',
    meetingId: 'm-2',
    personId: 'p-2',
    description: 'Provide Jordan with official corporate feedback guidelines and templates.',
    status: 'done',
    owner: 'me',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'a-4',
    meetingId: 'm-2',
    personId: 'p-2',
    description: 'Finalize partitioned table schema draft and perform latency load benchmarks.',
    status: 'open',
    owner: 'them',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'a-5',
    meetingId: 'm-3',
    personId: 'p-3',
    description: 'Integrate fluid spring layout feedback and measure FPS performance under load.',
    status: 'open',
    owner: 'them',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'a-6',
    meetingId: 'm-4',
    personId: 'p-4',
    description: 'Deliver detailed architectural scope estimate for modular dashboard options.',
    status: 'open',
    owner: 'me',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export function getInitialState(): AppState {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      const parsed = JSON.parse(serialized);
      // Ensure all keys are present
      if (parsed && Array.isArray(parsed.people) && Array.isArray(parsed.meetings) && Array.isArray(parsed.actionItems)) {
        return {
          people: parsed.people,
          meetings: parsed.meetings,
          actionItems: parsed.actionItems,
          dailyTasks: Array.isArray(parsed.dailyTasks) ? parsed.dailyTasks : DEFAULT_DAILY_TASKS,
        };
      }
    }
  } catch (err) {
    console.error('Failed to parse local storage state, using defaults', err);
  }

  // Seeding default state
  const state: AppState = {
    people: DEFAULT_PEOPLE,
    meetings: DEFAULT_MEETINGS,
    actionItems: DEFAULT_ACTION_ITEMS,
    dailyTasks: DEFAULT_DAILY_TASKS,
  };
  saveState(state);
  return state;
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to write state to local storage', err);
  }
}

export function clearState(): AppState {
  const empty: AppState = {
    people: [],
    meetings: [],
    actionItems: [],
    dailyTasks: [],
  };
  saveState(empty);
  return empty;
}

export function exportBackup(state: AppState): void {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(state, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('download', `1on1_ledger_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
}

export function importBackupFile(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = JSON.parse(result);
        if (parsed && Array.isArray(parsed.people) && Array.isArray(parsed.meetings) && Array.isArray(parsed.actionItems)) {
          resolve({
            people: parsed.people,
            meetings: parsed.meetings,
            actionItems: parsed.actionItems,
            dailyTasks: Array.isArray(parsed.dailyTasks) ? parsed.dailyTasks : [],
          });
        } else {
          reject(new Error('Invalid file format: missing core collections.'));
        }
      } catch (err) {
        reject(new Error('Failed to parse JSON backup file.'));
      }
    };
    reader.onerror = () => reject(new Error('File reading error.'));
    reader.readAsText(file);
  });
}
