const fs=require('fs');const {chromium}=require('playwright');
const src=fs.readFileSync('/home/claude/qlda-ttts-hcm/src/QldaTtts.Web/wwwroot/js/core.js','utf8');
const m=src.match(/const drumSVG = \(\(\)=>\{[\s\S]*?\}; \}\)\(\);/)[0];
const svg=eval(m.replace(/^const drumSVG = /,'(').replace(/;\s*$/,')'))();
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:400},deviceScaleFactor:2});
await p.setContent(`<body style="margin:0;background:transparent"><div id=d style="width:320px;height:320px;color:#9a7a1c">${svg.replace('stroke-width="1.2"','stroke-width="1.6"')}</div></body>`);
await p.locator('#d').screenshot({path:'drum.png',omitBackground:true});await b.close();})();
