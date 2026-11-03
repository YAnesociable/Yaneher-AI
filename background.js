/* Locally rendered ambient backgrounds. No videos, tracking, downloads or external assets. */
(() => {
  'use strict';
  const canvas=document.createElement('canvas');canvas.id='living-background';canvas.setAttribute('aria-hidden','true');
  const app=document.getElementById('app');app.prepend(canvas);
  const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
  let settings={},dark=false,economy=false,reduced=false,raf=0,last=0,time=0,w=1,h=1,mouse={x:.5,y:.5},target={x:.5,y:.5};
  const colours={purple:['#7354e8','#3c8de4','#dc7abf'],ocean:['#1d91c7','#32baad','#4866cd'],emerald:['#21ad8d','#348dc7','#8bb849'],sunset:['#de785a','#ce5f94','#e4a04d'],rose:['#c964af','#8668d1','#e58fa4'],mono:['#6f849e','#a1adbc','#798697']};
  const stars=Array.from({length:58},(_,i)=>({x:((i*127.13)%997)/997,y:((i*71.29)%991)/991,r:.6+(i%4)*.35,p:i*.71}));
  function resize(){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio||1,economy?1:1.5);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(d,0,0,d,0,0);draw();}
  function blob(ctx,x,y,r,c,a){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c);g.addColorStop(1,c+'00');ctx.globalAlpha=a;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  function drawScene(ctx,w,h,settings,dark,economy,reduced,time,mouse){
    ctx.clearRect(0,0,w,h);const mode=settings.background;
    if(!['aurora','liquid','nebula','mesh'].includes(mode))return;
    const custom=Array.isArray(settings.customColors)&&settings.customColors.length===2&&settings.customColors.every(c=>/^#[0-9a-f]{6}$/i.test(c));
    const palette=settings.accent==='custom'&&custom?[...settings.customColors,settings.customColors[0]]:colours[settings.accent]||colours.purple, strength=(settings.auroraStrength||75)/100;
    const motion=reduced?0:time;const mx=(mouse.x-.5)*w*.09,my=(mouse.y-.5)*h*.07;
    ctx.globalCompositeOperation=dark?'screen':'source-over';
    for(let i=0;i<(economy?3:5);i++){
      const x=w*(.15+i*.18)+Math.sin(motion*.11+i*1.9)*w*.16+mx;
      const y=h*(.27+(i%3)*.26)+Math.cos(motion*.09+i)*h*.17+my;
      blob(ctx,x,y,Math.max(w,h)*(.36+(i%2)*.09),palette[i%3],strength*(dark?.38:.23));
    }
    if(mode==='aurora'||mode==='liquid'){
      ctx.save();ctx.globalCompositeOperation=dark?'screen':'source-over';
      for(let i=0;i<3;i++){
        ctx.beginPath();const yy=h*(.24+i*.23),bend=Math.sin(motion*.13+i)*h*.21;
        ctx.moveTo(-w*.2,yy+bend);ctx.bezierCurveTo(w*.3,yy-h*.45,w*.54,yy+h*.47,w*1.2,yy-bend);
        ctx.strokeStyle=palette[i];ctx.lineWidth=mode==='liquid'?100:46;ctx.globalAlpha=strength*(dark?.16:.10);ctx.filter='blur(32px)';ctx.stroke();
        ctx.lineWidth=1.5;ctx.filter='blur(1px)';ctx.globalAlpha=strength*(dark?.28:.12);ctx.stroke();
      }ctx.restore();
    }
    if(mode==='nebula')for(const s of stars){
      const twinkle=.48+.45*Math.sin(motion*.7+s.p);ctx.globalAlpha=strength*twinkle*(dark?.8:.48);ctx.fillStyle=dark?'#f0e8ff':palette[1];
      const x=((s.x*w+motion*(s.r*.5)+mx*.22)%w+w)%w,y=s.y*h+Math.sin(motion*.1+s.p)*5;
      ctx.beginPath();ctx.arc(x,y,s.r,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
  }
  function draw(){drawScene(ctx,w,h,settings,dark,economy,reduced,time,mouse);}
  function tick(now){raf=0;if(document.hidden||reduced||!['aurora','liquid','nebula','mesh'].includes(settings.background))return;
    if(now-last>=1000/(economy?12:30)){time+=Math.min(.12,(now-last)/1000)*({slow:.55,normal:1,fast:1.6}[settings.auroraSpeed]||1);last=now;mouse.x+=(target.x-mouse.x)*.035;mouse.y+=(target.y-mouse.y)*.035;draw();}raf=requestAnimationFrame(tick);
  }
  function schedule(){cancelAnimationFrame(raf);raf=0;last=performance.now();draw();if(!document.hidden&&!reduced&&['aurora','liquid','nebula','mesh'].includes(settings.background))raf=requestAnimationFrame(tick);}
  window.YANE_BACKGROUND={preview(canvas,c,isDark){
    const width=Math.max(1,canvas.clientWidth||240),height=Math.max(1,canvas.clientHeight||120),d=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);const paint=canvas.getContext('2d');if(!paint)return;
    paint.setTransform(d*width/innerWidth,0,0,d*height/innerHeight,0,0);canvas.style.background=isDark?'#111522':'#f5f7fd';
    drawScene(paint,innerWidth,innerHeight,c,isDark,false,true,0,{x:.5,y:.5});
  },update(c,d,e,r){settings={...c};dark=d;economy=e;reduced=r;app.dataset.liveBackground=['aurora','liquid','nebula','mesh'].includes(c.background)?'on':'off';resize();schedule();},debug(){return{mode:settings.background,reduced,economy,running:!!raf,time}}};
  addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',schedule);
  document.addEventListener('pointermove',e=>{if(settings.reactive&&e.pointerType!=='touch'){target.x=e.clientX/w;target.y=e.clientY/h;}},{passive:true});
})();
