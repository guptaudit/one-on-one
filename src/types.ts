export type RelationshipType = 'manager' | 'reportee' | 'other';
export type ActionItemStatus = 'open' | 'done';
export type ActionItemOwner = 'me' | 'them';

export interface Person {
  id: string;
  name: string;
  role: string;
  relationship: RelationshipType;
  archived: boolean;
  sortOrder: number;
  createdAt: string;
  scratchpad?: string; // Pre-meeting agenda / talking points builder
}

export interface Meeting {
  id: string;
  personId: string;
  meetingDate: string; // YYYY-MM-DD
  notes: string;
  createdAt: string;
  updatedAt?: string;
  tags?: string[]; // e.g. 'Career', 'Feedback', 'Project', 'Compensation'
}

export interface ActionItem {
  id: string;
  meetingId: string;
  personId: string;
  description: string;
  status: ActionItemStatus;
  owner: ActionItemOwner;
  createdAt: string;
  completedAt?: string;
}

export type TaskPriority = 'high' | 'medium' | 'low';

export interface DailyTask {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  priority: TaskPriority;
  category?: string; // e.g. 'Deep Work', 'Personal', 'Focus', 'Admin'
  createdAt: string;
  completedAt?: string;
}

export interface AppState {
  people: Person[];
  meetings: Meeting[];
  actionItems: ActionItem[];
  dailyTasks: DailyTask[];
}

export type ThemeName = 'neutral-violet' | 'purple-mood' | 'forest-emerald' | 'midnight-slate';

export interface ThemePreset {
  name: ThemeName;
  label: string;
  description: string;
  colors: {
    paper: string;
    paperRaised: string;
    ink: string;
    inkSoft: string;
    rule: string;
    ruleStrong: string;
    primary: string;
    primarySoft: string;
    primaryStrong: string;
    navy: string;
    navySoft: string;
    badgeMe: string;
    badgeThem: string;
  };
}
