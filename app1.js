/* app.js - shared logic for Mini-LMS (Firebase v8 expected, auth & db global) */

function safeGet(id){ return document.getElementById(id); }

/* Protect page: redirect to index if not logged */
function protect() {
  if (typeof auth==='undefined') return console.warn('auth not initialized yet');
  auth.onAuthStateChanged(user => {
    if(!user) window.location.href = 'index.html';
  });
}

/* Logout handler attach (if button present) */
(function attachLogout(){
  const btn = safeGet('logoutBtn');
  if(!btn) return;
  btn.addEventListener('click', async ()=>{
    if(typeof auth==='undefined') return alert('Auth nuk është gati');
    try {
      await auth.signOut();
      window.location.href = 'index.html';
    } catch(err){ alert('Gabim gjatë daljes: ' + err.message); }
  });
})();

/* Badge display */
(function attachBadge(){
  const b = safeGet('userBadge');
  if(!b) return;
  if(typeof auth==='undefined') return console.warn('auth not ready for badge');
  auth.onAuthStateChanged(async user=>{
    if(!user){ b.innerText = 'Nuk je kyç'; return; }
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      if(doc.exists){
        const u = doc.data();
        b.innerText = (u.name || user.email) + ' (' + (u.role==='teacher' ? 'Mësues' : 'Nxënës') + ')';
      } else {
        b.innerText = user.email;
      }
    } catch(e){ b.innerText = user.email; }
  });
})();

/* Register + Login (index.html expects these IDs) */
(function attachAuthForms(){
  const registerBtn = safeGet('registerBtn');
  const loginBtn = safeGet('loginBtn');
  const roleSelect = safeGet('roleSelect');
  if(!registerBtn && !loginBtn) return;

  // show/hide fields handled in index.html scripts too
  if(registerBtn){
    registerBtn.addEventListener('click', async ()=>{
      const name = (safeGet('nameInput')||{}).value || '';
      const email = (safeGet('emailInput')||{}).value || '';
      const pass = (safeGet('passInput')||{}).value || '';
      const role = (safeGet('roleSelect')||{}).value || 'student';
      if(!name||!email||!pass) return alert('Plotëso të gjitha fushat');

      try {
        const cred = await auth.createUserWithEmailAndPassword(email, pass);
        const uid = cred.user.uid;
        let payload = { role, name, email, createdAt: new Date() };
        if(role === 'student') {
          payload.classNum = parseInt((safeGet('classNum')||{}).value) || null;
        } else {
          const opts = (safeGet('classList')||{}).selectedOptions || [];
          payload.classes = Array.from(opts).map(o => parseInt(o.value));
        }
        await db.collection('users').doc(uid).set(payload);
        alert('Regjistrimi u krye. Po të ridrejtoj tek paneli...');
        window.location.href = 'dashboard.html';
      } catch(err){ alert('Gabim: ' + err.message); }
    });
  }

  if(loginBtn){
    loginBtn.addEventListener('click', async ()=>{
      const email = (safeGet('emailInput')||{}).value || '';
      const pass = (safeGet('passInput')||{}).value || '';
      if(!email || !pass) return alert('Plotëso email dhe fjalëkalimin');
      try {
        const cred = await auth.signInWithEmailAndPassword(email, pass);
        alert('Mirë se erdhe!');
        window.location.href = 'dashboard.html';
      } catch(err){ alert('Gabim: ' + err.message); }
    });
  }
})();
