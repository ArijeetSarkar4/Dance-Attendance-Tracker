// Global variables
let students = JSON.parse(localStorage.getItem('danceStudents')) || [];
let attendanceRecords = JSON.parse(localStorage.getItem('danceAttendance')) || {};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    const today = new Date();
    const monday = getMonday(today);
    document.getElementById('weekDate').value = formatDate(monday);
    
    // Initialize with smooth loading
    setTimeout(() => {
        renderStudents();
        loadAttendanceForWeek();
        updateStatistics();
        populateHistoryDropdown();
    }, 100);
    
    // Add modern keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Add auto-save notifications
    setupAutoSave();
});

// Modern utility functions
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

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: '9999',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        animation: 'slideInRight 0.3s ease',
        maxWidth: '300px'
    });
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function addLoadingState(element) {
    element.classList.add('loading');
    const originalContent = element.innerHTML;
    element.disabled = true;
    return () => {
        element.classList.remove('loading');
        element.innerHTML = originalContent;
        element.disabled = false;
    };
}

// Enhanced student management functions
function addStudent() {
    const nameInput = document.getElementById('studentName');
    const name = nameInput.value.trim();
    
    if (!name) {
        showNotification('Please enter a student name', 'error');
        nameInput.focus();
        return;
    }
    
    if (students.find(student => student.name.toLowerCase() === name.toLowerCase())) {
        showNotification('Student already exists', 'error');
        nameInput.focus();
        return;
    }
    
    const student = {
        id: Date.now().toString(),
        name: name,
        dateAdded: new Date().toISOString()
    };
    
    students.push(student);
    saveStudents();
    
    // Smooth UI updates
    setTimeout(() => {
        renderStudents();
        loadAttendanceForWeek();
        updateStatistics();
        populateHistoryDropdown();
        showNotification(`${name} added successfully!`);
    }, 100);
    
    nameInput.value = '';
    nameInput.focus();
}

function removeStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    if (!confirm(`Are you sure you want to remove ${student.name}? This will also delete all attendance records.`)) {
        return;
    }
    
    students = students.filter(student => student.id !== studentId);
    
    // Remove from attendance records
    Object.keys(attendanceRecords).forEach(week => {
        delete attendanceRecords[week][studentId];
    });
    
    saveStudents();
    saveAttendance();
    
    // Smooth UI updates
    setTimeout(() => {
        renderStudents();
        loadAttendanceForWeek();
        updateStatistics();
        populateHistoryDropdown();
        showNotification(`${student.name} removed successfully`);
    }, 100);
}

function renderStudents() {
    const studentList = document.getElementById('studentList');
    
    if (students.length === 0) {
        studentList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-plus"></i>
                <p>No students added yet.<br>Add your first student above!</p>
            </div>
        `;
        return;
    }
    
    studentList.innerHTML = students.map((student, index) => `
        <div class="student-item" style="animation-delay: ${index * 0.1}s" role="listitem">
            <div class="student-name">${escapeHtml(student.name)}</div>
            <button 
                onclick="removeStudent('${student.id}')" 
                class="btn btn-danger"
                aria-label="Remove ${escapeHtml(student.name)}"
                data-tooltip="Remove student">
                <i class="fas fa-trash" aria-hidden="true"></i>
            </button>
        </div>
    `).join('');
}

// Enhanced attendance management functions
function loadAttendanceForWeek() {
    const weekDate = document.getElementById('weekDate').value;
    if (!weekDate) return;
    
    const attendanceGrid = document.getElementById('attendanceGrid');
    
    if (students.length === 0) {
        attendanceGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>Add students first to track attendance</p>
            </div>
        `;
        return;
    }
    
    const weekKey = weekDate;
    const weekAttendance = attendanceRecords[weekKey] || {};
    
    attendanceGrid.innerHTML = students.map((student, index) => `
        <div class="attendance-item" style="animation-delay: ${index * 0.05}s">
            <label for="attendance-${student.id}" class="student-name">${escapeHtml(student.name)}</label>
            <input 
                type="checkbox" 
                id="attendance-${student.id}" 
                class="attendance-checkbox"
                ${weekAttendance[student.id] ? 'checked' : ''}
                data-student-id="${student.id}"
                aria-label="Mark attendance for ${escapeHtml(student.name)}"
            >
        </div>
    `).join('');
}

function markAttendanceForWeek() {
    const weekDate = document.getElementById('weekDate').value;
    if (!weekDate) {
        showNotification('Please select a week date', 'error');
        return;
    }
    
    const button = event.target.closest('button');
    const removeLoading = addLoadingState(button);
    
    setTimeout(() => {
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
        
        removeLoading();
        
        // Enhanced success feedback
        button.innerHTML = '<i class="fas fa-check"></i> Saved!';
        button.style.background = 'var(--success-hover)';
        
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-check"></i> Save Attendance';
            button.style.background = '';
        }, 2000);
        
        showNotification('Attendance saved successfully!');
    }, 500);
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

// Enhanced keyboard shortcuts and auto-save
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // Ctrl/Cmd + Enter to add student
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            if (document.activeElement.id === 'studentName') {
                addStudent();
            }
        }
        
        // Escape to clear input
        if (event.key === 'Escape') {
            if (document.activeElement.id === 'studentName') {
                document.getElementById('studentName').value = '';
            }
        }
        
        // Ctrl/Cmd + S to save attendance
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            markAttendanceForWeek();
        }
    });
}

function setupAutoSave() {
    let autoSaveTimeout;
    
    document.addEventListener('change', function(event) {
        if (event.target.classList.contains('attendance-checkbox')) {
            // Clear existing timeout
            clearTimeout(autoSaveTimeout);
            
            // Auto-save after 1 second of inactivity
            autoSaveTimeout = setTimeout(() => {
                markAttendanceForWeek();
            }, 1000);
        }
    });
}

// Enhanced export function
function exportData() {
    const button = event.target.closest('button');
    const removeLoading = addLoadingState(button);
    
    setTimeout(() => {
        const data = {
            students: students,
            attendance: attendanceRecords,
            exportDate: new Date().toISOString(),
            totalStudents: students.length,
            totalClasses: Object.keys(attendanceRecords).length,
            appVersion: '2.0'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `dance-attendance-${formatDate(new Date())}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        removeLoading();
        showNotification('Data exported successfully!');
    }, 500);
}

// Add notification styles to document
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
