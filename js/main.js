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

      // Update total paid
      studentRef.update({ paid: newPaid });

      // Add to payments subcollection
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
        <td>${student.totalFee - student.paid}</td>
      `;
      tbody.appendChild(tr);

      // Add payment record rows
      doc.ref.collection("payments").orderBy("date", "desc").get().then(paymentsSnap => {
        paymentsSnap.forEach(paymentDoc => {
          const pay = paymentDoc.data();
          const payRow = document.createElement('tr');
          payRow.innerHTML = `
            <td colspan="4" style="padding-left: 20px; font-size: 0.9em; color: #555;">
              ↳ ${pay.description} - $${pay.amount} on ${pay.date.toDate().toLocaleDateString()}
            </td>
          `;
          tbody.appendChild(payRow);
        });
      });
    });
  });
}

// Initial load
loadStudentsDropdown();
updateFeeTable();
