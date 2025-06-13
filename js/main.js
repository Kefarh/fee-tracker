// ✅ Replace this with your actual Firebase config
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAKlM6pPf93zjLj49Y-nyKUIsIaLE5UmK8",
  authDomain: "fee-tracker-cadad.firebaseapp.com",
  projectId: "fee-tracker-cadad",
  storageBucket: "fee-tracker-cadad.firebasestorage.app",
  messagingSenderId: "372847716849",
  appId: "1:372847716849:web:15824518e99abe2c697c50",
  measurementId: "G-DQXRXSGSE1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Add student
function addStudent() {
  const name = document.getElementById('studentName').value.trim();
  const totalFee = parseFloat(document.getElementById('totalFee').value);
  if (!name || isNaN(totalFee)) return alert("Please fill in both fields.");

  const newRef = db.ref('students').push();
  newRef.set({
    name,
    totalFee,
    paid: 0
  });

  document.getElementById('studentName').value = '';
  document.getElementById('totalFee').value = '';
}

// Record payment
function recordPayment() {
  const studentId = document.getElementById('studentSelect').value;
  const amount = parseFloat(document.getElementById('amountPaid').value);
  if (!studentId || isNaN(amount)) return alert("Please select student and enter amount.");

  const studentRef = db.ref('students/' + studentId);
  studentRef.once('value', snapshot => {
    const data = snapshot.val();
    const newPaid = data.paid + amount;
    studentRef.update({ paid: newPaid });
  });

  document.getElementById('amountPaid').value = '';
}

// Load students into dropdown
function loadStudentsDropdown() {
  db.ref('students').once('value', snapshot => {
    const select = document.getElementById('studentSelect');
    select.innerHTML = '';
    snapshot.forEach(child => {
      const data = child.val();
      const option = document.createElement('option');
      option.value = child.key;
      option.textContent = data.name;
      select.appendChild(option);
    });
  });
}

// Update table with student data
function updateFeeTable() {
  db.ref('students').on('value', snapshot => {
    const tbody = document.querySelector('#feeTable tbody');
    tbody.innerHTML = '';
    snapshot.forEach(child => {
      const data = child.val();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${data.name}</td>
        <td>${data.totalFee}</td>
        <td>${data.paid}</td>
        <td>${data.totalFee - data.paid}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// Initialize app
loadStudentsDropdown();
updateFeeTable();

// Refresh dropdown periodically
setInterval(loadStudentsDropdown, 5000);
