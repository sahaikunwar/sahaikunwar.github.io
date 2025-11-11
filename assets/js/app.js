
let allVideos=[];
function getThumbnailUrl(v){
  const u=(v.url||'').trim();
  if(v.thumbnail) return v.thumbnail;
  const l=u.toLowerCase();
  if(l.includes('youtube.com')||l.includes('youtu.be')){
    const m=u.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if(m) return `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
  }
  return null;
}
function createEmbedElement(v){
  const u=(v.url||'').trim();
  if(!u) return null;
  const l=u.toLowerCase();
  if(l.includes('youtube.com')||l.includes('youtu.be')){
    const m=u.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if(m){
      const i=document.createElement('iframe');
      i.width='100%';i.height='250';i.src=`https://www.youtube.com/embed/${m[1]}`;
      i.setAttribute('frameborder','0');i.setAttribute('allowfullscreen','true');
      return i;
    }
  }
  if(l.includes('instagram.com')||l.includes('instagr.am')){
    let e=u;if(!e.endsWith('/'))e+='/';if(!e.includes('/embed'))e+='embed';
    const i=document.createElement('iframe');
    i.width='100%';i.height='320';i.src=e;i.setAttribute('frameborder','0');
    return i;
  }
  return null;
}
async function loadVideos(){
  const res=await fetch('data/videos.json');
  allVideos=await res.json();
  const vids=allVideos.filter(v=>v.category===CATEGORY_FILTER);
  renderVideos(vids);
}
function renderVideos(videos){
  const c=document.getElementById('videoList'); c.innerHTML='';
  videos.forEach(v=>{
    const card=document.createElement('div'); card.className='video-card';
    const t=document.createElement('h3'); t.textContent=v.title; card.appendChild(t);
    const meta=document.createElement('p'); meta.textContent=`${v.topic} • ${v.platform}`; card.appendChild(meta);
    const emb=createEmbedElement(v);
    if(emb){card.appendChild(emb);} else {
      const thumb=getThumbnailUrl(v);
      const link=document.createElement('a'); link.href=v.url; link.target='_blank';
      if(thumb){const img=document.createElement('img'); img.src=thumb; img.style.width='100%'; link.appendChild(img);}
      else {const ph=document.createElement('div'); ph.className='video-thumb-placeholder'; ph.textContent=`${v.platform} video`; link.appendChild(ph);}
      card.appendChild(link);
    }
    const btn=document.createElement('div'); btn.className='video-actions'; btn.innerHTML=`<a href="${v.url}" target="_blank">Open video in new tab</a>`; card.appendChild(btn);
    c.appendChild(card);
  });
}
document.addEventListener('DOMContentLoaded',loadVideos);
