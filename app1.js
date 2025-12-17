// app1.js - Mini LMS (rregullon problem dyfishimi)

const userBadge = document.getElementById('userBadge');
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', ()=>auth.signOut());

auth.onAuthStateChanged(async user=>{
  if(!user) return window.location.href='index.html';
  
  const doc = await db.collection('users').doc(user.uid).get();
  if(!doc.exists) return alert('Profili nuk u gjet');
  const u = doc.data();
  userBadge.innerText = u.name || user.email;

  // ---------------- COURSES ----------------
  const coursesWrap = document.getElementById('coursesWrap');
  const teacherControls = document.getElementById('teacherControls');

  if(u.role==='teacher' && teacherControls){
    teacherControls.style.display='block';

    document.getElementById('saveCourse').addEventListener('click', async ()=>{
      const title = document.getElementById('m_course_title').value.trim();
      const cls = parseInt(document.getElementById('m_course_class').value);
      if(!title) return alert('Shkruaj emrin e lëndës');
      await db.collection('courses').add({title, classes:[cls], teacherId:user.uid, createdAt:new Date()});
      document.getElementById('m_course_title').value='';
    });

    db.collection('courses').where('teacherId','==',user.uid).onSnapshot(s=>{
      coursesWrap.innerHTML=''; // PASTRON HTML-in për të shmangur dyfishimet
      if(s.empty) coursesWrap.innerHTML = '<div class="small muted">Nuk ka lëndë.</div>';
      else {
        s.forEach(d=>{
          const c = d.data();
          coursesWrap.innerHTML += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div><strong>${c.title}</strong><div class="small">Klasa: ${ (c.classes||[]).join(',') }</div></div>
            <div><button data-id="${d.id}" class="delCourseBtn secondary">Fshi</button></div>
          </div>`;
        });

        document.querySelectorAll('.delCourseBtn').forEach(b=>{
          b.onclick = async ()=>{
            if(!confirm('Fshi lëndën?')) return;
            await db.collection('courses').doc(b.dataset.id).delete();
          }
        });
      }
    });

  } else if(coursesWrap){ // student view
    db.collection('courses').where('classes','array-contains',u.classNum).onSnapshot(s=>{
      coursesWrap.innerHTML='';
      if(s.empty) coursesWrap.innerHTML = '<div class="small muted">Nuk ka lëndë për klasën tënde.</div>';
      else {
        s.forEach(d=>{
          const c = d.data();
          coursesWrap.innerHTML += `<div style="margin-bottom:8px"><strong>${c.title}</strong><div class="small">Klasa: ${ (c.classes||[]).join(',') }</div></div>`;
        });
      }
    });
  }

  // ---------------- SCHEDULE ----------------
  const scheduleWrap = document.getElementById('scheduleWrap');
  const teacherSchedForm = document.getElementById('teacherSchedForm');

  if(u.role==='teacher' && teacherSchedForm){
    teacherSchedForm.style.display='block';
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
      scheduleWrap.innerHTML='';
      if(s.empty) scheduleWrap.innerHTML = '<div class="small muted">Nuk ka orar të vendosur.</div>';
      else {
        s.forEach(d=>{
          const o=d.data();
          scheduleWrap.innerHTML += `<div style="margin-bottom:8px;"><strong>${o.day} ${o.time}</strong><div class="small">${o.subject} — Klasa: ${ (o.classes||[]).join(',') }</div></div>`;
        });
      }
    });

  } else if(scheduleWrap){ // student
    db.collection('schedule').where('classes','array-contains',u.classNum).onSnapshot(s=>{
      scheduleWrap.innerHTML='';
      if(s.empty) scheduleWrap.innerHTML = '<div class="small muted">Nuk ka orar për klasën tënde.</div>';
      else {
        s.forEach(d=>{
          const o=d.data();
          scheduleWrap.innerHTML += `<div style="margin-bottom:8px;"><strong>${o.day} ${o.time}</strong><div class="small">${o.subject}</div></div>`;
        });
      }
    });
  }

  // ---------------- TESTS ----------------
  const testsWrap = document.getElementById('testsWrap');
  const teacherTests = document.getElementById('teacherTests');

  if(u.role==='teacher' && teacherTests){
    teacherTests.style.display='block';
    document.getElementById('addTestBtn').addEventListener('click', async ()=>{
      const s = document.getElementById('testSubject').value.trim();
      const d = document.getElementById('testDate').value;
      const cl = parseInt(document.getElementById('testClass').value);
      if(!s||!d) return alert('Plotëso fushat');
      await db.collection('tests').add({subject:s,date:d,classes:[cl],teacherId:user.uid,createdAt:new Date()});
      document.getElementById('testSubject').value=''; document.getElementById('testDate').value='';
    });

    db.collection('tests').where('teacherId','==',user.uid).onSnapshot(s=>{
      testsWrap.innerHTML='';
      if(s.empty) testsWrap.innerHTML = '<div class="small muted">Nuk ka teste.</div>';
      else {
        s.forEach(d=>{
          const t=d.data();
          testsWrap.innerHTML += `<div style="margin-bottom:8px;"><strong>${t.date}</strong><div class="small">${t.subject} — Klasa: ${ (t.classes||[]).join(',') }</div></div>`;
        });
      }
    });

  } else if(testsWrap){ // student
    db.collection('tests').where('classes','array-contains',u.classNum).onSnapshot(s=>{
      testsWrap.innerHTML='';
      if(s.empty) testsWrap.innerHTML = '<div class="small muted">Nuk ka teste për klasën tënde.</div>';
      else {
        s.forEach(d=>{
          const t=d.data();
          testsWrap.innerHTML += `<div style="margin-bottom:8px;"><strong>${t.date}</strong><div class="small">${t.subject}</div></div>`;
        });
      }
    });
  }

  // ---------------- GRADES ----------------
  const gradesWrap = document.getElementById('gradesWrap');
  const teacherGrades = document.getElementById('teacherGrades');

  if(u.role==='teacher' && teacherGrades){
    teacherGrades.style.display='block';
    document.getElementById('addGradeBtn').addEventListener('click', async ()=>{
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
      gradesWrap.innerHTML='';
      if(s.empty) gradesWrap.innerHTML = '<div class="small muted">Nuk ka nota të vendosura.</div>';
      else {
        s.forEach(d=>{
          const g=d.data();
          gradesWrap.innerHTML += `<div style="margin-bottom:8px;"><strong>${g.studentEmail}</strong><div class="small">${g.subject}: ${g.grade}</div></div>`;
        });
      }
    });

  } else if(gradesWrap){ // student
    db.collection('grades').where('studentId','==',user.uid).onSnapshot(s=>{
      gradesWrap.innerHTML='';
      if(s.empty) gradesWrap.innerHTML = '<div class="small muted">Nuk ka nota për ju.</div>';
      else {
        s.forEach(d=>{
          const g=d.data();
          gradesWrap.innerHTML += `<div style="margin-bottom:8px;"><strong>${g.subject}</strong><div class="small">Nota: ${g.grade}</div></div>`;
        });
      }
    });
  }
});
