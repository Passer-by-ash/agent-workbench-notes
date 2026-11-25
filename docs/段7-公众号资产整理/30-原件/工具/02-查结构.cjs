// 空目录／孤儿 assets／坏引用／缺年索引／命名异常／无扩展名
// 用法：node "02-查结构.cjs"   （在 <本机路径> 目录下跑）

// 体检脚本更新：索引已改名为「00-索引-<库名>-<年>」
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
function walkAll(d,a){if(!fs.existsSync(d))return a;for(const f of fs.readdirSync(d)){const p=path.join(d,f);const st=fs.statSync(p);if(st.isDirectory()){if(f==='.obsidian')continue;walkAll(p,a);}else a.push(p);}return a;}
const all=walkAll(ROOT,[]);
console.log('全盘文件',all.length);
const emptyDirs=[];
(function w(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(fs.statSync(p).isDirectory()){w(p);if(fs.readdirSync(p).length===0)emptyDirs.push(path.relative(ROOT,p));}}})(ROOT);
console.log('空目录',emptyDirs.length, emptyDirs);
const orphanAssets=[];
(function w(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f);const st=fs.statSync(p);if(st.isDirectory()){if(f.endsWith('.assets')){const n=f.replace(/\.assets$/,'');if(!fs.existsSync(path.join(d,n+'.md')))orphanAssets.push(path.relative(ROOT,p));}else if(f!=='.obsidian')w(p);}}})(ROOT);
console.log('孤儿 assets',orphanAssets.length,orphanAssets);
const badRefs=[];
for(const p of all.filter(x=>x.endsWith('.md'))){
  const t=fs.readFileSync(p,'utf8');const dir=path.dirname(p);
  for(const m of t.matchAll(/!\[\[([^\]\/]+\.assets)\//g)){
    if(!fs.existsSync(path.join(dir,m[1])))badRefs.push([path.relative(ROOT,p),m[1]]);
  }
}
console.log('引用不存在的 assets',badRefs.length, badRefs);
// 年索引：按新命名
const idxMissing=[];
const libs={'公众文章':'公众文章','原始稿':'原始稿'};
for(const [lib,key] of Object.entries(libs)){
  const base=path.join(ROOT,lib);
  if(!fs.existsSync(base))continue;
  for(const y of fs.readdirSync(base)){
    const p=path.join(base,y);
    if(!fs.statSync(p).isDirectory()||!/^\d{4}$/.test(y))continue;
    if(!fs.existsSync(path.join(p,`00-索引-${key}-${y}.md`)))idxMissing.push(lib+'/'+y);
  }
}
console.log('缺年索引',idxMissing.length, idxMissing);
const badNames=all.filter(p=>/[\u200b\u200c\u200d\ufeff\[\]]/.test(path.basename(p)));
console.log('命名异常',badNames.length, badNames.map(p=>path.relative(ROOT,p)));
const noExt=all.filter(p=>!path.extname(p)&&!path.basename(p).startsWith('.'));
console.log('无扩展名',noExt.length, noExt.map(p=>path.relative(ROOT,p)));
const cnt={};
for(const p of all.filter(x=>x.endsWith('.md')&&!path.basename(x).startsWith('00-'))){
  const rel=path.relative(ROOT,p).replace(/\\/g,'/');
  const top=rel.split('/')[0];
  cnt[top]=(cnt[top]||0)+1;
}
console.log('各块篇数',cnt);
