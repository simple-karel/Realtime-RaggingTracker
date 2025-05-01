const socket = io();

// DOM Elements
const reportForm = document.getElementById('reportForm');
const searchQuery = document.getElementById('searchQuery');
const filterOptions = document.getElementById('filterOptions');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const reportLoader = document.getElementById('reportLoader');
const exportBtn = document.getElementById('exportBtn');
const universityChart = document.getElementById('universityChart').getContext('2d');
const raggingTypeChart = document.getElementById('raggingTypeChart').getContext('2d');
const trendChart = document.getElementById('trendChart').getContext('2d');
const distributionChart = document.getElementById('distributionChart').getContext('2d');

// Chart Instances
let uniChart, typeChart, trendChartInstance, distChart;

// Data Categories
const universities = [
  'Colombo', 'Jaffna', 'Peradeniya', 'Jayewardenepura', 'Ruhuna',
  'Sabaragamuwa', 'Kelaniya', 'Eastern', 'South Eastern'
];
const raggingTypes = [
  'Verbal Harassment', 'Physical Harassment', 'Sexual Harassment',
  'Psychological Abuse', 'Cyber Bullying', 'Other'
];

// Initialize Charts
function initCharts(reports) {
  const uniCounts = universities.map(uni => 
    reports.filter(r => r.university === uni).length
  );
  const typeCounts = raggingTypes.map(type => 
    reports.filter(r => r.raggingType === type).length
  );
  const total = reports.length || 1; // Avoid division by zero
  const uniPercentages = uniCounts.map(count => ((count / total) * 100).toFixed(1));
  const typePercentages = typeCounts.map(count => ((count / total) * 100).toFixed(1));

  // University Chart (Doughnut)
  if (uniChart) uniChart.destroy();
  uniChart = new Chart(universityChart, {
    type: 'doughnut',
    data: {
      labels: universities,
      datasets: [{
        data: uniPercentages,
        backgroundColor: ['#00e6ff', '#ff2d8d', '#7b2dff', '#ffcc00', '#33cc99', '#ff9933', '#99cc33', '#ff6699', '#66ccff'],
        borderColor: '#0a0e17',
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: 'Incidents by University (%)', color: '#e6f0ff', font: { size: 16 } },
        legend: { labels: { color: '#e6f0ff' } }
      },
      animation: { animateScale: true, animateRotate: true }
    }
  });

  // Ragging Type Chart (Doughnut)
  if (typeChart) typeChart.destroy();
  typeChart = new Chart(raggingTypeChart, {
    type: 'doughnut',
    data: {
      labels: raggingTypes,
      datasets: [{
        data: typePercentages,
        backgroundColor: ['#00e6ff', '#ff2d8d', '#7b2dff', '#ffcc00', '#33cc99', '#66ccff'],
        borderColor: '#0a0e17',
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: 'Incidents by Ragging Type (%)', color: '#e6f0ff', font: { size: 16 } },
        legend: { labels: { color: '#e6f0ff' } }
      },
      animation: { animateScale: true, animateRotate: true }
    }
  });

  // Trend Chart (Line)
  const months = [...new Set(reports.map(r => new Date(r.timestamp).toLocaleString('default', { month: 'short', year: 'numeric' })))].sort();
  const trendData = months.map(month => ({
    month,
    count: reports.filter(r => new Date(r.timestamp).toLocaleString('default', { month: 'short', year: 'numeric' }) === month).length
  }));
  if (trendChartInstance) trendChartInstance.destroy();
  trendChartInstance = new Chart(trendChart, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Incidents',
        data: trendData.map(d => d.count),
        borderColor: '#00e6ff',
        backgroundColor: 'rgba(0, 230, 255, 0.2)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: 'Incident Trends', color: '#e6f0ff', font: { size: 16 } },
        legend: { labels: { color: '#e6f0ff' } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#e6f0ff' } },
        x: { ticks: { color: '#e6f0ff' } }
      }
    }
  });

  // Distribution Chart (Bar)
  if (distChart) distChart.destroy();
  distChart = new Chart(distributionChart, {
    type: 'bar',
    data: {
      labels: universities,
      datasets: [{
        label: 'Incidents',
        data: uniCounts,
        backgroundColor: '#00e6ff',
        borderColor: '#0a0e17',
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: 'Incident Distribution', color: '#e6f0ff', font: { size: 16 } },
        legend: { labels: { color: '#e6f0ff' } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#e6f0ff' } },
        x: { ticks: { color: '#e6f0ff' } }
      }
    }
  });
}

// Fetch and Update Reports
async function fetchReports() {
  const response = await fetch('/api/reports');
  const reports = await response.json();
  initCharts(reports);
}

// Submit Report
reportForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  reportLoader.style.display = 'block';
  const report = {
    university: document.getElementById('university').value,
    raggingType: document.getElementById('raggingType').value,
    perpetrator: document.getElementById('perpetrator').value,
    details: document.getElementById('details').value
  };

  try {
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    });
    reportForm.reset();
  } catch (err) {
    console.error('Error submitting report:', err);
  } finally {
    reportLoader.style.display = 'none';
  }
});

// Search Perpetrators
searchBtn.addEventListener('click', async () => {
  const name = searchQuery.value.trim();
  const filter = filterOptions.value;
  if (!name) return;

  const response = await fetch(`/api/perpetrators/${name}`);
  let results = await response.json();

  // Apply filters
  if (filter === 'recent') {
    results = results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
  } else if (filter === 'university') {
    results = results.sort((a, b) => a.university.localeCompare(b.university));
  } else if (filter === 'raggingType') {
    results = results.sort((a, b) => a.raggingType.localeCompare(b.raggingType));
  }

  searchResults.innerHTML = results.length
    ? results.map(r => `
        <div class="result-item">
          <div class="result-title">${r.perpetrator}</div>
          <div class="result-description">${r.university} - ${r.raggingType} (${new Date(r.timestamp).toLocaleDateString()})</div>
          <div class="data-tags">
            <span class="data-badge">${r.university}</span>
            <span class="data-badge">${r.raggingType}</span>
          </div>
        </div>
      `).join('')
    : '<div class="result-item"><div class="result-title">No Results</div><div class="result-description">No reports found for this perpetrator.</div></div>';
});

// Export Report
exportBtn.addEventListener('click', async () => {
  const response = await fetch('/api/reports');
  const reports = await response.json();
  const blob = new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ragging_reports.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Real-time Updates
socket.on('newReport', () => {
  fetchReports();
});

// Initial Load
fetchReports();
