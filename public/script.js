const socket = io();

// DOM Elements
const reportForm = document.getElementById('reportForm');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const universityChart = document.getElementById('universityChart').getContext('2d');
const raggingTypeChart = document.getElementById('raggingTypeChart').getContext('2d');

// Chart.js Configurations
let uniChart, typeChart;

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

  if (uniChart) uniChart.destroy();
  if (typeChart) typeChart.destroy();

  uniChart = new Chart(universityChart, {
    type: 'doughnut',
    data: {
      labels: universities,
      datasets: [{
        data: uniPercentages,
        backgroundColor: [
          '#00ffcc', '#ff0066', '#66ccff', '#ffcc00', '#cc33ff',
          '#33cc99', '#ff9933', '#99cc33', '#ff6699'
        ],
        borderColor: '#1a1a2e',
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: 'Incidents by University (%)', color: '#e0e0e0' },
        legend: { labels: { color: '#e0e0e0' } }
      },
      animation: {
        animateScale: true,
        animateRotate: true
      }
    }
  });

  typeChart = new Chart(raggingTypeChart, {
    type: 'doughnut',
    data: {
      labels: raggingTypes,
      datasets: [{
        data: typePercentages,
        backgroundColor: [
          '#00ffcc', '#ff0066', '#66ccff', '#ffcc00', '#cc33ff', '#33cc99'
        ],
        borderColor: '#1a1a2e',
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: 'Incidents by Ragging Type (%)', color: '#e0e0e0' },
        legend: { labels: { color: '#e0e0e0' } }
      },
      animation: {
        animateScale: true,
        animateRotate: true
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
  const report = {
    university: document.getElementById('university').value,
    raggingType: document.getElementById('raggingType').value,
    perpetrator: document.getElementById('perpetrator').value,
    details: document.getElementById('details').value
  };

  await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report)
  });
  reportForm.reset();
});

// Search Perpetrators
async function searchPerpetrators() {
  const name = searchInput.value.trim();
  if (!name) return;
  const response = await fetch(`/api/perpetrators/${name}`);
  const results = await response.json();
  searchResults.innerHTML = results.length
    ? results.map(r => `<p>${r.perpetrator} reported at ${r.university} for ${r.raggingType}</p>`).join('')
    : '<p>No reports found.</p>';
}

// Real-time Updates
socket.on('newReport', () => {
  fetchReports();
});

// Initial Load
fetchReports();
