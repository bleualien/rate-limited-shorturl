const API_URL = "http://localhost:5000";
let chartInstance = null;

// 1. Shorten URL: POST /shorten
async function shortenUrl() {
    const input = document.getElementById('urlInput');
    const btn = document.getElementById('shortenBtn');
    const msg = document.getElementById('statusMsg');

    const res = await fetch(`${API_URL}/shorten`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ url: input.value })
    });

    if (res.status === 429) {
        const data = await res.json();
        // Handle rate limiting
        startCountdown(data.retry_after, btn, msg);
        return;
    }

    const data = await res.json();
    msg.innerHTML = `Success! <a href="${data.short_url}" target="_blank">${data.short_url}</a>`;
    // Refresh analytics after adding new link
    loadAnalytics();
}

// 2. Countdown Timer for Rate Limiter
function startCountdown(seconds, btn, msg) {
    btn.disabled = true;
    let timeLeft = seconds;
    const timer = setInterval(() => {
        msg.innerText = `Rate limited. Try again in ${timeLeft}s`;
        timeLeft--;
        if (timeLeft < 0) {
            clearInterval(timer);
            btn.disabled = false;
            msg.innerText = "";
        }
    }, 1000);
}

// 3. Load Analytics: GET /api/analytics
async function loadAnalytics() {
    const res = await fetch(`${API_URL}/api/analytics`);
    const data = await res.json();
    const list = document.getElementById('linkList');
    list.innerHTML = "";

    Object.keys(data).forEach(alias => {
        const li = document.createElement('li');
        li.innerText = `/${alias} (${data[alias].clicks.length} clicks)`;
        li.onclick = () => updateChart(data[alias].clicks);
        list.appendChild(li);
    });
}

// 4. Update Chart.js: Time-series Visualization
function updateChart(clicks) {
    const ctx = document.getElementById('clicksChart').getContext('2d');
    
    // Process clicks into last 7 days buckets
    const days = ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today'];
    const counts = new Array(7).fill(0);
    const now = Date.now() / 1000;

    clicks.forEach(ts => {
        const diff = Math.floor((now - ts) / 86400);
        if (diff < 7) counts[6 - diff]++;
    });

    if (chartInstance) chartInstance.destroy();
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{ 
                label: 'Clicks', 
                data: counts, 
                borderColor: '#4a90e2', 
                backgroundColor: 'rgba(74, 144, 226, 0.2)',
                fill: true 
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });
}

// Initial load
loadAnalytics();