// Storage key for localStorage
const STORAGE_KEY = 'roei_birthday_responses';
const ADMIN_PASSWORD = 'roei123';

// Webhook URL דיסקורד שלך — החלף לכתובת שלך!
const DISCORD_WEBHOOK_URL = 'https://ptb.discord.com/api/webhooks/1376911701152370750/la8sMhwx5FJcBZEZlyW93L6-Ec2VHLm_bzzqPfs_AWEz4x7YR2nfKKahuymFT86pV27Z';

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
    document.querySelectorAll('.radio-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.radio-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            const radioInput = this.querySelector('input[type="radio"]');
            radioInput.checked = true;
        });
    });

    document.getElementById('rsvpForm').addEventListener('submit', handleFormSubmit);

    document.getElementById('adminBtn').addEventListener('click', showAdminLogin);

    document.getElementById('loginBtn').addEventListener('click', handleAdminLogin);
    document.getElementById('backBtn').addEventListener('click', showUserForm);

    document.getElementById('adminPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleAdminLogin();
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    document.getElementById('downloadBtn').addEventListener('click', downloadJSON);

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

    if (!validateFormData(formData)) {
        return;
    }

    const existingIndex = responses.findIndex(r =>
        r.firstName.toLowerCase() === formData.firstName.toLowerCase() &&
        r.lastName.toLowerCase() === formData.lastName.toLowerCase()
    );

    if (existingIndex !== -1) {
        if (confirm('כבר נרשמת למסיבה. האם תרצה לעדכן את הפרטים?')) {
            responses[existingIndex] = formData;
        } else {
            return;
        }
    } else {
        responses.push(formData);
    }

    saveResponses();

    // שולחים הודעה ל-Discord דרך ה-Webhook
    sendDiscordWebhook(formData);

    showSuccessMessage();
    resetForm();

    console.log('Response saved:', formData);
}

// Validate form data
function validateFormData(formData) {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
        alert('אנא מלא את כל השדות');
        return false;
    }

    const phoneRegex = /^[\d\-\+\(\)\s]+$/;
    if (formData.phone.length < 9 || !phoneRegex.test(formData.phone)) {
        alert('אנא הכנס מספר טלפון תקין');
        return false;
    }

    return true;
}

// שולחת הודעה ל-Webhook דיסקורד
function sendDiscordWebhook(formData) {
    const embed = {
        title: 'רישום חדש למסיבת יום הולדת!',
        color: 0x0099ff,
        fields: [
            { name: 'שם', value: `${formData.firstName} ${formData.lastName}`, inline: true },
            { name: 'טלפון', value: formData.phone, inline: true },
            { name: 'האם מגיע', value: formData.attendance === 'yes' ? 'כן 🎉' : 'לא 😔', inline: true },
            { name: 'נרשם בתאריך', value: formData.timestamp, inline: false }
        ],
        timestamp: new Date().toISOString(),
        footer: {
            text: 'רישום יום הולדת - רועי'
        }
    };

    fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            embeds: [embed]
        })
    })
    .then(response => {
        if (!response.ok) {
            console.error('Webhook error:', response.statusText);
        }
    })
    .catch(error => {
        console.error('Webhook fetch error:', error);
    });
}
// Show success message
function showSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'block';

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
