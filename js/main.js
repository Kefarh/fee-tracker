// Firebase config
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

// Add student
function addStudent() {
  const name = document.getElementById('studentName').value.trim();
  const grade = document.getElementById('studentGrade').value.trim();
  const totalFee = parseFloat(document.getElementById('totalFee').value);
  if (!name || !grade || isNaN(totalFee)) return alert("Please enter valid details");

  db.collection("students").add({
    name,
    grade,
    totalFee,
    paid: 0
  }).then(() => {
    document.getElementById('studentName').value = '';
    document.getElementById('studentGrade').value = '';
    document.getElementById('totalFee').value = '';
    loadStudentsDropdown();
    populateGradeFilter();
    updateFeeTable();
  });
}

// Record payment
function recordPayment() {
  const studentId = document.getElementById('studentSelect').value;
  const amount = parseFloat(document.getElementById('amountPaid').value);
  const description = document.getElementById('paymentDescription').value.trim();
  const date = new Date();

  if (!studentId || isNaN(amount) || !description) return alert("Invalid payment input");

  const studentRef = db.collection("students").doc(studentId);

  studentRef.get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      const newPaid = data.paid + amount;

      studentRef.update({ paid: newPaid });

      studentRef.collection("payments").add({
        amount,
        description,
        date: firebase.firestore.Timestamp.fromDate(date)
      }).then(() => {
        document.getElementById('amountPaid').value = '';
        document.getElementById('paymentDescription').value = '';
        updateFeeTable();
      });
    }
  });
}

// Load student dropdown
function loadStudentsDropdown() {
  const select = document.getElementById('studentSelect');
  select.innerHTML = '';
  db.collection("students").get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = `${data.name} (${data.grade})`;
      select.appendChild(option);
    });
  });
}

// Populate grade filter dropdown
function populateGradeFilter() {
  const gradeSelect = document.getElementById('filterGrade');
  const seen = new Set();

  // Reset dropdown
  gradeSelect.innerHTML = `<option value="">All Grades</option>`;

  db.collection("students").get().then(snapshot => {
    snapshot.forEach(doc => {
      const grade = doc.data().grade;
      if (!seen.has(grade)) {
        seen.add(grade);
        const option = document.createElement("option");
        option.value = grade;
        option.textContent = grade;
        gradeSelect.appendChild(option);
      }
    });
  });
}

// Filter and display student records
function filterRecords() {
  const grade = document.getElementById('filterGrade').value.trim().toLowerCase();
  const startDate = document.getElementById('filterStartDate').value;
  const endDate = document.getElementById('filterEndDate').value;

  const tbody = document.querySelector('#feeTable tbody');
  tbody.innerHTML = '';

  db.collection("students").get().then(snapshot => {
    snapshot.forEach(studentDoc => {
      const student = studentDoc.data();
      const studentGrade = student.grade.toLowerCase();

      if (grade && studentGrade !== grade) return;

      studentDoc.ref.collection("payments").orderBy("date").get().then(paymentSnap => {
        const filteredPayments = paymentSnap.docs.filter(doc => {
          const data = doc.data();
          const date = data.date.toDate();
          const matchStart = startDate ? new Date(startDate) <= date : true;
          const matchEnd = endDate ? new Date(endDate + "T23:59:59") >= date : true;
          return matchStart && matchEnd;
        });

        if (filteredPayments.length > 0) {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${student.name} (${student.grade})</td>
            <td>${student.totalFee}</td>
            <td>${student.paid}</td>
            <td>${student.totalFee - student.paid}</td>
          `;
          tbody.appendChild(tr);
        }

        filteredPayments.forEach(paymentDoc => {
          const data = paymentDoc.data();
          const dateStr = data.date.toDate().toLocaleDateString();

          const payTr = document.createElement('tr');
          payTr.innerHTML = `
            <td colspan="4" style="padding-left: 20px; font-size: 0.9em; color: #555;">
              ↳ ${data.description} - $${data.amount} on ${dateStr}
            </td>
          `;
          tbody.appendChild(payTr);
        });
      });
    });
  });
}

// Default table display
function updateFeeTable() {
  document.getElementById('filterGrade').value = '';
  document.getElementById('filterStartDate').value = '';
  document.getElementById('filterEndDate').value = '';
  filterRecords();
}

// Initial setup
loadStudentsDropdown();
populateGradeFilter();
updateFeeTable();

// Live filter events
document.getElementById('filterGrade').addEventListener('change', filterRecords);
document.getElementById('filterStartDate').addEventListener('input', filterRecords);
document.getElementById('filterEndDate').addEventListener('input', filterRecords);
