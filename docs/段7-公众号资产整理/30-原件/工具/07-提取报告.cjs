// 07-提取报告：给每篇留一份「抓取时发生了什么」
// 学自 MagicMD 的 extraction-report.json 思路：正文之外，还要能回答
//   「这篇的正文/图片/时间，是哪次抓取、什么状态、有没有降级」
// 输出：公众文章/00-提取报告.md（人看）+ 00-提取报告.json（机读）
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const PUB=path.join(ROOT,'公众文章');

function walk(d,a,skip){if(!fs.existsSync(d))return a;for(const f of fs.readdirSync(d)){const p=path.join(d,f);const st=fs.statSync(p);if(st.isDirectory()){if(f==='.obsidian'||f.endsWith('.assets')||(skip&&f.startsWith('_'))||f==='00-工具')continue;walk(p,a,skip);}else if(f.endsWith('.md')&&!f.startsWith('00-'))a.push(p);}return a;}
const norm=s=>String(s||'').replace(/[\s\p{P}\p{S}]/gu,'');

const rows=[];
for(const p of walk(PUB,[],true)){
  const t=fs.readFileSync(p,'utf8');const fm=t.split(/^---$/m)[1]||'';
  const g=k=>{const m=fm.match(new RegExp('^'+k+':\\s*(.+)$','m'));return m?m[1].trim().replace(/^"|"$/g,''):'';};
  const body=t.split(/^---$/m).slice(2).join('')
    .replace(/^#[^\n]*\n/m,'').replace(/^(>\s.*\n)+/m,'')
    .replace(/!\[\[[^\]]*\]\]/g,'').replace(/（正文缺失：[^）]*）/g,'').replace(/（本篇为纯图片帖[^）]*）/g,'')
    .replace(/\s+/g,'').trim();
  const imgs=(t.match(/!\[\[[^\]]+\.assets\//g)||[]).length;
  const form=g('存档形态'),src=g('时间来源'),link=g('原文链接'),contentForm=g('内容形态');
  const hasLink=(link||'').includes('mp.weixin');

  // 抓取状态：正文有没有、图片有没有、时间是不是 ct 级
  const status=[];
  if(!hasLink) status.push('无链接');
  if(norm(body).length<15) status.push('正文空');
  if(imgs===0 && norm(body).length<15) status.push('无图无文');
  if(/未取到 ct|三种 UA/.test(src)) status.push('时间降级');
  status.push(/网页抓取/.test(form)?'网页抓取':(/手动复制/.test(form)?'手动复制':'仅清单'));

  rows.push({rel:path.relative(ROOT,p).replace(/\\/g,'/'),fn:path.basename(p,'.md'),
    pub:g('发布日'),form,src,hasLink,bodyLen:norm(body).length,imgs,contentForm,
    status:status.join('｜'),link:hasLink?link:''});
}
rows.sort((a,b)=>(a.pub||'').localeCompare(b.pub||''));
console.log('扫描',rows.length,'篇');

// 汇总
const c={};
for(const r of rows){
  const k=r.form||'（无）';
  c[k]=(c[k]||0)+1;
}
const bySrc={};
for(const r of rows){const k=r.src||'（无）';bySrc[k]=(bySrc[k]||0)+1;}

// JSON
const payload={generated:'2026-11-25',total:rows.length,byForm:c,byTimeSource:bySrc,items:rows};
fs.writeFileSync(path.join(PUB,'00-提取报告.json'),JSON.stringify(payload,null,1),'utf8');

// 人看的 md
const L=['---','title: "00-提取报告"','篇数: '+rows.length,'生成: 2026-11-25','---','',
  '# 提取报告 · 公众文章','',
  '> 每篇留一份「抓取时发生了什么」。学自外部工具的 `extraction-report.json` 思路——',
  '> 正文之外还要能回答：这篇的正文/图片/时间，是哪次抓取、什么状态、有没有降级。','',
  '**为什么要有这份**：这次整理里，4 篇取不到 `ct` 是靠人工记下来的。如果每篇都有一份抓取记录，',
  '降级会自然留下痕迹，不依赖谁记得。','',
  '## 一、总量与来源','',
  '| 存档形态 | 篇数 |','|---|---:|'];
Object.entries(c).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>L.push('| '+k+' | '+v+' |'));
L.push('','| 时间来源 | 篇数 |','|---|---:|');
Object.entries(bySrc).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>L.push('| '+k+' | '+v+' |'));
L.push('','## 二、降级与缺失（按严重度）','',
  '| 类别 | 篇数 |','|---|---:|');
const deg={
  '无链接':rows.filter(r=>!r.hasLink).length,
  '正文空（<15字）':rows.filter(r=>r.bodyLen<15).length,
  '无图无文':rows.filter(r=>r.bodyLen<15&&r.imgs===0).length,
  '时间降级（未取到 ct）':rows.filter(r=>/未取到 ct/.test(r.src)).length,
};
Object.entries(deg).forEach(([k,v])=>L.push('| '+k+' | '+v+' |'));
L.push('','## 三、逐篇明细（只列有降级的）','',
  '> 全量明细在 `00-提取报告.json`。这里只列有问题的，正常的跳过。','',
  '| 发布日 | 标题 | 字数 | 图 | 状态 |','|---|---|---:|---:|---|');
rows.filter(r=>/无链接|正文空|无图无文|时间降级/.test(r.status)+true && (!r.hasLink||r.bodyLen<15||/未取到 ct/.test(r.src)))
  .forEach(r=>L.push(`| ${(r.pub||'').slice(0,10)} | ${r.fn.slice(0,32)} | ${r.bodyLen} | ${r.imgs} | ${r.status} |`));
L.push('','---','',`*2026-11-25 生成 · 共 ${rows.length} 篇 · 机读版 \`00-提取报告.json\`*`);
fs.writeFileSync(path.join(PUB,'00-提取报告.md'),L.join('\n'),'utf8');
console.log('已写 00-提取报告.md / .json');
console.log('降级统计:',JSON.stringify(deg));
