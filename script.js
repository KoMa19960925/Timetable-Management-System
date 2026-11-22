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

const accountDialog = get("accountDialog");
const accountForm = get("accountForm");
const accountRole = get("accountRole");
const accountEmail = get("accountEmail");
const accountPassword = get("accountPassword");
const accountMessage = get("accountMessage");
const accountSubmit = get("accountSubmit");
const accountCancel = get("accountCancel");
let registering = false;

function studentGradeForEmail(email) {
    return /^grade(6|7|8|9|10|11|12)@gmail\.com$/.exec(email)?.[1];
}

function updateGradeEmailHint() {
    get("gradeEmailHint").hidden = accountRole.value !== "student";
}

function setAccountMode(mode, role) {
    registering = mode === "register";
    accountRole.value = role;
    get("accountRoleField").hidden = !registering;
    get("accountTitle").textContent = registering
        ? "Register"
        : role === "teacher" ? "Teacher Login" : "Student Login";
    accountSubmit.textContent = registering ? "Register" : "Login";
    accountPassword.autocomplete = registering ? "new-password" : "current-password";
    updateGradeEmailHint();
}

function openAccountDialog(mode, role) {
    accountForm.reset();
    accountMessage.textContent = "";
    setAccountMode(mode, role);
    accountDialog.showModal();
}

async function hashPassword(password, salt) {
    const key = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
    );
    const digest = await crypto.subtle.deriveBits({
        name: "PBKDF2", hash: "SHA-256", salt, iterations: 600000
    }, key, 256);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

get("registerBtn").addEventListener("click", () => openAccountDialog("register", "student"));
get("teacherLoginBtn").addEventListener("click", () => openAccountDialog("login", "teacher"));
get("studentLoginBtn").addEventListener("click", () => openAccountDialog("login", "student"));
accountRole.addEventListener("change", updateGradeEmailHint);
accountCancel.addEventListener("click", () => accountDialog.close());
accountDialog.addEventListener("cancel", event => {
    if (accountSubmit.disabled) event.preventDefault();
});
accountDialog.addEventListener("close", () => accountForm.reset());

accountForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (accountSubmit.disabled) return;
    const role = accountRole.value;
    const email = accountEmail.value.trim().toLowerCase();
    const password = accountPassword.value;
    const studentGrade = studentGradeForEmail(email);
    if (role === "student" && !studentGrade) {
        accountMessage.textContent = "Use your grade email, from grade6@gmail.com to grade12@gmail.com.";
        return;
    }
    if (registering && role === "teacher" && studentGrade) {
        accountMessage.textContent = "Grade emails are for student accounts. Use a different email for Teacher Login.";
        return;
    }
    const legacyKey = `tms:demo-account:${email}`;
    const key = role === "student" ? `tms:student-account:${email}` : legacyKey;
    accountSubmit.disabled = true;
    accountCancel.disabled = true;
    accountMessage.textContent = "";

    try {
        const storedAccount = localStorage.getItem(key);
        const legacyAccount = storedAccount === null && role === "student"
            ? JSON.parse(localStorage.getItem(legacyKey))
            : null;
        const account = legacyAccount?.role === "student" ? legacyAccount : JSON.parse(storedAccount);
        if (registering) {
            if (account) {
                accountMessage.textContent = "An account with this email already exists.";
                return;
            }
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const hash = await hashPassword(password, salt);
            if (localStorage.getItem(key) !== storedAccount) {
                accountMessage.textContent = "An account with this email already exists.";
                return;
            }
            localStorage.setItem(key, JSON.stringify({ role, salt: [...salt], hash }));
            setAccountMode("login", role);
            accountPassword.value = "";
            accountMessage.textContent = "Account created. Enter your password to log in.";
            accountPassword.focus();
            return;
        }

        if (!account || account.role !== role ||
            account.hash !== await hashPassword(password, new Uint8Array(account.salt))) {
            accountMessage.textContent = "Email or password is incorrect for this role.";
            return;
        }

        accountDialog.close();
        loginSection.style.display = "none";
        if (role === "teacher") {
            teacherInterface.classList.add("active");
            showTeacherTimetable();
        } else {
            studentGradeSelect.value = studentGrade;
            studentGradeSelect.disabled = true;
            studentInterface.classList.add("active");
            showStudentTimetable();
        }
    } catch {
        accountMessage.textContent = "Account access is unavailable in this browser.";
    } finally {
        accountSubmit.disabled = false;
        accountCancel.disabled = false;
    }
});

const backToTeacher = get("backToTeacher");
const studentLogout = get("studentLogoutBtn");
let studentGradeBeforePreview;

get("openStudentPreview").addEventListener("click", () => {
    if (!teacherInterface.classList.contains("active")) return;

    studentGradeBeforePreview = studentGradeSelect.value;
    studentGradeSelect.value = teacherGradeSelect.value;
    studentGradeSelect.disabled = false;
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
