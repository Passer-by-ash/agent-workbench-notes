// 零出链且零入链的文件（谁也没提到它，它也不提别人）
// 用法：node "03-查孤岛.cjs"   （在 <本机路径> 目录下跑）

// 全库「孤立文件」回查：一个文件既没被别处链接、自己也不链别人 = 孤岛
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
function walkAll(d,a){if(!fs.existsSync(d))return a;for(const f of fs.readdirSync(d)){const p=path.join(d,f);const st=fs.statSync(p);if(st.isDirectory()){if(f==='.obsidian')continue;walkAll(p,a);}else a.push(p);}return a;}
const all=walkAll(ROOT,[]);
const mdFiles=all.filter(p=>p.endsWith('.md'));
const rels=all.map(p=>path.relative(ROOT,p).replace(/\\/g,'/'));
const relSet=new Set(rels);
const mdNames=new Map();  // basename → [rel]
for(const r of rels.filter(x=>x.endsWith('.md'))){
  const n=r.replace(/\.md$/,'').split('/').pop();
  (mdNames.get(n)||mdNames.set(n,[]).get(n)).push(r);
}
function resolve(t){
  t=String(t).replace(/\\/g,'/').trim();
  if(relSet.has(t)||mdNames.has(t))return true;
  return rels.some(r=>r===t||r.endsWith('/'+t));
}

// 统计每篇的出链/入链
const outLinks=new Map(),inLinks=new Map();
for(const p of mdFiles){
  const rel=path.relative(ROOT,p).replace(/\\/g,'/');
  const t=fs.readFileSync(p,'utf8');
  const set=new Set();
  for(const m of t.matchAll(/(?<!!)\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g))set.add(m[1].trim());
  for(const m of t.matchAll(/!\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g)){
    const g=m[1].trim();
    if(g.endsWith('.assets')||/\.(jpg|png|jpeg|gif|webp)$/i.test(g))continue;
    set.add(g);
  }
  outLinks.set(rel,set);
}
// 反向
for(const [src,set] of outLinks){
  for(const tg of set){
    // 解析到具体文件
    const hit=rels.find(r=>r===tg||r===tg+'.md'||r.endsWith('/'+tg)||r.endsWith('/'+tg+'.md')||(r.endsWith('.md')&&r.replace(/\.md$/,'')===tg));
    if(hit)inLinks.set(hit,(inLinks.get(hit)||new Set()).add(src));
  }
}

const lonely=[];
for(const p of mdFiles){
  const rel=path.relative(ROOT,p).replace(/\\/g,'/');
  const out=outLinks.get(rel)||new Set();
  const inn=inLinks.get(rel)||new Set();
  // 排除 assets 类
  const outReal=[...out].filter(x=>!x.endsWith('.assets')&&!/\.(jpg|png|jpeg|gif|webp)$/i.test(x));
  if(outReal.length===0&&inn.size===0)lonely.push({rel,out:outReal.length,inn:inn.size});
}
console.log('全库 md',mdFiles.length);
console.log('孤立文件（零出链且零入链）:',lonely.length);
lonely.forEach(l=>console.log('  '+l.rel));
