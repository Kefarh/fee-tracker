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

// Load students into dropdown
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

// Update student fee table
function updateFeeTable() {
  const tbody = document.querySelector('#feeTable tbody');
  tbody.innerHTML = '';

  db.collection("students").onSnapshot(snapshot => {
    tbody.innerHTML = '';
    snapshot.forEach(doc => {
      const student = doc.data();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${student.name} (${student.grade})</td>
        <td>${student.totalFee}</td>
        <td>${student.paid}</td>
        <td>
          ${student.totalFee - student.paid}
          <br><button onclick="openPaymentHistory('${doc.id}')">View History</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// Open modal with payment history
function openPaymentHistory(studentId) {
  const modal = document.getElementById('paymentModal');
  const container = document.getElementById('paymentHistoryList');
  container.innerHTML = 'Loading...';

  const studentRef = db.collection("students").doc(studentId);
  studentRef.collection("payments").orderBy("date", "desc").get().then(snapshot => {
    container.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement('div');
      div.className = 'payment-entry';

      const date = data.date.toDate().toLocaleDateString();

      div.innerHTML = `
        <input type="text" value="${data.description}" id="desc-${doc.id}">
        <input type="number" value="${data.amount}" id="amt-${doc.id}">
        <span>${date}</span>
        <button onclick="saveEdit('${studentId}', '${doc.id}')">💾</button>
        <button onclick="deletePayment('${studentId}', '${doc.id}', ${data.amount})">🗑️</button>
      `;

      container.appendChild(div);
    });
  });

  modal.classList.remove('hidden');
}

// Save edited payment
function saveEdit(studentId, paymentId) {
  const desc = document.getElementById(`desc-${paymentId}`).value;
  const amt = parseFloat(document.getElementById(`amt-${paymentId}`).value);

  if (!desc || isNaN(amt)) return alert("Invalid input");

  const paymentRef = db.collection("students").doc(studentId).collection("payments").doc(paymentId);
  paymentRef.update({ description: desc, amount: amt }).then(() => {
    alert("Payment updated.");
    updateFeeTable();
  });
}

// Delete a payment
function deletePayment(studentId, paymentId, amount) {
  if (!confirm("Are you sure you want to delete this payment?")) return;

  const studentRef = db.collection("students").doc(studentId);
  const paymentRef = studentRef.collection("payments").doc(paymentId);

  studentRef.get().then(doc => {
    if (doc.exists) {
      const student = doc.data();
      const newPaid = Math.max(0, student.paid - amount);

      studentRef.update({ paid: newPaid }).then(() => {
        paymentRef.delete().then(() => {
          alert("Payment deleted.");
          updateFeeTable();
          openPaymentHistory(studentId);
        });
      });
    }
  });
}

// Close modal
function closeModal() {
  document.getElementById('paymentModal').classList.add('hidden');
}

// Initial load
loadStudentsDropdown();
updateFeeTable();
