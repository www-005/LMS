// app1.js

// ELEMENTS
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Logout button (if exists)
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = 'index.html';
  });
}

// Toggle student/teacher fields handled in index.html already

// REGISTER
if (registerBtn) {
  registerBtn.addEventListener('click', async () => {
    const role = document.getElementById('roleSelect').value;
    const name = document.getElementById('nameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const pass = document.getElementById('passInput').value;

    if (!name || !email || !pass) return alert('Plotëso fushat!');

    try {
      // Create user in Firebase Auth
      const userCred = await auth.createUserWithEmailAndPassword(email, pass);
      const uid = userCred.user.uid;

      // Prepare user data for Firestore
      const userData = {
        name,
        email,
        role,
        createdAt: new Date()
      };

      if (role === 'student') {
        userData.classNum = parseInt(document.getElementById('classNum').value);
      } else if (role === 'teacher') {
        const options = Array.from(document.getElementById('classList').selectedOptions);
        userData.classes = options.map(o => parseInt(o.value));
      }

      // Save user data in Firestore
      await db.collection('users').doc(uid).set(userData);

      alert('Regjistrimi u krye me sukses! Po kalojmë te paneli...');
      window.location.href = 'dashboard.html';
    } catch (e) {
      alert('Gabim: ' + e.message);
    }
  });
}

// LOGIN
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('emailInput').value.trim();
    const pass = document.getElementById('passInput').value;

    if (!email || !pass) return alert('Plotëso fushat!');

    try {
      await auth.signInWithEmailAndPassword(email, pass);
      window.location.href = 'dashboard.html';
    } catch (e) {
      alert('Gabim: ' + e.message);
    }
  });
}

// AUTH STATE CHANGE (for all pages)
auth.onAuthStateChanged(async user => {
  const userBadge = document.getElementById('userBadge');
  if (!user) {
    if (window.location.pathname !== '/index.html') {
      window.location.href = 'index.html';
    }
    return;
  }

  if (userBadge) {
    userBadge.innerText = user.email;
  }
});
