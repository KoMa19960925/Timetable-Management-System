// Sample timetable data
let timetableData = {
    "Monday": ["English", "Hindu", "Tamil", "Maths", "Science", "ICT", "Soc.Sci", "Drawing"],
    "Tuesday": ["Tamil", "ICT", "Science", "Soc.Sci", "English", "Hindu", "Maths", "Drawing"],
    "Wednesday": ["Science", "Hindu", "English", "ICT", "Science", "Maths", "Drawing", "Soc.Sci"],
    "Thursday": ["Tamil", "Soc.Sci", "English", "Maths", "Science", "ICT", "Hindu", "Drawing"],
    "Friday": ["Tamil", "Soc.Sci", "Science", "ICT", "Drawing", "Hindu", "English", "Maths"],
    "Saturday": ["Tamil", "Hindu", "English", "Maths", "Science", "ICT", "Soc.Sci", "Drawing"],
    "Sunday": ["Drawing", "Hindu", "English", "Maths", "Tamil", "ICT", "Soc.Sci", "Science"]
};

// Load timetable from localStorage if available
const savedTimetable = localStorage.getItem('classTimetable');
if (savedTimetable) {
    timetableData = JSON.parse(savedTimetable);
}

// DOM elements
const loginSection = document.getElementById('loginSection');
const teacherInterface = document.getElementById('teacherInterface');
const studentInterface = document.getElementById('studentInterface');
const teacherLoginBtn = document.getElementById('teacherLoginBtn');
const studentLoginBtn = document.getElementById('studentLoginBtn');
const teacherLogoutBtn = document.getElementById('teacherLogoutBtn');
const studentLogoutBtn = document.getElementById('studentLogoutBtn');
const teacherTimetableBody = document.getElementById('teacherTimetableBody');
const studentTimetableBody = document.getElementById('studentTimetableBody');
const daySelect = document.getElementById('daySelect');
const periodSelect = document.getElementById('periodSelect');
const subjectSelect = document.getElementById('subjectSelect');
const addPeriodBtn = document.getElementById('addPeriodBtn');
const removePeriodBtn = document.getElementById('removePeriodBtn');
const saveTimetableBtn = document.getElementById('saveTimetableBtn');
const teacherNotification = document.getElementById('teacherNotification');
const studentNotification = document.getElementById('studentNotification');

// Days array
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Login functions
teacherLoginBtn.addEventListener('click', function() {
    loginSection.style.display = 'none';
    teacherInterface.classList.add('active');
    generateTeacherTimetable();
});

studentLoginBtn.addEventListener('click', function() {
    loginSection.style.display = 'none';
    studentInterface.classList.add('active');
    generateStudentTimetable();
});

// Logout functions
teacherLogoutBtn.addEventListener('click', function() {
    teacherInterface.classList.remove('active');
    loginSection.style.display = '';
    showNotification(teacherNotification, "Logged out successfully", "info");
});

studentLogoutBtn.addEventListener('click', function() {
    studentInterface.classList.remove('active');
    loginSection.style.display = '';
});

// Generate teacher timetable
function generateTeacherTimetable() {
    teacherTimetableBody.innerHTML = '';
    
    days.forEach(day => {
        const row = document.createElement('tr');
        const dayCell = document.createElement('td');
        dayCell.className = 'day-header';
        dayCell.textContent = day;
        row.appendChild(dayCell);
        
        // Add period cells (Periods 1-4)
        for (let i = 0; i < 4; i++) {
            const periodCell = document.createElement('td');
            const subject = timetableData[day][i];
            
            if (subject) {
                periodCell.className = `subject-cell ${subject.toLowerCase().replace('.', '-').replace(' ', '-')}`;
                periodCell.textContent = subject;
                periodCell.dataset.day = day;
                periodCell.dataset.period = i;
                
                // Add click to select this cell
                periodCell.addEventListener('click', function() {
                    daySelect.value = day;
                    periodSelect.value = i + 1;
                    subjectSelect.value = subject;
                    showNotification(teacherNotification, `Selected ${day} - Period ${i+1}: ${subject}`, "info");
                });
            } else {
                periodCell.className = 'subject-cell empty-cell';
                periodCell.textContent = 'Free';
                periodCell.dataset.day = day;
                periodCell.dataset.period = i;
                
                periodCell.addEventListener('click', function() {
                    daySelect.value = day;
                    periodSelect.value = i + 1;
                    subjectSelect.value = '';
                    showNotification(teacherNotification, `Selected ${day} - Period ${i+1}: Free`, "info");
                });
            }
            
            row.appendChild(periodCell);
        }
        
        // Add break cell (empty cell that's handled by the header)
        row.appendChild(document.createElement('td'));
        
        // Add period cells (Periods 5-8)
        for (let i = 4; i < 8; i++) {
            const periodCell = document.createElement('td');
            const subject = timetableData[day][i];
            
            if (subject) {
                periodCell.className = `subject-cell ${subject.toLowerCase().replace('.', '-').replace(' ', '-')}`;
                periodCell.textContent = subject;
                periodCell.dataset.day = day;
                periodCell.dataset.period = i;
                
                // Add click to select this cell
                periodCell.addEventListener('click', function() {
                    daySelect.value = day;
                    periodSelect.value = i + 1;
                    subjectSelect.value = subject;
                    showNotification(teacherNotification, `Selected ${day} - Period ${i+1}: ${subject}`, "info");
                });
            } else {
                periodCell.className = 'subject-cell empty-cell';
                periodCell.textContent = 'Free';
                periodCell.dataset.day = day;
                periodCell.dataset.period = i;
                
                periodCell.addEventListener('click', function() {
                    daySelect.value = day;
                    periodSelect.value = i + 1;
                    subjectSelect.value = '';
                    showNotification(teacherNotification, `Selected ${day} - Period ${i+1}: Free`, "info");
                });
            }
            
            row.appendChild(periodCell);
        }
        
        teacherTimetableBody.appendChild(row);
    });
}

// Generate student timetable
function generateStudentTimetable() {
    studentTimetableBody.innerHTML = '';
    
    const today = new Date().getDay();
    // Adjust for Sunday (0) to be the last day in our array
    const todayIndex = today === 0 ? 6 : today - 1;
    
    days.forEach((day, index) => {
        const row = document.createElement('tr');
        
        // Highlight today's row
        if (index === todayIndex) {
            row.style.backgroundColor = '#f0f7ff';
        }
        
        const dayCell = document.createElement('td');
        dayCell.className = 'day-header';
        dayCell.textContent = day;
        
        // Highlight today's cell
        if (index === todayIndex) {
            dayCell.style.backgroundColor = '#3498db';
        }
        
        row.appendChild(dayCell);
        
        // Add period cells (Periods 1-4)
        for (let i = 0; i < 4; i++) {
            const periodCell = document.createElement('td');
            const subject = timetableData[day][i];
            
            if (subject) {
                periodCell.className = `subject-cell ${subject.toLowerCase().replace('.', '-').replace(' ', '-')}`;
                periodCell.textContent = subject;
            } else {
                periodCell.className = 'subject-cell empty-cell';
                periodCell.textContent = 'Free';
            }
            
            row.appendChild(periodCell);
        }
        
        // Add break cell (empty cell that's handled by the header)
        row.appendChild(document.createElement('td'));
        
        // Add period cells (Periods 5-8)
        for (let i = 4; i < 8; i++) {
            const periodCell = document.createElement('td');
            const subject = timetableData[day][i];
            
            if (subject) {
                periodCell.className = `subject-cell ${subject.toLowerCase().replace('.', '-').replace(' ', '-')}`;
                periodCell.textContent = subject;
            } else {
                periodCell.className = 'subject-cell empty-cell';
                periodCell.textContent = 'Free';
            }
            
            row.appendChild(periodCell);
        }
        
        studentTimetableBody.appendChild(row);
    });
}

// Add/Update period
addPeriodBtn.addEventListener('click', function() {
    const day = daySelect.value;
    const period = parseInt(periodSelect.value) - 1;
    const subject = subjectSelect.value;
    
    if (!day || period < 0 || period > 7) {
        showNotification(teacherNotification, "Please select valid day and period", "error");
        return;
    }
    
    if (subject) {
        timetableData[day][period] = subject;
        showNotification(teacherNotification, `Updated ${day} - Period ${period+1} to ${subject}`, "success");
    } else {
        timetableData[day][period] = "";
        showNotification(teacherNotification, `Cleared ${day} - Period ${period+1}`, "info");
    }
    
    generateTeacherTimetable();
});

// Remove period
removePeriodBtn.addEventListener('click', function() {
    const day = daySelect.value;
    const period = parseInt(periodSelect.value) - 1;
    
    if (!day || period < 0 || period > 7) {
        showNotification(teacherNotification, "Please select valid day and period", "error");
        return;
    }
    
    timetableData[day][period] = "";
    showNotification(teacherNotification, `Removed subject from ${day} - Period ${period+1}`, "success");
    subjectSelect.value = "";
    generateTeacherTimetable();
});

// Save timetable
saveTimetableBtn.addEventListener('click', function() {
    localStorage.setItem('classTimetable', JSON.stringify(timetableData));
    showNotification(teacherNotification, "Timetable saved successfully!", "success");
    
    // Update student view if it's open
    if (studentInterface.classList.contains('active')) {
        generateStudentTimetable();
    }
});

// Show notification
function showNotification(container, message, type) {
    container.textContent = message;
    container.className = `notification ${type}`;
    container.style.display = 'block';
    
    setTimeout(() => {
        container.style.display = 'none';
    }, 3000);
}

// Initialize the system
generateTeacherTimetable();

// Show student notification for a few seconds
setTimeout(() => {
    studentNotification.style.display = 'none';
}, 5000);
