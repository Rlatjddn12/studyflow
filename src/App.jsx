import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase.js";

const A="#10B981",A2="#059669",A3="#34D399",AG="rgba(16,185,129,0.12)",AS="rgba(16,185,129,0.06)";
const BG="#050506",BG2="#0A0A0C",CARD="#101012",CARD2="#141416",BD="#1A1A1E",BD2="#222226";
const T1="#F4F4F5",T2="#A1A1AA",T3="#52525B",T4="#3F3F46",WARN="#F59E0B",DANGER="#EF4444";
const FONT="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

// ═══ EVENT LOGGING + FUNNEL ═══
const LOG=[];
function logEvent(n,d={}){LOG.push({event:n,ts:Date.now(),...d});console.log(`[SF] ${n}`,d);}

if(typeof window!=="undefined"){window.studyFlowFunnel=()=>{
  const count=n=>LOG.filter(l=>l.event===n).length;
  const steps=[
    {name:"온보딩 시작",key:"onboarding_start"},
    {name:"온보딩 완료",key:"onboarding_complete"},
    {name:"플랜 생성 시작",key:"plan_generate_start"},
    {name:"플랜 생성 완료",key:"plan_generated"},
    {name:"태스크 체크",key:"task_checked"},
    {name:"페이월 노출",key:"paywall_shown"},
    {name:"부모 결제 요청",key:"parent_request"},
    {name:"결제 전환",key:"paywall_converted"},
    {name:"공유 카드 생성",key:"share_card_created"},
  ];
  console.log("\n══════ StudyFlow 퍼널 분석 ══════");
  let prev=0;
  steps.forEach((s,i)=>{
    const c=count(s.key);
    const rate=i>0&&prev>0?((c/prev)*100).toFixed(1)+"%":"—";
    console.log(`${i+1}. ${s.name.padEnd(14)} : ${String(c).padStart(4)} (전환율: ${rate})`);
    prev=c||prev;
  });
  console.log("\n[이탈 포인트] 전환율이 가장 낮은 구간을 집중 개선하세요.");
  console.log("전체 로그:",LOG);
};}

// ═══ STREAK LOGIC ═══
function calcStreak(plan){
  if(!plan||plan.length===0)return{streak:0,atRisk:false,msg:""};
  const today=new Date();today.setHours(0,0,0,0);
  const dayMap={};
  plan.forEach(d=>{const allDone=d.tasks.length>0&&d.tasks.every(t=>t.done);dayMap[d.date]=allDone;});
  let streak=0;let d=new Date(today);d.setDate(d.getDate()-1);
  while(true){const ds=d.toISOString().split("T")[0];if(dayMap[ds]===true){streak++;d.setDate(d.getDate()-1);}else break;}
  const todayStr=today.toISOString().split("T")[0];
  const todayPlan=plan.find(p=>p.date===todayStr);
  const todayAllDone=todayPlan?todayPlan.tasks.length>0&&todayPlan.tasks.every(t=>t.done):false;
  if(todayAllDone)streak++;
  const atRisk=!todayAllDone&&streak>0&&todayPlan&&todayPlan.tasks.length>0;
  const msg=atRisk?`오늘만 완료하면 ${streak+1}일 연속이에요!`:"";
  return{streak,atRisk,msg};
}

// ═══ ICONS ═══
const el=React.createElement;
function sv(s,w,c,ch){return el("svg",{width:s,height:s,viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:w,strokeLinecap:"round",strokeLinejoin:"round"},...ch);}
const IC={
  home:(c=T2,s=22)=>sv(s,"1.8",c,[el("path",{key:"p",d:"M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z"})]),
  plan:(c=T2,s=22)=>sv(s,"1.8",c,[el("rect",{key:"r",x:3,y:4,width:18,height:18,rx:2}),el("line",{key:"a",x1:16,y1:2,x2:16,y2:6}),el("line",{key:"b",x1:8,y1:2,x2:8,y2:6}),el("line",{key:"c",x1:3,y1:10,x2:21,y2:10})]),
  cal:(c=T2,s=22)=>sv(s,"1.8",c,[el("rect",{key:"r",x:3,y:4,width:18,height:18,rx:2}),el("line",{key:"a",x1:16,y1:2,x2:16,y2:6}),el("line",{key:"b",x1:8,y1:2,x2:8,y2:6}),el("line",{key:"c",x1:3,y1:10,x2:21,y2:10}),el("rect",{key:"d",x:7,y:13,width:3,height:3,rx:.5,fill:c,stroke:"none"})]),
  settings:(c=T2,s=22)=>sv(s,"1.8",c,[el("circle",{key:"c",cx:12,cy:12,r:3}),el("path",{key:"p",d:"M12 1v2m0 18v2m-9-11h2m18 0h2m-4.2-6.8-1.4 1.4M6.6 17.4l-1.4 1.4m0-13.6 1.4 1.4m10.8 10.8 1.4 1.4"})]),
  plus:(c=T2,s=18)=>sv(s,"2",c,[el("line",{key:"v",x1:12,y1:5,x2:12,y2:19}),el("line",{key:"h",x1:5,y1:12,x2:19,y2:12})]),
  x:(c=T3,s=18)=>sv(s,"2",c,[el("line",{key:"a",x1:18,y1:6,x2:6,y2:18}),el("line",{key:"b",x1:6,y1:6,x2:18,y2:18})]),
  check:(c="#fff",s=13)=>sv(s,"3",c,[el("polyline",{key:"p",points:"20 6 9 17 4 12"})]),
  clock:(c=T4,s=13)=>sv(s,"2",c,[el("circle",{key:"c",cx:12,cy:12,r:10}),el("polyline",{key:"p",points:"12 6 12 12 16 14"})]),
  target:(c=A,s=16)=>sv(s,"2",c,[el("circle",{key:"a",cx:12,cy:12,r:10}),el("circle",{key:"b",cx:12,cy:12,r:6}),el("circle",{key:"c",cx:12,cy:12,r:2})]),
  zap:(c=A,s=16)=>sv(s,"2",c,[el("polygon",{key:"p",points:"13 2 3 14 12 14 11 22 21 10 12 10 13 2"})]),
  flame:(c="#F97316",s=16)=>sv(s,"2",c,[el("path",{key:"p",d:"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.5-2.5 1.5-3.5L8.5 14.5z"})]),
  book:(c="#fff",s=18)=>sv(s,"2",c,[el("path",{key:"a",d:"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"}),el("path",{key:"b",d:"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"})]),
  sparkle:(c=A3,s=16)=>sv(s,"2",c,[el("path",{key:"p",d:"M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"})]),
  chevR:(c=T4,s=16)=>sv(s,"2",c,[el("path",{key:"p",d:"M9 18l6-6-6-6"})]),
  chevL:(c=T4,s=16)=>sv(s,"2",c,[el("path",{key:"p",d:"M15 18l-6-6 6-6"})]),
  edit:(c=T3,s=14)=>sv(s,"2",c,[el("path",{key:"a",d:"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"}),el("path",{key:"b",d:"M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"})]),
  trash:(c=DANGER,s=14)=>sv(s,"2",c,[el("polyline",{key:"a",points:"3 6 5 6 21 6"}),el("path",{key:"b",d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"})]),
  lock:(c=T4,s=16)=>sv(s,"2",c,[el("rect",{key:"r",x:3,y:11,width:18,height:11,rx:2}),el("path",{key:"p",d:"M7 11V7a5 5 0 0 1 10 0v4"})]),
  share:(c=T2,s=16)=>sv(s,"2",c,[el("circle",{key:"a",cx:18,cy:5,r:3}),el("circle",{key:"b",cx:6,cy:12,r:3}),el("circle",{key:"c",cx:18,cy:19,r:3}),el("line",{key:"d",x1:8.59,y1:13.51,x2:15.42,y2:17.49}),el("line",{key:"e",x1:15.41,y1:6.51,x2:8.59,y2:10.49})]),
  crown:(c=WARN,s=16)=>sv(s,"2",c,[el("path",{key:"p",d:"M2 20h20L19 8l-5 6-2-8-2 8-5-6-3 12z"})]),
  timer:(c=T2,s=22)=>sv(s,"1.8",c,[el("circle",{key:"c",cx:12,cy:13,r:8}),el("path",{key:"a",d:"M12 9v4l2 2"}),el("path",{key:"b",d:"M5 3l2 2"}),el("path",{key:"d",d:"M19 3l-2 2"}),el("line",{key:"e",x1:12,y1:1,x2:12,y2:3})]),
  play:(c="#fff",s=20)=>el("svg",{width:s,height:s,viewBox:"0 0 24 24",fill:c,stroke:"none"},el("polygon",{key:"p",points:"5 3 19 12 5 21 5 3"})),
  pause:(c="#fff",s=20)=>sv(s,"3",c,[el("line",{key:"a",x1:8,y1:5,x2:8,y2:19}),el("line",{key:"b",x1:16,y1:5,x2:16,y2:19})]),
  stop:(c="#fff",s=20)=>el("svg",{width:s,height:s,viewBox:"0 0 24 24",fill:c,stroke:"none"},el("rect",{key:"r",x:5,y:5,width:14,height:14,rx:2})),
  copy:(c=T2,s=16)=>sv(s,"2",c,[el("rect",{key:"a",x:9,y:9,width:13,height:13,rx:2}),el("path",{key:"b",d:"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"})]),
};

// ═══ SHARED COMPONENTS ═══
function Logo({size="default"}){const s=size==="small"?28:36;return el("div",{style:{display:"flex",alignItems:"center",gap:10}},el("div",{className:"logo-pulse",style:{width:s,height:s,borderRadius:s*.28,background:`linear-gradient(135deg,${A},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 20px ${AG}`}},IC.book("#fff",s*.48)),el("span",{style:{fontSize:size==="small"?14:17,fontWeight:800,color:T1,letterSpacing:-.5}},"StudyFlow"));}
function AnimNum({value,suffix="",style:st}){const[d,setD]=useState(0);const r=useRef();useEffect(()=>{const t0=performance.now();const tick=now=>{const p=Math.min((now-t0)/800,1);setD(Math.round(value*(1-Math.pow(1-p,3))));if(p<1)r.current=requestAnimationFrame(tick);};r.current=requestAnimationFrame(tick);return()=>r.current&&cancelAnimationFrame(r.current);},[value]);return el("span",{style:st},d,suffix);}
function Stagger({children,delay=60}){return el(React.Fragment,null,React.Children.toArray(children).map((ch,i)=>el("div",{key:i,style:{animation:`fadeSlideUp 0.45s cubic-bezier(0.16,1,0.3,1) ${i*delay}ms both`}},ch)));}
function ProgressRing({pct,size=90,stroke=7,label}){const r=(size-stroke)/2;const c=2*Math.PI*r;return el("div",{style:{position:"relative",width:size,height:size}},el("svg",{width:size,height:size,style:{transform:"rotate(-90deg)"}},el("circle",{cx:size/2,cy:size/2,r,fill:"none",stroke:BD,strokeWidth:stroke}),el("circle",{cx:size/2,cy:size/2,r,fill:"none",stroke:"url(#rg)",strokeWidth:stroke,strokeDasharray:c,strokeDashoffset:c*(1-pct/100),strokeLinecap:"round",style:{transition:"stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)"}}),el("defs",null,el("linearGradient",{id:"rg"},el("stop",{offset:"0%",stopColor:A2}),el("stop",{offset:"100%",stopColor:A3})))),el("div",{style:{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}},el(AnimNum,{value:pct,suffix:"%",style:{fontSize:size>80?22:16,fontWeight:800,color:T1}}),label&&el("span",{style:{fontSize:9,color:T3,fontWeight:600,marginTop:2}},label)));}

// ═══ STREAK ALERT ═══
function StreakAlert({msg,onClose}){
  if(!msg)return null;
  return el("div",{style:{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:300,width:"calc(100% - 40px)",maxWidth:440,animation:"fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1)"}},
    el("div",{style:{background:`linear-gradient(135deg,rgba(249,115,22,0.15),rgba(245,158,11,0.1))`,border:"1.5px solid rgba(249,115,22,0.3)",borderRadius:16,padding:"16px 20px",display:"flex",alignItems:"center",gap:12,backdropFilter:"blur(20px)"}},
      el("div",{style:{fontSize:28}},IC.flame("#F97316",28)),
      el("div",{style:{flex:1}},el("span",{style:{fontSize:14,fontWeight:700,color:T1,display:"block",marginBottom:2}},msg),el("span",{style:{fontSize:11,color:T3}},"스트릭을 유지하세요!")),
      el("button",{onClick:onClose,style:{background:"none",border:"none",cursor:"pointer",padding:4}},IC.x(T3,16))
    )
  );
}

// ═══ STUDY TIMER ═══
function TimerScreen(){
  const[running,setRunning]=useState(false);
  const[seconds,setSeconds]=useState(0);
  const[sessions,setSessions]=useState([]);
  const ref=useRef(null);

  useEffect(()=>{
    if(running){ref.current=setInterval(()=>setSeconds(s=>s+1),1000);}
    else{clearInterval(ref.current);}
    return()=>clearInterval(ref.current);
  },[running]);

  const fmt=s=>{const h=Math.floor(s/3600);const m=Math.floor((s%3600)/60);const sec=s%60;return `${h>0?h+":":""}${String(m).padStart(2,"00")}:${String(sec).padStart(2,"00")}`;};
  const stop=()=>{if(seconds>0){setSessions([...sessions,{duration:seconds,ts:Date.now()}]);logEvent("timer_session",{seconds});}setRunning(false);setSeconds(0);};
  const totalToday=sessions.reduce((s,x)=>s+x.duration,0);

  return el("div",{style:S.pad},el(Stagger,{delay:60},
    el("h2",{style:{fontSize:20,fontWeight:800,color:T1,marginBottom:24}},"공부 타이머"),
    el("div",{style:{textAlign:"center",padding:"40px 0",marginBottom:24}},
      el("div",{style:{position:"relative",width:200,height:200,margin:"0 auto",marginBottom:32}},
        el("svg",{width:200,height:200,style:{transform:"rotate(-90deg)",position:"absolute",inset:0}},
          el("circle",{cx:100,cy:100,r:90,fill:"none",stroke:BD,strokeWidth:6}),
          running&&el("circle",{cx:100,cy:100,r:90,fill:"none",stroke:A,strokeWidth:6,strokeDasharray:`${2*Math.PI*90}`,strokeDashoffset:0,strokeLinecap:"round",className:"timer-ring"})
        ),
        el("div",{style:{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}},
          el("span",{style:{fontSize:44,fontWeight:800,color:T1,fontVariantNumeric:"tabular-nums",letterSpacing:-1}},fmt(seconds)),
          el("span",{style:{fontSize:12,color:T3,marginTop:4}},running?"집중 중...":"준비")
        )
      ),
      el("div",{style:{display:"flex",justifyContent:"center",gap:16}},
        !running?el("button",{onClick:()=>{setRunning(true);logEvent("timer_start");},style:{width:64,height:64,borderRadius:32,background:`linear-gradient(135deg,${A},${A2})`,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:`0 4px 24px ${AG}`}},IC.play("#fff",24)):
        el(React.Fragment,null,
          el("button",{onClick:()=>setRunning(false),style:{width:56,height:56,borderRadius:28,background:CARD,border:`1.5px solid ${BD}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}},IC.pause(T1,22)),
          el("button",{onClick:stop,style:{width:56,height:56,borderRadius:28,background:"rgba(239,68,68,0.1)",border:`1.5px solid rgba(239,68,68,0.2)`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}},IC.stop(DANGER,18))
        )
      )
    ),
    el("div",{style:{background:CARD,border:`1px solid ${BD}`,borderRadius:16,padding:18,marginBottom:16}},
      el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
        el("span",{style:{fontSize:13,fontWeight:600,color:T2}},"오늘 총 공부 시간"),
        el("span",{style:{fontSize:20,fontWeight:800,color:A}},fmt(totalToday))
      )
    ),
    sessions.length>0&&el("div",null,
      el("h3",{style:{fontSize:14,fontWeight:700,color:T2,marginBottom:12}},"오늘의 세션"),
      ...sessions.map((s,i)=>el("div",{key:i,style:{background:CARD,border:`1px solid ${BD}`,borderRadius:12,padding:"12px 16px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}},
        el("span",{style:{fontSize:13,color:T1}},`세션 ${i+1}`),
        el("span",{style:{fontSize:13,fontWeight:700,color:A}},fmt(s.duration))
      ))
    )
  ));
}

// ═══ SHARE CARD ═══
function ShareCard({plan,profile,streak,onClose}){
  const canvasRef=useRef(null);
  const today=new Date().toISOString().split("T")[0];
  const tp=plan?plan.find(d=>d.date===today):null;
  const total=tp?tp.tasks.length:0;const done=tp?tp.tasks.filter(t=>t.done).length:0;
  const pct=total>0?Math.round((done/total)*100):0;
  const futureDays=plan?plan.filter(d=>d.date>=today):[];
  const lastDay=futureDays.length>0?futureDays[futureDays.length-1]:null;
  const dday=lastDay?lastDay.dayLabel:"";
  const personality=pct>=100?"완벽주의 학습러":pct>=70?"꾸준한 실천가":pct>=40?"성장 중인 도전자":"시작이 반이다!";

  useEffect(()=>{
    const c=canvasRef.current;if(!c)return;const ctx=c.getContext("2d");
    c.width=1080;c.height=1920;
    const bg=ctx.createLinearGradient(0,0,1080,1920);
    bg.addColorStop(0,"#030712");bg.addColorStop(0.5,"#051510");bg.addColorStop(1,"#030712");
    ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1920);
    ctx.globalAlpha=0.04;ctx.strokeStyle=A;ctx.lineWidth=1;
    for(let i=0;i<12;i++){ctx.beginPath();ctx.arc(540,960,150+i*80,0,Math.PI*2);ctx.stroke();}
    for(let i=-1080;i<2160;i+=120){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+1080,1920);ctx.stroke();}
    ctx.globalAlpha=1;
    const tg=ctx.createLinearGradient(200,0,880,0);tg.addColorStop(0,"transparent");tg.addColorStop(0.5,A);tg.addColorStop(1,"transparent");
    ctx.strokeStyle=tg;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(200,160);ctx.lineTo(880,160);ctx.stroke();
    ctx.fillStyle=A;ctx.beginPath();ctx.roundRect(440,100,200,44,22);ctx.fill();
    ctx.fillStyle="#fff";ctx.font="bold 22px 'Plus Jakarta Sans',sans-serif";ctx.textAlign="center";
    ctx.fillText("StudyFlow",540,130);
    ctx.fillStyle=T3;ctx.font="500 26px 'Plus Jakarta Sans',sans-serif";ctx.fillText(today,540,220);
    ctx.strokeStyle="#1a1a1e";ctx.lineWidth=14;ctx.beginPath();ctx.arc(540,460,140,-Math.PI/2,Math.PI*1.5);ctx.stroke();
    const pg=ctx.createLinearGradient(400,320,680,600);pg.addColorStop(0,A2);pg.addColorStop(1,A3);
    ctx.strokeStyle=pg;ctx.lineWidth=14;ctx.lineCap="round";ctx.beginPath();ctx.arc(540,460,140,-Math.PI/2,-Math.PI/2+Math.PI*2*(pct/100));ctx.stroke();
    ctx.shadowColor=A;ctx.shadowBlur=30;ctx.beginPath();ctx.arc(540,460,140,-Math.PI/2,-Math.PI/2+Math.PI*2*(pct/100));ctx.stroke();
    ctx.shadowBlur=0;
    ctx.fillStyle=T1;ctx.font="bold 72px 'Plus Jakarta Sans',sans-serif";ctx.fillText(`${pct}%`,540,475);
    ctx.fillStyle=T3;ctx.font="500 24px 'Plus Jakarta Sans',sans-serif";ctx.fillText("오늘 달성률",540,520);
    ctx.fillStyle="rgba(16,185,129,0.1)";ctx.beginPath();ctx.roundRect(320,660,440,56,28);ctx.fill();
    ctx.strokeStyle="rgba(16,185,129,0.3)";ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(320,660,440,56,28);ctx.stroke();
    ctx.fillStyle=A3;ctx.font="bold 24px 'Plus Jakarta Sans',sans-serif";ctx.fillText(`"${personality}"`,540,696);
    const stats=[{label:"완료",value:`${done}/${total}`},{label:"스트릭",value:`${streak.streak}일`},{label:dday||"D-Day",value:dday||"—"}];
    stats.forEach((s,i)=>{
      const x=190+i*350;
      ctx.fillStyle="rgba(255,255,255,0.03)";ctx.beginPath();ctx.roundRect(x-120,770,240,120,16);ctx.fill();
      ctx.fillStyle=T1;ctx.font="bold 36px 'Plus Jakarta Sans',sans-serif";ctx.fillText(s.value,x,820);
      ctx.fillStyle=T4;ctx.font="500 20px 'Plus Jakarta Sans',sans-serif";ctx.fillText(s.label,x,860);
    });
    if(tp){let y=950;ctx.textAlign="left";tp.tasks.slice(0,5).forEach((task)=>{
      ctx.fillStyle=task.done?"rgba(16,185,129,0.08)":"rgba(255,255,255,0.02)";
      ctx.beginPath();ctx.roundRect(100,y,880,76,14);ctx.fill();
      if(task.done){ctx.fillStyle=A;ctx.beginPath();ctx.roundRect(130,y+22,32,32,8);ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(139,y+38);ctx.lineTo(145,y+45);ctx.lineTo(155,y+33);ctx.stroke();}
      else{ctx.strokeStyle=BD2;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(130,y+22,32,32,8);ctx.stroke();}
      ctx.fillStyle=task.done?"rgba(212,212,216,0.5)":"#d4d4d8";ctx.font=`${task.done?"500":"600"} 24px 'Plus Jakarta Sans',sans-serif`;
      const txt=`${task.subject} · ${task.task}`;ctx.fillText(txt.slice(0,35),180,y+48);
      y+=90;
    });}
    const bg2=ctx.createLinearGradient(200,0,880,0);bg2.addColorStop(0,"transparent");bg2.addColorStop(0.5,A);bg2.addColorStop(1,"transparent");
    ctx.strokeStyle=bg2;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(200,1700);ctx.lineTo(880,1700);ctx.stroke();
    ctx.textAlign="center";ctx.fillStyle=T4;ctx.font="400 20px 'Plus Jakarta Sans',sans-serif";
    ctx.fillText("AI 학습 플래너로 공부 관리하기",540,1760);
    ctx.fillStyle=A;ctx.font="bold 22px 'Plus Jakarta Sans',sans-serif";ctx.fillText("studyflow.app",540,1800);
    logEvent("share_card_created");
  },[plan]);

  const download=()=>{const c=canvasRef.current;if(!c)return;const l=document.createElement("a");l.download=`studyflow-${today}.png`;l.href=c.toDataURL("image/png");l.click();logEvent("share_card_downloaded");};

  return el("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(12px)",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,animation:"fadeIn 0.2s"},onClick:onClose},
    el("div",{style:{width:"100%",maxWidth:300,animation:"popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)"},onClick:e=>e.stopPropagation()},
      el("canvas",{ref:canvasRef,style:{width:"100%",borderRadius:16,border:`1px solid ${BD}`}}),
      el("div",{style:{display:"flex",gap:10,marginTop:16}},
        el("button",{onClick:onClose,style:{flex:1,background:CARD,border:`1px solid ${BD}`,borderRadius:14,color:T2,padding:14,fontSize:14,fontWeight:600,cursor:"pointer"}},"닫기"),
        el("button",{onClick:download,className:"btn-glow",style:{flex:2,...S.genBtn,padding:14,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:6}},IC.share("#fff",16)," 저장하기")
      )
    )
  );
}

// ═══ PAYWALL ═══
function PaywallModal({onClose,onUpgrade}){
  const[copied,setCopied]=useState(false);
  logEvent("paywall_shown");

  const parentRequest=()=>{
    const msg=`엄마(아빠), 나 이번 시험 StudyFlow 앱으로 공부 관리하려고 해! AI가 시험 일정에 맞춰서 매일 뭐 공부할지 짜주는 앱이야. 프리미엄 버전이 월 4,900원인데 결제해줄 수 있어? 🙏\n\n👉 studyflow.app`;
    if(navigator.clipboard){navigator.clipboard.writeText(msg).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);logEvent("parent_request");});}
  };

  return el("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"fadeIn 0.2s"},onClick:onClose},
    el("div",{style:{width:"100%",maxWidth:380,background:CARD,borderRadius:20,padding:"28px 24px",border:`1px solid ${BD}`,animation:"popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",textAlign:"center",maxHeight:"90vh",overflowY:"auto"},onClick:e=>e.stopPropagation()},
      el("div",{style:{width:56,height:56,borderRadius:16,background:`linear-gradient(135deg,${WARN},#F97316)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 4px 24px rgba(245,158,11,0.2)"}},IC.crown("#fff",24)),
      el("h3",{style:{fontSize:18,fontWeight:800,color:T1,marginBottom:6}},"StudyFlow Pro"),
      el("p",{style:{fontSize:13,color:T2,lineHeight:1.6,marginBottom:20}},"시험 직전 복습 플랜과 프리미엄 기능을 잠금 해제하세요"),
      el("div",{style:{background:BG2,borderRadius:14,padding:14,marginBottom:16,textAlign:"left"}},
        [{t:"시험 직전 3일 집중 복습 플랜"},{t:"AI 요약 & 퀴즈 (Coming soon)"},{t:"과목 무제한 등록"},{t:"광고 제거"}].map((f,i)=>el("div",{key:i,style:{display:"flex",alignItems:"center",gap:10,padding:"7px 0"}},el("div",{style:{width:18,height:18,borderRadius:5,background:AS,display:"flex",alignItems:"center",justifyContent:"center"}},IC.check(A,10)),el("span",{style:{fontSize:13,color:T1}},f.t)))
      ),
      el("div",{style:{marginBottom:14}},el("span",{style:{fontSize:28,fontWeight:800,color:T1}},"₩4,900"),el("span",{style:{fontSize:13,color:T3}},"/월")),
      el("button",{onClick:()=>{logEvent("paywall_converted");onUpgrade();},className:"btn-glow",style:{...S.genBtn,background:`linear-gradient(135deg,${WARN},#F97316)`,boxShadow:"0 4px 20px rgba(245,158,11,0.2)",marginBottom:12}},"Pro 시작하기"),
      el("button",{onClick:parentRequest,style:{width:"100%",background:"rgba(245,158,11,0.06)",border:`1.5px solid rgba(245,158,11,0.15)`,borderRadius:14,padding:"13px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",marginBottom:8}},
        copied?el(React.Fragment,null,IC.check(A,16),el("span",{style:{fontSize:13,fontWeight:600,color:A}},"메시지가 복사되었어요!")):
        el(React.Fragment,null,IC.copy(WARN,16),el("span",{style:{fontSize:13,fontWeight:600,color:WARN}},"부모님께 결제 요청하기"))
      ),
      el("p",{style:{fontSize:11,color:T4,lineHeight:1.5,marginBottom:8}},"카카오톡에 붙여넣기하면 결제 요청 메시지가 전송됩니다"),
      el("button",{onClick:onClose,style:{background:"none",border:"none",color:T4,fontSize:13,cursor:"pointer",padding:6}},"나중에")
    )
  );
}

// ═══ EDIT MODAL ═══
function EditModal({task,onSave,onDelete,onClose}){const[t,setT]=useState(task.task);const[d,setD]=useState(task.duration);const[s,setS]=useState(task.subject);return el("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn 0.2s"},onClick:onClose},el("div",{style:{width:"100%",maxWidth:480,background:CARD,borderRadius:"20px 20px 0 0",padding:"24px 20px 36px",border:`1px solid ${BD}`,borderBottom:"none",animation:"slideUp 0.35s cubic-bezier(0.16,1,0.3,1)"},onClick:e=>e.stopPropagation()},el("div",{style:{width:36,height:4,borderRadius:2,background:BD2,margin:"0 auto 20px"}}),el("h3",{style:{fontSize:16,fontWeight:700,color:T1,marginBottom:20}},"태스크 수정"),el("div",{style:{marginBottom:14}},el("label",{style:S.label},"과목"),el("input",{value:s,onChange:e=>setS(e.target.value),style:S.input,className:"input-glow"})),el("div",{style:{marginBottom:14}},el("label",{style:S.label},"내용"),el("textarea",{value:t,onChange:e=>setT(e.target.value),rows:3,style:S.inputArea,className:"input-glow"})),el("div",{style:{marginBottom:20}},el("label",{style:S.label},"소요 시간"),el("input",{value:d,onChange:e=>setD(e.target.value),style:S.input,className:"input-glow"})),el("div",{style:{display:"flex",gap:10}},el("button",{onClick:()=>{logEvent("task_deleted",{id:task.id});onDelete(task.id);},style:{flex:1,background:"rgba(239,68,68,0.1)",border:"1.5px solid rgba(239,68,68,0.2)",borderRadius:14,color:DANGER,padding:13,fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}},IC.trash(DANGER,14)," 삭제"),el("button",{onClick:()=>{logEvent("task_edited",{id:task.id});onSave({...task,task:t,duration:d,subject:s});},className:"btn-glow",style:{flex:2,...S.genBtn,padding:13,fontSize:14}},"저장"))));}

// ═══ LOADING ═══
function LoadingScreen(){const steps=[{l:"시험 범위 분석",ic:IC.target},{l:"학습 프로필 반영",ic:IC.zap},{l:"일정 최적화",ic:IC.sparkle},{l:"플랜 생성 완료",ic:IC.check}];const[step,setStep]=useState(0);const[dots,setDots]=useState("");useEffect(()=>{const t=setInterval(()=>setStep(p=>Math.min(p+1,3)),1800);return()=>clearInterval(t);},[]);useEffect(()=>{const t=setInterval(()=>setDots(p=>p.length>=3?"":p+"."),400);return()=>clearInterval(t);},[]);return el("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:40,position:"relative",overflow:"hidden"}},el("div",{className:"loading-glow",style:{position:"absolute",width:300,height:300,borderRadius:"50%",background:`radial-gradient(circle,${AG},transparent 70%)`,top:"30%",left:"50%",transform:"translate(-50%,-50%)",filter:"blur(40px)"}}),el("div",{style:{position:"relative",width:120,height:120,marginBottom:48}},el("div",{className:"ring1",style:{position:"absolute",inset:0,borderRadius:"50%",border:`2px solid ${BD}`,borderTopColor:A}}),el("div",{className:"ring2",style:{position:"absolute",inset:12,borderRadius:"50%",border:`2px solid ${BD}`,borderRightColor:A3,opacity:.7}}),el("div",{className:"ring3",style:{position:"absolute",inset:24,borderRadius:"50%",border:`2px solid ${BD}`,borderBottomColor:A2,opacity:.5}}),el("div",{style:{position:"absolute",inset:36,borderRadius:"50%",background:`linear-gradient(135deg,${A},${A2})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 40px ${AG}`}},IC.book("#fff",24))),el("div",{style:{width:"100%",maxWidth:280,zIndex:1}},steps.map((s,i)=>{const ac=i===step,dn=i<step;return el("div",{key:i,style:{display:"flex",alignItems:"center",gap:14,padding:"12px 0",opacity:dn?.4:ac?1:.2,transition:"all 0.5s",transform:ac?"translateX(4px)":"none"}},el("div",{style:{width:32,height:32,borderRadius:10,background:dn?A:ac?AS:"transparent",border:`1.5px solid ${dn?A:ac?A:BD}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:ac?`0 0 20px ${AG}`:"none"}},dn?IC.check("#fff",14):s.ic(ac?A:T4,16)),el("span",{style:{fontSize:14,fontWeight:ac?700:500,color:dn?T3:ac?T1:T4}},s.l+(ac?dots:"")));})),el("div",{style:{width:"100%",maxWidth:280,marginTop:24}},el("div",{style:{height:3,background:BD,borderRadius:2,overflow:"hidden"}},el("div",{style:{height:"100%",borderRadius:2,background:`linear-gradient(90deg,${A2},${A},${A3})`,width:`${((step+1)/4)*100}%`,transition:"width 0.8s"}}))));}

// ═══ NAV ═══
function BottomNav({active,onNav}){const items=[{id:"home",l:"홈",icon:IC.home},{id:"plan",l:"플랜",icon:IC.plan},{id:"timer",l:"타이머",icon:IC.timer},{id:"calendar",l:"캘린더",icon:IC.cal},{id:"settings",l:"설정",icon:IC.settings}];return el("div",{className:"sf-nav",style:S.nav},el("div",{style:S.navInner},items.map(it=>{const on=active===it.id;return el("button",{key:it.id,onClick:()=>{logEvent("tab_switch",{tab:it.id});onNav(it.id);},style:{...S.navItem,padding:"6px 12px"}},el("div",{style:{transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",transform:on?"translateY(-3px) scale(1.1)":"none"}},it.icon(on?A:T4,20)),el("span",{style:{fontSize:9,color:on?A:T4,fontWeight:on?700:500,opacity:on?1:.7}},it.l),el("div",{style:{position:"absolute",top:-1,width:on?16:0,height:3,borderRadius:"0 0 3px 3px",background:`linear-gradient(90deg,${A},${A3})`,transition:"all 0.3s"}}));})));}

// ═══ TASK ITEM ═══
function TaskItem({task,onToggle,onEdit,locked}){const[pop,setPop]=useState(false);const click=()=>{if(locked)return;if(!task.done)setPop(true);logEvent("task_checked",{id:task.id});onToggle();setTimeout(()=>setPop(false),400);};if(locked)return el("div",{style:{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",background:CARD,border:`1px solid ${BD}`,borderRadius:14,position:"relative",overflow:"hidden"}},el("div",{style:{position:"absolute",inset:0,background:"rgba(5,5,6,0.7)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1,borderRadius:14}},IC.lock(T3,20)),el("div",{style:{flex:1,opacity:.3}},el("span",{style:{fontSize:10,fontWeight:700,color:A}},task.subject),el("br"),el("span",{style:{fontSize:13,color:T3}},task.task)));return el("div",{style:{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",background:CARD,border:`1px solid ${BD}`,borderRadius:14,cursor:"pointer",transition:"all 0.25s",opacity:task.done?.4:1,transform:pop?"scale(0.97)":"scale(1)"}},el("div",{onClick:click,style:{width:22,height:22,minWidth:22,borderRadius:7,border:`2px solid ${task.done?A:BD2}`,background:task.done?A:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",transform:pop?"scale(1.2)":"scale(1)",boxShadow:task.done?`0 0 12px ${AG}`:"none"}},task.done&&el("div",{style:{animation:"popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)"}},IC.check("#fff",12))),el("div",{onClick:click,style:{flex:1,display:"flex",flexDirection:"column",gap:3}},el("span",{style:{fontSize:10,fontWeight:700,color:A,textTransform:"uppercase",letterSpacing:.5}},task.subject),el("span",{style:{fontSize:13,color:"#d4d4d8",lineHeight:1.4,textDecoration:task.done?"line-through":"none"}},task.task)),el("div",{style:{display:"flex",alignItems:"center",gap:8,flexShrink:0}},el("div",{style:{display:"flex",alignItems:"center",gap:4}},IC.clock(T4,12),el("span",{style:{fontSize:11,color:T4}},task.duration)),el("button",{onClick:e=>{e.stopPropagation();onEdit(task);},style:{background:"none",border:"none",cursor:"pointer",padding:4,opacity:.5}},IC.edit(T2,14))));}

// ═══ HOME ═══
function HomeScreen({plan,onToggle,onNav,onEdit,onShare,streak}){const today=new Date().toISOString().split("T")[0];const tp=plan?plan.find(d=>d.date===today):null;const total=plan?plan.reduce((s,d)=>s+d.tasks.length,0):0;const done=plan?plan.reduce((s,d)=>s+d.tasks.filter(t=>t.done).length,0):0;const pct=total>0?Math.round((done/total)*100):0;const di=plan?plan.findIndex(d=>d.date===today):-1;const td=tp?tp.tasks.filter(t=>t.done).length:0;const tt=tp?tp.tasks.length:0;const tp2=tt>0?Math.round((td/tt)*100):0;if(!plan)return el("div",{style:S.pad},el("div",{style:{animation:"fadeSlideUp 0.5s ease"}},el(Logo,null)),el("div",{style:{marginTop:100,textAlign:"center",animation:"fadeSlideUp 0.6s ease 0.1s both"}},el("div",{className:"empty-float",style:{width:80,height:80,borderRadius:24,background:CARD,border:`1px solid ${BD}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}},IC.target(T3,36)),el("h2",{style:{fontSize:18,fontWeight:700,color:T2,marginBottom:8}},"아직 플랜이 없어요"),el("p",{style:{fontSize:13,color:T4,marginBottom:28}},"플랜 탭에서 새 학습 플랜을 만들어보세요"),el("button",{onClick:()=>onNav("plan"),className:"btn-glow",style:{...S.genBtn,padding:"12px 32px",width:"auto",display:"inline-flex",alignItems:"center",gap:8,fontSize:14}},IC.plus("#fff",16)," 플랜 만들기")));return el("div",{style:S.pad},el(Stagger,{delay:60},el(Logo,null),el("div",{style:{marginTop:24,marginBottom:20,display:"flex",alignItems:"center",gap:20,background:CARD,border:`1px solid ${BD}`,borderRadius:20,padding:"24px 20px"}},el(ProgressRing,{pct:tp2,size:96,stroke:8,label:"오늘"}),el("div",{style:{flex:1}},el("h2",{style:{fontSize:18,fontWeight:800,color:T1,marginBottom:4}},"오늘의 학습"),el("p",{style:{fontSize:12,color:T3,marginBottom:10}},today),el("div",{style:{display:"flex",gap:16}},el("div",null,el("span",{style:{fontSize:20,fontWeight:800,color:T1}},td),el("span",{style:{fontSize:12,color:T3}},`/${tt}`),el("p",{style:{fontSize:10,color:T4}},"완료")),el("div",null,el("span",{style:{fontSize:20,fontWeight:800,color:T1}},pct),el("span",{style:{fontSize:12,color:T3}},"%"),el("p",{style:{fontSize:10,color:T4}},"전체"))))),el("div",{style:{display:"flex",gap:10,marginBottom:16}},[{ic:()=>IC.target(A,16),v:pct,sf:"%",l:"전체"},{ic:()=>IC.flame("#F97316",16),v:streak.streak,sf:"일",l:"스트릭"},{ic:()=>IC.zap(A,16),v:done,sf:"개",l:"완료"}].map((s,i)=>el("div",{key:i,className:"stat-card",style:{flex:1,background:CARD,border:`1px solid ${BD}`,borderRadius:14,padding:"12px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:5}},el("div",{style:{width:30,height:30,borderRadius:9,background:AS,display:"flex",alignItems:"center",justifyContent:"center"}},s.ic()),el(AnimNum,{value:s.v,suffix:s.sf,style:{fontSize:14,fontWeight:800,color:T1}}),el("span",{style:{fontSize:9,color:T3,fontWeight:600}},s.l)))),el("button",{onClick:onShare,style:{width:"100%",background:CARD,border:`1px solid ${BD}`,borderRadius:14,padding:"12px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",marginBottom:16}},IC.share(A,16),el("span",{style:{fontSize:13,fontWeight:600,color:T2}},"오늘의 공부 요약 공유")),tp?el("div",null,el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}},el("h3",{style:{fontSize:15,fontWeight:700,color:T1}},"오늘 할 일"),el("span",{style:{fontSize:12,fontWeight:700,color:A}},`${td}/${tt}`)),el(Stagger,{delay:40},tp.tasks.map(t=>el(TaskItem,{key:t.id,task:t,onToggle:()=>onToggle(di,t.id),onEdit,locked:false})))):el("div",{style:{textAlign:"center",padding:"24px 0",color:T4,fontSize:13}},"오늘은 예정된 학습이 없어요")));}

// ═══ PLAN ═══
function PlanScreen({plan,onGenerate,onToggle,onReset,onEdit,isPro,onPaywall}){const[subjects,setSubjects]=useState([{id:1,name:"",examDate:"",scope:""}]);const add=()=>setSubjects([...subjects,{id:Date.now(),name:"",examDate:"",scope:""}]);const rm=id=>subjects.length>1&&setSubjects(subjects.filter(s=>s.id!==id));const up=(id,f,v)=>setSubjects(subjects.map(s=>s.id===id?{...s,[f]:v}:s));const ok=subjects.every(s=>s.name&&s.examDate&&s.scope);if(plan){const total=plan.reduce((s,d)=>s+d.tasks.length,0);const done=plan.reduce((s,d)=>s+d.tasks.filter(t=>t.done).length,0);const pct=total>0?Math.round((done/total)*100):0;const today=new Date().toISOString().split("T")[0];return el("div",{style:S.pad},el(Stagger,{delay:50},el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}},el("h2",{style:{fontSize:20,fontWeight:800,color:T1}},"학습 플랜"),el("button",{onClick:onReset,className:"btn-ghost",style:S.resetBtn},"새 플랜")),el("div",{style:{background:CARD,border:`1px solid ${BD}`,borderRadius:16,padding:18,marginBottom:20}},el("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:12}},el("span",{style:{fontSize:12,fontWeight:600,color:T2}},"전체 진도"),el(AnimNum,{value:pct,suffix:"%",style:{fontSize:20,fontWeight:800,color:T1}})),el("div",{style:{height:6,background:BD,borderRadius:3,overflow:"hidden"}},el("div",{className:"progress-shimmer",style:{height:"100%",borderRadius:3,background:`linear-gradient(90deg,${A2},${A},${A3})`,width:`${pct}%`,transition:"width 1s"}})),el("span",{style:{fontSize:11,color:T4,marginTop:8,display:"block"}},`${done}/${total}`)),...plan.map((day,di)=>{const isT=day.date===today;const allD=day.tasks.every(t=>t.done);const hp=day.tasks.some(t=>t.premium);const lk=hp&&!isPro;return el("div",{key:day.date,style:{background:isT?CARD2:CARD,border:`1px solid ${isT?A:BD}`,borderRadius:16,padding:16,opacity:allD?.4:1,marginBottom:2,boxShadow:isT?`0 0 24px ${AS}`:"none",position:"relative"}},lk&&el("div",{onClick:onPaywall,style:{position:"absolute",top:10,right:10,background:`linear-gradient(135deg,${WARN},#F97316)`,borderRadius:8,padding:"4px 10px",display:"flex",alignItems:"center",gap:4,cursor:"pointer",zIndex:2}},IC.crown("#fff",12),el("span",{style:{fontSize:10,fontWeight:700,color:"#fff"}},"PRO")),el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,paddingBottom:10,borderBottom:`1px solid ${BD}`}},el("div",{style:{display:"flex",alignItems:"center",gap:8}},el("span",{style:{fontSize:13,fontWeight:700,color:T1}},day.date),isT&&el("span",{style:{fontSize:9,fontWeight:800,color:"#fff",background:`linear-gradient(135deg,${A},${A2})`,padding:"3px 10px",borderRadius:6}},"오늘")),el("span",{style:{fontSize:12,fontWeight:600,color:T4}},day.dayLabel)),el(Stagger,{delay:30},day.tasks.map(t=>el(TaskItem,{key:t.id,task:t,onToggle:()=>onToggle(di,t.id),onEdit,locked:t.premium&&!isPro}))));})));}return el("div",{style:S.pad},el(Stagger,{delay:70},el("h2",{style:{fontSize:20,fontWeight:800,color:T1,marginBottom:6}},"새 플랜 만들기"),el("p",{style:{fontSize:13,color:T2,marginBottom:28,lineHeight:1.6}},"과목과 시험 정보를 입력하면 AI가 최적의 학습 플랜을 생성합니다"),...subjects.map((subj,i)=>el("div",{key:subj.id,style:{background:CARD,border:`1px solid ${BD}`,borderRadius:16,padding:20,marginBottom:12}},el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}},el("span",{style:{fontSize:13,fontWeight:700,color:A}},`과목 ${i+1}`),subjects.length>1&&el("button",{onClick:()=>rm(subj.id),style:{background:"none",border:"none",cursor:"pointer",padding:4}},IC.x(T4,18))),el("div",{style:{marginBottom:14}},el("label",{style:S.label},"과목명"),el("input",{placeholder:"수학",value:subj.name,onChange:e=>up(subj.id,"name",e.target.value),style:S.input,className:"input-glow"})),el("div",{style:{marginBottom:14}},el("label",{style:S.label},"시험일"),el("input",{type:"date",value:subj.examDate,onChange:e=>up(subj.id,"examDate",e.target.value),style:S.input,className:"input-glow"})),el("div",null,el("label",{style:S.label},"시험 범위"),el("textarea",{placeholder:"1단원~3단원, 미적분, 확률과 통계",rows:3,value:subj.scope,onChange:e=>up(subj.id,"scope",e.target.value),style:S.inputArea,className:"input-glow"})))),el("button",{onClick:add,className:"btn-ghost",style:S.addBtn},IC.plus(T2,16),el("span",null,"과목 추가")),el("button",{onClick:()=>{if(ok){logEvent("plan_generate_start",{n:subjects.length});onGenerate(subjects);}},className:"btn-glow",style:{...S.genBtn,opacity:ok?1:.3,cursor:ok?"pointer":"not-allowed"}},"플랜 생성")));}

// ═══ CALENDAR ═══
function CalendarScreen({plan,onToggle,onEdit,isPro}){const[vm,setVM]=useState(()=>new Date());const[sel,setSel]=useState(null);const y=vm.getFullYear(),m=vm.getMonth();const fd=new Date(y,m,1).getDay();const dim=new Date(y,m+1,0).getDate();const today=new Date().toISOString().split("T")[0];const mn=["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];const dn=["일","월","화","수","목","금","토"];const pm2={};if(plan)plan.forEach(d=>{pm2[d.date]=d;});const cells=[];for(let i=0;i<fd;i++)cells.push(null);for(let d=1;d<=dim;d++)cells.push(d);const sd=sel&&pm2[sel];const di=plan?plan.findIndex(d=>d.date===sel):-1;return el("div",{style:S.pad},el(Stagger,{delay:50},el("h2",{style:{fontSize:20,fontWeight:800,color:T1,marginBottom:20}},"캘린더"),el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}},el("button",{onClick:()=>setVM(new Date(y,m-1,1)),style:{background:CARD,border:`1px solid ${BD}`,borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}},IC.chevL(T2,18)),el("span",{style:{fontSize:16,fontWeight:700,color:T1}},`${y}년 ${mn[m]}`),el("button",{onClick:()=>setVM(new Date(y,m+1,1)),style:{background:CARD,border:`1px solid ${BD}`,borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}},IC.chevR(T2,18))),el("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:8}},dn.map(d=>el("div",{key:d,style:{textAlign:"center",fontSize:11,fontWeight:600,color:T4,padding:"6px 0"}},d))),el("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:20}},cells.map((day,i)=>{if(!day)return el("div",{key:`e${i}`});const ds=`${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;const ht=!!pm2[ds];const it=ds===today;const is=ds===sel;const dd=pm2[ds];const ad=dd?dd.tasks.every(t=>t.done):false;return el("button",{key:i,onClick:()=>setSel(is?null:ds),style:{aspectRatio:"1",borderRadius:12,border:is?`2px solid ${A}`:`1.5px solid ${ht?BD2:"transparent"}`,background:is?AS:it?CARD2:ht?CARD:"transparent",color:it?A:ht?T1:T3,fontSize:13,fontWeight:it||is?700:500,cursor:ht?"pointer":"default",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,transition:"all 0.2s",boxShadow:is?`0 0 16px ${AG}`:"none"}},el("span",null,day),ht&&el("div",{style:{width:4,height:4,borderRadius:2,background:ad?A3:A}}));})),sd&&el("div",{style:{animation:"fadeSlideUp 0.3s ease"}},el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}},el("h3",{style:{fontSize:15,fontWeight:700,color:T1}},sel),el("span",{style:{fontSize:12,fontWeight:600,color:A}},sd.dayLabel)),el("div",{style:{display:"flex",flexDirection:"column",gap:6}},sd.tasks.map(t=>el(TaskItem,{key:t.id,task:t,onToggle:()=>onToggle(di,t.id),onEdit,locked:t.premium&&!isPro})))),!plan&&el("div",{style:{textAlign:"center",padding:"40px 0"}},el("p",{style:{fontSize:13,color:T4}},"플랜을 생성하면 캘린더에 표시됩니다"))));}

// ═══ SETTINGS ═══
function SettingsScreen({isPro,onPaywall,profile,onSignOut}){return el("div",{style:S.pad},el(Stagger,{delay:70},el("h2",{style:{fontSize:20,fontWeight:800,color:T1,marginBottom:24}},"설정"),!isPro&&el("button",{onClick:onPaywall,style:{width:"100%",background:"linear-gradient(135deg,rgba(245,158,11,0.1),rgba(249,115,22,0.1))",border:"1.5px solid rgba(245,158,11,0.2)",borderRadius:16,padding:"18px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",marginBottom:16}},el("div",{style:{width:44,height:44,borderRadius:14,background:`linear-gradient(135deg,${WARN},#F97316)`,display:"flex",alignItems:"center",justifyContent:"center"}},IC.crown("#fff",20)),el("div",{style:{flex:1,textAlign:"left"}},el("span",{style:{fontSize:15,fontWeight:700,color:T1,display:"block",marginBottom:4}},"StudyFlow Pro"),el("span",{style:{fontSize:12,color:T2}},"모든 기능을 잠금 해제하세요"))),profile&&el("div",{style:{background:CARD,border:`1px solid ${BD}`,borderRadius:14,padding:16,marginBottom:8}},el("span",{style:{fontSize:12,fontWeight:600,color:T2,display:"block",marginBottom:8}},"내 프로필"),el("div",{style:{display:"flex",justifyContent:"space-between"}},el("span",{style:{fontSize:13,color:T1}},"하루 집중 시간"),el("span",{style:{fontSize:13,fontWeight:700,color:A}},`${profile.dailyHours}시간`)),profile.weakSubjects&&el("div",{style:{display:"flex",justifyContent:"space-between",marginTop:8}},el("span",{style:{fontSize:13,color:T1}},"취약 과목"),el("span",{style:{fontSize:13,fontWeight:700,color:WARN}},profile.weakSubjects))),...["알림 설정","다크/라이트 모드","데이터 초기화","버전 v1.0"].map(item=>el("div",{key:item,style:{background:CARD,border:`1px solid ${BD}`,borderRadius:14,padding:"16px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",marginBottom:8}},el("span",{style:{fontSize:14,fontWeight:600,color:T2}},item),el("div",{style:{display:"flex",alignItems:"center",gap:6}},el("span",{style:{fontSize:11,color:T4}},"Coming soon"),IC.chevR(T4,16)))),el("button",{onClick:onSignOut,style:{width:"100%",background:"rgba(239,68,68,0.06)",border:`1.5px solid rgba(239,68,68,0.15)`,borderRadius:14,padding:"15px",fontSize:14,fontWeight:700,color:DANGER,cursor:"pointer",marginTop:8}},"로그아웃")));}

// ═══ LOGIN ═══
function LoginScreen(){
  const[busy,setBusy]=useState(false);
  const login=async()=>{
    setBusy(true);
    await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin}});
    setBusy(false);
  };
  const GIcon=()=>el("svg",{width:20,height:20,viewBox:"0 0 48 48"},
    el("path",{key:"r",fill:"#EA4335",d:"M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.4 30.2 0 24 0 14.8 0 7 5.4 3.1 13.3l7.8 6C12.9 13 18 9.5 24 9.5z"}),
    el("path",{key:"b",fill:"#4285F4",d:"M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9C43.7 38.2 46.5 31.8 46.5 24.5z"}),
    el("path",{key:"y",fill:"#FBBC05",d:"M10.9 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8.4-6.1z"}),
    el("path",{key:"g",fill:"#34A853",d:"M24 48c6.2 0 11.4-2 15.2-5.5l-7.6-5.9c-2 1.4-4.7 2.2-7.6 2.2-6 0-11.1-4-12.9-9.5l-8.4 6.1C7 43 15 48 24 48z"})
  );
  return el("div",{style:{...S.pad,minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",textAlign:"center"}},
    el("div",{style:{animation:"fadeSlideUp 0.6s ease",width:"100%",maxWidth:340}},
      el(Logo,null),
      el("h1",{style:{fontSize:24,fontWeight:800,color:T1,marginTop:32,marginBottom:12}},"환영합니다"),
      el("p",{style:{fontSize:14,color:T2,lineHeight:1.6,marginBottom:40}},"AI가 당신에게 딱 맞는 학습 플랜을 만들어드립니다"),
      el("button",{onClick:login,disabled:busy,style:{width:"100%",background:"#fff",border:"none",borderRadius:14,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:12,cursor:busy?"wait":"pointer",fontSize:15,fontWeight:700,color:"#111",boxShadow:"0 2px 16px rgba(0,0,0,.15)"}},
        el(GIcon,null),
        busy?"로그인 중...":"Google로 시작하기"
      )
    )
  );
}

// ═══ ONBOARDING ═══
function OnboardingScreen({onComplete}){const[step,setStep]=useState(0);const[profile,setProfile]=useState({dailyHours:"3",weakSubjects:""});logEvent("onboarding_start");if(step===0)return el("div",{style:{...S.pad,minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",textAlign:"center"}},el("div",{style:{animation:"fadeSlideUp 0.6s ease"}},el(Logo,null),el("h1",{style:{fontSize:24,fontWeight:800,color:T1,marginTop:32,marginBottom:12}},"환영합니다"),el("p",{style:{fontSize:14,color:T2,lineHeight:1.6,marginBottom:40,maxWidth:300}},"AI가 당신에게 딱 맞는 학습 플랜을 만들어드립니다"),el("button",{onClick:()=>{logEvent("onboarding_next");setStep(1);},className:"btn-glow",style:{...S.genBtn,width:"auto",padding:"14px 48px"}},"시작하기")));return el("div",{style:{...S.pad,minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center"}},el(Stagger,{delay:80},el("h2",{style:{fontSize:20,fontWeight:800,color:T1,marginBottom:8}},"학습 프로필 설정"),el("p",{style:{fontSize:13,color:T2,marginBottom:32}},"맞춤형 플랜을 위해 간단한 정보를 입력해주세요"),el("div",{style:{background:CARD,border:`1px solid ${BD}`,borderRadius:16,padding:20,marginBottom:16}},el("label",{style:S.label},"하루 집중 가능 시간"),el("div",{style:{display:"flex",gap:8}},["2","3","4","5"].map(h=>el("button",{key:h,onClick:()=>setProfile({...profile,dailyHours:h}),style:{flex:1,padding:"12px 0",borderRadius:12,border:`1.5px solid ${profile.dailyHours===h?A:BD}`,background:profile.dailyHours===h?AS:"transparent",color:profile.dailyHours===h?A:T2,fontSize:14,fontWeight:700,cursor:"pointer"}},h+"시간")))),el("div",{style:{background:CARD,border:`1px solid ${BD}`,borderRadius:16,padding:20,marginBottom:16}},el("label",{style:S.label},"취약 과목 (선택)"),el("input",{placeholder:"예: 국어, 과학",value:profile.weakSubjects,onChange:e=>setProfile({...profile,weakSubjects:e.target.value}),style:S.input,className:"input-glow"})),el("button",{onClick:()=>{logEvent("onboarding_complete",profile);onComplete(profile);},className:"btn-glow",style:S.genBtn},"완료")));}

// ═══ LOCAL PLAN GENERATOR ═══
function generateLocalPlan(subjects,profile){const today=new Date();let tc=1;const allDays=new Map();subjects.forEach(subj=>{const exam=new Date(subj.examDate);const diff=Math.max(1,Math.ceil((exam-today)/864e5));const parts=subj.scope.split(/[,、~\-~－]/).map(s=>s.trim()).filter(Boolean);const chunks=[];if(parts.length===0)chunks.push(`${subj.name} 전체 범위 학습`);else if(parts.length<=2)parts.forEach(p=>{chunks.push(`${p} 핵심 개념 정리`);chunks.push(`${p} 예제 풀이`);chunks.push(`${p} 복습`);});else parts.forEach(p=>{chunks.push(`${p} 정리 + 예제`);});const reviews=[`${subj.name} 전체 핵심 복습`,`${subj.name} 모의 문제 + 오답`,`${subj.name} 최종 점검`];const sd=Math.max(1,diff-3);const tpd=Math.max(1,Math.ceil(chunks.length/sd));for(let d=0;d<diff;d++){const dt=new Date(today);dt.setDate(dt.getDate()+d);const ds=dt.toISOString().split("T")[0];if(!allDays.has(ds))allDays.set(ds,{date:ds,dayLabel:`D-${diff-d}`,tasks:[]});const day=allDays.get(ds);if(d>=diff-3){const ri=d-(diff-3);if(ri<reviews.length)day.tasks.push({id:`t${tc++}`,subject:subj.name,task:reviews[ri],duration:"1.5시간",done:false,premium:true});}else{const si=d*tpd,ei=Math.min(si+tpd,chunks.length);for(let ci=si;ci<ei;ci++){const hrs=profile?Math.min(parseFloat(profile.dailyHours)||2,3):1.5;day.tasks.push({id:`t${tc++}`,subject:subj.name,task:chunks[ci],duration:`${(hrs*.5+Math.random()*.5).toFixed(1)}시간`,done:false,premium:false});}}}});return{plan:Array.from(allDays.values()).sort((a,b)=>a.date.localeCompare(b.date)).filter(d=>d.tasks.length>0)};}

// ═══ PLAN GENERATOR (via /api/generate) ═══
async function generatePlan(subjects,profile){
  try{
    const today=new Date();
    const list=subjects.map(s=>`- ${s.name}, 시험: ${s.examDate}, 범위: ${s.scope}`).join("\n");
    const pi=profile?` 하루${profile.dailyHours}시간`:"";
    const res=await fetch("/api/generate",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({today:today.toISOString().split("T")[0],dailyHours:pi,subjects:list})
    });
    if(!res.ok)return generateLocalPlan(subjects,profile);
    const data=await res.json();
    if(data.plan&&data.plan.length>0)return data;
    return generateLocalPlan(subjects,profile);
  }catch(e){
    return generateLocalPlan(subjects,profile);
  }
}

// ═══ MAIN ═══
export default function App(){
  const[user,setUser]=useState(null);
  const[screen,setScreen]=useState("authLoading");
  const[tab,setTab]=useState("home");
  const[plan,setPlan]=useState(null);
  const[loading,setLoading]=useState(false);
  const[isPro,setIsPro]=useState(false);
  const[profile,setProfile]=useState(null);
  const[editTask,setEditTask]=useState(null);
  const[editDI,setEditDI]=useState(-1);
  const[showPaywall,setShowPaywall]=useState(false);
  const[showShare,setShowShare]=useState(false);
  const[streakAlert,setStreakAlert]=useState("");

  useEffect(()=>{if(!document.getElementById("sf-font")){const l=document.createElement("link");l.id="sf-font";l.rel="stylesheet";l.href=FONT;document.head.appendChild(l);}},[]);

  const loadUserData=async(uid)=>{
    const{data:pd}=await supabase.from("profiles").select("*").eq("user_id",uid).maybeSingle();
    if(pd){
      setProfile({dailyHours:pd.daily_hours,weakSubjects:pd.weak_subjects||""});
      const{data:pld}=await supabase.from("plans").select("*").eq("user_id",uid).order("updated_at",{ascending:false}).limit(1).maybeSingle();
      if(pld?.plan_data)setPlan(pld.plan_data);
      setScreen("app");
    }else{
      setScreen("onboarding");
    }
  };

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session){setUser(session.user);loadUserData(session.user.id);}
      else setScreen("login");
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      if(session&&event==="SIGNED_IN"){setUser(session.user);loadUserData(session.user.id);}
      else if(!session){setUser(null);setPlan(null);setProfile(null);setScreen("login");}
    });
    return()=>subscription.unsubscribe();
  },[]);

  const streak=calcStreak(plan);
  useEffect(()=>{if(streak.atRisk&&streak.msg){setStreakAlert(streak.msg);const t=setTimeout(()=>setStreakAlert(""),6000);return()=>clearTimeout(t);}},[plan]);

  const syncPlan=async(newPlan,uid=user?.id)=>{
    if(!uid)return;
    if(newPlan===null){await supabase.from("plans").delete().eq("user_id",uid);return;}
    await supabase.from("plans").upsert({user_id:uid,plan_data:newPlan,updated_at:new Date().toISOString()},{onConflict:"user_id"});
  };

  const generate=async(subjects)=>{
    setLoading(true);
    const res=await generatePlan(subjects,profile);
    if(res&&res.plan){
      setPlan(res.plan);
      await syncPlan(res.plan);
      setTab("home");
      logEvent("plan_generated",{days:res.plan.length});
    }else{alert("생성 실패.");logEvent("plan_generate_fail");}
    setLoading(false);
  };

  const toggle=(di,tid)=>{
    setPlan(p=>{
      const next=p.map((d,i)=>i===di?{...d,tasks:d.tasks.map(t=>t.id===tid?{...t,done:!t.done}:t)}:d);
      syncPlan(next);
      return next;
    });
  };

  const openEdit=task=>{if(!plan)return;for(let i=0;i<plan.length;i++){if(plan[i].tasks.find(t=>t.id===task.id)){setEditDI(i);break;}}setEditTask({...task});};

  const saveTask=u=>{
    setPlan(p=>{
      const next=p.map((d,i)=>i===editDI?{...d,tasks:d.tasks.map(t=>t.id===u.id?u:t)}:d);
      syncPlan(next);
      return next;
    });
    setEditTask(null);
  };

  const deleteTask=tid=>{
    setPlan(p=>{
      const next=p.map((d,i)=>i===editDI?{...d,tasks:d.tasks.filter(t=>t.id!==tid)}:d).filter(d=>d.tasks.length>0);
      syncPlan(next);
      return next;
    });
    setEditTask(null);
  };

  const handleOnboardingComplete=async(p)=>{
    setProfile(p);
    if(user){
      await supabase.from("profiles").upsert({user_id:user.id,daily_hours:p.dailyHours,weak_subjects:p.weakSubjects,created_at:new Date().toISOString()},{onConflict:"user_id"});
    }
    setScreen("app");
  };

  const handleSignOut=async()=>{await supabase.auth.signOut();};

  const wrapStyle={fontFamily:"'Plus Jakarta Sans',sans-serif",background:BG,color:T1,minHeight:"100vh",width:"100%"};

  if(screen==="authLoading")return el("div",{className:"sf-app",style:wrapStyle},el("style",null,CSS),el(LoadingScreen,null));
  if(screen==="login")return el("div",{className:"sf-app",style:wrapStyle},el("style",null,CSS),el(LoginScreen,null));
  if(screen==="onboarding")return el("div",{className:"sf-app",style:wrapStyle},el("style",null,CSS),el(OnboardingScreen,{onComplete:handleOnboardingComplete}));

  return el("div",{className:"sf-app",style:{...wrapStyle,position:"relative",overflowX:"hidden"}},
    el("style",null,CSS),
    el(StreakAlert,{msg:streakAlert,onClose:()=>setStreakAlert("")}),
    el("div",{style:{paddingBottom:85}},loading?el(LoadingScreen,null):el(React.Fragment,null,
      tab==="home"&&el(HomeScreen,{plan,onToggle:toggle,onNav:setTab,onEdit:openEdit,onShare:()=>setShowShare(true),streak}),
      tab==="plan"&&el(PlanScreen,{plan,onGenerate:generate,onToggle:toggle,onReset:()=>{setPlan(null);syncPlan(null);},onEdit:openEdit,isPro,onPaywall:()=>setShowPaywall(true)}),
      tab==="timer"&&el(TimerScreen,null),
      tab==="calendar"&&el(CalendarScreen,{plan,onToggle:toggle,onEdit:openEdit,isPro}),
      tab==="settings"&&el(SettingsScreen,{isPro,onPaywall:()=>setShowPaywall(true),profile,onSignOut:handleSignOut})
    )),
    !loading&&el(BottomNav,{active:tab,onNav:setTab}),
    editTask&&el(EditModal,{task:editTask,onSave:saveTask,onDelete:deleteTask,onClose:()=>setEditTask(null)}),
    showPaywall&&el(PaywallModal,{onClose:()=>setShowPaywall(false),onUpgrade:()=>{setIsPro(true);setShowPaywall(false);}}),
    showShare&&plan&&el(ShareCard,{plan,profile,streak,onClose:()=>setShowShare(false)})
  );
}

const CSS=`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes popIn{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}@keyframes glowPulse{0%,100%{box-shadow:0 0 20px ${AG}}50%{box-shadow:0 0 40px ${AG},0 0 60px ${AS}}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}*{box-sizing:border-box;margin:0;padding:0}input,textarea{font-family:'Plus Jakarta Sans',sans-serif}input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(1);opacity:.3}input::placeholder,textarea::placeholder{color:${T4}}button{font-family:'Plus Jakarta Sans',sans-serif}::-webkit-scrollbar{width:0}.input-glow:focus{border-color:${A}!important;outline:none;box-shadow:0 0 0 3px ${AG},0 0 20px ${AS}!important}.card-hover:hover{border-color:${BD2}!important;transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,0,0,.2)}.btn-glow:hover{box-shadow:0 4px 24px ${AG},0 0 48px ${AS}!important;transform:translateY(-1px)}.btn-ghost:hover{background:${AS}!important;border-color:${A}!important;color:${A}!important}.stat-card:hover{border-color:${BD2}!important;transform:translateY(-2px)}.empty-float{animation:float 3s ease-in-out infinite}.logo-pulse{animation:glowPulse 3s ease-in-out infinite}.ring1{animation:spin 3s linear infinite}.ring2{animation:spin 4s linear infinite reverse}.ring3{animation:spin 5s linear infinite}.loading-glow{animation:glowPulse 2s ease-in-out infinite}.progress-shimmer{position:relative}.progress-shimmer::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);background-size:200% 100%;animation:shimmer 2s linear infinite;border-radius:inherit}.timer-ring{animation:spin 60s linear infinite}@media (min-width:481px){.sf-app{max-width:480px;margin:0 auto}.sf-nav{max-width:480px;left:50%;transform:translateX(-50%)}}@media (max-width:480px){.sf-app{max-width:100%;width:100%}.sf-nav{max-width:100%;width:100%;left:0;transform:none}}`;

const S={pad:{padding:"20px 20px 32px"},nav:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",zIndex:100},navInner:{display:"flex",justifyContent:"space-around",alignItems:"center",background:`${CARD}ee`,borderTop:`1px solid ${BD}`,padding:"8px 0 14px",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)"},navItem:{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,position:"relative"},label:{display:"block",fontSize:12,fontWeight:600,color:T2,marginBottom:8},input:{width:"100%",background:BG2,border:`1.5px solid ${BD}`,borderRadius:14,color:T1,padding:"13px 16px",fontSize:14,transition:"all 0.25s ease"},inputArea:{width:"100%",background:BG2,border:`1.5px solid ${BD}`,borderRadius:14,color:T1,padding:"13px 16px",fontSize:14,resize:"vertical",transition:"all 0.25s ease"},addBtn:{width:"100%",background:"none",border:`1.5px dashed ${BD}`,borderRadius:14,color:T2,padding:"14px",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:12},genBtn:{width:"100%",background:`linear-gradient(135deg,${A},${A2})`,border:"none",borderRadius:14,color:"#fff",padding:"15px",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:`0 4px 20px ${AG}`},resetBtn:{background:AS,border:"1.5px solid transparent",borderRadius:12,color:A,padding:"8px 18px",fontSize:12,fontWeight:700,cursor:"pointer"}};
