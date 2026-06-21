// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------
const state = {
  people: [],
  selectedPersonId: null,
  meetings: [],
  editingMeetingId: null,   // null = creating new
  editingPersonId: null,    // null = creating new
  editingPersonRelationship: null,
  pendingActionItems: [],   // [{description, owner}] while editing a meeting
};

// ---------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const getPeople = () => api("/api/people");
const createPerson = (data) => api("/api/people", { method: "POST", body: JSON.stringify(data) });
const updatePerson = (id, data) => api(`/api/people/${id}`, { method: "PATCH", body: JSON.stringify(data) });
const archivePerson = (id) => api(`/api/people/${id}`, { method: "DELETE" });

const getMeetings = (personId) => api(`/api/people/${personId}/meetings`);
const getOpenItemsForPerson = (personId) => api(`/api/people/${personId}/open-items`);
const createMeeting = (data) => api("/api/meetings", { method: "POST", body: JSON.stringify(data) });
const updateMeeting = (id, data) => api(`/api/meetings/${id}`, { method: "PATCH", body: JSON.stringify(data) });
const deleteMeeting = (id) => api(`/api/meetings/${id}`, { method: "DELETE" });

const addActionItem = (meetingId, data) => api(`/api/meetings/${meetingId}/action-items`, { method: "POST", body: JSON.stringify(data) });
const updateActionItem = (id, data) => api(`/api/action-items/${id}`, { method: "PATCH", body: JSON.stringify(data) });
const deleteActionItem = (id) => api(`/api/action-items/${id}`, { method: "DELETE" });
const getAllOpenItems = () => api("/api/open-items");
const clearDatabase = () => api("/api/clear-db", { method: "POST" });

// ---------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------
const $ = (sel) => document.querySelector(sel);

const managerList = $("#managerList");
const reporteeList = $("#reporteeList");
const othersList = $("#othersList");
const addManagerBtn = $("#addManagerBtn");
const addReporteeBtn = $("#addReporteeBtn");
const addOtherBtn = $("#addOtherBtn");
const openItemsBtn = $("#openItemsBtn");
const openItemsCount = $("#openItemsCount");

const emptyState = $("#emptyState");
const ledgerContent = $("#ledgerContent");
const personRelationshipLabel = $("#personRelationshipLabel");
const personName = $("#personName");
const personRole = $("#personRole");
const editPersonBtn = $("#editPersonBtn");
const emailDraftBtn = $("#emailDraftBtn");
const newMeetingBtn = $("#newMeetingBtn");
const carryBanner = $("#carryBanner");
const carryText = $("#carryText");
const thread = $("#thread");
const settingsBtn = $("#settingsBtn");

const meetingModalBackdrop = $("#meetingModalBackdrop");
const meetingModalTitle = $("#meetingModalTitle");
const meetingDateInput = $("#meetingDateInput");
const meetingNotesInput = $("#meetingNotesInput");
const actionItemsEditor = $("#actionItemsEditor");
const addActionItemBtn = $("#addActionItemBtn");
const closeMeetingModal = $("#closeMeetingModal");
const cancelMeetingBtn = $("#cancelMeetingBtn");
const saveMeetingBtn = $("#saveMeetingBtn");

const personModalBackdrop = $("#personModalBackdrop");
const personModalTitle = $("#personModalTitle");
const personNameInput = $("#personNameInput");
const personRoleInput = $("#personRoleInput");
const closePersonModal = $("#closePersonModal");
const cancelPersonBtn = $("#cancelPersonBtn");
const savePersonBtn = $("#savePersonBtn");
const deletePersonBtn = $("#deletePersonBtn");

const settingsBackdrop = $("#settingsBackdrop");
const closeSettingsModal = $("#closeSettingsModal");
const closeSettingsBtn = $("#closeSettingsBtn");
const themeOptions = document.querySelectorAll(".theme-option");
const backupDatabaseBtn = $("#backupDatabaseBtn");
const restoreDatabaseBtn = $("#restoreDatabaseBtn");
const restoreDbInput = $("#restoreDbInput");
const clearDatabaseBtn = $("#clearDatabaseBtn");
const emailDraftBackdrop = $("#emailDraftBackdrop");
const closeEmailDraftModal = $("#closeEmailDraftModal");
const emailSubjectInput = $("#emailSubjectInput");
const emailPreview = $("#emailPreview");
const emailBodyInput = $("#emailBodyInput");
const copyEmailDraftBtn = $("#copyEmailDraftBtn");
const downloadEmailDraftBtn = $("#downloadEmailDraftBtn");
const closeEmailDraftBtn = $("#closeEmailDraftBtn");
const openItemsBackdrop = $("#openItemsBackdrop");
const closeOpenItemsModal = $("#closeOpenItemsModal");
const openItemsBody = $("#openItemsBody");

const toast = $("#toast");

// ---------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------
function showToast(msg) {
  toast.textContent = msg;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add("show"));
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => { toast.hidden = true; }, 200);
  }, 2200);
}

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatDateLong(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function relativeFromToday(iso) {
  const then = new Date(iso + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.round((now - then) / 86400000);
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays === -1) return "tomorrow";
  if (diffDays > 0 && diffDays < 14) return `${diffDays} days ago`;
  if (diffDays < 0 && diffDays > -14) return `in ${-diffDays} days`;
  const weeks = Math.round(diffDays / 7);
  if (diffDays > 0) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  return `in ${-weeks} week${-weeks === 1 ? "" : "s"}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function selectedPerson() {
  return state.people.find((p) => p.id === state.selectedPersonId) || null;
}

const THEME_STORAGE_KEY = "oneonone-theme";
const themePresets = {
  default: {
    "--paper": "#F8FAFC",
    "--paper-raised": "#FFFFFF",
    "--ink": "#0F172A",
    "--ink-soft": "#475569",
    "--rule": "#E2E8F0",
    "--rule-strong": "#CBD5E1",
    "--primary": "#861657",
    "--primary-soft": "#F8E5F0",
    "--primary-strong": "#5F1044",
    "--navy": "#334155",
    "--navy-soft": "#64748B",
    "--sage": "#0F766E",
    "--sage-soft": "#D1FAE5",
  },
  purple: {
    "--paper": "#FCF5FF",
    "--paper-raised": "#FFFFFF",
    "--ink": "#1F1B2E",
    "--ink-soft": "#5B5471",
    "--rule": "#E9D8FD",
    "--rule-strong": "#D6BCFA",
    "--primary": "#861657",
    "--primary-soft": "#F5D5E9",
    "--primary-strong": "#5D104A",
    "--navy": "#44337A",
    "--navy-soft": "#6D28D9",
    "--sage": "#134E4A",
    "--sage-soft": "#D8F8F2",
  },
  dark: {
    "--paper": "#0F172A",
    "--paper-raised": "#111827",
    "--ink": "#E2E8F0",
    "--ink-soft": "#94A3B8",
    "--rule": "#334155",
    "--rule-strong": "#475569",
    "--primary": "#861657",
    "--primary-soft": "#4C1D44",
    "--primary-strong": "#D8B4FE",
    "--navy": "#1E293B",
    "--navy-soft": "#3B82F6",
    "--sage": "#0F766E",
    "--sage-soft": "#134E4A",
  },
};

function applyTheme(themeName) {
  const theme = themePresets[themeName] || themePresets.default;
  Object.entries(theme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
  themeOptions.forEach((option) => {
    option.classList.toggle("selected", option.dataset.theme === themeName);
  });
  localStorage.setItem(THEME_STORAGE_KEY, themeName);
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY) || "default";
  applyTheme(saved);
}

// ---------------------------------------------------------------------
// Rendering: rail
// ---------------------------------------------------------------------
function renderRail() {
  const managers = state.people.filter((p) => p.relationship === "manager");
  const reportees = state.people.filter((p) => p.relationship === "reportee");
  const others = state.people.filter((p) => p.relationship === "other");

  managerList.innerHTML = managers.map(personChipHtml).join("");
  reporteeList.innerHTML = reportees.map(personChipHtml).join("") ||
    `<p style="color:rgba(239,234,224,0.4); font-size:13px; padding:4px;">None added yet</p>`;
  othersList.innerHTML = others.map(personChipHtml).join("") ||
    `<p style="color:rgba(239,234,224,0.4); font-size:13px; padding:4px;">None added yet</p>`;

  addManagerBtn.hidden = managers.length > 0;

  document.querySelectorAll(".person-chip").forEach((el) => {
    el.addEventListener("click", () => selectPerson(parseInt(el.dataset.id, 10)));
  });

  const totalOpen = state.people.reduce((sum, p) => sum + p.open_action_count, 0);
  openItemsCount.textContent = totalOpen;
}

function personChipHtml(p) {
  const active = p.id === state.selectedPersonId ? "active" : "";
  const hasOpen = p.open_action_count > 0 ? "has-open" : "";
  return `
    <div class="person-chip ${active} ${hasOpen}" data-id="${p.id}">
      <span class="person-chip-dot"></span>
      <span class="person-chip-name">${escapeHtml(p.name)}</span>
      ${p.open_action_count > 0 ? `<span class="person-chip-meta">${p.open_action_count}</span>` : ""}
    </div>
  `;
}

// ---------------------------------------------------------------------
// Rendering: ledger / thread
// ---------------------------------------------------------------------
async function selectPerson(id) {
  state.selectedPersonId = id;
  renderRail();
  await loadAndRenderLedger();
}

async function loadAndRenderLedger() {
  const person = selectedPerson();
  if (!person) {
    emptyState.hidden = false;
    ledgerContent.hidden = true;
    return;
  }
  emptyState.hidden = true;
  ledgerContent.hidden = false;

  personRelationshipLabel.textContent = person.relationship === "manager" ? "Manager" : (person.relationship === "reportee" ? "Reportee" : "Other");
  personName.textContent = person.name;
  personRole.textContent = person.role || "";
  personRole.style.display = person.role ? "block" : "none";

  state.meetings = await getMeetings(person.id);
  renderCarryBanner();
  renderThread();
}

function renderCarryBanner() {
  const allOpen = [];
  state.meetings.forEach((m) => {
    m.action_items.forEach((item) => {
      if (item.status === "open") allOpen.push(item);
    });
  });
  if (allOpen.length === 0) {
    carryBanner.hidden = true;
    return;
  }
  carryBanner.hidden = false;
  const mine = allOpen.filter((i) => i.owner === "me").length;
  const theirs = allOpen.filter((i) => i.owner === "them").length;
  let parts = [];
  if (mine) parts.push(`${mine} on you`);
  if (theirs) parts.push(`${theirs} on them`);
  carryText.textContent = `${allOpen.length} open action item${allOpen.length === 1 ? "" : "s"} (${parts.join(", ")}) — carried into your next 1:1.`;
}

function renderThread() {
  if (state.meetings.length === 0) {
    thread.innerHTML = `<p style="color:var(--ink-soft); font-size:14.5px; padding-left: 4px;">No 1:1s logged yet. Click "Log a 1:1" to start the ledger.</p>`;
    return;
  }
  thread.innerHTML = state.meetings.map(entryHtml).join("");

  thread.querySelectorAll(".entry-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => openMeetingModal(parseInt(btn.dataset.meetingId, 10)));
  });
  thread.querySelectorAll(".action-checkbox").forEach((box) => {
    box.addEventListener("click", () => toggleActionItem(parseInt(box.dataset.itemId, 10), box.classList.contains("checked")));
  });
}

function entryHtml(m) {
  const hasOpen = m.action_items.some((i) => i.status === "open");
  const itemsHtml = m.action_items.map((item) => `
    <div class="action-row">
      <div class="action-checkbox ${item.status === "done" ? "checked" : ""}" data-item-id="${item.id}"></div>
      <span class="action-text ${item.status === "done" ? "done" : ""}">${escapeHtml(item.description)}</span>
      <span class="action-owner ${item.owner === "them" ? "them" : ""}">${item.owner === "them" ? "Them" : "Me"}</span>
    </div>
  `).join("");

  return `
    <div class="entry ${hasOpen ? "has-open" : ""}">
      <div class="entry-date-row">
        <span class="entry-date">${formatDateLong(m.meeting_date)}</span>
        <span class="entry-relative">${relativeFromToday(m.meeting_date)}</span>
        <button class="entry-edit-btn" data-meeting-id="${m.id}" type="button">Edit</button>
      </div>
      <p class="entry-notes">${escapeHtml(m.notes || "")}</p>
      ${m.action_items.length ? `<div class="entry-items">${itemsHtml}</div>` : ""}
    </div>
  `;
}

async function toggleActionItem(itemId, currentlyChecked) {
  const newStatus = currentlyChecked ? "open" : "done";
  await updateActionItem(itemId, { status: newStatus });
  await refreshPeopleAndLedger();
  showToast(newStatus === "done" ? "Marked done" : "Reopened");
}

// ---------------------------------------------------------------------
// Meeting modal (log / edit a 1:1)
// ---------------------------------------------------------------------
function openMeetingModal(meetingId = null) {
  state.editingMeetingId = meetingId;
  const person = selectedPerson();
  if (!person) return;

  if (meetingId) {
    const m = state.meetings.find((mm) => mm.id === meetingId);
    meetingModalTitle.textContent = `Edit 1:1 — ${formatDateLong(m.meeting_date)}`;
    meetingDateInput.value = m.meeting_date;
    meetingNotesInput.value = m.notes || "";
    state.pendingActionItems = m.action_items.map((i) => ({
      id: i.id, description: i.description, owner: i.owner, status: i.status,
    }));
  } else {
    meetingModalTitle.textContent = `Log a 1:1 with ${person.name}`;
    meetingDateInput.value = todayISO();
    meetingNotesInput.value = "";
    // Pre-seed with carried-over open items from this person's history.
    const openCarried = [];
    state.meetings.forEach((m) => {
      m.action_items.forEach((i) => {
        if (i.status === "open") {
          openCarried.push({ description: i.description, owner: i.owner, carried: true });
        }
      });
    });
    state.pendingActionItems = openCarried;
  }

  renderActionItemsEditor();
  meetingModalBackdrop.hidden = false;
  meetingNotesInput.focus();
}

function renderActionItemsEditor() {
  actionItemsEditor.innerHTML = state.pendingActionItems.map((item, idx) => `
    <div class="action-item-edit-row" data-idx="${idx}">
      <input type="text" value="${escapeHtml(item.description)}" placeholder="What needs to happen?" data-field="description">
      <select data-field="owner">
        <option value="me" ${item.owner === "me" ? "selected" : ""}>Me</option>
        <option value="them" ${item.owner === "them" ? "selected" : ""}>Them</option>
      </select>
      <button class="remove-item-btn" type="button" data-idx="${idx}" aria-label="Remove">×</button>
    </div>
  `).join("");

  actionItemsEditor.querySelectorAll(".action-item-edit-row").forEach((row) => {
    const idx = parseInt(row.dataset.idx, 10);
    row.querySelector('[data-field="description"]').addEventListener("input", (e) => {
      state.pendingActionItems[idx].description = e.target.value;
    });
    row.querySelector('[data-field="owner"]').addEventListener("change", (e) => {
      state.pendingActionItems[idx].owner = e.target.value;
    });
  });
  actionItemsEditor.querySelectorAll(".remove-item-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx, 10);
      state.pendingActionItems.splice(idx, 1);
      renderActionItemsEditor();
    });
  });
}

addActionItemBtn.addEventListener("click", () => {
  state.pendingActionItems.push({ description: "", owner: "me" });
  renderActionItemsEditor();
  const inputs = actionItemsEditor.querySelectorAll('[data-field="description"]');
  if (inputs.length) inputs[inputs.length - 1].focus();
});

function closeMeetingModalFn() {
  meetingModalBackdrop.hidden = true;
  state.editingMeetingId = null;
  state.pendingActionItems = [];
}

closeMeetingModal.addEventListener("click", closeMeetingModalFn);
cancelMeetingBtn.addEventListener("click", closeMeetingModalFn);
meetingModalBackdrop.addEventListener("click", (e) => {
  if (e.target === meetingModalBackdrop) closeMeetingModalFn();
});

function openEmailDraftModal() {
  const person = selectedPerson();
  if (!person) return;

  const latestMeeting = state.meetings[0] || null;
  const openItems = state.meetings.flatMap((m) => m.action_items)
    .filter((item) => item.status === "open");
  const subject = latestMeeting
    ? `1:1 summary for ${person.name} — ${formatDateLong(latestMeeting.meeting_date)}`
    : `1:1 summary for ${person.name}`;
  const bodyLines = [
    `Hi ${person.name},`,
    "",
    "Here’s the summary from our latest 1:1:",
    "",
    `Date: ${latestMeeting ? formatDateLong(latestMeeting.meeting_date) : todayISO()}`,
    "",
    "Notes:",
    latestMeeting ? (latestMeeting.notes || "No notes yet.") : "No notes yet.",
    "",
    "Open action items:",
  ];

  if (openItems.length === 0) {
    bodyLines.push("No open action items at the moment.");
  } else {
    openItems.forEach((item, idx) => {
      const ownerLabel = item.owner === "them" ? "Them" : "Me";
      bodyLines.push(`${idx + 1}. ${item.description} (${ownerLabel})`);
    });
  }

  bodyLines.push("", "Thanks,");

  const htmlBody = `
    <div style="font-family: Inter, system-ui, sans-serif; color: #0F172A; line-height: 1.6;">
      <p>Hi ${escapeHtml(person.name)},</p>
      <p>Here’s the summary from our latest 1:1:</p>
      <p><strong>Date:</strong> ${escapeHtml(latestMeeting ? formatDateLong(latestMeeting.meeting_date) : todayISO())}</p>
      <p><strong>Notes:</strong><br>${latestMeeting ? escapeHtml(latestMeeting.notes || "No notes yet.").replace(/\n/g, "<br>") : "No notes yet."}</p>
      <p><strong>Open action items:</strong></p>
      ${openItems.length === 0 ? '<p>No open action items at the moment.</p>' : `<ul>${openItems.map((item) => `<li>${escapeHtml(item.description)} (${item.owner === "them" ? "Them" : "Me"})</li>`).join("")}</ul>`}
      <p>Thanks,<br>Your Name</p>
    </div>
  `;

  emailPreview.innerHTML = htmlBody;
  emailSubjectInput.value = subject;
  emailBodyInput.value = htmlBody.trim();
  emailDraftBackdrop.hidden = false;
  copyEmailDraftBtn.focus();
}

function closeEmailDraftModalFn() {
  emailDraftBackdrop.hidden = true;
}

closeEmailDraftModal.addEventListener("click", closeEmailDraftModalFn);
closeEmailDraftBtn.addEventListener("click", closeEmailDraftModalFn);
emailDraftBackdrop.addEventListener("click", (e) => {
  if (e.target === emailDraftBackdrop) closeEmailDraftModalFn();
});

copyEmailDraftBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(emailBodyInput.value);
    showToast("HTML copied to clipboard");
  } catch (err) {
    showToast("Unable to copy HTML");
  }
});

downloadEmailDraftBtn.addEventListener("click", () => {
  const subject = emailSubjectInput.value;
  const html = emailBodyInput.value;
  const emlLines = [
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    `Subject: ${subject}`,
    "Content-Transfer-Encoding: 7bit",
    "",
    html,
  ];
  const blob = new Blob([emlLines.join("\r\n")], { type: "message/rfc822" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${subject.replace(/[^a-z0-9-_ ]/gi, "_").slice(0, 50)}.eml`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  showToast("Outlook draft downloaded");
});

settingsBtn.addEventListener("click", () => {
  settingsBackdrop.hidden = false;
});

closeSettingsModal.addEventListener("click", () => { settingsBackdrop.hidden = true; });
closeSettingsBtn.addEventListener("click", () => { settingsBackdrop.hidden = true; });
settingsBackdrop.addEventListener("click", (e) => {
  if (e.target === settingsBackdrop) settingsBackdrop.hidden = true;
});

themeOptions.forEach((option) => {
  option.addEventListener("click", () => applyTheme(option.dataset.theme));
});

backupDatabaseBtn.addEventListener("click", () => {
  const anchor = document.createElement("a");
  anchor.href = "/api/backup-db";
  anchor.download = "oneonones.db";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
});

restoreDatabaseBtn.addEventListener("click", () => {
  restoreDbInput.click();
});

restoreDbInput.addEventListener("change", async () => {
  const file = restoreDbInput.files && restoreDbInput.files[0];
  if (!file) return;
  const form = new FormData();
  form.append("file", file);

  try {
    const res = await fetch("/api/restore-db", { method: "POST", body: form });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Restore failed");
    }
    settingsBackdrop.hidden = true;
    state.selectedPersonId = null;
    await refreshPeopleAndLedger();
    showToast("Database restored");
  } catch (err) {
    showToast(err.message || "Unable to restore database");
  } finally {
    restoreDbInput.value = "";
  }
});

clearDatabaseBtn.addEventListener("click", async () => {
  if (!confirm("This will permanently clear all people, meetings, and action items. Continue?")) return;
  try {
    await clearDatabase();
    settingsBackdrop.hidden = true;
    state.selectedPersonId = null;
    await refreshPeopleAndLedger();
    showToast("Database cleared");
  } catch (err) {
    showToast(err.message || "Unable to clear database");
  }
});

saveMeetingBtn.addEventListener("click", async () => {
  const person = selectedPerson();
  if (!person) return;

  const meetingDate = meetingDateInput.value || todayISO();
  const notes = meetingNotesInput.value;
  const validPending = state.pendingActionItems
    .map((i) => ({ ...i, description: (i.description || "").trim() }))
    .filter((i) => i.description);
  const cleanItems = validPending.map((i) => ({ description: i.description, owner: i.owner }));

  try {
    if (state.editingMeetingId) {
      await updateMeeting(state.editingMeetingId, { meeting_date: meetingDate, notes });
      const original = state.meetings.find((m) => m.id === state.editingMeetingId).action_items;
      const stillPresent = new Set();
      for (const item of validPending) {
        if (item.id) {
          await updateActionItem(item.id, { description: item.description, owner: item.owner });
          stillPresent.add(item.id);
        } else {
          await addActionItem(state.editingMeetingId, { description: item.description, owner: item.owner });
        }
      }
      for (const orig of original) {
        if (!stillPresent.has(orig.id) && !validPending.some((p) => p.id === orig.id)) {
          await deleteActionItem(orig.id);
        }
      }
      showToast("Entry updated");
    } else {
      await createMeeting({
        person_id: person.id,
        meeting_date: meetingDate,
        notes,
        action_items: cleanItems,
      });
      showToast("1:1 logged");
    }
    closeMeetingModalFn();
    await refreshPeopleAndLedger();
  } catch (err) {
    showToast(err.message || "Something went wrong");
  }
});

newMeetingBtn.addEventListener("click", () => openMeetingModal(null));
emailDraftBtn.addEventListener("click", openEmailDraftModal);

// ---------------------------------------------------------------------
// Person modal (add / edit manager or reportee)
// ---------------------------------------------------------------------
function openPersonModal(relationship, personToEdit = null) {
  state.editingPersonId = personToEdit ? personToEdit.id : null;
  state.editingPersonRelationship = relationship;

  personModalTitle.textContent = personToEdit
    ? `Edit ${relationship}`
    : `Add ${relationship}`;
  personNameInput.value = personToEdit ? personToEdit.name : "";
  personRoleInput.value = personToEdit ? (personToEdit.role || "") : "";
  deletePersonBtn.hidden = !personToEdit;

  personModalBackdrop.hidden = false;
  personNameInput.focus();
}

function closePersonModalFn() {
  personModalBackdrop.hidden = true;
  state.editingPersonId = null;
  state.editingPersonRelationship = null;
}

addManagerBtn.addEventListener("click", () => openPersonModal("manager"));
addReporteeBtn.addEventListener("click", () => openPersonModal("reportee"));
addOtherBtn.addEventListener("click", () => openPersonModal("other"));
editPersonBtn.addEventListener("click", () => {
  const person = selectedPerson();
  if (person) openPersonModal(person.relationship, person);
});

closePersonModal.addEventListener("click", closePersonModalFn);
cancelPersonBtn.addEventListener("click", closePersonModalFn);
personModalBackdrop.addEventListener("click", (e) => {
  if (e.target === personModalBackdrop) closePersonModalFn();
});

savePersonBtn.addEventListener("click", async () => {
  const name = personNameInput.value.trim();
  const role = personRoleInput.value.trim();
  if (!name) {
    showToast("Name is required");
    return;
  }
  try {
    if (state.editingPersonId) {
      await updatePerson(state.editingPersonId, { name, role });
      showToast("Saved");
    } else {
      const created = await createPerson({ name, role, relationship: state.editingPersonRelationship });
      state.selectedPersonId = created.id;
      showToast(`Added ${name}`);
    }
    closePersonModalFn();
    await refreshPeopleAndLedger();
  } catch (err) {
    showToast(err.message || "Something went wrong");
  }
});

deletePersonBtn.addEventListener("click", async () => {
  if (!state.editingPersonId) return;
  const person = state.people.find((p) => p.id === state.editingPersonId);
  if (!confirm(`Remove ${person.name} from your ledger? Their meeting history will be kept but hidden.`)) return;
  await archivePerson(state.editingPersonId);
  if (state.selectedPersonId === state.editingPersonId) state.selectedPersonId = null;
  closePersonModalFn();
  await refreshPeopleAndLedger();
  showToast("Removed");
});

// ---------------------------------------------------------------------
// Open items drawer (across whole team)
// ---------------------------------------------------------------------
openItemsBtn.addEventListener("click", async () => {
  await renderOpenItemsDrawer();
  openItemsBackdrop.hidden = false;
});

async function renderOpenItemsDrawer() {
  const items = await getAllOpenItems();
  if (items.length === 0) {
    openItemsBody.innerHTML = `<div class="open-items-empty">Nothing open. You're all caught up.</div>`;
    return;
  }
  const grouped = {};
  items.forEach((i) => {
    grouped[i.person_name] = grouped[i.person_name] || [];
    grouped[i.person_name].push(i);
  });
  openItemsBody.innerHTML = Object.entries(grouped).map(([name, list]) => `
    <div class="open-items-group">
      <p class="open-items-group-title">${escapeHtml(name)}</p>
      ${list.map((i) => `
        <div class="action-row" style="margin-bottom:6px;">
          <div class="action-checkbox" data-item-id="${i.id}"></div>
          <span class="action-text">${escapeHtml(i.description)}</span>
          <span class="action-owner ${i.owner === "them" ? "them" : ""}">${i.owner === "them" ? "Them" : "Me"}</span>
        </div>
      `).join("")}
    </div>
  `).join("");

  openItemsBody.querySelectorAll(".action-checkbox").forEach((box) => {
    box.addEventListener("click", async () => {
      await updateActionItem(parseInt(box.dataset.itemId, 10), { status: "done" });
      await refreshPeopleAndLedger();
      await renderOpenItemsDrawer();
      showToast("Marked done");
    });
  });
}

closeOpenItemsModal.addEventListener("click", () => { openItemsBackdrop.hidden = true; });
openItemsBackdrop.addEventListener("click", (e) => {
  if (e.target === openItemsBackdrop) openItemsBackdrop.hidden = true;
});

// ---------------------------------------------------------------------
// Keyboard: Esc closes any open modal
// ---------------------------------------------------------------------
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!meetingModalBackdrop.hidden) closeMeetingModalFn();
  if (!personModalBackdrop.hidden) closePersonModalFn();
  if (!openItemsBackdrop.hidden) openItemsBackdrop.hidden = true;
});

// ---------------------------------------------------------------------
// Refresh / bootstrap
// ---------------------------------------------------------------------
async function refreshPeopleAndLedger() {
  state.people = await getPeople();
  renderRail();
  if (state.selectedPersonId && state.people.some((p) => p.id === state.selectedPersonId)) {
    await loadAndRenderLedger();
  } else {
    state.selectedPersonId = null;
    emptyState.hidden = false;
    ledgerContent.hidden = true;
  }
}

async function bootstrap() {
  state.people = await getPeople();
  renderRail();
  // Auto-select manager, or first reportee, if nothing selected yet
  if (state.people.length > 0) {
    const manager = state.people.find((p) => p.relationship === "manager");
    state.selectedPersonId = manager ? manager.id : state.people[0].id;
    renderRail();
    await loadAndRenderLedger();
  }
}

loadTheme();
bootstrap();
