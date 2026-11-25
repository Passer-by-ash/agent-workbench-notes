// 04-重建年索引（带库名的新命名）：
//   公众文章 → 00-索引-公众文章-YYYY.md
//   原始稿   → 00-索引-原始稿-YYYY.md
//   回顾     → 00-索引-回顾-YYYY.md / 00-索引-回顾-YYYY-MM.md / 00-索引-回顾-总.md
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const PUB=path.join(ROOT,'公众文章');
const DRAFT=path.join(ROOT,'原始稿');
const RETRO=path.join(ROOT,'回顾');

function walk(d,a,skip){if(!fs.existsSync(d))return a;for(const f of fs.readdirSync(d)){const p=path.join(d,f);const st=fs.statSync(p);if(st.isDirectory()){if(f==='.obsidian'||f.endsWith('.assets')||(skip&&f.startsWith('_'))||f==='00-工具'||f==='00-交接')continue;walk(p,a,skip);}else if(f.endsWith('.md')&&!f.startsWith('00-'))a.push(p);}return a;}
function fmOf(p){const t=fs.readFileSync(p,'utf8');const fm=t.split(/^---$/m)[1]||'';
  const g=k=>{const m=fm.match(new RegExp('^'+k+':\\s*(.+)$','m'));return m?m[1].trim().replace(/^"|"$/g,''):'';};
  return {fn:path.basename(p,'.md'),title:g('title'),pub:g('发布日'),write:g('写作日'),rd:g('回看日期'),origPub:g('原文发布时间'),
    form:g('内容形态'),publishedAs:g('已发布为'),merged:g('合并进'),unpub:g('发布状态'),rawFm:fm};}
const cleanOld=(base)=>{if(!fs.existsSync(base))return;for(const d of fs.readdirSync(base)){const p=path.join(base,d);
  if(!fs.statSync(p).isDirectory()||!/^\d{4}$/.test(d))continue;
  for(const g of fs.readdirSync(p))if(g.startsWith('00-索引'))fs.unlinkSync(path.join(p,g));}};

// ---- 公众文章 ----
const pubs=walk(PUB,[],true).map(p=>({p,...fmOf(p)}));
cleanOld(PUB);
const pubY={};
for(const r of pubs){const y=(r.pub||'').slice(0,4)||'未定',m=(r.pub||'').slice(5,7)||'00';
  ((pubY[y]=pubY[y]||{})[m]=pubY[y][m]||[]).push(r);}
for(const y of Object.keys(pubY).sort()){
  const months=pubY[y],total=Object.values(months).reduce((a,b)=>a+b.length,0);
  const L=['---',`title: "00-索引-公众文章-${y}"`,'年份: '+y,'篇数: '+total,'---','',
    `# ${y} · 公众文章（${total} 篇）`,'','> 按真实发布时间排列，取自公众号原文 `ct` 字段。',''];
  for(const m of Object.keys(months).sort()){
    const list=months[m].sort((a,b)=>(a.pub||'').localeCompare(b.pub||''));
    L.push('',`## ${y}-${m}（${list.length} 篇）`,'');
    list.forEach(r=>L.push('- '+((r.pub||'').slice(5,16)||'  --  :  ')+' [['+r.fn+']]'+(r.form?' <sub>'+r.form+'</sub>':'')));
  }
  L.push('');
  fs.writeFileSync(path.join(PUB,y,`00-索引-公众文章-${y}.md`),L.join('\n'),'utf8');
}
console.log('公众文章索引',Object.keys(pubY).length,'个');

// ---- 原始稿 ----
const drafts=walk(DRAFT,[],false).map(p=>({p,...fmOf(p)}));
cleanOld(DRAFT);
const dY={};
for(const r of drafts){const y=(r.write||'').slice(0,4)||'未定';(dY[y]=dY[y]||[]).push(r);}
for(const y of Object.keys(dY).sort()){
  const list=dY[y].sort((a,b)=>(a.write||'').localeCompare(b.write||''));
  const L=['---',`title: "00-索引-原始稿-${y}"`,'年份: '+y,'篇数: '+list.length,'---','',
    `# ${y} · 原始稿（${list.length} 篇）`,'',
    '> 只收手写草稿。`已发布为`=改写成某篇；`合并进`=与别的原稿合为一篇；`发布状态`=未发布。',''];
  list.forEach(r=>{
    let tail='';
    if(r.publishedAs)tail=' → '+r.publishedAs;
    else if(r.merged)tail=' ⟶ '+r.merged+'（合并）';
    else if(r.unpub)tail=' — 未发布';
    L.push('- '+((r.write||'').slice(5,16)||'  --  :  ')+' [['+r.fn+']]'+tail);
  });
  L.push('');
  fs.writeFileSync(path.join(DRAFT,y,`00-索引-原始稿-${y}.md`),L.join('\n'),'utf8');
}
console.log('原始稿索引',Object.keys(dY).length,'个');

// ---- 回顾 ----
const retros=walk(RETRO,[],false).map(p=>({p,...fmOf(p)}));
const rY={};
for(const r of retros){const y=(r.rd||'').slice(0,4)||'未定',m=(r.rd||'').slice(5,7)||'00';
  ((rY[y]=rY[y]||{})[m]=rY[y][m]||[]).push(r);}
// 清旧
for(const y of Object.keys(rY)){
  for(const g of fs.readdirSync(path.join(RETRO,y))){
    const p=path.join(RETRO,y,g);
    if(fs.statSync(p).isDirectory()){for(const h of fs.readdirSync(p))if(h.startsWith('00-索引'))fs.unlinkSync(path.join(p,h));}
    else if(g.startsWith('00-索引'))fs.unlinkSync(p);
  }
}
let mn=0;
for(const y of Object.keys(rY).sort()){
  for(const m of Object.keys(rY[y]).sort()){
    const list=rY[y][m].sort((a,b)=>(a.rd||'').localeCompare(b.rd||''));
    const L=['---',`title: "00-索引-回顾-${y}-${m}"`,'年份: '+y,'月份: '+m,'条数: '+list.length,'---','',
      `# ${y}-${m} · 回顾（${list.length} 条）`,'','> 按回看日期排列。`原文` 指向当时的公众号发布版。','',
      '| 回看日 | 回看 | 原文 | 原文发布 |','|---|---|---|---|'];
    list.forEach(r=>{
      const single=(r.rawFm.match(/^回看原文:\s*"\[\[([^\]|#]+)/m)||[])[1]||'';
      const multi=[...r.rawFm.matchAll(/^\s+-\s+"\[\[([^\]|#]+)/gm)].map(x=>x[1].trim());
      let orig;
      if(multi.length)orig=multi.map(x=>'[['+x+']]').join('<br>');
      else orig=single?'[['+single+']]':'—';
      L.push(`| ${r.rd} | [[${r.fn}]] | ${orig} | ${r.origPub||'—'} |`);
    });
    L.push('');
    fs.writeFileSync(path.join(RETRO,y,m,`00-索引-回顾-${y}-${m}.md`),L.join('\n'),'utf8');
    mn++;
  }
  const total=Object.values(rY[y]).reduce((a,b)=>a+b.length,0);
  const LY=['---',`title: "00-索引-回顾-${y}"`,'年份: '+y,'条数: '+total,'---','',
    `# ${y} · 回顾（${total} 条）`,'','| 月份 | 条数 | 索引 |','|---|---:|---|'];
  Object.keys(rY[y]).sort().forEach(m=>LY.push(`| ${m} | ${rY[y][m].length} | [[00-索引-回顾-${y}-${m}]] |`));
  LY.push(`| **合计** | **${total}** | |`,'');
  fs.writeFileSync(path.join(RETRO,y,`00-索引-回顾-${y}.md`),LY.join('\n'),'utf8');
}
console.log('回顾 月索引',mn,'个 / 年索引',Object.keys(rY).length,'个');
