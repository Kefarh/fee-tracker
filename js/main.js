// main.js (Enhanced dashboard with student counts and unpaid balances)

const firebaseConfig = {
  apiKey: "AIzaSyAKlM6pPf93zjLj49Y-nyKUIsIaLE5UmK8",
  authDomain: "fee-tracker-cadad.firebaseapp.com",
  projectId: "fee-tracker-cadad",
  storageBucket: "fee-tracker-cadad.firebasestorage.app",
  messagingSenderId: "372847716849",
  appId: "1:372847716849:web:15824518e99abe2c697c50",
  measurementId: "G-DQXRXSGSE1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const standardFees = {
  "Grade 1": 1500,
  "Grade 2": 1500,
  "Grade 3": 1800,
  "Grade 4": 2000,
  "Grade 5": 2300,
  "Grade 6": 3000,
  "Grade 7": 3500
};

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById(pageId).style.display = 'block';
  if (pageId === 'dashboard') {
    loadDashboardStats();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadStudentsDropdown();
  populateGradeFilter();
  filterRecords();
  showPage('dashboard');

  const gradeSelect = document.getElementById('studentGrade');
  if (gradeSelect) {
    gradeSelect.addEventListener('change', () => {
      const grade = gradeSelect.value.trim();
      if (standardFees[grade]) {
        document.getElementById('totalFee').value = standardFees[grade];
      }
    });
  }

  ['filterGrade', 'filterStartDate', 'filterEndDate', 'filterName'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', filterRecords);
  });
});

function loadDashboardStats() {
  const summaryContainer = document.getElementById('dashboardSummary');
  if (!summaryContainer) return;
  summaryContainer.innerHTML = '<p>Loading...</p>';

  db.collection("students").get().then(snapshot => {
    const gradeCounts = {};
    let totalUnpaid = 0;
    const promises = [];

    snapshot.forEach(doc => {
      const student = doc.data();
      const grade = student.grade;
      gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
      totalUnpaid += (student.totalFee - student.paid);
    });

    let html = '<h3>Total Students Per Grade</h3><ul>';
    Object.keys(gradeCounts).sort().forEach(grade => {
      html += `<li>${grade}: ${gradeCounts[grade]}</li>`;
    });
    html += '</ul>';
    html += `<p><strong>Total Unpaid Balance:</strong> $${totalUnpaid}</p>`;

    summaryContainer.innerHTML = html;
  });
}
