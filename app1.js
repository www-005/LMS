// app1.js - Mini-LMS Firebase v8
window.auth = window.auth || firebase.auth();
window.db = window.db || firebase.firestore();

// logout
document.getElementById('logoutBtn')?.addEventListener('click', ()=>{
  auth.signOut().then(()=>window.location.href='index.html');
});

// User badge
auth.onAuthStateChanged(async user=>{
  if(!user){
    document.getElementById('userBadge')?.innerText = 'Nuk je kyç';
    return;
  }
  document.getElementById('userBadge')?.innerText = user.email;

  const doc = await db.collection('users').doc(user.uid).get();
  if(!doc.exists) return alert('Profili nuk u gjet');
  const u = doc.data();

  // Ensure classes is always array
  if(u.role==='teacher' && !Array.isArray(u.classes)) u.classes=[];

  // --- COURSES ---
  const coursesWrap = document.getElementById('coursesWrap');
  if(coursesWrap){
    if(u.role==='teacher'){
      document.getElementById('teacherControls')?.style.display='block';
      document.getElementById('saveCourse')?.addEventListener('click', async ()=>{
        const title = document.getElementById('m_course_title').value.trim();
        const cls = parseInt(document.getElementById('m_course_class').value);
        if(!title) return alert('Shkruaj emrin e lëndës');
        await db.collection('courses').add({title, classes:[cls], teacherId:user.uid, createdAt:new Date()});
        document.getElementById('m_course_title').value='';
      });

      db.collection('courses').where('teacherId','==',user.uid).onSnapshot(s=>{
        if(s.empty) coursesWrap.innerHTML = '<div class="small muted">Nuk ka lëndë.</div>';
        else {
          let html='';
          s.forEach(d=>{
            const c=d.data();
            html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <div><strong>${c.title}</strong><div class="small">Klasa: ${(c.classes||[]).join(',')}</div></div>
              <div><button data-id="${d.id}" class="delCourseBtn secondary">Fshi</button></div>
            </div>`;
          });
          coursesWrap.innerHTML = html;
          document.querySelectorAll('.delCourseBtn').forEach(b=>{
            b.addEventListener('click', async ()=>{
              if(!confirm('Fshi lëndën?')) return;
              const id = b.dataset.id;
              await db.collection('courses').doc(id).delete();
            });
          });
        }
      });
    } else {
      // student view
      db.collection('courses').where('classes','array-contains',u.classNum).onSnapshot(s=>{
        if(s.empty) coursesWrap.innerHTML = '<div class="small muted">Nuk ka lëndë për klasën tënde.</div>';
        else {
          let html='';
          s.forEach(d=>{
            const c=d.data();
            html += `<div style="margin-bottom:8px"><strong>${c.title}</strong><div class="small">Klasa: ${(c.classes||[]).join(',')}</div></div>`;
          });
          coursesWrap.innerHTML = html;
        }
      });
    }
  }

  // --- SCHEDULE ---
  const scheduleWrap = document.getElementById('scheduleWrap');
  if(scheduleWrap){
    if(u.role==='teacher'){
      document.getElementById('teacherSchedForm')?.style.display='block';
      document.getElementById('addSchedBtn')?.addEventListener('click', async ()=>{
        const day = document.getElementById('daySched').value.trim();
        const time = document.getElementById('timeSched').value.trim();
        const subj = document.getElementById('subjSched').value.trim();
        const cl = parseInt(document.getElementById('classSched').value);
        if(!day||!time||!subj) return alert('Plotëso fushat');
        await db.collection('schedule').add({day,time,subject:subj,classes:[cl],teacherId:user.uid,createdAt:new Date()});
        document.getElementById('daySched').value='';
        document.getElementById('timeSched').value='';
        document.getElementById('subjSched').value='';
      });

      db.collection('schedule').where('teacherId','==',user.uid).onSnapshot(s=>{
        if(s.empty) scheduleWrap.innerHTML = '<div class="small muted">Nuk ka orar të vendosur.</div>';
        else {
          let html='';
          s.forEach(d=>{
            const o=d.data();
            html += `<div style="margin-bottom:8px;"><strong>${o.day} ${o.time}</strong><div class="small">${o.subject} — Klasa: ${(o.classes||[]).join(',')}</div></div>`;
          });
          scheduleWrap.innerHTML = html;
        }
      });
    } else {
      db.collection('schedule').where('classes','array-contains',u.classNum).onSnapshot(s=>{
        if(s.empty) scheduleWrap.innerHTML = '<div class="small muted">Nuk ka orar për klasën tënde.</div>';
        else {
          let html='';
          s.forEach(d=>{
            const o=d.data();
            html += `<div style="margin-bottom:8px;"><strong>${o.day} ${o.time}</strong><div class="small">${o.subject}</div></div>`;
          });
          scheduleWrap.innerHTML = html;
        }
      });
    }
  }

  // --- TESTS ---
  const testsWrap = document.getElementById('testsWrap');
  if(testsWrap){
    if(u.role==='teacher'){
      document.getElementById('teacherTests')?.style.display='block';
      document.getElementById('addTestBtn')?.addEventListener('click', async ()=>{
        const s = document.getElementById('testSubject').value.trim();
        const d = document.getElementById('testDate').value;
        const cl = parseInt(document.getElementById('testClass').value);
        if(!s||!d) return alert('Plotëso fushat');
        await db.collection('tests').add({subject:s,date:d,classes:[cl],teacherId:user.uid,createdAt:new Date()});
        document.getElementById('testSubject').value='';
        document.getElementById('testDate').value='';
      });

      db.collection('tests').where('teacherId','==',user.uid).onSnapshot(s=>{
        if(s.empty) testsWrap.innerHTML = '<div class="small muted">Nuk ka teste.</div>';
        else {
          let html='';
          s.forEach(d=>{
            const t=d.data();
            html += `<div style="margin-bottom:8px;"><strong>${t.date}</strong><div class="small">${t.subject} — Klasa: ${(t.classes||[]).join(',')}</div></div>`;
          });
          testsWrap.innerHTML = html;
        }
      });
    } else {
      db.collection('tests').where('classes','array-contains',u.classNum).onSnapshot(s=>{
        if(s.empty) testsWrap.innerHTML = '<div class="small muted">Nuk ka teste për klasën tënde.</div>';
        else {
          let html='';
          s.forEach(d=>{
            const t=d.data();
            html += `<div style="margin-bottom:8px;"><strong>${t.date}</strong><div class="small">${t.subject}</div></div>`;
          });
          testsWrap.innerHTML = html;
        }
      });
    }
  }

  // --- GRADES ---
  const gradesWrap = document.getElementById('gradesWrap');
  if(gradesWrap){
    if(u.role==='teacher'){
      document.getElementById('teacherGrades')?.style.display='block';
      document.getElementById('addGradeBtn')?.addEventListener('click', async ()=>{
        const email = document.getElementById('studentEmail').value.trim();
        const subj = document.getElementById('subjectGrade').value.trim();
        const grade = parseFloat(document.getElementById('gradeValue').value);
        if(!email||!subj||!grade) return alert('Plotëso fushat');
        const q = await db.collection('users').where('email','==',email).get();
        if(q.empty) return alert('Nxënësi nuk u gjet');
        const studentId = q.docs[0].id;
        await db.collection('grades').add({studentId,studentEmail:email,subject:subj,grade,teacherId:user.uid,createdAt:new Date()});
        alert('Nota u shtua');
      });

      db.collection('grades').where('teacherId','==',user.uid).onSnapshot(s=>{
        if(s.empty) gradesWrap.innerHTML = '<div class="small muted">Nuk ka nota të vendosura.</div>';
        else {
          let html=''; s.forEach(d=>{
            const g=d.data();
            html += `<div style="margin-bottom:8px;"><strong>${g.studentEmail}</strong><div class="small">${g.subject}: ${g.grade}</div></div>`;
          });
          gradesWrap.innerHTML = html;
        }
      });
    } else {
      db.collection('grades').where('studentId','==',user.uid).onSnapshot(s=>{
        if(s.empty) gradesWrap.innerHTML = '<div class="small muted">Nuk ka nota për ju.</div>';
        else {
          let html=''; s.forEach(d=>{
            const g=d.data();
            html += `<div style="margin-bottom:8px;"><strong>${g.subject}</strong><div class="small">Nota: ${g.grade}</div></div>`;
          });
          gradesWrap.innerHTML = html;
        }
      });
    }
  }
});
