let payload, bandChart, genderChart, scatterChart;
const pink = '#e8a6bd', pink2 = '#f2c6d5', white = '#f7f5f5', muted = '#8f8b90', grid = '#2b2a2e';
const $ = id => document.getElementById(id);

async function init(){
  payload = await (await fetch('/api/data')).json();
  render(payload.data);
  $('genderFilter').addEventListener('change', ()=>render(payload.data));
  $('resetBtn').addEventListener('click', ()=>{$('genderFilter').value='ALL'; $('searchInput').value=''; render(payload.data)});
  $('searchInput').addEventListener('input', ()=>renderTable(currentRows()));
}
function currentRows(){
  const g=$('genderFilter').value;
  return payload.data.filter(r=>g==='ALL'||r.Gender===g);
}
function stats(rows){
  const vals=rows.map(r=>r.Exam_Score).sort((a,b)=>a-b), n=vals.length;
  const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const mean=avg(vals), med=n%2?vals[(n-1)/2]:(vals[n/2-1]+vals[n/2])/2;
  const sd=Math.sqrt(vals.reduce((s,x)=>s+(x-mean)**2,0)/(n-1||1));
  const high=rows.filter(r=>r.Exam_Score>=80).length;
  return {n,mean,med,sd,min:vals[0],max:vals[n-1],risk:rows.filter(r=>r.Exam_Score<60).length,high,highPct:high/n*100};
}
function correlation(rows,key){
 const a=rows.map(r=>+r[key]),b=rows.map(r=>+r.Exam_Score),ma=a.reduce((s,x)=>s+x,0)/a.length,mb=b.reduce((s,x)=>s+x,0)/b.length;
 const num=a.reduce((s,x,i)=>s+(x-ma)*(b[i]-mb),0), den=Math.sqrt(a.reduce((s,x)=>s+(x-ma)**2,0)*b.reduce((s,x)=>s+(x-mb)**2,0)); return den?num/den:0;
}
function render(rows){
 const s=stats(rows), cs=correlation(rows,'Study_Hours'), ca=correlation(rows,'Attendance');
 $('kpiCount').textContent=s.n; $('kpiMean').textContent=s.mean.toFixed(2); $('kpiMedian').textContent=s.med.toFixed(2); $('kpiStd').textContent=s.sd.toFixed(2); $('kpiRisk').textContent=s.risk;
 $('studyCorr').textContent='r = '+cs.toFixed(2); $('attCorr').textContent='r = '+ca.toFixed(2); $('highText').textContent=s.high+' records'; $('highPct').textContent=s.highPct.toFixed(0)+'%';
 $('studyText').textContent=relationshipLabel(cs); $('attText').textContent=relationshipLabel(ca); $('corrPill').textContent='Correlation '+cs.toFixed(2);
 renderCharts(rows); renderCorr(rows); renderText(rows,s,cs,ca); renderTable(rows);
}
function relationshipLabel(r){return r>=.7?'Hubungan kuat':r>=.4?'Hubungan sedang':r<=-.7?'Hubungan negatif kuat':r<=-.4?'Hubungan negatif sedang':'Hubungan lemah'}
function baseOptions(){return {responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:white,font:{size:11}}}},scales:{x:{ticks:{color:muted,font:{size:10}},grid:{color:grid}},y:{ticks:{color:muted,font:{size:10}},grid:{color:grid}}}}}
function renderCharts(rows){
 if(bandChart)bandChart.destroy(); if(genderChart)genderChart.destroy(); if(scatterChart)scatterChart.destroy();
 const labels=['< 60','60–69','70–79','80–89','90–100']; const counts=labels.map((_,i)=>rows.filter(r=>[r.Exam_Score<60,r.Exam_Score>=60&&r.Exam_Score<70,r.Exam_Score>=70&&r.Exam_Score<80,r.Exam_Score>=80&&r.Exam_Score<90,r.Exam_Score>=90][i]).length);
 bandChart=new Chart($('bandChart'),{type:'bar',data:{labels,datasets:[{data:counts,backgroundColor:pink,borderRadius:7,borderSkipped:false}]},options:baseOptions()});
 const fs=rows.filter(r=>r.Gender==='F'), ms=rows.filter(r=>r.Gender==='M');
 genderChart=new Chart($('genderChart'),{type:'bar',data:{labels:['Female','Male'],datasets:[{label:'Average score',data:[avg(fs),avg(ms)],backgroundColor:[pink,pink2],borderRadius:7}]},options:baseOptions()});
 const pts=rows.map(r=>({x:r.Study_Hours,y:r.Exam_Score}));
 scatterChart=new Chart($('scatterChart'),{type:'scatter',data:{datasets:[{data:pts,backgroundColor:pink,pointRadius:4}]},options:{...baseOptions(),scales:{x:{...baseOptions().scales.x,title:{display:true,text:'Study Hours',color:muted}},y:{...baseOptions().scales.y,title:{display:true,text:'Exam Score',color:muted}}}}});
}
function avg(a){return a.length?a.reduce((s,r)=>s+r.Exam_Score,0)/a.length:0}
function renderCorr(rows){const items=[['Attendance',correlation(rows,'Attendance')],['Screen Time',correlation(rows,'Screen_Hours')],['Study Hours',correlation(rows,'Study_Hours')],['Sleep Hours',correlation(rows,'Sleep_Hours')],['Satisfaction',correlation(rows,'Satisfaction')]];$('corrList').innerHTML=items.map(([n,v])=>`<div class="corr-item"><div class="corr-meta"><span>${n}</span><span>${v.toFixed(2)}</span></div><div class="bar"><i style="width:${Math.min(100,Math.abs(v)*100)}%"></i></div></div>`).join('')}
function renderText(rows,s,cs,ca){
 const screen=correlation(rows,'Screen_Hours');
 $('analysisText').innerHTML=`<p><strong>Rata-rata nilai</strong> adalah ${s.mean.toFixed(2)} dan median ${s.med.toFixed(2)}. Artinya, pusat data berada di sekitar nilai tersebut.</p><p><strong>Standar deviasi</strong> sebesar ${s.sd.toFixed(2)} menunjukkan seberapa menyebar nilai dari rata-ratanya. Semakin besar nilainya, semakin beragam performanya.</p><p><strong>Rentang nilai</strong> berada dari ${s.min} sampai ${s.max}. Ada <strong>${s.risk} data</strong> di bawah 60, sementara <strong>${s.high} data</strong> berada pada 80 ke atas.</p><p><strong>Hubungan antar variabel</strong> terlihat kuat: jam belajar dengan nilai memiliki korelasi ${cs.toFixed(2)}, kehadiran ${ca.toFixed(2)}, sedangkan screen time ${screen.toFixed(2)}.</p>`;
 $('decisionText').innerHTML=`<div class="decision"><span class="num">01</span><span>Prioritaskan pendampingan pada data dengan nilai di bawah 60 karena kelompok ini paling membutuhkan perhatian.</span></div><div class="decision"><span class="num">02</span><span>Pertahankan kebiasaan belajar dan kehadiran yang baik karena keduanya berkaitan kuat dengan nilai.</span></div><div class="decision"><span class="num">03</span><span>Perhatikan screen time. Hubungan negatif yang kuat menunjukkan pola yang perlu dievaluasi bersama kebiasaan belajar.</span></div><div class="decision"><span class="num">04</span><span>Gunakan dashboard ini untuk membandingkan kelompok, mencari pola, lalu menentukan prioritas berdasarkan data.</span></div>`;
}
function renderTable(rows){const q=$('searchInput').value.trim();const filtered=rows.filter(r=>String(r.Student_ID).includes(q));$('dataBody').innerHTML=filtered.slice(0,20).map(r=>`<tr><td>${r.Student_ID}</td><td>${r.Gender==='F'?'Female':'Male'}</td><td>${r.Age}</td><td>${r.Study_Hours}</td><td>${r.Attendance}%</td><td>${r.Exam_Score}</td><td>${r.Screen_Hours}</td><td>${r.Satisfaction}/10</td></tr>`).join('')}
init();
