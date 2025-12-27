// ==================== CONFIGURATION ====================
const CONFIG = {
    // Replace with your published Google Sheet CSV URL
    SHEET_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSmuK5Rd_wTUWDBmic7pVlSTBZGsnk2CISYsAWyKIc35g6EwIn0tIiYO4BWQqB8vKgThojWI8avxwyO/pub?output=csv',
    
    // Or use Google Sheets API (better for write operations)
    USE_API: false,
    SHEET_ID: 'YOUR_SHEET_ID',
    API_KEY: 'YOUR_API_KEY',
    
    // Your Google Form URL
    FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSdISmE7sPgpzkK9VfRMlmQs5NIHCrghjtJZCH1iu2FNDHnCbQ/viewform?usp=dialog',
    
    // Settings
    REFRESH_INTERVAL: 300000, // Auto-refresh every 5 minutes (in milliseconds)
    CHART_COLORS: {
        applied: '#4299e1',
        interview: '#ed8936',
        selected: '#48bb78',
        rejected: '#f56565'
    }
};

// ==================== GLOBAL VARIABLES ====================
let applicationsData = [];
let filteredData = [];
let statusChart = null;
let timelineChart = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Internship Tracker...');
    loadData();
    setupAutoRefresh();
    setTodayDate();
});

// ==================== DATA LOADING ====================
async function loadData() {
    showLoading(true);
    
    try {
        // Method 1: Load from published CSV
        if (!CONFIG.USE_API) {
            await loadFromCSV();
        } 
        // Method 2: Load from Google Sheets API
        else {
            await loadFromAPI();
        }
        
        processData();
        updateDashboard();
        renderApplications();
        showToast('Data loaded successfully! 🎉', 'success');
        
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load data. Please check your configuration.', 'error');
        
        // Load sample data for demo
        loadSampleData();
    } finally {
        showLoading(false);
    }
}

// Load data from published CSV
async function loadFromCSV() {
    const response = await fetch(CONFIG.SHEET_URL);
    const csvText = await response.text();
    applicationsData = parseCSV(csvText);
    console.log('✅ Loaded', applicationsData.length, 'applications from CSV');
}

// Load data from Google Sheets API
async function loadFromAPI() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/Form_Responses?key=${CONFIG.API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    const rows = data.values;
    const headers = rows[0];
    
    applicationsData = rows.slice(1).map(row => {
        let obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return obj;
    });
    
    console.log('✅ Loaded', applicationsData.length, 'applications from API');
}

// Parse CSV text into array of objects
function parseCSV(csv) {
    const lines = csv.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        let obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] ? values[index].trim() : '';
        });
        return obj;
    });
}

// Helper function to parse CSV line (handles quotes)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// Load sample data for demo purposes
function loadSampleData() {
    applicationsData = [
        {
            'Timestamp': '12/16/2025 21:51:55',
            'Company Name': 'ABC Enterprises',
            'Position': 'Product Manager',
            'Date Applied': '12/16/2025',
            'Application Status': 'Applied',
            'Deadline': '1/16/2026',
            'Notes': '',
            'Summary Area': '5'
        },
        {
            'Timestamp': '12/16/2025 22:05:50',
            'Company Name': 'Xyz',
            'Position': 'HII',
            'Date Applied': '12/26/2025',
            'Application Status': 'Applied',
            'Deadline': '12/31/2025',
            'Notes': '',
            'Summary Area': '3'
        },
        {
            'Timestamp': '12/16/2025 22:06:03',
            'Company Name': 'ABS Comany',
            'Position': 'Software Engineer',
            'Date Applied': '12/16/2025',
            'Application Status': 'Interview',
            'Deadline': '1/16/2026',
            'Notes': '',
            'Summary Area': '1'
        },
        {
            'Timestamp': '12/16/2025 23:30:56',
            'Company Name': 'Xyz',
            'Position': 'Jhjj',
            'Date Applied': '12/16/2025',
            'Application Status': 'Applied',
            'Deadline': '12/31/2025',
            'Notes': '',
            'Summary Area': '0'
        },
        {
            'Timestamp': '12/17/2025 20:46:52',
            'Company Name': 'kdjf',
            'Position': 'dfsdjf',
            'Date Applied': '12/17/2025',
            'Application Status': 'Selected',
            'Deadline': '12/27/2025',
            'Notes': '',
            'Summary Area': '0'
        }
    ];
    
    console.log('📝 Loaded sample data for demo');
    processData();
    updateDashboard();
    renderApplications();
}

// Process and clean data
function processData() {
    filteredData = [...applicationsData];
    
    // Sort by most recent first
    filteredData.sort((a, b) => {
        const dateA = new Date(a['Date Applied'] || a.Timestamp);
        const dateB = new Date(b['Date Applied'] || b.Timestamp);
        return dateB - dateA;
    });
}

// ==================== DASHBOARD ====================
function updateDashboard() {
    updateStatistics();
    updateCharts();
    updateRecentApplications();
}

function updateStatistics() {
    let stats = {
        total: applicationsData.length,
        applied: 0,
        interview: 0,
        selected: 0,
        rejected: 0
    };
    
    applicationsData.forEach(app => {
        const status = app['Application Status'];
        if (status === 'Applied') stats.applied++;
        else if (status === 'Interview') stats.interview++;
        else if (status === 'Selected') stats.selected++;
        else if (status === 'Rejected') stats.rejected++;
    });
    
    // Animate counter updates
    animateValue('totalCount', 0, stats.total, 800);
    animateValue('appliedCount', 0, stats.applied, 800);
    animateValue('interviewCount', 0, stats.interview, 800);
    animateValue('selectedCount', 0, stats.selected, 800);
}

// Animate number counting
function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

function updateCharts() {
    updateStatusChart();
    updateTimelineChart();
}

// Update status pie chart
function updateStatusChart() {
    const ctx = document.getElementById('statusChart').getContext('2d');
    
    const statusCounts = {
        Applied: 0,
        Interview: 0,
        Selected: 0,
        Rejected: 0
    };
    
    applicationsData.forEach(app => {
        const status = app['Application Status'];
        if (statusCounts[status] !== undefined) {
            statusCounts[status]++;
        }
    });
    
    if (statusChart) {
        statusChart.destroy();
    }
    
    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                    CONFIG.CHART_COLORS.applied,
                    CONFIG.CHART_COLORS.interview,
                    CONFIG.CHART_COLORS.selected,
                    CONFIG.CHART_COLORS.rejected
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12,
                            family: "'Segoe UI', sans-serif"
                        }
                    }
                }
            }
        }
    });
}

// Update timeline bar chart
function updateTimelineChart() {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    const monthCounts = {};

    applicationsData.forEach(app => {
        // Prefer Date Applied, fallback to Timestamp
        const rawDate = app['Date Applied'] || app['Timestamp'];
        const date = new Date(rawDate);

        // 🚫 Skip invalid dates
        if (isNaN(date.getTime())) return;

        const monthKey = date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        });

        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    const sortedMonths = Object.keys(monthCounts).sort((a, b) => {
        return new Date(a) - new Date(b);
    });

    if (timelineChart) timelineChart.destroy();

    timelineChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedMonths,
            datasets: [{
                label: 'Applications',
                data: sortedMonths.map(m => monthCounts[m]),
                backgroundColor: CONFIG.CHART_COLORS.applied,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}


function updateRecentApplications() {
    const container = document.getElementById('recentApplications');
    const recent = filteredData.slice(0, 3);
    
    if (recent.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No applications yet. Add your first one!</p>';
        return;
    }
    
    container.innerHTML = recent.map(app => `
        <div class="app-card status-${app['Application Status'].toLowerCase()}" onclick="showApplicationDetails(${applicationsData.indexOf(app)})">
            <div class="app-header">
                <div class="app-title">
                    <h3>${app['Company Name']}</h3>
                    <p>${app['Position']}</p>
                </div>
                <span class="app-status status-${app['Application Status'].toLowerCase()}">
                    ${app['Application Status']}
                </span>
            </div>
            <div class="app-details">
                <div class="app-detail-item">
                    <span class="app-detail-label">📅 Applied</span>
                    <span class="app-detail-value">${formatDate(app['Date Applied'])}</span>
                </div>
                ${app['Deadline'] ? `
                <div class="app-detail-item">
                    <span class="app-detail-label">⏰ Deadline</span>
                    <span class="app-detail-value">${formatDate(app['Deadline'])}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// ==================== APPLICATIONS LIST ====================
function renderApplications() {
    const container = document.getElementById('applicationsContainer');
    
    if (filteredData.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h3 style="color: var(--text-secondary); margin-bottom: 1rem;">📭 No applications found</h3>
                <p style="color: var(--text-light);">Try adjusting your filters or add a new application.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredData.map((app, index) => `
        <div class="app-card status-${app['Application Status'].toLowerCase()}" onclick="showApplicationDetails(${applicationsData.indexOf(app)})">
            <div class="app-header">
                <div class="app-title">
                    <h3>${app['Company Name']}</h3>
                    <p>${app['Position']}</p>
                </div>
                <span class="app-status status-${app['Application Status'].toLowerCase()}">
                    ${getStatusIcon(app['Application Status'])} ${app['Application Status']}
                </span>
            </div>
            <div class="app-details">
                <div class="app-detail-item">
                    <span class="app-detail-label">📅 Date Applied</span>
                    <span class="app-detail-value">${formatDate(app['Date Applied'])}</span>
                </div>
                ${app['Deadline'] ? `
                <div class="app-detail-item">
                    <span class="app-detail-label">⏰ Deadline</span>
                    <span class="app-detail-value">${formatDate(app['Deadline'])}</span>
                </div>
                ` : ''}
                ${app['Notes'] ? `
                <div class="app-detail-item" style="grid-column: 1 / -1;">
                    <span class="app-detail-label">📝 Notes</span>
                    <span class="app-detail-value">${app['Notes'].substring(0, 100)}${app['Notes'].length > 100 ? '...' : ''}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// ==================== FILTERING & SORTING ====================
function filterApplications() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    filteredData = applicationsData.filter(app => {
        const matchesSearch = 
            app['Company Name'].toLowerCase().includes(searchTerm) ||
            app['Position'].toLowerCase().includes(searchTerm);
        
        const matchesStatus = 
            statusFilter === 'all' || 
            app['Application Status'] === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    renderApplications();
}

function sortApplications() {
    const sortBy = document.getElementById('sortBy').value;
    
    filteredData.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b['Date Applied']) - new Date(a['Date Applied']);
            case 'oldest':
                return new Date(a['Date Applied']) - new Date(b['Date Applied']);
            case 'company':
                return a['Company Name'].localeCompare(b['Company Name']);
            case 'deadline':
                if (!a['Deadline']) return 1;
                if (!b['Deadline']) return -1;
                return new Date(a['Deadline']) - new Date(b['Deadline']);
            default:
                return 0;
        }
    });
    
    renderApplications();
}

// ==================== FORM SUBMISSION ====================
function submitApplication(event) {
    event.preventDefault();
    
    // Get form values
    const formData = {
        companyName: document.getElementById('companyName').value,
        position: document.getElementById('position').value,
        dateApplied: document.getElementById('dateApplied').value,
        status: document.getElementById('status').value,
        deadline: document.getElementById('deadline').value,
        notes: document.getElementById('notes').value
    };
    
    // Show message about Google Form being better for persistence
    if (confirm('⚠️ Note: Adding applications here will only update your local view.\n\nFor permanent storage in Google Sheets, please use the Google Form.\n\nDo you want to add this application locally anyway?')) {
        
        // Add to local data
        const newApp = {
            'Timestamp': new Date().toLocaleString(),
            'Company Name': formData.companyName,
            'Position': formData.position,
            'Date Applied': formData.dateApplied,
            'Application Status': formData.status,
            'Deadline': formData.deadline,
            'Notes': formData.notes,
            'Summary Area': ''
        };
        
        applicationsData.unshift(newApp);
        processData();
        updateDashboard();
        renderApplications();
        
        // Reset form
        document.getElementById('addApplicationForm').reset();
        
        // Show success message
        showToast('Application added locally! Use Google Form for permanent storage.', 'success');
        
        // Switch to applications view
        showSection('applications');
    }
}

// ==================== APPLICATION DETAILS MODAL ====================
function showApplicationDetails(index) {
    const app = applicationsData[index];
    const modal = document.getElementById('appModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <h2 style="margin-bottom: 1.5rem; color: var(--primary-color);">
            ${app['Company Name']} - ${app['Position']}
        </h2>
        
        <div style="display: grid; gap: 1.5rem;">
            <div class="app-detail-item">
                <span class="app-detail-label">📊 Status</span>
                <span class="app-status status-${app['Application Status'].toLowerCase()}" style="display: inline-block; margin-top: 0.5rem;">
                    ${getStatusIcon(app['Application Status'])} ${app['Application Status']}
                </span>
            </div>
            
            <div class="app-detail-item">
                <span class="app-detail-label">📅 Date Applied</span>
                <span class="app-detail-value">${formatDate(app['Date Applied'])}</span>
            </div>
            
            ${app['Deadline'] ? `
            <div class="app-detail-item">
                <span class="app-detail-label">⏰ Deadline</span>
                <span class="app-detail-value">${formatDate(app['Deadline'])} (${getDaysUntil(app['Deadline'])})</span>
            </div>
            ` : ''}
            
            <div class="app-detail-item">
                <span class="app-detail-label">🕐 Timestamp</span>
                <span class="app-detail-value">${app['Timestamp']}</span>
            </div>
            
            ${app['Notes'] ? `
            <div class="app-detail-item">
                <span class="app-detail-label">📝 Notes</span>
                <p style="margin-top: 0.5rem; line-height: 1.6; color: var(--text-primary);">
                    ${app['Notes']}
                </p>
            </div>
            ` : ''}
        </div>
        
        <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
            <button class="btn-primary" onclick="closeModal()" style="width: 100%;">
                Close
            </button>
        </div>
    `;
    
    modal.classList.add('show');
}

function closeModal() {
    document.getElementById('appModal').classList.remove('show');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('appModal');
    if (event.target === modal) {
        closeModal();
    }
}

// ==================== NAVIGATION ====================
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Add active class to clicked button
    document.getElementById(sectionId + 'Btn').classList.add('active');
    
    // Refresh data if viewing dashboard
    if (sectionId === 'dashboard') {
        updateDashboard();
    }
}

function openGoogleForm() {
    window.open(
        'https://docs.google.com/forms/d/e/1FAIpQLSdISmE7sPgpzkK9VfRMlmQs5NIHCrghjtJZCH1iu2FNDHnCbQ/viewform?usp=dialog',
        '_blank'
    );
}


// ==================== UTILITY FUNCTIONS ====================
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

function getDaysUntil(dateString) {
    const deadline = new Date(dateString);
    const today = new Date();
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays === 0) return 'Today!';
    if (diffDays === 1) return 'Tomorrow!';
    return `in ${diffDays} days`;
}

function getStatusIcon(status) {
    const icons = {
        'Applied': '📝',
        'Interview': '📞',
        'Selected': '✅',
        'Rejected': '❌'
    };
    return icons[status] || '📋';
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.add('show');
    } else {
        spinner.classList.remove('show');
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateApplied').value = today;
}

function setupAutoRefresh() {
    setInterval(() => {
        console.log('🔄 Auto-refreshing data...');
        loadData();
    }, CONFIG.REFRESH_INTERVAL);
}

// ==================== CHART.JS CDN ====================
// Add Chart.js library
const chartScript = document.createElement('script');
chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
document.head.appendChild(chartScript);