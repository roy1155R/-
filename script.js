// Storage key for localStorage
const STORAGE_KEY = 'roei_birthday_responses';
const ADMIN_PASSWORD = 'roei123';

// Global variables
let responses = [];
let isAdminMode = false;

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadResponses();
    setupEventListeners();
    showUserForm();
});

// Load existing responses from localStorage
function loadResponses() {
    try {
        const savedResponses = localStorage.getItem(STORAGE_KEY);
        if (savedResponses) {
            responses = JSON.parse(savedResponses);
        }
    } catch (error) {
        console.error('Error loading responses:', error);
        responses = [];
    }
}

// Save responses to localStorage
function saveResponses() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
    } catch (error) {
        console.error('Error saving responses:', error);
        alert('שגיאה בשמירת הנתונים');
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Handle radio button selection visual feedback
    document.querySelectorAll('.radio-option').forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            document.querySelectorAll('.radio-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Check the radio button
            const radioInput = this.querySelector('input[type="radio"]');
            radioInput.checked = true;
        });
    });

    // Handle form submission
    document.getElementById('rsvpForm').addEventListener('submit', handleFormSubmit);

    // Admin button
    document.getElementById('adminBtn').addEventListener('click', showAdminLogin);

    // Admin login
    document.getElementById('loginBtn').addEventListener('click', handleAdminLogin);
    document.getElementById('backBtn').addEventListener('click', showUserForm);

    // Admin password enter key
    document.getElementById('adminPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleAdminLogin();
        }
    });

    // Admin logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Download button
    document.getElementById('downloadBtn').addEventListener('click', downloadJSON);

    // Clear all button
    document.getElementById('clearAllBtn').addEventListener('click', clearAllData);
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        attendance: document.querySelector('input[name="attendance"]:checked').value,
        timestamp: new Date().toLocaleString('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    };

    // Validate form data
    if (!validateFormData(formData)) {
        return;
    }

    // Check if person already responded
    const existingIndex = responses.findIndex(r => 
        r.firstName.toLowerCase() === formData.firstName.toLowerCase() && 
        r.lastName.toLowerCase() === formData.lastName.toLowerCase()
    );

    if (existingIndex !== -1) {
        if (confirm('כבר נרשמת למסיבה. האם תרצה לעדכן את הפרטים?')) {
            // Update existing response
            responses[existingIndex] = formData;
        } else {
            return;
        }
    } else {
        // Add new response
        responses.push(formData);
    }

    // Save to localStorage
    saveResponses();

    // Show success message
    showSuccessMessage();

    // Reset form
    resetForm();

    // Log for development
    console.log('Response saved:', formData);
}

// Validate form data
function validateFormData(formData) {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
        alert('אנא מלא את כל השדות');
        return false;
    }

    // Check if phone number is valid (basic validation)
    const phoneRegex = /^[\d\-\+\(\)\s]+$/;
    if (formData.phone.length < 9 || !phoneRegex.test(formData.phone)) {
        alert('אנא הכנס מספר טלפון תקין');
        return false;
    }

    return true;
}

// Show success message
function showSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'block';
    
    // Hide success message after 3 seconds
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}

// Reset form
function resetForm() {
    document.getElementById('rsvpForm').reset();
    document.querySelectorAll('.radio-option').forEach(opt => {
        opt.classList.remove('selected');
    });
}

// Show/Hide sections
function showUserForm() {
    document.getElementById('userForm').classList.remove('hidden');
    document.getElementById('adminLogin').classList.add('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
    isAdminMode = false;
}

function showAdminLogin() {
    document.getElementById('userForm').classList.add('hidden');
    document.getElementById('adminLogin').classList.remove('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
    document.getElementById('adminPassword').focus();
    hideLoginError();
}

function showAdminPanel() {
    document.getElementById('userForm').classList.add('hidden');
    document.getElementById('adminLogin').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    isAdminMode = true;
    updateAdminPanel();
}

// Admin login handling
function handleAdminLogin() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        document.getElementById('adminPassword').value = '';
        hideLoginError();
        showAdminPanel();
    } else {
        showLoginError();
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }
}

function showLoginError() {
    document.getElementById('loginError').style.display = 'block';
    setTimeout(() => {
        hideLoginError();
    }, 3000);
}

function hideLoginError() {
    document.getElementById('loginError').style.display = 'none';
}

// Handle logout
function handleLogout() {
    showUserForm();
}

// Update admin panel with current data
function updateAdminPanel() {
    updateStats();
    displayResponses();
}

// Update statistics
function updateStats() {
    const stats = getResponsesStats();
    document.getElementById('totalCount').textContent = stats.total;
    document.getElementById('attendingCount').textContent = stats.attending;
    document.getElementById('notAttendingCount').textContent = stats.notAttending;
}

// Display responses in admin panel
function displayResponses() {
    const responsesList = document.getElementById('responsesList');
    
    if (responses.length === 0) {
        responsesList.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">אין אישורי הגעה עדיין</p>';
        return;
    }

    // Sort responses by timestamp (newest first)
    const sortedResponses = [...responses].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    responsesList.innerHTML = sortedResponses.map(response => {
        const attendanceText = response.attendance === 'yes' ? 'מגיע 🎉' : 'לא מגיע 😔';
        const attendanceClass = response.attendance === 'yes' ? 'attendance-yes' : 'attendance-no';
        
        return `
            <div class="response-item ${attendanceClass}">
                <div class="response-name">${response.firstName} ${response.lastName}</div>
                <div class="response-details">
                    טלפון: ${response.phone} | ${attendanceText}<br>
                    <small>נרשם: ${response.timestamp}</small>
                </div>
            </div>
        `;
    }).join('');
}

// Download responses as JSON
function downloadJSON() {
    if (responses.length === 0) {
        alert('אין נתונים להורדה');
        return;
    }

    const dataStr = JSON.stringify(responses, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roei_birthday_responses_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
}

// Clear all data
function clearAllData() {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו לא ניתנת לביטול!')) {
        if (confirm('בטוח בטוח? כל הרשימה תימחק!')) {
            responses = [];
            saveResponses();
            updateAdminPanel();
            alert('כל הנתונים נמחקו בהצלחה');
        }
    }
}

// Utility function to get responses statistics
function getResponsesStats() {
    return {
        total: responses.length,
        attending: responses.filter(r => r.attendance === 'yes').length,
        notAttending: responses.filter(r => r.attendance === 'no').length
    };
}

// Export data for backup (console function)
function exportData() {
    console.log('Backup Data:', JSON.stringify(responses, null, 2));
    return responses;
}

// Import data from backup (console function)
function importData(data) {
    if (Array.isArray(data)) {
        responses = data;
        saveResponses();
        if (isAdminMode) {
            updateAdminPanel();
        }
        console.log('Data imported successfully');
        return true;
    }
    console.error('Invalid data format');
    return false;
}
