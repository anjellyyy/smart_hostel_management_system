// API Base URL - Update this to match your backend URL
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
let currentSection = 'dashboard';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadDashboardData();
    loadRoomsForSelection();
    loadStudentsForSelection();
    checkLoginStatus();
});

// Initialize event listeners
function initializeApp() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // Action cards
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // Footer links
    document.querySelectorAll('.footer-section a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                showSection(section);
            }
        });
    });

    // Forms (guard if elements are missing to avoid breaking other features)
    const studentForm = document.getElementById('studentForm');
    if (studentForm) studentForm.addEventListener('submit', handleStudentRegistration);
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) paymentForm.addEventListener('submit', handlePaymentSubmission);
    const complaintForm = document.getElementById('complaintForm');
    if (complaintForm) complaintForm.addEventListener('submit', handleComplaintSubmission);
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    // If there are no modal forms, fall back to simple prompt-based auth
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn && !loginForm) loginBtn.addEventListener('click', showLoginPrompt);
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn && !registerForm) registerBtn.addEventListener('click', showRegisterPrompt);

    // Chatbot
    initializeChatbot();
}

// Section Navigation
async function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionName).classList.add('active');

    // Add active class to current nav link
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Load section-specific data
    currentSection = sectionName;
    switch(sectionName) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'students':
            await loadStudents();
            break;
        case 'rooms':
            await loadRooms();
            break;
        case 'payments':
            // Ensure student dropdowns are populated before rendering
            await loadStudentsForSelection();
            await loadPayments();
            break;
        case 'complaints':
            // Ensure student dropdowns are populated before rendering
            await loadStudentsForSelection();
            await loadComplaints();
            break;
    }
}

// API Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const text = await response.text();
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch (_) { data = null; }

        if (!response.ok) {
            const msg = (data && (data.error || data.message)) || response.statusText || 'Request failed';
            console.error('API error:', msg, { endpoint, status: response.status, data });
            showNotification(msg, 'error');
            return null;
        }

        return data;
    } catch (error) {
        console.error('API Call Error:', error);
        showNotification('Error connecting to server. Please try again.', 'error');
        return null;
    }
}

// Dashboard Functions
async function loadDashboardData() {
    const summary = await apiCall('/dashboard');
    if (summary) {
        document.getElementById('totalStudents').textContent = summary.totalStudents || summary.total_students || 0;
        document.getElementById('totalRooms').textContent = summary.totalRooms || summary.total_rooms || 0;
        document.getElementById('availableRooms').textContent = summary.availableRooms || summary.available_rooms || 0;
        document.getElementById('pendingComplaints').textContent = summary.pendingComplaints || summary.pending_complaints || 0;
    }

    // Ensure accurate counts from live data
    const [studentsList, roomsList, complaintsList] = await Promise.all([
        apiCall('/students'),
        apiCall('/rooms'),
        apiCall('/complaints')
    ]);

    if (studentsList) {
        document.getElementById('totalStudents').textContent = studentsList.length;
    }
    if (roomsList) {
        document.getElementById('totalRooms').textContent = roomsList.length;
        const available = roomsList.filter(r => (r.availability === 'Available')).length;
        document.getElementById('availableRooms').textContent = available;
    }
    if (complaintsList) {
        const pending = complaintsList.filter(c => c.status === 'Pending').length;
        document.getElementById('pendingComplaints').textContent = pending;
    }

    loadRecentActivities();
}

async function loadRecentActivities() {
    const activities = await apiCall('/activities');
    const activityList = document.getElementById('activityList');
    
    if (activities && activities.length > 0) {
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.description} • ${formatDate(activity.date)}</p>
                </div>
            </div>
        `).join('');
    } else {
        activityList.innerHTML = '<p>No recent activities</p>';
    }
}

function getActivityIcon(type) {
    const icons = {
        registration: 'fa-user-plus',
        payment: 'fa-money-bill-wave',
        complaint: 'fa-comments',
        room: 'fa-bed'
    };
    return icons[type] || 'fa-bell';
}

// Student Management
async function loadStudents() {
    const students = await apiCall('/students');
    const table = document.getElementById('studentsTable');
    
    if (students && students.length > 0) {
        table.innerHTML = students.map(student => `
            <tr>
                <td>${student.student_id}</td>
                <td>${student.name}</td>
                <td>${student.age}</td>
                <td>${student.gender}</td>
                <td>${student.room_no}</td>
                <td>${student.contact}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editStudent('${student.student_id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteStudent('${student.student_id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } else {
        table.innerHTML = '<tr><td colspan="7" class="text-center">No students registered</td></tr>';
    }
}

async function handleStudentRegistration(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const studentData = {
        student_id: formData.get('student_id'),
        name: formData.get('name'),
        age: parseInt(formData.get('age')),
        gender: formData.get('gender'),
        contact: formData.get('contact'),
        room_no: formData.get('room_no')
    };

    const result = await apiCall('/students', {
        method: 'POST',
        body: JSON.stringify(studentData)
    });

    if (result) {
        showNotification('Student registered successfully!', 'success');
        e.target.reset();
        loadStudents();
        loadDashboardData();
        loadRoomsForSelection();
    }
}

// Room Management
async function loadRooms() {
    const rooms = await apiCall('/rooms');
    const table = document.getElementById('roomsTable');
    
    if (rooms && rooms.length > 0) {
        table.innerHTML = rooms.map(room => `
            <tr>
                <td>${room.room_no}</td>
                <td>${room.type}</td>
                <td>${room.capacity}</td>
                <td>
                    <span class="status status-${room.availability === 'Available' ? 'available' : 'occupied'}">
                        ${room.availability}
                    </span>
                </td>
                <td>${room.occupied_by || '-'}</td>
                <td>
                    ${room.availability === 'Available' ? 
                        `<button class="btn btn-primary btn-sm" onclick="allocateRoom('${room.room_no}')">Allocate</button>` :
                        `<button class="btn btn-warning btn-sm" onclick="vacateRoom('${room.room_no}')">Vacate</button>`
                    }
                </td>
            </tr>
        `).join('');
    }
}

async function loadRoomsForSelection() {
    const rooms = await apiCall('/rooms/available');
    const select = document.getElementById('studentRoom');
    
    if (select) {
        if (rooms && rooms.length > 0) {
            select.innerHTML = '<option value="">Select Room</option>' + 
                rooms.map(room => `<option value="${room.room_no}">${room.room_no} (${room.type})</option>`).join('');
        } else {
            select.innerHTML = '<option value="">No rooms available</option>';
        }
    }
}

// Payment Management
function formatINR(value) {
    try {
        if (value === null || value === undefined) return '₹0.00';
        // Normalize: remove any non-numeric/decimal except dot
        const cleaned = String(value).trim().replace(/[^0-9.]/g, '');
        const num = Number.isFinite(Number(cleaned)) ? Number(cleaned) : Number(value);
        if (!Number.isFinite(num)) return `₹${value}`;
        return `₹${num.toFixed(2)}`;
    } catch (e) {
        return `₹${value}`;
    }
}

async function loadPayments() {
    const payments = await apiCall('/payments');
    const table = document.getElementById('paymentsTable');
    
    if (payments && payments.length > 0) {
        table.innerHTML = payments.map(payment => `
            <tr>
                <td>${payment.payment_id}</td>
                <td>${payment.student_id}</td>
                <td>${formatINR(payment.amount)}</td>
                <td>${payment.payment_type}</td>
                <td>${formatDate(payment.payment_date)}</td>
                <td>
                    <span class="status status-completed">Completed</span>
                </td>
            </tr>
        `).join('');
    } else {
        table.innerHTML = '<tr><td colspan="6" class="text-center">No payment records</td></tr>';
    }
}

async function loadStudentsForSelection() {
    const paymentSelect = document.getElementById('paymentStudent');
    const complaintSelect = document.getElementById('complaintStudent');

    // Show loading state if selects exist
    if (paymentSelect) paymentSelect.innerHTML = '<option value="">Loading...</option>';
    if (complaintSelect) complaintSelect.innerHTML = '<option value="">Loading...</option>';

    const students = await apiCall('/students');

    if (students && Array.isArray(students) && students.length > 0) {
        const options = '<option value="">Select Student</option>' +
            students.map(student => `<option value="${student.student_id}">${student.student_id} - ${student.name}</option>`).join('');

        if (paymentSelect) paymentSelect.innerHTML = options;
        if (complaintSelect) complaintSelect.innerHTML = options;
    } else {
        if (paymentSelect) paymentSelect.innerHTML = '<option value="">No students</option>';
        if (complaintSelect) complaintSelect.innerHTML = '<option value="">No students</option>';
    }
}

async function handlePaymentSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const paymentData = {
        student_id: formData.get('student_id'),
        amount: parseFloat(formData.get('amount')),
        payment_date: formData.get('payment_date'),
        payment_type: formData.get('payment_type')
    };

    const result = await apiCall('/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData)
    });

    if (result) {
        showNotification('Payment recorded successfully!', 'success');
        e.target.reset();
        loadPayments();
        loadDashboardData();
    }
}

// Complaint Management
async function loadComplaints() {
    const complaints = await apiCall('/complaints');
    const table = document.getElementById('complaintsTable');
    
    if (complaints && complaints.length > 0) {
        table.innerHTML = complaints.map(complaint => `
            <tr>
                <td>${complaint.complaint_id}</td>
                <td>${complaint.student_id}</td>
                <td>${complaint.issue_type}</td>
                <td>${complaint.description}</td>
                <td>${formatDate(complaint.complaint_date)}</td>
                <td>
                    <span class="status status-${complaint.status === 'Resolved' ? 'resolved' : 'pending'}">
                        ${complaint.status}
                    </span>
                </td>
                <td>
                    ${complaint.status === 'Pending' ? 
                        `<button class="btn btn-success btn-sm" onclick="resolveComplaint('${complaint.complaint_id}')">Resolve</button>` :
                        `<button class="btn btn-primary btn-sm" disabled>Resolved</button>`
                    }
                </td>
            </tr>
        `).join('');
    } else {
        table.innerHTML = '<tr><td colspan="7" class="text-center">No complaints filed</td></tr>';
    }
}

async function handleComplaintSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const complaintData = {
        student_id: formData.get('student_id'),
        issue_type: formData.get('issue_type'),
        description: formData.get('description')
    };

    const result = await apiCall('/complaints', {
        method: 'POST',
        body: JSON.stringify(complaintData)
    });

    if (result) {
        showNotification('Complaint submitted successfully!', 'success');
        e.target.reset();
        loadComplaints();
        loadDashboardData();
    }
}

// Chatbot Functions
function initializeChatbot() {
    const toggle = document.getElementById('chatbotToggle');
    const chatWindow = document.getElementById('chatbotWindow');
    const close = document.getElementById('chatbotClose');
    const send = document.getElementById('chatbotSend');
    const input = document.getElementById('chatbotInput');

    if (!toggle || !chatWindow || !close || !send || !input) return;

    toggle.addEventListener('click', () => {
        chatWindow.classList.toggle('active');
    });

    close.addEventListener('click', () => {
        chatWindow.classList.remove('active');
    });

    send.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

async function sendMessage() {
    const input = document.getElementById('chatbotInput');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    input.value = '';

    // Get bot response
    const response = await apiCall('/chatbot', {
        method: 'POST',
        body: JSON.stringify({ message: message })
    });

    if (response) {
        addMessage(response.reply, 'bot');
    } else {
        addMessage('I apologize, but I am currently unable to process your request. Please try again later.', 'bot');
    }
}

function addMessage(content, sender) {
    const body = document.getElementById('chatbotBody');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.innerHTML = `<div class="message-content">${content}</div>`;
    
    body.appendChild(messageDiv);
    body.scrollTop = body.scrollHeight;
}

// Utility Functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// ---------- Simple prompt-based auth if modals are not present ----------
async function showLoginPrompt() {
    const username = prompt('Enter username:');
    if (!username) return;
    const password = prompt('Enter password:');
    if (!password) return;
    const result = await apiCall('/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    console.log('Login prompt response:', result);
    if (result && (result.success || result.user)) {
        localStorage.setItem('userInfo', JSON.stringify(result.user));
        showNotification(result.message || 'Login successful', 'success');
    } else if (result && result.error) {
        showNotification(result.error, 'error');
    }
}

async function showRegisterPrompt() {
    const username = prompt('Choose a username:');
    if (!username) return;
    const email = prompt('Enter email:');
    if (!email) return;
    const password = prompt('Choose a password:');
    if (!password) return;
    const result = await apiCall('/register', { method: 'POST', body: JSON.stringify({ username, email, password }) });
    console.log('Register prompt response:', result);
    if (result && (result.success || result.message)) {
        showNotification(result.message || 'Registered successfully. Please login.', 'success');
    } else if (result && result.error) {
        showNotification(result.error, 'error');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Placeholder functions for future implementation
function editStudent(studentId) {
    const name = prompt('Enter new name (leave blank to keep same):');
    const age = prompt('Enter new age (leave blank to keep same):');
    const contact = prompt('Enter new contact (leave blank to keep same):');
    const room = prompt('Enter new room no (leave blank to keep same):');
    const payload = {};
    if (name) payload.name = name;
    if (age) payload.age = parseInt(age);
    if (contact) payload.contact = contact;
    if (room) payload.room_no = room;
    if (Object.keys(payload).length === 0) {
        return;
    }
    apiCall(`/students/${studentId}`, { method: 'PUT', body: JSON.stringify(payload) }).then(() => {
        showNotification('Student updated successfully', 'success');
        loadStudents();
        loadRooms();
        loadRoomsForSelection();
        loadDashboardData();
    });
}

function deleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student?')) {
        apiCall(`/students/${studentId}`, { method: 'DELETE' }).then(() => {
            showNotification('Student deleted successfully', 'success');
            loadStudents();
            loadRooms();
            loadRoomsForSelection();
            loadDashboardData();
        });
    }
}

function allocateRoom(roomNo) {
    const studentId = prompt('Enter Student ID to allocate:');
    if (!studentId) return;
    apiCall('/rooms/allocate', { method: 'POST', body: JSON.stringify({ student_id: studentId, room_no: roomNo }) }).then((res) => {
        if (res) {
            showNotification(`Room ${roomNo} allocated to ${studentId}`, 'success');
            loadRooms();
            loadRoomsForSelection();
            loadStudents();
            loadDashboardData();
        }
    });
}

function vacateRoom(roomNo) {
    if (confirm(`Are you sure you want to vacate room ${roomNo}?`)) {
        apiCall('/rooms/vacate', { method: 'POST', body: JSON.stringify({ room_no: roomNo }) }).then((res) => {
            if (res) {
                showNotification(`Room ${roomNo} vacated`, 'success');
                loadRooms();
                loadRoomsForSelection();
                loadStudents();
                loadDashboardData();
            }
        });
    }
}

function resolveComplaint(complaintId) {
    if (confirm('Mark this complaint as resolved?')) {
        apiCall(`/complaints/${complaintId}/resolve`, { method: 'POST' }).then((res) => {
            if (res) {
                showNotification('Complaint marked as resolved', 'success');
                loadComplaints();
                loadDashboardData();
            }
        });
    }
}

// Auth functions
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function checkLoginStatus() {
    // Check if user is logged in (you can implement session storage or cookies)
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        const user = JSON.parse(userInfo);
        document.getElementById('userInfo').textContent = `Welcome, ${user.username}`;
        document.getElementById('userInfo').style.display = 'inline';
        document.getElementById('logoutBtn').style.display = 'inline-block';
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('registerBtn').style.display = 'none';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const loginData = {
        username: formData.get('username'),
        password: formData.get('password')
    };

    const result = await apiCall('/login', {
        method: 'POST',
        body: JSON.stringify(loginData)
    });

    console.log('Login response:', result);
    if (result && (result.success || result.user)) {
        showNotification(result.message || 'Login successful!', 'success');
        localStorage.setItem('userInfo', JSON.stringify(result.user));
        closeModal('loginModal');
        checkLoginStatus();
        e.target.reset();
    } else if (result && result.error) {
        showNotification(result.error, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const registerData = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password')
    };

    const result = await apiCall('/register', {
        method: 'POST',
        body: JSON.stringify(registerData)
    });

    console.log('Register response:', result);
    if (result && (result.success || result.message)) {
        showNotification(result.message || 'Registration successful! Please login.', 'success');
        closeModal('registerModal');
        e.target.reset();
    } else if (result && result.error) {
        showNotification(result.error, 'error');
    }
}

function logout() {
    localStorage.removeItem('userInfo');
    showNotification('Logged out successfully!', 'success');
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('registerBtn').style.display = 'inline-block';
}