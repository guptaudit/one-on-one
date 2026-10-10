import * as XLSX from 'xlsx';
import { Person, Meeting, ActionItem, DailyTask } from '../types';

/**
 * Sanitizes a string to be a valid Excel worksheet name (max 31 chars, no forbidden chars).
 */
function sanitizeSheetName(name: string, existingNames: Set<string>): string {
  // Remove forbidden characters: \ / ? * [ ] :
  let clean = name.replace(/[\\/?*[\]:]/g, '').trim();
  if (!clean) clean = 'Person';
  clean = clean.slice(0, 28);

  let uniqueName = clean;
  let counter = 1;
  while (existingNames.has(uniqueName.toLowerCase())) {
    uniqueName = `${clean.slice(0, 25)} (${counter++})`;
  }
  existingNames.add(uniqueName.toLowerCase());
  return uniqueName;
}

/**
 * Sets comfortable column widths on an XLSX worksheet.
 */
function autoFitColumns(rows: (string | number | undefined | null)[][]): { wch: number }[] {
  if (rows.length === 0) return [];
  const colCount = Math.max(...rows.map((r) => r.length));
  const colWidths: number[] = new Array(colCount).fill(10);

  for (const row of rows) {
    row.forEach((cell, colIndex) => {
      const length = cell !== undefined && cell !== null ? String(cell).length : 0;
      if (length > colWidths[colIndex]) {
        // Cap max column width to 60 for long notes so sheet isn't overly stretched
        colWidths[colIndex] = Math.min(length + 3, 60);
      }
    });
  }

  return colWidths.map((w) => ({ wch: Math.max(w, 12) }));
}

/**
 * Exports selected 1:1 records (Meetings & Action Items) to a multi-sheet Excel (.xlsx) file.
 */
export function exportMeetingsAndActionsToExcel(
  selectedPeople: Person[],
  allMeetings: Meeting[],
  allActionItems: ActionItem[],
  customFilename?: string
): boolean {
  if (!selectedPeople || selectedPeople.length === 0) {
    return false;
  }

  const wb = XLSX.utils.book_new();
  const existingSheetNames = new Set<string>();

  // --- Sheet 1: Master Team Overview ---
  const overviewRows: (string | number)[][] = [
    ['1:1 MEETINGS & ACTION ITEMS MASTER OVERVIEW'],
    [`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
    [`Selected Team Members: ${selectedPeople.length}`],
    [],
    [
      'Person Name',
      'Role / Title',
      'Relationship',
      'Total Meetings',
      'Latest Meeting',
      'Total Action Items',
      'Open Actions',
      'Completed Actions',
      'Upcoming Agenda / Scratchpad',
    ],
  ];

  selectedPeople.forEach((person) => {
    const personMeetings = allMeetings
      .filter((m) => m.personId === person.id)
      .sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());

    const personActions = allActionItems.filter((i) => i.personId === person.id);
    const openActions = personActions.filter((i) => i.status === 'open');
    const doneActions = personActions.filter((i) => i.status === 'done');
    const latestMeeting = personMeetings.length > 0 ? personMeetings[0].meetingDate : 'No meetings logged';

    const relationshipLabel =
      person.relationship === 'manager'
        ? 'Reporting To (Manager)'
        : person.relationship === 'reportee'
        ? 'Direct Report'
        : 'Peer / Cross-functional';

    overviewRows.push([
      person.name,
      person.role || 'Team Member',
      relationshipLabel,
      personMeetings.length,
      latestMeeting,
      personActions.length,
      openActions.length,
      doneActions.length,
      person.scratchpad || 'None',
    ]);
  });

  const overviewWs = XLSX.utils.aoa_to_sheet(overviewRows);
  overviewWs['!cols'] = autoFitColumns(overviewRows);
  const overviewSheetName = sanitizeSheetName('Team Overview', existingSheetNames);
  XLSX.utils.book_append_sheet(wb, overviewWs, overviewSheetName);

  // --- Sheet 2..N: Individual Sheet Per Person ---
  selectedPeople.forEach((person) => {
    const personMeetings = allMeetings
      .filter((m) => m.personId === person.id)
      .sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());

    const personActions = allActionItems
      .filter((i) => i.personId === person.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const openActions = personActions.filter((i) => i.status === 'open');
    const doneActions = personActions.filter((i) => i.status === 'done');

    const relationshipLabel =
      person.relationship === 'manager'
        ? 'Reporting To (Manager)'
        : person.relationship === 'reportee'
        ? 'Direct Report'
        : 'Peer / Cross-functional';

    const personRows: (string | number)[][] = [
      [`1:1 DOSSIER: ${person.name.toUpperCase()}`],
      [`Role: ${person.role || 'Team Member'}  |  Relationship: ${relationshipLabel}`],
      [`Profile Created: ${person.createdAt.slice(0, 10)}`],
      [`Current Scratchpad / Talking Points: ${person.scratchpad || 'None'}`],
      [],
      [`--- ACTION ITEMS (${personActions.length} Total: ${openActions.length} Open, ${doneActions.length} Done) ---`],
      ['Status', 'Owner', 'Description', 'Created Date', 'Completed Date'],
    ];

    if (personActions.length === 0) {
      personRows.push(['No action items logged for this person.', '', '', '', '']);
    } else {
      personActions.forEach((item) => {
        personRows.push([
          item.status === 'open' ? 'OPEN' : 'DONE',
          item.owner === 'me' ? 'Me' : person.name,
          item.description,
          item.createdAt.slice(0, 10),
          item.completedAt ? item.completedAt.slice(0, 10) : '-',
        ]);
      });
    }

    personRows.push(
      [],
      [`--- 1:1 MEETING HISTORY (${personMeetings.length} Meetings Logged) ---`],
      ['Meeting Date', 'Topics & Tags', 'Meeting Notes, Discussion & Decisions']
    );

    if (personMeetings.length === 0) {
      personRows.push(['No meetings logged for this person yet.', '', '']);
    } else {
      personMeetings.forEach((meeting) => {
        personRows.push([
          meeting.meetingDate,
          meeting.tags && meeting.tags.length > 0 ? meeting.tags.join(', ') : 'General Discussion',
          meeting.notes || 'No written notes recorded.',
        ]);
      });
    }

    const personWs = XLSX.utils.aoa_to_sheet(personRows);
    personWs['!cols'] = autoFitColumns(personRows);
    const sheetName = sanitizeSheetName(person.name, existingSheetNames);
    XLSX.utils.book_append_sheet(wb, personWs, sheetName);
  });

  const todayIso = new Date().toISOString().slice(0, 10);
  const fileName = customFilename || `1on1_Ledger_Export_${todayIso}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return true;
}

/**
 * Extracts all unique years from tasks, always including the current year.
 */
export function getAvailableTaskYears(tasks: DailyTask[]): number[] {
  const currentYear = new Date().getFullYear();
  const yearSet = new Set<number>([currentYear]);
  if (tasks && tasks.length > 0) {
    tasks.forEach((t) => {
      if (t.date) {
        const y = parseInt(t.date.slice(0, 4), 10);
        if (!isNaN(y) && y >= 2000 && y <= 2100) {
          yearSet.add(y);
        }
      }
    });
  }
  return Array.from(yearSet).sort((a, b) => b - a);
}

export interface ExportTasksOptions {
  selectedYear?: number | 'all';
  customFilename?: string;
}

/**
 * Exports personal daily tasks to an Excel (.xlsx) file.
 * Supports exporting all tasks or filtering by a specific year for End-of-Year reviews.
 */
export function exportDailyTasksToExcel(
  tasks: DailyTask[],
  options?: ExportTasksOptions | string
): boolean {
  if (!tasks || tasks.length === 0) {
    return false;
  }

  // Normalize options
  let selectedYear: number | 'all' = 'all';
  let customFilename: string | undefined;

  if (typeof options === 'string') {
    customFilename = options;
  } else if (options) {
    if (options.selectedYear !== undefined) {
      selectedYear = options.selectedYear;
    }
    customFilename = options.customFilename;
  }

  // Filter tasks if a specific year is chosen
  const filteredTasks =
    selectedYear === 'all'
      ? tasks
      : tasks.filter((t) => t.date && t.date.startsWith(selectedYear.toString()));

  if (filteredTasks.length === 0 && selectedYear !== 'all') {
    // If no tasks match that year, we still allow exporting or return false
    // But better to warn or export with notice
  }

  const wb = XLSX.utils.book_new();

  // Sort tasks: pending first, then by date descending
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const isYearEnd = selectedYear !== 'all';
  const titlePrefix = isYearEnd
    ? `ANNUAL YEAR-END DAILY TASKS REVIEW (${selectedYear})`
    : 'PERSONAL DAILY TASKS EXPORT (ALL-TIME)';

  // --- Sheet 1: Daily Tasks Inventory ---
  const taskRows: (string | number)[][] = [
    [titlePrefix],
    [`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
    [`Export Scope: ${isYearEnd ? `Year ${selectedYear} Only` : 'All Recorded Tasks'}`],
    [`Total Tasks in Scope: ${filteredTasks.length}`],
    [],
    ['Status', 'Task Title', 'Priority', 'Category', 'Scheduled Date', 'Completed Date', 'Created Date'],
  ];

  if (filteredTasks.length === 0) {
    taskRows.push(['No tasks recorded for the selected year.', '', '', '', '', '', '']);
  } else {
    sortedTasks.forEach((task) => {
      taskRows.push([
        task.completed ? 'COMPLETED' : 'PENDING',
        task.title,
        task.priority ? task.priority.toUpperCase() : 'MEDIUM',
        task.category || 'Personal',
        task.date,
        task.completedAt ? task.completedAt.slice(0, 10) : '-',
        task.createdAt ? task.createdAt.slice(0, 10) : '-',
      ]);
    });
  }

  const tasksWs = XLSX.utils.aoa_to_sheet(taskRows);
  tasksWs['!cols'] = autoFitColumns(taskRows);
  const mainSheetName = isYearEnd ? `${selectedYear} Tasks` : 'Daily Tasks';
  XLSX.utils.book_append_sheet(wb, tasksWs, mainSheetName);

  // --- Sheet 2: Productivity & Velocity Summary ---
  const completedCount = filteredTasks.filter((t) => t.completed).length;
  const pendingCount = filteredTasks.length - completedCount;
  const completionRate = filteredTasks.length > 0 ? Math.round((completedCount / filteredTasks.length) * 100) : 0;

  const highPriority = filteredTasks.filter((t) => t.priority === 'high');
  const medPriority = filteredTasks.filter((t) => t.priority === 'medium');
  const lowPriority = filteredTasks.filter((t) => t.priority === 'low');

  // Category counts
  const categoryMap = new Map<string, { total: number; done: number }>();
  filteredTasks.forEach((t) => {
    const cat = t.category || 'Uncategorized';
    const entry = categoryMap.get(cat) || { total: 0, done: 0 };
    entry.total += 1;
    if (t.completed) entry.done += 1;
    categoryMap.set(cat, entry);
  });

  const summaryRows: (string | number)[][] = [
    [isYearEnd ? `ANNUAL EXECUTIVE SUMMARY (${selectedYear})` : 'PRODUCTIVITY & TASK COMPLETION SUMMARY'],
    [],
    ['Overall Velocity Metric', 'Count / Value'],
    ['Total Tasks in Scope', filteredTasks.length],
    ['Completed Tasks', completedCount],
    ['Pending / Open Tasks', pendingCount],
    ['Overall Completion Rate', `${completionRate}%`],
    [],
    ['Priority Breakdown', 'Total Count', 'Completed', 'Pending'],
    ['High Priority', highPriority.length, highPriority.filter((t) => t.completed).length, highPriority.filter((t) => !t.completed).length],
    ['Medium Priority', medPriority.length, medPriority.filter((t) => t.completed).length, medPriority.filter((t) => !t.completed).length],
    ['Low Priority', lowPriority.length, lowPriority.filter((t) => t.completed).length, lowPriority.filter((t) => !t.completed).length],
    [],
    ['Category Breakdown', 'Total Tasks', 'Completed', 'Completion Rate'],
  ];

  categoryMap.forEach((val, cat) => {
    const rate = val.total > 0 ? `${Math.round((val.done / val.total) * 100)}%` : '0%';
    summaryRows.push([cat, val.total, val.done, rate]);
  });

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  summaryWs['!cols'] = autoFitColumns(summaryRows);
  XLSX.utils.book_append_sheet(wb, summaryWs, isYearEnd ? 'Annual Summary' : 'Productivity Summary');

  // --- Sheet 3: If End of Year export, add Month-by-Month Retrospective ---
  if (isYearEnd && typeof selectedYear === 'number') {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthlyRows: (string | number)[][] = [
      [`${selectedYear} MONTH-BY-MONTH RETROSPECTIVE`],
      [],
      ['Month', 'Total Scheduled', 'Completed', 'Pending', 'Completion Rate', 'High Priority Finished'],
    ];

    for (let m = 1; m <= 12; m++) {
      const monthPrefix = `${selectedYear}-${String(m).padStart(2, '0')}`;
      const monthTasks = filteredTasks.filter((t) => t.date && t.date.startsWith(monthPrefix));
      const mDone = monthTasks.filter((t) => t.completed).length;
      const mPending = monthTasks.length - mDone;
      const mHighDone = monthTasks.filter((t) => t.priority === 'high' && t.completed).length;
      const mRate = monthTasks.length > 0 ? `${Math.round((mDone / monthTasks.length) * 100)}%` : 'N/A';

      monthlyRows.push([
        monthNames[m - 1],
        monthTasks.length,
        mDone,
        mPending,
        mRate,
        mHighDone,
      ]);
    }

    const monthlyWs = XLSX.utils.aoa_to_sheet(monthlyRows);
    monthlyWs['!cols'] = autoFitColumns(monthlyRows);
    XLSX.utils.book_append_sheet(wb, monthlyWs, `${selectedYear} Monthly Trend`);
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const defaultFilename = isYearEnd
    ? `Daily_Tasks_YearEnd_${selectedYear}_Export_${todayIso}.xlsx`
    : `Daily_Tasks_AllTime_Export_${todayIso}.xlsx`;

  const fileName = customFilename || defaultFilename;
  XLSX.writeFile(wb, fileName);
  return true;
}
