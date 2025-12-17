// app1.js - përditësuar për të shmangur dyfishimet pa ndryshuar logjikën e faqes

// Logout button
const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn){
  logoutBtn.addEventListener('click', async ()=> {
    await auth.signOut();
    window.location.href='index.html';
  });
}

// Auth page
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');

if(registerBtn){
  registerBtn.addEventListener('click', async () => {
    const role = document.getElementById('roleSelect').value;
    const name = document.getElementById('nameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const pass = document.getElementById('passInput').value.trim();
    if(!name || !email || !pass) return alert('Plotëso fushat');

    try {
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      const user = cred.user;

      const data = {name, email, role};
      if(role==='student'){
        data.classNum = parseInt(document.getElementById('classNum').value);
      } else if(role==='teacher'){
        const sel = document.getElementById('classList');
        data.classes = Array.from(sel.selectedOptions).map(o=>parseInt(o.value));
      }

      await db.collection('users').doc(user.uid).set(data);
      alert('Regjistrimi u krye me sukses!');
      window.location.href = 'dashboard.html';
    } catch(e){
      console.error(e);
      alert(e.message);
    }
  });
}

if(loginBtn){
  loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('emailInput').value.trim();
    const pass = document.getElementById('passInput').value.trim();
    if(!email || !pass) return alert('Plotëso email dhe fjalëkalim');

    try {
      await auth.signInWithEmailAndPassword(email, pass);
      window.location.href = 'dashboard.html';
    } catch(e){
      console.error(e);
      alert(e.message);
    }
  });
}

// Update user badge
auth.onAuthStateChanged(user => {
  const badge = document.getElementById('userBadge');
  if(user && badge) badge.innerText = user.email;
});

// ----------------------
// Shmang dyfishimet e click event-ve dhe HTML-it
// ----------------------
const onceEvents = {};

function addOnceEvent(key, element, type, callback){
  if(!onceEvents[key]){
    element.addEventListener(type, callback);
    onceEvents[key] = true;
  }
}

// Për të gjitha funksionet e mesues/nxenes, brenda `auth.onAuthStateChanged`:
// thjesht bëni:
// addOnceEvent('saveCourseBtn', document.getElementById('saveCourse'), 'click', async ()=>{ ... });
// Kështu sigurohet që çdo button listener vendoset vetëm një herë dhe nuk shtohet dyfish HTML-i

// Për shembull për Courses:
if(document.getElementById('coursesWrap')){
  auth.onAuthStateChanged(async user => {
    if(!user) return;
    const doc = await db.collection('users').doc(user.uid).get();
    const u = doc.data();
    const wrap = document.getElementById('coursesWrap');

    if(u.role==='teacher'){
      document.getElementById('teacherControls').style.display='block';

      addOnceEvent('saveCourseBtn', document.getElementById('saveCourse'), 'click', async ()=>{
        const title = document.getElementById('m_course_title').value.trim();
        const cls = parseInt(document.getElementById('m_course_class').value);
        if(!title) return alert('Shkruaj emrin e lëndës');
        await db.collection('courses').add({title, classes:[cls], teacherId:user.uid, createdAt:new Date()});
        document.getElementById('m_course_title').value='';
      });

      db.collection('courses').where('teacherId','==',user.uid).onSnapshot(s=>{
        wrap.innerHTML='';
        if(s.empty) wrap.innerHTML = '<div class="small muted">Nuk ka lëndë.</div>';
        else s.forEach(d=>{
          const c=d.data();
          wrap.innerHTML += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div><strong>${c.title}</strong><div class="small">Klasa: ${(c.classes||[]).join(',')}</div></div>
            <div><button data-id="${d.id}" class="delCourseBtn secondary">Fshi</button></div>
          </div>`;
        });
        wrap.querySelectorAll('.delCourseBtn').forEach(b=>{
          b.onclick = async ()=>{
            if(!confirm('Fshi lëndën?')) return;
            await db.collection('courses').doc(b.dataset.id).delete();
          };
        });
      });

    } else {
      db.collection('courses').where('classes','array-contains',u.classNum).onSnapshot(s=>{
        wrap.innerHTML='';
        if(s.empty) wrap.innerHTML = '<div class="small muted">Nuk ka lëndë për klasën tënde.</div>';
        else s.forEach(d=>{
          const c=d.data();
          wrap.innerHTML += `<div style="margin-bottom:8px"><strong>${c.title}</strong><div class="small">Klasa: ${(c.classes||[]).join(',')}</div></div>`;
        });
      });
    }
  });
}
