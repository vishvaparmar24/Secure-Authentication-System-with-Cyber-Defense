const API_BASE = '/api/admin';

function log(msg, type = 'info') {
    const debugEl = document.getElementById('debugLog');
    if (!debugEl) return;

    // Add timestamp
    const time = new Date().toLocaleTimeString([], { hour12: false });
    const color = type === 'error' ? '#ef4444' : '#22c55e';
    const icon = type === 'error' ? '❌' : '>';

    const div = document.createElement('div');
    div.className = 'terminal-line';
    div.innerHTML = `<span style="opacity:0.5">[${time}]</span> <span style="color:${color}">${icon} ${msg}</span>`;

    debugEl.appendChild(div);
    debugEl.scrollTop = debugEl.scrollHeight; // Auto scroll to newest
}

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 5000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}

async function fetchStats() {
    log('Fetching Stats...');
    try {
        const res = await fetchWithTimeout(`${API_BASE}/stats?t=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        log(`Stats received: Users=${data.totalUsers}, Attacks=${data.totalAttacks}`);
        document.getElementById('totalUsers').textContent = data.totalUsers;
        document.getElementById('highRiskUsers').textContent = data.highRiskUsers;
        document.getElementById('totalAttacks').textContent = data.totalAttacks;
    } catch (error) {
        log('Stats Error: ' + error.message, 'error');
        document.getElementById('totalUsers').textContent = 'Err';
    }
}

async function fetchEvents() {
    log('Fetching Events...');
    try {
        const res = await fetchWithTimeout(`${API_BASE}/events?t=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const logs = await res.json();
        log(`Events received: ${logs.length} items`);

        const tbody = document.getElementById('eventTableBody');
        tbody.innerHTML = '';
        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No events found</td></tr>';
            return;
        }
        logs.forEach(log => {
            const tr = document.createElement('tr');
            let colorClass = '';
            if (log.event_type && (log.event_type.includes('FAIL') || log.event_type.includes('BLOCKED'))) colorClass = 'risk-medium';

            tr.innerHTML = `
                <td style="font-size: 0.8rem; color: #94a3b8;">${new Date(log.timestamp).toLocaleTimeString()}</td>
                <td class="${colorClass}">${log.event_type}</td>
                <td>${log.ip_address}</td>
                <td><span class="risk-badge ${colorClass || 'risk-low'}">LOG</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        log('Events Error: ' + error.message, 'error');
    }
}

async function fetchRiskUsers() {
    log('Fetching Risk Users...');
    try {
        const res = await fetchWithTimeout(`${API_BASE}/risk-users?t=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const users = await res.json();
        log(`Risk Users received: ${users.length} items`);

        const tbody = document.getElementById('riskTableBody');
        tbody.innerHTML = '';
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">No high risk users</td></tr>';
            return;
        }
        users.forEach(u => {
            const tr = document.createElement('tr');
            let badgeClass = 'risk-low';
            if (u.risk_level === 'MEDIUM') badgeClass = 'risk-medium';
            if (u.risk_level === 'HIGH') badgeClass = 'risk-high';
            if (u.risk_level === 'CRITICAL') badgeClass = 'risk-critical';

            tr.innerHTML = `
                <td>${u.email}</td>
                <td style="font-weight: bold;">${u.risk_score}</td>
                <td><span class="risk-badge ${badgeClass}">${u.risk_level}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        log('Risk Users Error: ' + error.message, 'error');
    }
}

async function renderCharts() {
    log('Rendering Charts...');
    try {
        const res = await fetchWithTimeout(`${API_BASE}/attack-distribution?t=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        log('Chart data received');

        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js library failed to load. Check internet connection.');
        }

        const ctx = document.getElementById('attackChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '# of Events',
                    data: data.data,
                    backgroundColor: '#6366f1',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { grid: { display: false } }
                }
            }
        });

        const ctx2 = document.getElementById('threatPieChart').getContext('2d');
        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: [
                        '#6366f1', '#ec4899', '#ef4444', '#eab308', '#22c55e'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
            }
        });
    } catch (error) {
        log('Charts Error: ' + error.message, 'error');
    }
}

// Auto-run on load
window.addEventListener('load', () => {
    log('JS Loaded. Initializing Dashboard...');
    fetchStats();
    fetchEvents();
    fetchRiskUsers();
    renderCharts();

    setInterval(fetchEvents, 3000);
    setInterval(fetchRiskUsers, 5000);
});
