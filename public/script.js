// Initialize Socket.io
const socket = io();

// DOM Elements
const reportForm = document.getElementById('reportForm');
const reportLoader = document.getElementById('reportLoader');
const searchQuery = document.getElementById('searchQuery');
const filterOptions = document.getElementById('filterOptions');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const exportBtn = document.getElementById('exportBtn');
const liveUpdates = document.getElementById('liveUpdates');
const incidentPercentage = document.getElementById('incidentPercentage');

// Chart Elements
const universityChart = document.getElementById('universityChart').getContext('2d');
const raggingTypeChart = document.getElementById('raggingTypeChart').getContext('2d');
const trendChart = document.getElementById('trendChart').getContext('2d');
const distributionChart = document.getElementById('distributionChart').getContext('2d');

// Initialize Charts
let uChart, rtChart, tChart, dChart;

function initCharts() {
  uChart = new Chart(universityChart, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Incidents by University',
        data: [],
        backgroundColor: '#4DD0E1',
      }]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });

  rtChart = new Chart(raggingTypeChart, {
    type: 'pie',
    data: {
      labels: [],
      datasets: [{
        label: 'Incidents by Ragging Type',
        data: [],
        backgroundColor: ['#4DD0E1', '#FFAB91', '#81C784', '#FFD54F', '#A1887F', '#90CAF9'],
      }]
    }
  });

  tChart = new Chart(trendChart, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Incidents Over Time',
        data: [],
        borderColor: '#4DD0E1',
        fill: false,
      }]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });

  dChart = new Chart(distributionChart, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        label: 'Incident Distribution',
        data: [],
        backgroundColor: ['#4DD0E1', '#FFAB91', '#81C784', '#FFD54F'],
      }]
    }
  });
}

// Fetch and Update Data
async function fetchData() {
  try {
    const response = await fetch('/api/reports');
    const reports = await response.json();
    updateCharts(reports);
    updatePercentage(reports);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

function updateCharts(reports) {
  // University Chart
  const universityCounts = reports.reduce((acc, report) => {
    acc[report.university] = (acc[report.university] || 0) + 1;
    return acc;
  }, {});
  uChart.data.labels = Object.keys(universityCounts);
  uChart.data.datasets[0].data = Object.values(universityCounts);
  uChart.update();

  // Ragging Type Chart
  const raggingTypeCounts = reports.reduce((acc, report) => {
    acc[report.raggingType] = (acc[report.raggingType] || 0) + 1;
    return acc;
  }, {});
  rtChart.data.labels = Object.keys(raggingTypeCounts);
  rtChart.data.datasets[0].data = Object.values(raggingTypeCounts);
  rtChart.update();

  // Trend Chart (by date)
  const dates = reports.map(report => new Date(report.timestamp).toLocaleDateString());
  const dateCounts = dates.reduce((acc, date) => {
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  tChart.data.labels = Object.keys(dateCounts);
  tChart.data.datasets[0].data = Object.values(dateCounts);
  tChart.update();

  // Distribution Chart (simplified)
  const distributionCounts = reports.reduce((acc, report) => {
    acc[report.university] = (acc[report.university] || 0) + 1;
    return acc;
  }, {});
  dChart.data.labels = Object.keys(distributionCounts);
  dChart.data.datasets[0].data = Object.values(distributionCounts);
  dChart.update();
}

// Calculate and Update Percentage
function updatePercentage(reports) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Filter reports for the current month
  const thisMonthReports = reports.filter(report => {
    const reportDate = new Date(report.timestamp);
    return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
  });

  // Hypothetical average monthly reports (for demonstration purposes)
  const averageMonthlyReports = 100; // Adjust this value as needed
  const percentage = thisMonthReports.length
    ? Math.min(100, Math.round((thisMonthReports.length / averageMonthlyReports) * 100))
    : 0;

  incidentPercentage.textContent = `${percentage}%`;
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
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });

    if (response.ok) {
      reportForm.reset();
      fetchData();
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
    const response = await fetch('/api/reports');
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
    const response = await fetch('/api/reports');
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

// Real-Time Live Updates Box
socket.on('newReport', (report) => {
  const updateItem = document.createElement('div');
  updateItem.classList.add('update-item');
  updateItem.innerHTML = `
    <div class="update-text">
      New report: ${report.university} - ${report.raggingType}
    </div>
    <div class="update-timestamp">
      ${new Date(report.timestamp).toLocaleString()}
    </div>
  `;
  liveUpdates.appendChild(updateItem);

  // Limit to last 20 updates
  const updateItems = liveUpdates.querySelectorAll('.update-item');
  if (updateItems.length > 20) {
    liveUpdates.removeChild(updateItems[0]);
  }

  // Scroll to the bottom
  liveUpdates.scrollTop = liveUpdates.scrollHeight;
});

// Initialize
initCharts();
fetchData();
