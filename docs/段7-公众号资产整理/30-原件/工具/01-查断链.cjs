// 检查所有 [[双链]] 与 ![[图片]] 是否指向真实文件
// 用法：node "01-查断链.cjs"   （在 <本机路径> 目录下跑）

// 断链检查 v2：按 Obsidian 的真实解析规则（路径后缀匹配）
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
function walkAll(d,out){if(!fs.existsSync(d))return out;for(const f of fs.readdirSync(d)){const p=path.join(d,f);const st=fs.statSync(p);if(st.isDirectory()){if(f==='.obsidian')continue;walkAll(p,out);}else out.push(p);}return out;}
const allFiles=walkAll(ROOT,[]);
// 相对 ROOT 的路径（正斜杠）
const rels=allFiles.map(p=>path.relative(ROOT,p).replace(/\\/g,'/'));
const relSet=new Set(rels);
// 去掉扩展名的 md 名
const mdNames=new Set(rels.filter(r=>r.endsWith('.md')).map(r=>r.replace(/\.md$/,'').split('/').pop()));
const mdRelNoExt=new Set(rels.filter(r=>r.endsWith('.md')).map(r=>r.replace(/\.md$/,'')));

// Obsidian 规则：target 能在「完整路径」或「路径后缀」里找到唯一匹配
function resolve(target){
  const t=target.replace(/\\/g,'/');
  if(relSet.has(t)||mdRelNoExt.has(t))return true;
  // 后缀匹配
  const hits=rels.filter(r=>r===t||r.endsWith('/'+t));
  return hits.length>0;
}
const mdFiles=allFiles.filter(p=>p.endsWith('.md'));
let aL=0,aB=[],iL=0,iB=[];
for(const p of mdFiles){
  const t=fs.readFileSync(p,'utf8');
  const rel=path.relative(ROOT,p).replace(/\\/g,'/');
  for(const m of t.matchAll(/!\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g)){iL++;const g=m[1].trim();if(!resolve(g))iB.push([rel,g]);}
  for(const m of t.matchAll(/(?<!!)\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g)){aL++;const g=m[1].trim();
    if(mdNames.has(g)||mdRelNoExt.has(g))continue;
    if(!resolve(g))aB.push([rel,g]);}
}
console.log('文章链接',aL,'| 断',aB.length);
console.log('图片嵌入',iL,'| 断',iB.length,'| vault文件',allFiles.length);
if(aB.length){const g={};aB.forEach(([f,l])=>{g[f]=g[f]||[];g[f].push(l);});Object.entries(g).slice(0,10).forEach(([f,ls])=>console.log('  A',f,'→',[...new Set(ls)].slice(0,3).join(' , ')));}
if(iB.length){const g={};iB.forEach(([f,l])=>{g[f]=g[f]||[];g[f].push(l);});Object.entries(g).slice(0,10).forEach(([f,ls])=>console.log('  I',f,'→',[...new Set(ls)].slice(0,3).join(' , ')));}
