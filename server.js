// Initialize Socket.io (Remove this for now as Socket.io won't work with Netlify Functions directly)
// const socket = io();

// DOM Elements
const reportForm = document.getElementById('reportForm');
const reportLoader = document.getElementById('reportLoader');
const searchQuery = document.getElementById('searchQuery');
const filterOptions = document.getElementById('filterOptions');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const exportBtn = document.getElementById('exportBtn');
const liveUpdates = document.getElementById('liveUpdates');
const universityTotal = document.getElementById('universityTotal');
const typeTotal = document.getElementById('typeTotal');
const universityBreakdown = document.getElementById('universityBreakdown');
const typeBreakdown = document.getElementById('typeBreakdown');

// Chart Elements
const trendChart = document.getElementById('trendChart').getContext('2d');
const distributionChart = document.getElementById('distributionChart').getContext('2d');

// Initialize Charts
let tChart, dChart;

function initCharts() {
  // Trend Line Chart (Analytics Section)
  tChart = new Chart(trendChart, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Incidents Over Time',
        data: [],
        borderColor: '#00F0FF',
        fill: false,
        tension: 0.3,
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true, ticks: { color: '#A5B4FC' } },
        x: { ticks: { color: '#A5B4FC' } }
      },
      plugins: {
        legend: { labels: { color: '#A5B4FC' } }
      }
    }
  });

  // Distribution Doughnut Chart (Analytics Section)
  dChart = new Chart(distributionChart, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        label: 'Incident Distribution',
        data: [],
        backgroundColor: ['#00F0FF', '#FF00E6', '#00FF85', '#E0E0FF'],
      }]
    },
    options: {
      plugins: {
        legend: { labels: { color: '#A5B4FC' } }
      }
    }
  });
}

// Fetch and Update Data
async function fetchData() {
  try {
    const response = await fetch('/.netlify/functions/api/reports');
    const reports = await response.json();
    updateProgressRings(reports);
    updateCharts(reports);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

function updateProgressRings(reports) {
  // University Progress Ring and Breakdown
  const universityCounts = reports.reduce((acc, report) => {
    acc[report.university] = (acc[report.university] || 0) + 1;
    return acc;
  }, {});
  const totalUniversities = Object.values(universityCounts).reduce((sum, val) => sum + val, 0);
  universityTotal.textContent = totalUniversities;

  const universityCircle = document.querySelector('.university-progress .progress-ring-circle');
  const progress = totalUniversities > 0 ? (totalUniversities / 100) * 879.65 : 0;
  universityCircle.style.strokeDasharray = `${progress} 879.65`;

  universityBreakdown.innerHTML = '';
  const universities = Object.entries(universityCounts);
  universities.sort((a, b) => b[1] - a[1]);
  universities.forEach(([university, count]) => {
    const percentage = totalUniversities ? Math.round((count / totalUniversities) * 100) : 0;
    const item = document.createElement('div');
    item.classList.add('breakdown-item');
    item.innerHTML = `
      <span>${university}</span>
      <span>${percentage}%</span>
    `;
    universityBreakdown.appendChild(item);
  });

  // Type Progress Ring and Breakdown
  const raggingTypeCounts = reports.reduce((acc, report) => {
    acc[report.raggingType] = (acc[report.raggingType] || 0) + 1;
    return acc;
  }, {});
  const totalTypes = Object.values(raggingTypeCounts).reduce((sum, val) => sum + val, 0);
  typeTotal.textContent = totalTypes;

  const typeCircle = document.querySelector('.type-progress .progress-ring-circle');
  const typeProgress = totalTypes > 0 ? (totalTypes / 100) * 879.65 : 0;
  typeCircle.style.strokeDasharray = `${typeProgress} 879.65`;

  typeBreakdown.innerHTML = '';
  const types = Object.entries(raggingTypeCounts);
  types.sort((a, b) => b[1] - a[1]);
  types.forEach(([type, count]) => {
    const percentage = totalTypes ? Math.round((count / totalTypes) * 100) : 0;
    const item = document.createElement('div');
    item.classList.add('breakdown-item');
    item.innerHTML = `
      <span>${type}</span>
      <span>${percentage}%</span>
    `;
    typeBreakdown.appendChild(item);
  });
}

function updateCharts(reports) {
  const dates = reports.map(report => new Date(report.timestamp).toLocaleDateString());
  const dateCounts = dates.reduce((acc, date) => {
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  tChart.data.labels = Object.keys(dateCounts);
  tChart.data.datasets[0].data = Object.values(dateCounts);
  tChart.update();

  const distributionCounts = reports.reduce((acc, report) => {
    acc[report.university] = (acc[report.university] || 0) + 1;
    return acc;
  }, {});
  dChart.data.labels = Object.keys(distributionCounts);
  dChart.data.datasets[0].data = Object.values(distributionCounts);
  dChart.update();
}

// Submit Report
reportForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  reportLoader.style.display = 'block';

  const report = {
    university: document.getElementById('university').value,
    raggingType: document.getElementById('raggingType').value,
    perpetrator: document.getElementById('perpetrator').value,
    details: document.getElementById('details').value,
  };

  try {
    const response = await fetch('/.netlify/functions/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });

    if (response.ok) {
      reportForm.reset();
      fetchData();
      // Simulate live update without Socket.io
      const data = await response.json();
      const newReport = data.report;
      const updateItem = document.createElement('div');
      updateItem.classList.add('update-item');
      updateItem.innerHTML = `
        <div class="update-text">
          New report: ${newReport.university} - ${newReport.raggingType}
        </div>
        <div class="update-timestamp">
          ${new Date(newReport.timestamp).toLocaleString()}
        </div>
      `;
      liveUpdates.appendChild(updateItem);

      const updateItems = liveUpdates.querySelectorAll('.update-item');
      if (updateItems.length > 20) {
        liveUpdates.removeChild(updateItems[0]);
      }
      liveUpdates.scrollTop = liveUpdates.scrollHeight;
    } else {
      alert('Error submitting report');
    }
  } catch (error) {
    console.error('Error submitting report:', error);
    alert('Error submitting report');
  } finally {
    reportLoader.style.display = 'none';
  }
});

// Search Reports
searchBtn.addEventListener('click', async () => {
  const query = searchQuery.value.toLowerCase();
  const filter = filterOptions.value;

  try {
    const response = await fetch('/.netlify/functions/api/reports');
    const reports = await response.json();

    let filteredReports = reports;

    if (query) {
      filteredReports = filteredReports.filter(report =>
        report.perpetrator.toLowerCase().includes(query) ||
        report.university.toLowerCase().includes(query) ||
        report.raggingType.toLowerCase().includes(query) ||
        report.details.toLowerCase().includes(query)
      );
    }

    if (filter !== 'all') {
      if (filter === 'recent') {
        filteredReports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        filteredReports = filteredReports.slice(0, 5);
      } else if (filter === 'university') {
        filteredReports.sort((a, b) => a.university.localeCompare(b.university));
      } else if (filter === 'raggingType') {
        filteredReports.sort((a, b) => a.raggingType.localeCompare(b.raggingType));
      }
    }

    displaySearchResults(filteredReports);
  } catch (error) {
    console.error('Error searching reports:', error);
  }
});

function displaySearchResults(reports) {
  searchResults.innerHTML = '';
  if (reports.length === 0) {
    searchResults.innerHTML = `
      <div class="result-item">
        <div class="result-title">No Results</div>
        <div class="result-description">No reports match your search criteria.</div>
      </div>
    `;
    return;
  }

  reports.forEach(report => {
    const resultItem = document.createElement('div');
    resultItem.classList.add('result-item');
    resultItem.innerHTML = `
      <div class="result-title">${report.university} - ${report.raggingType}</div>
      <div class="result-description">
        Perpetrator: ${report.perpetrator || 'Anonymous'}<br>
        Details: ${report.details}<br>
        Reported on: ${new Date(report.timestamp).toLocaleString()}
      </div>
    `;
    searchResults.appendChild(resultItem);
  });
}

// Export Data
exportBtn.addEventListener('click', async () => {
  try {
    const response = await fetch('/.netlify/functions/api/reports');
    const reports = await response.json();

    const csvContent = [
      ['ID', 'University', 'Ragging Type', 'Perpetrator', 'Details', 'Timestamp'],
      ...reports.map(report => [
        report.id,
        report.university,
        report.raggingType,
        report.perpetrator || 'Anonymous',
        `"${report.details.replace(/"/g, '""')}"`,
        report.timestamp
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ragging_reports.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Error exporting data');
  }
});

// Initialize
initCharts();
fetchData();
