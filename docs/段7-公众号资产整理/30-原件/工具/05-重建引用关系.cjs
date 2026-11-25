// 从公众号原文的引用卡片重建 00-引用关系.md
// 用法：node "05-重建引用关系.cjs"   （在 <本机路径> 目录下跑）

// 重建 公众文章/00-引用关系.md（按现有文章重新提取引用卡片）
const fs=require('fs'),path=require('path'),zlib=require('zlib'),crypto=require('crypto');
const ROOT=path.join(__dirname,'..');
const PUB=path.join(ROOT,'公众文章');
const CACHE='<本机路径>';
const keyOf=u=>crypto.createHash('sha1').update(u).digest('hex').slice(0,20);
const dec=s=>String(s).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
function walk(d,a){if(!fs.existsSync(d))return a;for(const f of fs.readdirSync(d)){const p=path.join(d,f);const st=fs.statSync(p);if(st.isDirectory()){if(f==='.obsidian'||f.endsWith('.assets')||f.startsWith('_'))continue;walk(p,a);}else if(f.endsWith('.md')&&!f.startsWith('00-'))a.push(p);}return a;}
const pubs=walk(PUB,[]).map(p=>{
  const t=fs.readFileSync(p,'utf8');const fm=t.split(/^---$/m)[1]||'';
  const g=k=>{const m=fm.match(new RegExp('^'+k+':\\s*(.+)$','m'));return m?m[1].trim().replace(/^"|"$/g,''):'';};
  return {p,fn:path.basename(p,'.md'),rel:path.relative(ROOT,p).replace(/\\/g,'/'),title:g('title'),pub:g('发布日'),link:g('原文链接'),cited:Number(g('被引次数')||0)};
});
// 链接 → 文件
const byLink=new Map();for(const x of pubs){if(x.link&&x.link.includes('mp.weixin')&&!byLink.has(x.link.trim()))byLink.set(x.link.trim(),x);}
const sc=u=>{u=String(u||'');let m=u.match(/\/s\/([A-Za-z0-9_-]+)/);if(m)return m[1];m=u.match(/[?&]sn=([a-f0-9]+)/);return m?m[1]:'';};
const bySc=new Map();for(const x of pubs){const k=sc(x.link);if(k&&!bySc.has(k))bySc.set(k,x);}

// 从缓存提取引用卡片
const edges=[];
for(const x of pubs){
  if(!x.link||!x.link.includes('mp.weixin'))continue;
  const cf=path.join(CACHE,keyOf(x.link)+'.html.gz');
  if(!fs.existsSync(cf))continue;
  const html=zlib.gunzipSync(fs.readFileSync(cf)).toString('utf8');
  const cards=[];
  for(const m of html.matchAll(/data-json="(%7B[^"]*?)"/g)){
    try{const j=JSON.parse(decodeURIComponent(dec(m[1])));
      if(j&&j.article&&j.article.url)cards.push({title:j.article.title||'',url:dec(j.article.url)});
    }catch(e){}
  }
  if(!cards.length)for(const m of html.matchAll(/<a[^>]*class="[^"]*blockquote_article[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g))
    cards.push({title:dec(m[2]).trim(),url:dec(m[1])});
  const seen=new Set();
  for(const c of cards){
    const k=c.title+'|'+c.url;if(seen.has(k))continue;seen.add(k);
    let tgt=byLink.get(c.url)||bySc.get(sc(c.url));
    if(!tgt&&c.title)tgt=pubs.find(p=>p.title.replace(/\s/g,'')===c.title.replace(/\s/g,''));
    if(tgt&&tgt.rel!==x.rel)edges.push([x,tgt]);
  }
}
console.log('引用边',edges.length);
const indeg={};edges.forEach(([a,b])=>{indeg[b.rel]=(indeg[b.rel]||0)+1;});

// 写总表
const sorted=Object.entries(indeg).sort((a,b)=>b[1]-a[1]);
const titleOf=new Map(pubs.map(x=>[x.rel,x]));
const L=['# 引用关系总表 · 公众文章','',
 `> 由公众号原文里的引用卡片提取，共 **${edges.length}** 条，涉及 **${new Set(edges.map(e=>e[0].rel)).size}** 篇源文、**${sorted.length}** 篇被引文章。`,'',
 '## 一、被引最多','','| # | 文章 | 被引 | 发布年 |','|---:|---|---:|---|'];
sorted.slice(0,40).forEach(([rel,n],i)=>{
  const t=titleOf.get(rel);
  L.push('| '+(i+1)+' | [['+t.fn+']] | '+n+' | '+(t.pub||'').slice(0,4)+' |');
});
L.push('','## 二、全部引用关系','','| 源文 | → 被引 |','|---|---|');
const seen=new Set();
edges.sort((a,b)=>a[0].rel.localeCompare(b[0].rel)).forEach(([a,b])=>{
  const k=a.rel+'|'+b.rel;if(seen.has(k))return;seen.add(k);
  L.push('| [['+a.fn+']] | [['+b.fn+']] |');
});
L.push('');
fs.writeFileSync(path.join(PUB,'00-引用关系.md'),L.join('\n'),'utf8');
console.log('引用关系表已写 | 被引篇',sorted.length);

// 回写被引次数
let n=0;
for(const [rel,cnt] of Object.entries(indeg)){
  const t=titleOf.get(rel);if(!t)continue;
  let md=fs.readFileSync(t.p,'utf8');
  if(/^被引次数:/m.test(md))md=md.replace(/^被引次数:\s*\d+$/m,'被引次数: '+cnt);
  else{const fe=md.indexOf('\n---',4);md=md.slice(0,fe)+'\n被引次数: '+cnt+md.slice(fe);}
  fs.writeFileSync(t.p,md,'utf8');n++;
}
console.log('回写被引次数',n,'篇');
