// 08-脱敏门：上传前扫一遍，拦本机路径、个人姓名、内部代号、公众号名、F盘路径
// 学自往批上传的做法：上传前跑门，退出码 0=GO / 3=GO-CONDITIONAL / 1=NO-GO
const fs=require('fs'),path=require('path');
const ROOT=process.argv[2]||'<本机路径>';
const RULES=[
  {name:'本机绝对路径 Windows', re:/(?<![A-Za-z])[A-Za-z]:\\[^\s"'`|<>]{3,}/g, hard:true},
  {name:'本机绝对路径 正斜杠', re:/(?<![A-Za-z])[A-Za-z]:\/[^\s"'`|<>]{3,}/g, hard:true},
  {name:'盘符根路径', re:/\b[A-Za-z]:\\?(?=[\s"'`）)，,。]|$)/g, hard:true},
  {name:'URL 里的本机', re:/file:\/\/\/?[A-Za-z]:/g, hard:true},
  {name:'公众号名', re:/<公众号>/g, hard:true},
  {name:'微信 biz 参数', re:/__biz=[A-Za-z0-9=+/]+/g, hard:true},
  {name:'微信链接', re:/https?:\/\/mp\.weixin\.qq\.com\/[^\s"'`）)]+/g, hard:false},
  {name:'手机号', re:/\b1[3-9]\d{9}\b/g, hard:true},
  {name:'邮箱', re:/[\w.+-]+@[\w-]+\.[\w.]+/g, hard:false},
  {name:'身份证', re:/\b\d{17}[\dXx]\b/g, hard:true},
  {name:'B站视频号', re:/BV[0-9A-Za-z]{10}/g, hard:false},
  {name:'本机用户名', re:/Windows|Administrator/g, hard:false},
];
function walk(d,a){if(!fs.existsSync(d))return a;if(fs.statSync(d).isFile()){a.push(d);return a;}for(const f of fs.readdirSync(d)){const p=path.join(d,f);const st=fs.statSync(p);if(st.isDirectory())walk(p,a);else a.push(p);}return a;}
const files=walk(ROOT,[]);
console.log('扫描',ROOT);
console.log('文件数',files.length,'\n');
let hard=0,soft=0;
const hits=[];
for(const p of files){
  const ext=path.extname(p).toLowerCase();
  if(!['.md','.txt','.json','.js','.cjs','.yml','.yaml'].includes(ext))continue;
  const t=fs.readFileSync(p,'utf8');
  for(const r of RULES){
    const m=t.match(r.re);
    if(!m)continue;
    const uniq=[...new Set(m)].slice(0,5);
    hits.push({file:path.relative(ROOT,p),rule:r.name,hard:r.hard,count:m.length,samples:uniq});
    if(r.hard)hard+=m.length;else soft+=m.length;
  }
}
if(!hits.length){console.log('✅ 无命中');process.exit(0);}
console.log('命中：');
for(const h of hits){
  console.log(`\n${h.hard?'⛔':'⚠️'} ${h.file}`);
  console.log(`   ${h.rule} ×${h.count}`);
  h.samples.forEach(s=>console.log(`      ${String(s).slice(0,70)}`));
}
console.log(`\n硬拦 ${hard} 处 | 提示 ${soft} 处`);
process.exit(hard>0?1:(soft>0?3:0));
