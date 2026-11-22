const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const periods = 8;
const get = id => document.getElementById(id);
const loginSection = get("loginSection");
const teacherInterface = get("teacherInterface");
const studentInterface = get("studentInterface");
const teacherGradeSelect = get("teacherGradeSelect");
const studentGradeSelect = get("studentGradeSelect");
const teacherTimetableBody = get("teacherTimetableBody");
const studentTimetableBody = get("studentTimetableBody");
const studentTable = get("studentTimetable").closest(".timetable-container");
const daySelect = get("daySelect");
const periodSelect = get("periodSelect");
const subjectSelect = get("subjectSelect");
const deleteTimetableBtn = get("deleteTimetableBtn");
const drafts = new Map();

for (const select of [teacherGradeSelect, studentGradeSelect]) {
    for (let grade = 6; grade <= 12; grade++) {
        const option = document.createElement("option");
        option.value = grade;
        option.textContent = `Grade ${grade}`;
        select.appendChild(option);
    }
}

function storageKey(grade) {
    return `classTimetable:grade:${grade}`;
}

function readSavedTimetable(grade) {
    try {
        const stored = localStorage.getItem(storageKey(grade));
        // Treat an earlier, ungraded save as Grade 6 until it is updated or deleted.
        const legacy = stored === null && grade === "6";
        const data = JSON.parse(legacy ? localStorage.getItem("classTimetable") : stored);
        if (!data || !days.every(day => Array.isArray(data[day]))) {
            return null;
        }

        return Object.fromEntries(days.map(day => [
            day,
            Array.from({ length: periods }, (_, i) =>
                typeof data[day][i] === "string" ? data[day][i] : "")
        ]));
    } catch {
        return null;
    }
}

function blankTimetable() {
    return Object.fromEntries(days.map(day => [day, Array(periods).fill("")]));
}

function renderTimetable(body, timetable, onSelect) {
    body.replaceChildren();
    if (!timetable) return;

    const today = days[(new Date().getDay() + 6) % days.length];
    for (const day of days) {
        const row = document.createElement("tr");
        const dayCell = document.createElement("th");
        dayCell.scope = "row";
        dayCell.className = "day-header";
        dayCell.textContent = day;
        if (!onSelect && day === today) {
            row.style.backgroundColor = "#f0f7ff";
            dayCell.style.backgroundColor = "#3498db";
        }
        row.appendChild(dayCell);

        timetable[day].forEach((subject, period) => {
            if (period === 4) row.appendChild(document.createElement("td"));

            const cell = document.createElement("td");
            const subjectClass = subject.toLowerCase().replace(/[. ]/g, "-");
            cell.className = `subject-cell ${subjectClass || "empty-cell"}`;
            cell.textContent = subject || "Free";
            if (onSelect) {
                cell.addEventListener("click", () => onSelect(day, period, subject));
            }
            row.appendChild(cell);
        });
        body.appendChild(row);
    }
}

function showTeacherTimetable() {
    const grade = teacherGradeSelect.value;
    const saved = readSavedTimetable(grade);
    const draft = drafts.get(grade);
    deleteTimetableBtn.disabled = !saved && !draft;
    get("teacherGradeStatus").textContent = draft
        ? `Grade ${grade} has unsaved changes.`
        : saved
            ? `Grade ${grade} timetable is saved.`
            : `Grade ${grade} has no saved timetable. Add periods, then save.`;

    renderTimetable(teacherTimetableBody, draft || saved || blankTimetable(), (day, period, subject) => {
        daySelect.value = day;
        periodSelect.value = period + 1;
        subjectSelect.value = subject;
        showTeacherMessage(`Selected ${day}, Period ${period + 1}: ${subject || "Free"}`, "info");
    });
}

function showStudentTimetable() {
    const grade = studentGradeSelect.value;
    const saved = readSavedTimetable(grade);
    get("studentGradeStatus").textContent = saved
        ? `Grade ${grade} timetable`
        : `No timetable has been saved for Grade ${grade}.`;
    studentTable.hidden = !saved;
    renderTimetable(studentTimetableBody, saved);
}

let messageTimeout;
function showTeacherMessage(message, type) {
    const notification = get("teacherNotification");
    clearTimeout(messageTimeout);
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = "block";
    messageTimeout = setTimeout(() => {
        notification.style.display = "none";
    }, 3000);
}

get("timetableAccessLink").addEventListener("click", event => {
    event.preventDefault();
    get("access-heading").focus({ preventScroll: true });
    loginSection.scrollIntoView({ block: "center" });
});

get("teacherLoginBtn").addEventListener("click", () => {
    loginSection.style.display = "none";
    teacherInterface.classList.add("active");
    showTeacherTimetable();
});
get("studentLoginBtn").addEventListener("click", () => {
    loginSection.style.display = "none";
    studentInterface.classList.add("active");
    showStudentTimetable();
});

const backToTeacher = get("backToTeacher");
const studentLogout = get("studentLogoutBtn");
let studentGradeBeforePreview;

get("openStudentPreview").addEventListener("click", () => {
    if (!teacherInterface.classList.contains("active")) return;

    studentGradeBeforePreview = studentGradeSelect.value;
    studentGradeSelect.value = teacherGradeSelect.value;
    teacherInterface.classList.remove("active");
    backToTeacher.hidden = false;
    studentLogout.hidden = true;
    studentInterface.classList.add("active");
    showStudentTimetable();
    get("studentDashboardTitle").focus();
});

backToTeacher.addEventListener("click", () => {
    if (backToTeacher.hidden) return;

    studentInterface.classList.remove("active");
    backToTeacher.hidden = true;
    studentLogout.hidden = false;
    studentGradeSelect.value = studentGradeBeforePreview;
    teacherInterface.classList.add("active");
    showTeacherTimetable();
    get("openStudentPreview").focus();
});

for (const [button, dashboard] of [
    [get("teacherLogoutBtn"), teacherInterface],
    [studentLogout, studentInterface]
]) {
    button.addEventListener("click", () => {
        dashboard.classList.remove("active");
        loginSection.style.display = "";
    });
}

teacherGradeSelect.addEventListener("change", () => {
    get("teacherNotification").style.display = "none";
    subjectSelect.value = "";
    showTeacherTimetable();
});
studentGradeSelect.addEventListener("change", showStudentTimetable);

function updatePeriod(subject) {
    const grade = teacherGradeSelect.value;
    const draft = drafts.get(grade) || readSavedTimetable(grade) || blankTimetable();
    draft[daySelect.value][Number(periodSelect.value) - 1] = subject;
    drafts.set(grade, draft);
    showTeacherTimetable();
}

get("addPeriodBtn").addEventListener("click", () => updatePeriod(subjectSelect.value));
get("removePeriodBtn").addEventListener("click", () => {
    subjectSelect.value = "";
    updatePeriod("");
});

get("saveTimetableBtn").addEventListener("click", () => {
    const grade = teacherGradeSelect.value;
    const timetable = drafts.get(grade) || readSavedTimetable(grade) || blankTimetable();
    try {
        localStorage.setItem(storageKey(grade), JSON.stringify(timetable));
    } catch {
        showTeacherMessage("Unable to save the timetable in this browser.", "error");
        return;
    }
    drafts.delete(grade);
    showTeacherTimetable();
    showTeacherMessage(`Grade ${grade} timetable saved.`, "success");
});

deleteTimetableBtn.addEventListener("click", () => {
    const grade = teacherGradeSelect.value;
    if (!window.confirm(`Delete the Grade ${grade} timetable and any unsaved changes?`)) return;

    try {
        // Record deletion even for Grade 6 so a legacy save cannot reappear.
        localStorage.setItem(storageKey(grade), "null");
    } catch {
        showTeacherMessage("Unable to delete the timetable in this browser.", "error");
        return;
    }
    drafts.delete(grade);
    subjectSelect.value = "";
    showTeacherTimetable();
    showTeacherMessage(`Grade ${grade} timetable deleted.`, "success");
});

window.addEventListener("storage", event => {
    if (event.key === null || event.key === "classTimetable" || event.key.startsWith("classTimetable:grade:")) {
        if (studentInterface.classList.contains("active")) showStudentTimetable();
        if (teacherInterface.classList.contains("active")) showTeacherTimetable();
    }
});
