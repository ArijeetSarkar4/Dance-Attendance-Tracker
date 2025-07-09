// Global variables
let students = JSON.parse(localStorage.getItem('danceStudents')) || [];
let attendanceRecords = JSON.parse(localStorage.getItem('danceAttendance')) || {};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    const today = new Date();
    const monday = getMonday(today);
    document.getElementById('weekDate').value = formatDate(monday);
    
    renderStudents();
    loadAttendanceForWeek();
    updateStatistics();
    populateHistoryDropdown();
});

// Utility functions
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Student management functions
function addStudent() {
    const nameInput = document.getElementById('studentName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter a student name');
        return;
    }
    
    if (students.find(student => student.name.toLowerCase() === name.toLowerCase())) {
        alert('Student already exists');
        return;
    }
    
    const student = {
        id: Date.now().toString(),
        name: name,
        dateAdded: new Date().toISOString()
    };
    
    students.push(student);
    saveStudents();
    renderStudents();
    loadAttendanceForWeek();
    updateStatistics();
    populateHistoryDropdown();
    
    nameInput.value = '';
    nameInput.focus();
}

function removeStudent(studentId) {
    if (!confirm('Are you sure you want to remove this student? This will also delete all attendance records.')) {
        return;
    }
    
    students = students.filter(student => student.id !== studentId);
    
    // Remove from attendance records
    Object.keys(attendanceRecords).forEach(week => {
        delete attendanceRecords[week][studentId];
    });
    
    saveStudents();
    saveAttendance();
    renderStudents();
    loadAttendanceForWeek();
    updateStatistics();
    populateHistoryDropdown();
}

function renderStudents() {
    const studentList = document.getElementById('studentList');
    
    if (students.length === 0) {
        studentList.innerHTML = '<div class="empty-state"><i class="fas fa-user-plus"></i><br>No students added yet. Add your first student above!</div>';
        return;
    }
    
    studentList.innerHTML = students.map(student => `
        <div class="student-item">
            <div class="student-name">${escapeHtml(student.name)}</div>
            <button onclick="removeStudent('${student.id}')" class="btn btn-danger">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Attendance management functions
function loadAttendanceForWeek() {
    const weekDate = document.getElementById('weekDate').value;
    if (!weekDate) return;
    
    const attendanceGrid = document.getElementById('attendanceGrid');
    
    if (students.length === 0) {
        attendanceGrid.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><br>Add students first to track attendance</div>';
        return;
    }
    
    const weekKey = weekDate;
    const weekAttendance = attendanceRecords[weekKey] || {};
    
    attendanceGrid.innerHTML = students.map(student => `
        <div class="attendance-item">
            <label for="attendance-${student.id}" class="student-name">${escapeHtml(student.name)}</label>
            <input 
                type="checkbox" 
                id="attendance-${student.id}" 
                class="attendance-checkbox"
                ${weekAttendance[student.id] ? 'checked' : ''}
                data-student-id="${student.id}"
            >
        </div>
    `).join('');
}

function markAttendanceForWeek() {
    const weekDate = document.getElementById('weekDate').value;
    if (!weekDate) {
        alert('Please select a week date');
        return;
    }
    
    const weekKey = weekDate;
    const checkboxes = document.querySelectorAll('.attendance-checkbox');
    
    if (!attendanceRecords[weekKey]) {
        attendanceRecords[weekKey] = {};
    }
    
    checkboxes.forEach(checkbox => {
        const studentId = checkbox.dataset.studentId;
        attendanceRecords[weekKey][studentId] = checkbox.checked;
    });
    
    saveAttendance();
    updateStatistics();
    
    // Show success message
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Saved!';
    button.style.background = '#38a169';
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
    }, 2000);
}

// Statistics functions
function updateStatistics() {
    const statsGrid = document.getElementById('statsGrid');
    
    if (students.length === 0) {
        statsGrid.innerHTML = '<div class="empty-state"><i class="fas fa-chart-bar"></i><br>No data to display yet</div>';
        return;
    }
    
    const stats = calculateStatistics();
    
    statsGrid.innerHTML = `
        <div class="stat-item">
            <span>Total Students</span>
            <span class="stat-value">${stats.totalStudents}</span>
        </div>
        <div class="stat-item">
            <span>Total Classes</span>
            <span class="stat-value">${stats.totalClasses}</span>
        </div>
        <div class="stat-item">
            <span>Average Attendance</span>
            <span class="stat-value">${stats.averageAttendance}%</span>
        </div>
        <div class="stat-item">
            <span>Most Consistent Student</span>
            <span class="stat-value">${stats.mostConsistent || 'N/A'}</span>
        </div>
    `;
}

function calculateStatistics() {
    const totalStudents = students.length;
    const totalClasses = Object.keys(attendanceRecords).length;
    
    let totalPossibleAttendances = 0;
    let totalActualAttendances = 0;
    const studentAttendanceCounts = {};
    
    students.forEach(student => {
        studentAttendanceCounts[student.id] = { present: 0, total: 0 };
    });
    
    Object.values(attendanceRecords).forEach(weekRecord => {
        students.forEach(student => {
            if (weekRecord.hasOwnProperty(student.id)) {
                totalPossibleAttendances++;
                studentAttendanceCounts[student.id].total++;
                
                if (weekRecord[student.id]) {
                    totalActualAttendances++;
                    studentAttendanceCounts[student.id].present++;
                }
            }
        });
    });
    
    const averageAttendance = totalPossibleAttendances > 0 
        ? Math.round((totalActualAttendances / totalPossibleAttendances) * 100)
        : 0;
    
    // Find most consistent student
    let bestAttendanceRate = 0;
    let mostConsistent = '';
    
    students.forEach(student => {
        const counts = studentAttendanceCounts[student.id];
        if (counts.total > 0) {
            const rate = counts.present / counts.total;
            if (rate > bestAttendanceRate) {
                bestAttendanceRate = rate;
                mostConsistent = student.name;
            }
        }
    });
    
    return {
        totalStudents,
        totalClasses,
        averageAttendance,
        mostConsistent
    };
}

// History functions
function populateHistoryDropdown() {
    const historyStudent = document.getElementById('historyStudent');
    const currentValue = historyStudent.value;
    
    historyStudent.innerHTML = '<option value="">Select a student</option>' +
        students.map(student => 
            `<option value="${student.id}" ${currentValue === student.id ? 'selected' : ''}>${escapeHtml(student.name)}</option>`
        ).join('');
}

function loadStudentHistory() {
    const studentId = document.getElementById('historyStudent').value;
    const historyDisplay = document.getElementById('historyDisplay');
    
    if (!studentId) {
        historyDisplay.innerHTML = '<div class="empty-state"><i class="fas fa-user-clock"></i><br>Select a student to view their attendance history</div>';
        return;
    }
    
    const student = students.find(s => s.id === studentId);
    const studentHistory = [];
    
    Object.keys(attendanceRecords).forEach(week => {
        if (attendanceRecords[week].hasOwnProperty(studentId)) {
            studentHistory.push({
                week: week,
                present: attendanceRecords[week][studentId]
            });
        }
    });
    
    studentHistory.sort((a, b) => new Date(b.week) - new Date(a.week));
    
    if (studentHistory.length === 0) {
        historyDisplay.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-times"></i><br>No attendance records found for ${escapeHtml(student.name)}</div>`;
        return;
    }
    
    const presentCount = studentHistory.filter(record => record.present).length;
    const attendanceRate = Math.round((presentCount / studentHistory.length) * 100);
    
    historyDisplay.innerHTML = `
        <div style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #5a67d8;">
            <h3>${escapeHtml(student.name)}'s Attendance Summary</h3>
            <p>Classes Attended: ${presentCount} out of ${studentHistory.length} (${attendanceRate}%)</p>
        </div>
        ${studentHistory.map(record => `
            <div class="history-item">
                <span>Week of ${formatDisplayDate(record.week)}</span>
                <span class="attendance-status ${record.present ? 'status-present' : 'status-absent'}">
                    ${record.present ? 'Present' : 'Absent'}
                </span>
            </div>
        `).join('')}
    `;
}

// Data persistence functions
function saveStudents() {
    localStorage.setItem('danceStudents', JSON.stringify(students));
}

function saveAttendance() {
    localStorage.setItem('danceAttendance', JSON.stringify(attendanceRecords));
}

// Export function
function exportData() {
    const data = {
        students: students,
        attendance: attendanceRecords,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `dance-attendance-${formatDate(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Enter key in student name input
    if (event.target.id === 'studentName' && event.key === 'Enter') {
        addStudent();
    }
});

// Auto-save functionality for attendance checkboxes
document.addEventListener('change', function(event) {
    if (event.target.classList.contains('attendance-checkbox')) {
        // Auto-save after a short delay
        setTimeout(() => {
            markAttendanceForWeek();
        }, 500);
    }
});
