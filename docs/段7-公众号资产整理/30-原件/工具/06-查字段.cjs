// 0字节／正文过短／frontmatter 缺字段／文件名与 title 不符
// 用法：node "06-查字段.cjs"   （在 <本机路径> 目录下跑）

// 完整回查：找出所有可疑项
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
function walkAll(d,a){if(!fs.existsSync(d))return a;for(const f of fs.readdirSync(d)){const p=path.join(d,f);const st=fs.statSync(p);if(st.isDirectory()){if(f==='.obsidian')continue;walkAll(p,a);}else a.push(p);}return a;}
const all=walkAll(ROOT,[]);
const mds=all.filter(p=>p.endsWith('.md'));
const rel=p=>path.relative(ROOT,p).replace(/\\/g,'/');

console.log('=== 1. 0 字节文件 ===');
const zero=all.filter(p=>fs.statSync(p).size===0);
console.log(zero.length, zero.map(rel).slice(0,10));

console.log('\n=== 2. 正文为空的文章（<15字）===');
const empty=[];
for(const p of mds.filter(x=>!path.basename(x).startsWith('00-'))){
  const t=fs.readFileSync(p,'utf8');
  const body=t.split(/^---$/m).slice(2).join('')
    .replace(/^#[^\n]*\n/m,'').replace(/^(>\s.*\n)+/m,'')
    .replace(/!\[\[[^\]]*\]\]/g,'').replace(/（正文缺失：[^）]*）/g,'').replace(/（本篇为纯图片帖[^）]*）/g,'')
    .replace(/[\s\p{P}\p{S}]/gu,'');
  if(body.length<15)empty.push({rel:rel(p),len:body.length,fn:path.basename(p,'.md')});
}
console.log(empty.length);
empty.slice(0,15).forEach(e=>console.log('  '+e.len+'字 | '+e.fn.slice(0,50)));

console.log('\n=== 3. frontmatter 字段一致性 ===');
const FIELD_REQ={'公众文章':['title','发布日','原文链接'],'原始稿':['title','写作日'],'回顾':['title','回看日期']};
const missField=[];
for(const p of mds.filter(x=>!path.basename(x).startsWith('00-'))){
  const r=rel(p);
  let lib=null;
  if(r.startsWith('公众文章/'))lib='公众文章';
  else if(r.startsWith('原始稿/'))lib='原始稿';
  else if(r.startsWith('回顾/'))lib='回顾';
  if(!lib)continue;
  const t=fs.readFileSync(p,'utf8');const fm=t.split(/^---$/m)[1]||'';
  for(const k of FIELD_REQ[lib]){
    if(!new RegExp('^'+k+':','m').test(fm))missField.push({rel:r,miss:k});
  }
}
console.log(missField.length);
missField.slice(0,10).forEach(m=>console.log('  缺 '+m.miss+' | '+m.rel));

console.log('\n=== 4. 文件名与 title 字段不一致 ===');
let titleMismatch=0;
for(const p of mds.filter(x=>!path.basename(x).startsWith('00-'))){
  const t=fs.readFileSync(p,'utf8');const fm=t.split(/^---$/m)[1]||'';
  const m=fm.match(/^title:\s*(.+)$/m);
  if(!m)continue;
  const title=m[1].trim().replace(/^"|"$/g,'');
  const fn=path.basename(p,'.md');
  // 文件名是 title 或 title（年-月）
  if(fn!==title&&!fn.startsWith(title+'（')){titleMismatch++;if(titleMismatch<=8)console.log('  fn: '+fn.slice(0,40)+'\n    title: '+title.slice(0,40));}
}
console.log('总计',titleMismatch);
