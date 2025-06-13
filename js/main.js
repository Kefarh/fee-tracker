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


firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Add student
function addStudent() {
  const name = document.getElementById('studentName').value.trim();
  const totalFee = parseFloat(document.getElementById('totalFee').value);
  if (!name || isNaN(totalFee)) return alert("Please enter valid details");

  db.collection("students").add({
    name,
    totalFee,
    paid: 0
  }).then(() => {
    document.getElementById('studentName').value = '';
    document.getElementById('totalFee').value = '';
    loadStudentsDropdown();
  });
}

// Record payment
function recordPayment() {
  const studentId = document.getElementById('studentSelect').value;
  const amount = parseFloat(document.getElementById('amountPaid').value);
  if (!studentId || isNaN(amount)) return alert("Invalid input");

  const ref = db.collection("students").doc(studentId);
  ref.get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      const newPaid = data.paid + amount;
      ref.update({ paid: newPaid }).then(() => {
        document.getElementById('amountPaid').value = '';
        updateFeeTable();
      });
    }
  });
}

// Load students into dropdown
function loadStudentsDropdown() {
  const select = document.getElementById('studentSelect');
  select.innerHTML = '';
  db.collection("students").get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = data.name;
      select.appendChild(option);
    });
  });
}

// Update student fee table
function updateFeeTable() {
  const tbody = document.querySelector('#feeTable tbody');
  tbody.innerHTML = '';
  db.collection("students").onSnapshot(snapshot => {
    tbody.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
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

// Initial load
loadStudentsDropdown();
updateFeeTable();
