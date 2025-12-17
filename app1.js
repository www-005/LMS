// app1.js

// Logout button
const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn){
  logoutBtn.addEventListener('click', async ()=>{
    await auth.signOut();
    window.location.href='index.html';
  });
}

// Auth page (index.html)
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');

if(registerBtn){
  registerBtn.addEventListener('click', async (e) => {
    e.preventDefault(); // PREVENT loop automatik

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
      window.location.href = 'dashboard.html'; // redirect vetëm pas suksesit
    } catch(e){
      console.error(e);
      alert(e.message);
    }
  });
}

if(loginBtn){
  loginBtn.addEventListener('click', async (e) => {
    e.preventDefault(); // PREVENT loop automatik
    const email = document.getElementById('emailInput').value.trim();
    const pass = document.getElementById('passInput').value.trim();
    if(!email || !pass) return alert('Plotëso email dhe fjalëkalim');

    try {
      await auth.signInWithEmailAndPassword(email, pass);
      window.location.href = 'dashboard.html'; // redirect vetëm pas suksesit
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
// Funksione te tjera per faqet e mesuesve/nxenesve
// ----------------------

// Courses (courses.html)
if(document.getElementById('coursesWrap')){
  auth.onAuthStateChanged(async user => {
    if(!user) return window.location.href='index.html';
    const doc = await db.collection('users').doc(user.uid).get();
    const u = doc.data();
    const wrap = document.getElementById('coursesWrap');

    if(u.role==='teacher'){
      document.getElementById('teacherControls').style.display='block';
      document.getElementById('saveCourse').addEventListener('click', async ()=>{
        const title = document.getElementById('m_course_title').value.trim();
        const cls = parseInt(document.getElementById('m_course_class').value);
        if(!title) return alert('Shkruaj emrin e lëndës');
        await db.collection('courses').add({title, classes:[cls], teacherId:user.uid, createdAt:new Date()});
        document.getElementById('m_course_title').value='';
      });

      db.collection('courses').where('teacherId','==',user.uid).onSnapshot(s=>{
        if(s.empty) wrap.innerHTML = '<div class="small muted">Nuk ka lëndë.</div>';
        else {
          let html='';
          s.forEach(d=>{
            const c=d.data();
            html+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <div><strong>${c.title}</strong><div class="small">Klasa: ${(c.classes||[]).join(',')}</div></div>
              <div><button data-id="${d.id}" class="delCourseBtn secondary">Fshi</button></div>
            </div>`;
          });
          wrap.innerHTML=html;
          document.querySelectorAll('.delCourseBtn').forEach(b=>{
            b.addEventListener('click', async ()=>{
              if(!confirm('Fshi lëndën?')) return;
              await db.collection('courses').doc(b.dataset.id).delete();
            });
          });
        }
      });

    } else {
      db.collection('courses').where('classes','array-contains',u.classNum).onSnapshot(s=>{
        if(s.empty) wrap.innerHTML = '<div class="small muted">Nuk ka lëndë për klasën tënde.</div>';
        else {
          let html='';
          s.forEach(d=>{
            const c=d.data();
            html+=`<div style="margin-bottom:8px"><strong>${c.title}</strong><div class="small">Klasa: ${(c.classes||[]).join(',')}</div></div>`;
          });
          wrap.innerHTML = html;
        }
      });
    }
  });
}

// Grades (grades.html)
if(document.getElementById('gradesWrap')){
  auth.onAuthStateChanged(async user=>{
    if(!user) return window.location.href='index.html';
    const udoc = await db.collection('users').doc(user.uid).get();
    const u = udoc.data();
    const wrap = document.getElementById('gradesWrap');

    if(u.role==='teacher'){
      document.getElementById('teacherGrades').style.display='block';
      document.getElementById('addGradeBtn').addEventListener('click', async ()=>{
        const email = document.getElementById('studentEmail').value.trim();
        const subj = document.getElementById('subjectGrade').value.trim();
        const grade = parseFloat(document.getElementById('gradeValue').value);
        if(!email||!subj||!grade) return alert('Plotëso fushat');

        const q = await db.collection('users').where('email','==',email).get();
        if(q.empty) return alert('Nxënësi nuk u gjet');
        const studentId = q.docs[0].id;

        await db.collection('grades').add({studentId, studentEmail: email, subject: subj, grade, teacherId:user.uid, createdAt: new Date()});
        alert('Nota u shtua');
      });

      db.collection('grades').where('teacherId','==',user.uid).onSnapshot(s=>{
        if(s.empty) wrap.innerHTML = '<div class="small muted">Nuk ka nota të vendosura.</div>';
        else {
          let html='';
          s.forEach(d=>{ const g=d.data(); html+=`<div style="margin-bottom:8px;"><strong>${g.studentEmail}</strong><div class="small">${g.subject}: ${g.grade}</div></div>` });
          wrap.innerHTML = html;
        }
      });

    } else {
      db.collection('grades').where('studentId','==',user.uid).onSnapshot(s=>{
        if(s.empty) wrap.innerHTML = '<div class="small muted">Nuk ka nota për ju.</div>';
        else {
          let html='';
          s.forEach(d=>{ const g=d.data(); html+=`<div style="margin-bottom:8px;"><strong>${g.subject}</strong><div class="small">Nota: ${g.grade}</div></div>` });
          wrap.innerHTML = html;
        }
      });
    }
  });
}

// Schedule (schedule.html)
if(document.getElementById('scheduleWrap')){
  auth.onAuthStateChanged(async user=>{
    if(!user) return window.location.href='index.html';
    const udoc = await db.collection('users').doc(user.uid).get();
    const u = udoc.data();
    const wrap = document.getElementById('scheduleWrap');

    if(u.role==='teacher'){
      document.getElementById('teacherSchedForm').style.display='block';
      document.getElementById('addSchedBtn').addEventListener('click', async ()=>{
        const day = document.getElementById('daySched').value.trim();
        const time = document.getElementById('timeSched').value.trim();
        const subj = document.getElementById('subjSched').value.trim();
        const cl = parseInt(document.getElementById('classSched').value);
        if(!day||!time||!subj) return alert('Plotëso fushat');

        await db.collection('schedule').add({day,time,subject:subj,classes:[cl],teacherId:user.uid,createdAt:new Date()});
        document.getElementById('daySched').value=''; document.getElementById('timeSched').value=''; document.getElementById('subjSched').value='';
      });

      db.collection('schedule').where('teacherId','==',user.uid).onSnapshot(s=>{
        if(s.empty) wrap.innerHTML = '<div class="small muted">Nuk ka orar të vendosur.</div>';
        else {
          let html='';
          s.forEach(d=>{ const o=d.data();
            html+=`<div style="margin-bottom:8px;"><strong>${o.day} ${o.time}</strong><div class="small">${o.subject} — Klasa: ${(o.classes||[]).join(',')}</div></div>`;
          });
          wrap.innerHTML = html;
        }
      });

    } else {
      db.collection('schedule').where('classes','array-contains',u.classNum).onSnapshot(s=>{
        if(s.empty) wrap.innerHTML = '<div class="small muted">Nuk ka orar për klasën tënde.</div>';
        else {
          let html='';
          s.forEach(d=>{ const o=d.data();
            html+=`<div style="margin-bottom:8px;"><strong>${o.day} ${o.time}</strong><div class="small">${o.subject}</div></div>`;
          });
          wrap.innerHTML = html;
        }
      });
    }
  });
}

// Tests (test.html)
if(document.getElementById('testsWrap')){
  auth.onAuthStateChanged(async user=>{
    if(!user) return window.location.href='index.html';
    const udoc = await db.collection('users').doc(user.uid).get();
    const u = udoc.data();
    const wrap = document.getElementById('testsWrap');

    if(u.role==='teacher'){
      document.getElementById('teacherTests').style.display='block';
      document.getElementById('addTestBtn').addEventListener('click', async ()=>{
        const s = document.getElementById('testSubject').value.trim();
        const d = document.getElementById('testDate').value;
        const cl = parseInt(document.getElementById('testClass').value);
        if(!s||!d) return alert('Plotëso fushat');

        await db.collection('tests').add({subject:s,date:d,classes:[cl],teacherId:user.uid,createdAt:new Date()});
        document.getElementById('testSubject').value=''; document.getElementById('testDate').value='';
      });

      db.collection('tests').where('teacherId','==',user.uid).onSnapshot(s=>{
        if(s.empty) wrap.innerHTML = '<div class="small muted">Nuk ka teste.</div>';
        else {
          let html='';
          s.forEach(d=>{ const t=d.data();
            html+=`<div style="margin-bottom:8px;"><strong>${t.date}</strong><div class="small">${t.subject} — Klasa: ${(t.classes||[]).join(',')}</div></div>`;
          });
          wrap.innerHTML = html;
        }
      });

    } else {
      db.collection('tests').where('classes','array-contains',u.classNum).onSnapshot(s=>{
        if(s.empty) wrap.innerHTML = '<div class="small muted">Nuk ka teste për klasën tënde.</div>';
        else {
          let html='';
          s.forEach(d=>{ const t=d.data();
            html+=`<div style="margin-bottom:8px;"><strong>${t.date}</strong><div class="small">${t.subject}</div></div>`;
          });
          wrap.innerHTML = html;
        }
      });
    }
  });
}

// Reports (reports.html)
if(document.getElementById('reportPanel')){
  auth.onAuthStateChanged(async user=>{
    if(!user) return window.location.href='index.html';
    const udoc = await db.collection('users').doc(user.uid).get();
    const u = udoc.data();
    const wrap = document.getElementById('reportSelectWrap');
    const card = document.getElementById('reportCard');

    if(u.role!=='teacher'){
      wrap.innerHTML = '<div class="small">Vetëm mësuesit mund të shikojnë raportet e nxënësve.</div>';
      return;
    }

    db.collection('users').where('role','==','student').onSnapshot(s=>{
      let html = '<select id="reportSelect"><option value="">Zgjidh nxënës</option>';
      s.forEach(d=>{ const st = d.data(); html+=`<option value="${d.id}">${st.name} (Klasa ${st.classNum||'-'})</option>` });
      html += '</select>';
      wrap.innerHTML = html;

      document.getElementById('reportSelect').addEventListener('change', ()=>{
        const id = document.getElementById('reportSelect').value;
        if(!id){ card.innerHTML=''; return; }
        db.collection('grades').where('studentId','==',id).onSnapshot(ss=>{
          let out='<h3>Raporti</h3>';
          let sum=0,count=0;
          ss.forEach(dg=>{ const g=dg.data(); out+=`<div class="small">${g.subject}: ${g.grade}</div>`; sum+=parseFloat(g.grade||0); count++; });
          out+=`<div style="margin-top:10px;"><strong>Mesatarja:</strong> ${count? (sum/count).toFixed(2) : '-'}</div>`;
          out+=`<div style="margin-top:10px;"><button onclick="window.print()">Printo</button></div>`;
          card.innerHTML = out;
        });
      });
    });
  });
}

// Profile (profile.html)
if(document.getElementById('pName')){
  auth.onAuthStateChanged(async user=>{
    if(!user) return window.location.href='index.html';
    const udoc = await db.collection('users').doc(user.uid).get();
    const u = udoc.data();

    document.getElementById('pName').innerText = u.name || user.email;
    document.getElementById('pRole').innerText = u.role==='teacher' ? 'Mësues' : 'Nxënës';
    document.getElementById('pClass').innerText = u.role==='student' ? 'Klasa: ' + (u.classNum||'-') : 'Kujdestar i klasave: ' + ((u.classes||[]).join(', ')||'-');

    const details = document.getElementById('profileDetailsWrap');
    if(u.role==='student'){
      details.innerHTML='<h3>Notat</h3>';
      db.collection('grades').where('studentId','==',user.uid).onSnapshot(s=>{
        details.innerHTML='<h3>Notat</h3>';
        s.forEach(d=>{
          const g=d.data();
          details.innerHTML+=`<div class="card small">${g.subject}: ${g.grade}</div>`;
        });
      });
    } else {
      details.innerHTML='<div class="small">Si mësues, përdor menynë për të shtuar lëndë, orar, teste dhe nota.</div>';
    }
  });
}

