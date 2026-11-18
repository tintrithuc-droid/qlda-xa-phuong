/* ===== QUẢN LÝ KHỐI LƯỢNG (UC24–27) ===== */
function pickContract(key){ const list=contractOpts(S.pid,'dt'); let c=S.f[key]; if(!c||!list.some(x=>x[0]===c)) c=(list.find(([id])=>D('boq').some(b=>b.contractId===id))||list[0]||[])[0]; return c; }
VIEWS['khoi-luong']=()=>{
  const cid=pickContract('klc'); const c=cid&&get('contracts',cid); const ed=can('khoi-luong','edit');
  if(!c) return `<div class="head"><div class="grow"><h1>Quản lý khối lượng</h1></div></div>`+emptyBox('Chưa có hợp đồng giai đoạn thực hiện đầu tư. Hãy nhập hợp đồng ở mục Gói thầu và hợp đồng. Hợp đồng tư vấn giai đoạn chuẩn bị đầu tư nghiệm thu tại mục Chuẩn bị đầu tư › Nghiệm thu, thanh toán.');
  const cv=contractValue(c); const bq=D('boq').filter(b=>b.contractId===cid).sort((a,b)=>byCode(a,b));
  if(bq.some(b=>b.section)){ const first={}; bq.forEach((b,i)=>{ const k=b.section||''; if(!(k in first)) first[k]=i; }); bq.sort((a,b)=>first[a.section||'']-first[b.section||'']||byCode(a,b)); }
  const rows=bq.map(b=>({...b, val:N(b.qty)*N(b.price), dq:boqDone(b), aq:boqAcc(b)}));
  const tv=sum(rows,'val'), td=sum(rows,r=>r.dq*N(r.price)), ta=sum(rows,r=>r.aq*N(r.price)), paid=contractPaid(cid);
  const vols=D('volumes').filter(v=>v.contractId===cid).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const per={}; vols.forEach(v=>{ const b=get('boq',v.boqId); if(!b) return; const k=(v.date||'').slice(0,7); per[k]=per[k]||{m:k,dv:0,av:0,n:0}; if(volLive(v)) per[k].dv+=N(v.doneQty)*N(b.price); if(volAccOk(v)) per[k].av+=N(v.acceptedQty)*N(b.price); per[k].n++; });
  const pr=Object.values(per).sort(by('m'));
  let cum=0, cumA=0; pr.forEach(p=>{ cum+=p.dv; cumA+=p.av; p.cum=cum; p.cumA=cumA; });
  const pend=contractAccPend(cid);
  const t=S.tab.kl||'hd';
  const tabs=[['hd','Khối lượng theo hợp đồng'],['nt','Theo dõi nghiệm thu'],['th','Tổng hợp']];
  let body='';
  if(t==='hd') body=`<div class="card"><div class="ch"><h2>Bảng khối lượng hợp đồng</h2>${ed?`<button class="btn sm" data-act="imp" data-id="boq|${cid}">Nhập từ Excel</button><button class="btn sm" data-act="add-boq" data-id="${cid}">+ Thêm công việc</button><button class="btn primary sm" data-act="vb-new" data-id="${cid}">+ Lập đợt nghiệm thu</button>`:''}</div>
    ${table([{h:'Mã',k:'code'},{h:'Nội dung công việc',k:'name'},{h:'ĐVT',k:'unit'},{h:'KL hợp đồng',r:1,f:r=>fmtN(r.qty,2)},{h:'Đơn giá',r:1,f:r=>fmtVND(r.price)},{h:'Thành tiền',r:1,f:r=>fmtVND(r.val)},{h:'KL thực hiện lũy kế',r:1,f:r=>fmtN(r.dq,2)},{h:'% thực hiện',f:r=>`<div style="min-width:110px">${progBar(pct(r.dq,r.qty), r.dq>r.qty?'bad':'')}</div>`},{h:'KL nghiệm thu',r:1,f:r=>fmtN(r.aq,2)},{h:'Giá trị nghiệm thu',r:1,f:r=>fmtVND(r.aq*N(r.price))}],
      rows, {actions:r=>editBtns('khoi-luong','boq',r.id), empty:'Chưa có bảng khối lượng hợp đồng.', group:boqGroupLabel(rows), foot:['Tổng cộng','','','','',fmtVND(tv),'',fmtP(pct(td,tv)),'',fmtVND(ta)]})}
    <div class="small" style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b>Bảng khối lượng, dự toán gốc của hợp đồng:</b> ${attLinks(atts('contracts',cid,'Bảng khối lượng hợp đồng'))}${ed?`<button class="btn sm ghost" data-act="att-boq" data-id="${cid}">${AICO.clip} Đính kèm / gỡ tệp</button>`:''}</div>
    ${Math.abs(tv-cv)>1 && rows.length?`<div class="alert info" style="margin-top:10px">Tổng thành tiền bảng khối lượng (${fmtVND(tv)} đ) khác giá trị hợp đồng sau điều chỉnh (${fmtVND(cv)} đ), chênh lệch ${fmtVND(cv-tv)} đ.</div>`:''}
    ${rows.some(r=>r.dq>r.qty)?`<div class="alert bad" style="margin-top:10px">Có công việc vượt khối lượng hợp đồng, cần lập phụ lục điều chỉnh trước khi thanh toán.</div>`:''}</div>`;
  else if(t==='nt') body=vbView(cid, ed);
  else body=`<div class="grid g2"><div class="card"><h2>Giá trị thực hiện và nghiệm thu theo tháng</h2>${pr.length?barChart({labels:pr.map(p=>p.m.slice(5)+'/'+p.m.slice(2,4)), series:[{name:'Thực hiện',color:'var(--c1)',values:pr.map(p=>p.dv)},{name:'Nghiệm thu',color:'var(--c3)',values:pr.map(p=>p.av)}], fmt:v=>fmtN(v/1e9,1)+' tỷ'}):emptyBox('Chưa có số liệu.')}</div>
    <div class="card"><h2>Tổng hợp theo kỳ</h2>${table([{h:'Tháng',f:r=>r.m.slice(5)+'/'+r.m.slice(0,4)},{h:'Số lần cập nhật',r:1,k:'n'},{h:'Giá trị thực hiện',r:1,f:r=>fmtVND(r.dv)},{h:'Giá trị nghiệm thu',r:1,f:r=>fmtVND(r.av)},{h:'Lũy kế thực hiện',r:1,f:r=>fmtVND(r.cum)},{h:'Lũy kế nghiệm thu',r:1,f:r=>fmtVND(r.cumA)}], pr.map(p=>({...p,id:p.m})), {foot:['Tổng',sum(pr,'n'),fmtVND(sum(pr,'dv')),fmtVND(sum(pr,'av')),'','']})}
    <p class="small muted" style="margin:8px 0 0">Giá trị nghiệm thu chỉ tính các đợt nghiệm thu đã được duyệt.</p></div></div>`;
  return `<div class="head"><div class="grow"><h1>Quản lý khối lượng</h1><p>${esc(c.contractor)}</p></div><select data-f="klc" aria-label="Hợp đồng" style="max-width:420px">${opts(contractOpts(S.pid,'dt'),cid)}</select></div>
  <div class="grid g4"><div class="card kpi"><div class="eyebrow">Giá trị hợp đồng</div><div class="v">${fmtTy(cv)}</div><div class="s">${bq.length} công việc</div></div>
    <div class="card kpi"><div class="eyebrow">Thực hiện lũy kế</div><div class="v">${fmtTy(td)}</div><div class="s">${fmtP(pct(td,cv))} giá trị HĐ</div></div>
    <div class="card kpi"><div class="eyebrow">Đã nghiệm thu</div><div class="v">${fmtTy(ta)}</div><div class="s">${fmtP(pct(ta,td))} khối lượng thực hiện${pend>0?`<br><span style="color:var(--amber)">Chờ duyệt: ${fmtTy(pend)}</span>`:''}</div></div>
    <div class="card kpi"><div class="eyebrow">Đã thanh toán</div><div class="v">${fmtTy(paid)}</div><div class="s">Nghiệm thu chưa thanh toán ${fmtTy(Math.max(0,ta-paid))}</div></div></div>
  <div class="tabs">${tabs.map(([k,l])=>`<button class="${t===k?'on':''}" data-act="tab" data-g="kl" data-id="${k}">${l}</button>`).join('')}</div>${body}`;
};
/* Dòng nhóm công việc (phần, hạng mục) trong bảng khối lượng: tên nhóm + thành tiền của nhóm */
function boqGroupLabel(rows){ if(!rows.some(r=>r.section)) return null; const t={}; rows.forEach(r=>{ const k=r.section||''; t[k]=(t[k]||0)+N(r.qty)*N(r.price); });
  return r=>{ const k=r.section||''; return `${esc(k||'Công việc chưa xếp nhóm')}<span class="muted" style="float:right;font-weight:600">${fmtVND(t[k])} đ</span>`; }; }
function boqSections(cid){ return [...new Set(D('boq').filter(b=>b.contractId===cid && b.section).sort(byCode).map(b=>b.section))]; }
const boqFields=(cid)=>[{key:'code',label:'Mã hiệu',req:true},{key:'unit',label:'Đơn vị tính',type:'select',options:()=>catalog('Đơn vị tính'),req:true},{key:'section',label:'Nhóm công việc (phần, hạng mục)',full:true,suggest:()=>boqSections(cid),hint:'Không bắt buộc. Bấm chọn nhóm đã có hoặc gõ tên nhóm mới, ví dụ: 1. PHẦN ĐƯỜNG GIAO THÔNG'},{key:'name',label:'Nội dung công việc',req:true,full:true},{key:'qty',label:'Khối lượng hợp đồng',type:'number',req:true},{key:'price',label:'Đơn giá (đồng)',type:'money',req:true}];
ACT['add-boq']=(cid)=>openForm({title:'Thêm công việc vào bảng khối lượng hợp đồng', fields:boqFields(cid), onSave:v=>save('boq',{...v, contractId:cid})});
ACT['edit-boq']=(id)=>cidPhase((get('boq',id)||{}).contractId)==='cb'? cbSpEdit(get('boq',id)) : openForm({title:'Cập nhật công việc', fields:boqFields((get('boq',id)||{}).contractId), value:get('boq',id), onSave:v=>save('boq',v)});
ACT['att-boq']=(cid)=>attachForm('Bảng khối lượng, dự toán gốc của hợp đồng','contracts',cid,'Bảng khối lượng hợp đồng',{label:'Tệp bảng khối lượng / dự toán (Excel, PDF…)'});

/* ===== ĐỢT NGHIỆM THU KHỐI LƯỢNG (bản 1.7, mục 27–30) =====
   Mỗi đợt gắn một biên bản nghiệm thu (số, ngày, tệp scan) và gồm nhiều công việc của hợp đồng.
   Cán bộ kỹ thuật lập đợt trên một bảng lưới, trình; tư vấn giám sát xác nhận; lãnh đạo Ban duyệt một lần cho cả đợt.
   Khối lượng nghiệm thu chỉ được tính (thẻ chỉ số, báo cáo, điều kiện thanh toán) khi đợt đã duyệt. */
/** Các đợt của hợp đồng; dòng khối lượng cũ chưa có đợt được gom theo tên đợt và coi là đã nghiệm thu. */
function vbList(cid){
  const real=D('vbatches').filter(b=>b.contractId===cid).map(b=>({...b, vols:D('volumes').filter(v=>v.batchId===b.id)}));
  const old={}; D('volumes').filter(v=>v.contractId===cid && (!v.batchId || !get('vbatches',v.batchId))).forEach(v=>{ const k=v.period||'Đợt 1'; (old[k]=old[k]||{id:'old|'+cid+'|'+k, name:k, contractId:cid, date:'', number:'', status:'Đã duyệt', old:true, vols:[]}).vols.push(v); });
  Object.values(old).forEach(o=>{ o.date=o.vols.map(v=>v.date).sort().pop()||''; o.number=(o.vols.find(v=>v.note)||{}).note||''; });
  return [...real, ...Object.values(old)].map(b=>{ const val=f=>sum(b.vols, v=>N(v[f])*N((get('boq',v.boqId)||{}).price)); return {...b, dv:val('doneQty'), av:val('acceptedQty')}; })
    .sort((a,b)=>(b.date||'').localeCompare(a.date||'') || String(b.name).localeCompare(String(a.name),'vi',{numeric:true}));
}
function vbView(cid, ed, cb){
  const list=vbList(cid); const open=S.vbOpen||(S.vbOpen={});
  const c=get('contracts',cid);
  const rows=list.map(b=>{ const isOpen=!!open[b.id]; const bb=b.old? atts('contracts',cid,'Biên bản nghiệm thu',b.name) : atts('vbatches',b.id);
    const acts=b.old? '' : wfBtns('vbatches',b)+(wfEditable('vbatches',b)&&ed?`<button class="btn sm ghost" data-act="vb-edit" data-id="${esc(b.id)}">Sửa</button><button class="btn sm ghost danger" data-act="vb-del" data-id="${esc(b.id)}">Xóa</button>`:'');
    const pillH=b.old? pill('Đã nghiệm thu','ok') : wfPill('vbatches',b);
    const det=isOpen? `<div class="vb-det">${table([{h:'Mã',f:v=>esc((get('boq',v.boqId)||{}).code||'')},{h:'Công việc',f:v=>esc((get('boq',v.boqId)||{}).name||'')},{h:'ĐVT',f:v=>esc((get('boq',v.boqId)||{}).unit||'')},{h:'KL thực hiện',r:1,f:v=>fmtN(v.doneQty,2)},{h:'KL nghiệm thu',r:1,f:v=>fmtN(v.acceptedQty,2)},{h:'Giá trị nghiệm thu',r:1,f:v=>fmtVND(N(v.acceptedQty)*N((get('boq',v.boqId)||{}).price))}],
      b.vols.slice().sort((x,y)=>String((get('boq',x.boqId)||{}).code).localeCompare(String((get('boq',y.boqId)||{}).code),'vi',{numeric:true})), {nopage:true, foot:['Tổng cộng','','','','',fmtVND(b.av)], empty:'Đợt chưa có công việc.'})}${b.note?`<p class="small muted" style="margin:6px 0 0">${esc(b.note)}</p>`:''}</div>` : '';
    return `<div class="vb ${isOpen?'open':''}"><div class="vb-h"><button type="button" class="vb-t" data-act="vb-toggle" data-id="${esc(b.id)}" aria-expanded="${isOpen}"><span class="vb-car">${isOpen?'▾':'▸'}</span><b>${esc(b.name)}</b>${b.number?` <span class="small muted">Biên bản ${esc(b.number)}</span>`:''}</button>
      <span class="small num muted">${fmtDate(b.date)}</span><span class="small">${b.vols.length} ${cb?'sản phẩm':'công việc'}</span>${cb?'':`<span class="small num">Thực hiện ${fmtVND(b.dv)} đ</span>`}<span class="small num"><b>Nghiệm thu ${fmtVND(b.av)} đ</b></span>${pillH}</div>
      <div class="vb-a">${bb.length?attLinks(bb,{max:2}):''}${acts}</div>${det}</div>`; }).join('');
  if(cb) return `<div class="card"><div class="ch"><h2>Các đợt nghiệm thu sản phẩm</h2>${ed?`<button class="btn primary sm" data-act="vb-new" data-id="${cid}">+ Nghiệm thu sản phẩm</button>`:''}</div>
    ${list.length? `<div class="vb-list">${rows}</div>` : emptyBox('Chưa có đợt nghiệm thu sản phẩm nào.')}
    <p class="small muted" style="margin:10px 0 0">Quy trình: cán bộ lập đợt nghiệm thu kèm biên bản và trình, lãnh đạo Ban duyệt (không qua bước tư vấn giám sát xác nhận). Giá trị nghiệm thu chỉ được tính vào số liệu và điều kiện thanh toán khi đợt đã duyệt.</p></div>`;
  return `<div class="card"><div class="ch"><h2>Các đợt nghiệm thu khối lượng</h2>${ed?`<span style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" data-act="imp" data-id="vol|${cid}">Nhập từ Excel</button><button class="btn primary sm" data-act="vb-new" data-id="${cid}">+ Lập đợt nghiệm thu</button></span>`:''}</div>
    ${list.length? `<div class="vb-list">${rows}</div>` : emptyBox('Chưa có đợt nghiệm thu nào. Bấm "Lập đợt nghiệm thu" để nhập khối lượng của cả đợt trên một bảng.')}
    <p class="small muted" style="margin:10px 0 0">Quy trình: cán bộ kỹ thuật lập đợt và trình${wfHasCheck('vbatches')?', tư vấn giám sát xác nhận khối lượng':''}, lãnh đạo Ban duyệt. Khối lượng nghiệm thu chỉ được tính vào số liệu và điều kiện thanh toán khi đợt đã duyệt.</p></div>`;
}
ACT['vb-toggle']=(id)=>{ const o=S.vbOpen||(S.vbOpen={}); o[id]=!o[id]; render(); };
ACT['vb-new']=(cid)=>{ if(cidPhase(cid)==='cb') return cbVbForm(cid, null); const draft=D('vbatches').filter(b=>b.contractId===cid && wfStatus('vbatches',b)==='Soạn thảo' && !wfReturned('vbatches',b)).sort(by('date',-1))[0];
  vbForm(cid, null); };
ACT['vb-edit']=(id)=>{ const b=get('vbatches',id); if(!b) return; if(cidPhase(b.contractId)==='cb') cbVbForm(b.contractId, b); else vbForm(b.contractId, b); };
ACT['vb-del']=async(id)=>{ const b=get('vbatches',id); if(!b) return; const vs=D('volumes').filter(v=>v.batchId===id);
  if(!await confirmBox(`Xóa <b>${esc(b.name)}</b> cùng ${vs.length} dòng khối lượng của đợt? Thao tác này không hoàn tác được.`)) return;
  try{ for(const v of vs) await Store.del('volumes', v.id); await Store.del('vbatches', id); toast('Đã xóa đợt nghiệm thu'); }catch(ex){ toast(errText(ex),'err'); } };
/** Tên đợt mới: Đợt n, với n lớn hơn số đợt lớn nhất đã có của hợp đồng (không tự nhảy khi thêm công việc vào cùng đợt). */
/* Chỉ lấy số đứng sau chữ "Đợt" (tối đa 3 chữ số), không bắt nhầm năm trong "Lũy kế đến 31/12/2024" của dữ liệu đầu kỳ */
const volPeriodNo = p => { const m=/(?:^|[^\p{L}])đợt\s*(?:số\s*|thứ\s*)?0*(\d{1,3})(?!\d)/iu.exec(String(p||'')); return m? +m[1] : 0; };
function vbNextName(cid){ const ns=vbList(cid).map(b=>volPeriodNo(b.name)); return 'Đợt '+((ns.length?Math.max(...ns):0)+1); }
function vbForm(cid, b){
  const bq=D('boq').filter(x=>x.contractId===cid).sort((x,y)=>String(x.code).localeCompare(String(y.code),'vi',{numeric:true}));
  if(!bq.length) return toast('Hợp đồng chưa có bảng khối lượng. Hãy nhập bảng khối lượng hợp đồng trước.','err');
  const mine=b? D('volumes').filter(v=>v.batchId===b.id) : [];
  const cur=id=>mine.find(v=>v.boqId===id);
  const prevDone=x=>boqDone(x)-N((cur(x.id)||{}).doneQty), prevAcc=x=>boqAccAll(x)-N((cur(x.id)||{}).acceptedQty);
  const grid=`<div class="vb-tools"><button type="button" class="btn sm" id="vb_copy">Chép khối lượng thực hiện sang nghiệm thu</button><label class="small"><input type="checkbox" id="vb_only"> Chỉ hiện công việc có số liệu</label><input type="search" id="vb_q" placeholder="Tìm mã, tên công việc…" aria-label="Tìm công việc" style="max-width:240px"></div>
    <div class="tw vb-grid"><table><thead><tr><th>Mã</th><th>Công việc</th><th>ĐVT</th><th class="r">KL hợp đồng</th><th class="r">Lũy kế thực hiện trước</th><th class="r">Lũy kế nghiệm thu trước</th><th class="r">KL thực hiện đợt này</th><th class="r">KL nghiệm thu đợt này</th></tr></thead><tbody>
    ${bq.map(x=>{ const v=cur(x.id)||{}; return `<tr data-b="${esc(x.id)}" data-q="${esc(norm(x.code+' '+x.name))}"><td class="num">${esc(x.code)}</td><td>${esc(x.name)}</td><td>${esc(x.unit||'')}</td><td class="r num">${fmtN(x.qty,2)}</td><td class="r num">${fmtN(prevDone(x),2)}</td><td class="r num">${fmtN(prevAcc(x),2)}</td>
      <td class="r"><input type="number" step="any" min="0" class="num vbq" data-k="d" value="${v.doneQty??''}" aria-label="Khối lượng thực hiện ${esc(x.code)}"></td><td class="r"><input type="number" step="any" min="0" class="num vbq" data-k="a" value="${v.acceptedQty??''}" aria-label="Khối lượng nghiệm thu ${esc(x.code)}"></td></tr>`; }).join('')}
    </tbody><tfoot><tr><td colspan="6">Giá trị của đợt</td><td class="r num" id="vb_td">0</td><td class="r num" id="vb_ta">0</td></tr></tfoot></table></div>
    <p class="small muted" style="margin:6px 0 0">Khối lượng nghiệm thu đợt này được lớn hơn khối lượng thực hiện đợt này (nghiệm thu phần đã thi công ở đợt trước), miễn là lũy kế nghiệm thu không vượt lũy kế thực hiện. Dòng tô đỏ: lũy kế nghiệm thu vượt lũy kế thực hiện; tô vàng: lũy kế thực hiện vượt khối lượng hợp đồng.</p>`;
  openForm({title:(b?'Sửa ':'Lập ')+'đợt nghiệm thu khối lượng'+(b?': '+b.name:''), wide:true, value:b||{name:vbNextName(cid), date:TODAY},
    fields:[{key:'name',label:'Tên đợt',req:true,suggest:()=>b?[]:[vbNextName(cid)]},{key:'number',label:'Số biên bản nghiệm thu'},{key:'date',label:'Ngày nghiệm thu',type:'date',req:true},{key:'note',label:'Ghi chú'},
      {key:'grid',type:'html',label:'Khối lượng các công việc trong đợt',full:true,html:grid},
      {key:'att',label:'Biên bản nghiệm thu của đợt (bản scan PDF, ảnh)',type:'attach',col:'vbatches',kind:'Biên bản nghiệm thu',full:true}],
    onSave:async v=>{ const err=$('#mform_err'); const lines=vbRead(); const bad=[], over=[];
      if(!lines.some(l=>l.d||l.a)){ err.textContent='Chưa nhập khối lượng cho công việc nào.'; return false; }
      lines.forEach(l=>{ const x=get('boq',l.id); const cd=prevDone(x)+l.d, ca=prevAcc(x)+l.a; if(l.d<0||l.a<0) bad.push(x.code+' (số âm)'); else if(ca>cd+1e-9) bad.push(`${x.code} (lũy kế nghiệm thu ${fmtN(ca,2)} > lũy kế thực hiện ${fmtN(cd,2)})`); if(cd>N(x.qty)*1.0001) over.push(x.code); });
      if(bad.length){ err.textContent='Không lưu được: '+bad.slice(0,3).join('; ')+(bad.length>3?'…':''); return false; }
      if(D('vbatches').some(o=>o.contractId===cid && o.id!==(b&&b.id) && norm(o.name)===norm(v.name))){ err.textContent='Hợp đồng đã có đợt tên "'+v.name+'".'; return false; }
      const rec=await save('vbatches',{...(b||{}), contractId:cid, name:v.name, number:v.number, date:v.date, note:v.note});
      for(const l of lines){ const old=cur(l.id); const x=get('boq',l.id);
        if(!l.d && !l.a){ if(old) await Store.del('volumes', old.id); continue; }
        await save('volumes',{...(old||{}), contractId:cid, boqId:l.id, batchId:rec.id, date:v.date, period:v.name, note:v.number||'', doneQty:l.d, acceptedQty:l.a}); }
      if(over.length) toast(`Lưu ý: lũy kế thực hiện vượt khối lượng hợp đồng ở ${over.length} công việc (${over.slice(0,3).join(', ')}). Cần lập phụ lục điều chỉnh trước khi thanh toán.`,'err');
      return rec; }});
  const ov=$('#ov'); const tb=ov.querySelector('.vb-grid tbody');
  const recalc=()=>{ let td=0, ta=0; tb.querySelectorAll('tr').forEach(tr=>{ const x=get('boq',tr.dataset.b); const d=N(tr.querySelector('[data-k=d]').value), a=N(tr.querySelector('[data-k=a]').value);
      td+=d*N(x.price); ta+=a*N(x.price); const cd=prevDone(x)+d, ca=prevAcc(x)+a; tr.classList.toggle('bad', ca>cd+1e-9); tr.classList.toggle('warn', !(ca>cd+1e-9) && cd>N(x.qty)*1.0001); });
    $('#vb_td',ov).textContent=fmtVND(td); $('#vb_ta',ov).textContent=fmtVND(ta); };
  const filt=()=>{ const q=norm($('#vb_q',ov).value), only=$('#vb_only',ov).checked; tb.querySelectorAll('tr').forEach(tr=>{ const has=[...tr.querySelectorAll('.vbq')].some(i=>N(i.value)); tr.hidden=(q && !tr.dataset.q.includes(q)) || (only && !has); }); };
  tb.addEventListener('input', recalc); $('#vb_q',ov).addEventListener('input', filt); $('#vb_only',ov).addEventListener('change', filt);
  $('#vb_copy',ov).addEventListener('click', ()=>{ tb.querySelectorAll('tr').forEach(tr=>{ const d=tr.querySelector('[data-k=d]'), a=tr.querySelector('[data-k=a]'); if(d.value!=='' && a.value==='') a.value=d.value; }); recalc(); });
  recalc();
}
function vbRead(){ return [...$('#ov').querySelectorAll('.vb-grid tbody tr')].map(tr=>({id:tr.dataset.b, d:N(tr.querySelector('[data-k=d]').value), a:N(tr.querySelector('[data-k=a]').value)})); }
/* Sửa một dòng khối lượng cũ (dữ liệu trước bản 1.7, chưa thuộc đợt nào) */
const volFields=(cid)=>[{key:'boqId',label:'Công việc',type:'select',options:()=>D('boq').filter(b=>b.contractId===cid).sort(byCode).map(b=>[b.id, b.code+' · '+b.name+' ('+b.unit+')']),req:true,full:true},
  {key:'date',label:'Ngày',type:'date',req:true,def:TODAY},{key:'period',label:'Đợt / kỳ',req:true,suggest:()=>vbList(cid).map(b=>b.name)},
  {key:'doneQty',label:'Khối lượng thực hiện trong kỳ',type:'number',req:true},{key:'acceptedQty',label:'Khối lượng được nghiệm thu',type:'number',def:0},{key:'note',label:'Số biên bản nghiệm thu / ghi chú',full:true}];
/** Mục 29: kiểm tra theo lũy kế: lũy kế nghiệm thu không vượt lũy kế thực hiện; vượt khối lượng hợp đồng thì nhắc. */
function volCheck(v, self){ const b=get('boq',v.boqId); const done=boqDone(b)-(self?N(self.doneQty):0)+N(v.doneQty), acc=boqAccAll(b)-(self?N(self.acceptedQty):0)+N(v.acceptedQty);
  if(N(v.doneQty)<0||N(v.acceptedQty)<0){ $('#mform_err').textContent='Khối lượng không được âm.'; return false; }
  if(acc>done+1e-9){ $('#mform_err').textContent=`Lũy kế nghiệm thu (${fmtN(acc,2)}) vượt lũy kế thực hiện (${fmtN(done,2)}) ${b.unit||''}.`; return false; }
  if(done>N(b.qty)*1.0001) toast(`Lưu ý: lũy kế ${fmtN(done,2)} vượt khối lượng hợp đồng ${fmtN(b.qty,2)} ${b.unit}.`,'err'); return true; }
ACT['add-vol']=(cid)=>ACT['vb-new'](cid);
ACT['edit-volumes']=(id)=>{ const o=get('volumes',id); const bt=batchOf(o); if(bt) return ACT['vb-edit'](bt.id);
  openForm({title:'Sửa khối lượng thực hiện / nghiệm thu', fields:volFields(o.contractId), value:o, onSave:v=>volCheck(v,o)?save('volumes',v,(get('boq',v.boqId)||{}).name+' '+v.period):false}); };

/* ===== QUẢN LÝ THANH TOÁN (UC28–31) ===== */
/* Thanh toán theo giai đoạn: Thực hiện đầu tư › Quản lý thanh toán và Chuẩn bị đầu tư › Nghiệm thu, thanh toán
   (hợp đồng tư vấn: nghiệm thu theo sản phẩm, rồi thanh toán) */
VIEWS['thanh-toan']=()=>payView('dt');
VIEWS['cb-thanh-toan']=()=>payView('cb');
function payView(ph){
  const fk=ph==='cb'?'ttcb':'ttc', tk=ph==='cb'?'ttcb':'tt';
  const list=contractOpts(S.pid, ph); let cid=S.f[fk]||''; if(cid && !list.some(x=>x[0]===cid)) cid='';
  const cs=D('contracts').filter(c=>inFilter(contractPid(c)) && contractPhase(c)===ph && (!cid||c.id===cid)).sort(by('number'));
  const ids=cs.map(c=>c.id); const ed=can('thanh-toan','edit');
  const plans=D('payplans').filter(p=>ids.includes(p.contractId)).sort(by('planDate'));
  const pays=D('payments').filter(p=>ids.includes(p.contractId)).sort((a,b)=>b.date.localeCompare(a.date));
  const tv=sum(cs,contractValue), ta=sum(cs,c=>contractAcc(c.id)), tp=sum(cs,c=>contractPaid(c.id)), pend=sum(pays.filter(payInProc),payAmt);
  const t=S.tab[tk]||(ph==='cb'?'nt':'td');
  const cn=id=>{ const c=get('contracts',id)||{}; return `<span class="num small">${esc(c.number||'')}</span>`; };
  let body='';
  if(t==='nt' && ph==='cb') body=cbAcceptView(cid);
  else if(t==='td') body=`<div class="card"><h2>Theo dõi giá trị đã thanh toán theo hợp đồng</h2>${table([{h:'Hợp đồng',f:r=>`${cn(r.id)}<div class="small muted">${esc((pkgOf(r.packageId)||{}).code||'')} · ${esc(r.contractor)}</div>`},{h:'Giá trị HĐ',r:1,f:r=>fmtVND(contractValue(r))},{h:'Đã nghiệm thu',r:1,f:r=>fmtVND(contractAcc(r.id))},{h:'Đã thanh toán',r:1,f:r=>fmtVND(contractPaid(r.id))},{h:'Đang đề nghị',r:1,f:r=>fmtVND(sum(D('payments').filter(p=>p.contractId===r.id&&payInProc(p)),'amount'))},{h:'Còn lại',r:1,f:r=>fmtVND(contractValue(r)-contractPaid(r.id))},{h:'Tỷ lệ thanh toán',f:r=>`<div style="min-width:110px">${progBar(pct(contractPaid(r.id),contractValue(r)))}</div>`}], cs,
    {foot:['Tổng cộng',fmtVND(tv),fmtVND(ta),fmtVND(tp),fmtVND(pend),fmtVND(tv-tp),fmtP(pct(tp,tv))]})}</div>`;
  else if(t==='kh') body=`<div class="card"><div class="ch"><h2>Kế hoạch thanh toán</h2>${ed?`<button class="btn primary sm" data-act="add-plan" data-id="${cid}">+ Thêm kế hoạch</button>`:''}</div>${table([{h:'Hợp đồng',f:r=>cn(r.contractId)},{h:'Đợt',k:'phase'},{h:'Thời gian dự kiến',f:r=>`<span class="num">${fmtDate(r.planDate)}</span>`},{h:'Giá trị kế hoạch',r:1,f:r=>fmtVND(r.amount)},{h:'Đã chi',r:1,f:r=>{ const ps=D('payments').filter(x=>x.payPlanId===r.id && x.status==='Đã thanh toán'); return ps.length? `${fmtVND(planPaid(r))}<div class="small muted">${ps.map(x=>esc(x.number)).join(', ')}</div>` : '—'; }},{h:'Tình trạng',f:r=>{ const st=planState(r); return pill(st.t, st.k); }},{h:'Tệp',f:r=>attCell(atts('payplans',r.id))},...(wfOn('payplans',S.pid||null)||plans.some(x=>x.status)?[{h:'Trình duyệt',f:r=>wfPill('payplans',r)}]:[])], plans, {actions:r=>wfBtns('payplans',r)+wfEditBtns('payplans',r), empty:'Chưa có kế hoạch thanh toán.', foot:['Tổng','','',fmtVND(sum(plans,'amount')),fmtVND(sum(plans,planPaid)),'','',...(wfOn('payplans',S.pid||null)||plans.some(x=>x.status)?['']:[])]})}<p class="small muted" style="margin:8px 0 0">Đợt được tính là đã thực hiện khi có hồ sơ thanh toán gắn với đợt (chọn ở ô Thuộc đợt kế hoạch thanh toán khi lập hồ sơ) đã được Kho bạc chi.</p></div>`;
  else if(t==='hs') body=`<div class="card"><div class="ch"><h2>Hồ sơ thanh toán</h2>${ed?`<button class="btn primary sm" data-act="add-pay" data-id="${cid}">+ Lập hồ sơ thanh toán</button>`:''}</div>${table([{h:'Số hồ sơ',k:'number'},{h:'Hợp đồng',f:r=>cn(r.contractId)},{h:'Ngày',f:r=>`<span class="num">${fmtDate(r.date)}</span>`},{h:'Loại',k:'kind'},{h:'Nội dung',k:'content'},{h:'Giá trị',r:1,f:r=>fmtVND(r.amount)},{h:'Trạng thái',f:r=>wfPill('payments',r)},{h:'Tệp',f:r=>attCell(atts('payments',r.id))}], pays, {actions:r=>wfBtns('payments',r)+wfEditBtns('payments',r, ed&&r.status==='Đang trình KBNN'?`<button class="btn sm ghost" data-act="pay-done" data-id="${r.id}">Xác nhận đã chi</button>`:''), empty:'Chưa có hồ sơ thanh toán.'})}</div>`;
  else {
    const q={}; const qk=d=>d.slice(0,4)+'-Q'+(Math.floor((+d.slice(5,7)-1)/3)+1);
    plans.forEach(p=>{ const k=qk(p.planDate); (q[k]=q[k]||{k,plan:0,paid:0}).plan+=N(p.amount); });
    pays.filter(p=>p.status==='Đã thanh toán').forEach(p=>{ const k=qk(p.date); (q[k]=q[k]||{k,plan:0,paid:0}).paid+=payAmt(p); });
    const qs=Object.values(q).sort(by('k')); let cp=0, ca=0; qs.forEach(x=>{ cp+=x.plan; ca+=x.paid; x.cp=cp; x.ca=ca; });
    const byP=projects().filter(p=>inFilter(p.id)).map(p=>{ const c=D('contracts').filter(x=>contractPid(x)===p.id && contractPhase(x)===ph && (!cid||x.id===cid)); return {...p, cv:sum(c,contractValue), paid:sum(c,x=>contractPaid(x.id))}; }).filter(p=>p.cv);
    body=`<div class="grid g2"><div class="card"><h2>Kế hoạch và thực tế thanh toán theo quý</h2>${qs.length?barChart({labels:qs.map(x=>x.k.replace('-',' ')), series:[{name:'Kế hoạch',color:'var(--c5)',values:qs.map(x=>x.plan)},{name:'Đã thanh toán',color:'var(--c2)',values:qs.map(x=>x.paid)}], fmt:v=>fmtN(v/1e9,0)+' tỷ'}):emptyBox('Chưa có số liệu.')}</div>
      <div class="card"><h2>Tổng hợp giá trị thanh toán theo dự án</h2>${table([{h:'Dự án',f:r=>esc(r.code)},{h:'Giá trị HĐ',r:1,f:r=>fmtVND(r.cv)},{h:'Đã thanh toán',r:1,f:r=>fmtVND(r.paid)},{h:'Tỷ lệ giải ngân / TMĐT',r:1,f:r=>fmtP(pct(r.paid,r.tmdt))}], byP, {foot:['Tổng',fmtVND(sum(byP,'cv')),fmtVND(sum(byP,'paid')),'']})}
      <h3 style="margin-top:14px">Lũy kế theo quý</h3>${table([{h:'Quý',k:'k'},{h:'Kế hoạch lũy kế',r:1,f:r=>fmtVND(r.cp)},{h:'Thực tế lũy kế',r:1,f:r=>fmtVND(r.ca)},{h:'Đạt',r:1,f:r=>fmtP(pct(r.ca,r.cp))}], qs.map(x=>({...x,id:x.k})))}</div></div>`;
  }
  return `<div class="head"><div class="grow"><h1>${ph==='cb'?'Nghiệm thu, thanh toán':'Quản lý thanh toán'} <span class="pill ${ph==='cb'?'info':'acc'}" style="vertical-align:middle;font-size:.8rem">${esc(PHASES[ph])}</span></h1><p>${cs.length} hợp đồng${ph==='cb'?' tư vấn':''}, đã thanh toán ${fmtTy(tp)} trên tổng giá trị ${fmtTy(tv)}</p></div><select data-f="${fk}" aria-label="Hợp đồng" style="max-width:420px">${opts(list,cid,'Tất cả hợp đồng')}</select></div>
  <div class="grid g4"><div class="card kpi"><div class="eyebrow">Giá trị hợp đồng</div><div class="v">${fmtTy(tv)}</div></div>${ph==='cb'?`<div class="card kpi"><div class="eyebrow">Đã nghiệm thu</div><div class="v">${fmtTy(ta)}</div><div class="s">${fmtP(pct(ta,tv))} giá trị HĐ · chưa thanh toán ${fmtTy(Math.max(0,ta-tp))}</div></div>`:''}<div class="card kpi"><div class="eyebrow">Đã thanh toán</div><div class="v">${fmtTy(tp)}</div><div class="s">${fmtP(pct(tp,tv))} giá trị HĐ</div></div>
    <div class="card kpi"><div class="eyebrow">Đang đề nghị / trình KBNN</div><div class="v">${fmtTy(pend)}</div></div>${ph==='cb'?'':`<div class="card kpi"><div class="eyebrow">Kế hoạch năm ${TODAY.slice(0,4)}</div><div class="v">${fmtTy(sum(plans.filter(p=>p.planDate.startsWith(TODAY.slice(0,4))),'amount'))}</div><div class="s">Đã chi trong năm ${fmtTy(sum(pays.filter(p=>p.status==='Đã thanh toán'&&p.date.startsWith(TODAY.slice(0,4))),'amount'))}</div></div>`}</div>
  <div class="tabs">${[...(ph==='cb'?[['nt','Nghiệm thu sản phẩm']]:[]),['td','Theo dõi đã thanh toán'],['kh','Kế hoạch thanh toán'],['hs','Hồ sơ thanh toán'],['th','Tổng hợp']].map(([k,l])=>`<button class="${t===k?'on':''}" data-act="tab" data-g="${tk}" data-id="${k}">${l}</button>`).join('')}</div>${body}`;
}
/* Nghiệm thu sản phẩm của hợp đồng tư vấn (chuẩn bị đầu tư): mỗi sản phẩm là một dòng của bảng khối lượng hợp đồng (đơn vị "Sản phẩm",
   khối lượng 1, đơn giá bằng giá trị sản phẩm); mỗi đợt nghiệm thu là một đợt khối lượng, nhập theo giá trị, kèm biên bản.
   Đợt nghiệm thu đi theo quy trình "Đợt nghiệm thu khối lượng" nhưng bỏ bước tư vấn giám sát xác nhận. */
function cbAcceptView(cid){
  const ed=can('khoi-luong','edit');
  if(!cid){ const cs=D('contracts').filter(c=>inFilter(contractPid(c)) && contractPhase(c)==='cb').sort(by('number'));
    return `<div class="card"><div class="ch"><h2>Nghiệm thu sản phẩm theo hợp đồng</h2></div><p class="small muted" style="margin-top:0">Chọn một hợp đồng để khai báo sản phẩm và nghiệm thu từng đợt.</p>${table([{h:'Hợp đồng',f:r=>`<span class="num small">${esc(r.number)}</span><div class="small muted">${esc((pkgOf(r.packageId)||{}).code||'')} · ${esc(r.contractor)}</div>`},{h:'Sản phẩm',r:1,f:r=>D('boq').filter(b=>b.contractId===r.id).length},{h:'Giá trị HĐ',r:1,f:r=>fmtVND(contractValue(r))},{h:'Đã nghiệm thu',r:1,f:r=>fmtVND(contractAcc(r.id))},{h:'Đã thanh toán',r:1,f:r=>fmtVND(contractPaid(r.id))},{h:'Tỷ lệ nghiệm thu',f:r=>`<div style="min-width:110px">${progBar(pct(contractAcc(r.id),contractValue(r)))}</div>`}], cs, {rowAct:'pick-cbc', empty:'Chưa có hợp đồng giai đoạn chuẩn bị đầu tư. Vui lòng nhập hợp đồng ở mục Chuẩn bị đầu tư › Gói thầu và hợp đồng.'})}</div>`; }
  const c=get('contracts',cid); const cv=contractValue(c);
  const rows=D('boq').filter(b=>b.contractId===cid).sort(byCode).map(b=>({...b, val:N(b.qty)*N(b.price), av:boqAcc(b)*N(b.price), pv:(boqAccAll(b)-boqAcc(b))*N(b.price)}));
  const tv=sum(rows,'val'), ta=sum(rows,'av');
  const st=r=>r.av>=r.val-0.5&&r.val>0? pill('Đã nghiệm thu đủ','ok') : r.av>0? pill('Nghiệm thu một phần','warn') : r.pv>0? pill('Chờ duyệt nghiệm thu','warn') : pill('Chưa nghiệm thu','info');
  return `<div class="card"><div class="ch"><h2>Sản phẩm theo hợp đồng</h2>${ed?`<span style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" data-act="add-cbsp" data-id="${cid}">+ Thêm sản phẩm</button>${rows.length?`<button class="btn primary sm" data-act="vb-new" data-id="${cid}">+ Nghiệm thu sản phẩm</button>`:''}</span>`:''}</div>
    <p class="small muted" style="margin-top:0">Hợp đồng tư vấn nghiệm thu, thanh toán theo sản phẩm (nhiệm vụ khảo sát, báo cáo kinh tế - kỹ thuật, hồ sơ thiết kế, dự toán…). Khai báo sản phẩm và giá trị theo hợp đồng, sau đó nghiệm thu từng đợt kèm biên bản; giá trị đã nghiệm thu là căn cứ lập hồ sơ thanh toán.</p>
    ${table([{h:'Ký hiệu',k:'code'},{h:'Sản phẩm',k:'name'},{h:'Giá trị theo HĐ',r:1,f:r=>fmtVND(r.val)},{h:'Đã nghiệm thu',r:1,f:r=>fmtVND(r.av)+(r.pv?`<div class="small muted">chờ duyệt ${fmtVND(r.pv)}</div>`:'')},{h:'Tỷ lệ',f:r=>`<div style="min-width:110px">${progBar(pct(r.av,r.val))}</div>`},{h:'Trạng thái',f:st}],
      rows, {actions:r=>editBtns('khoi-luong','boq',r.id), empty:'Chưa khai báo sản phẩm của hợp đồng.', foot:['Tổng cộng','',fmtVND(tv),fmtVND(ta),fmtP(pct(ta,tv)),'']})}
    ${Math.abs(tv-cv)>1 && rows.length?`<div class="alert info" style="margin-top:10px">Tổng giá trị các sản phẩm (${fmtVND(tv)} đ) khác giá trị hợp đồng sau điều chỉnh (${fmtVND(cv)} đ), chênh lệch ${fmtVND(cv-tv)} đ.</div>`:''}</div>
  ${vbView(cid, ed, true)}`;
}
ACT['pick-cbc']=(id)=>{ S.f.ttcb=id; render(); };
const cbSpFields=()=>[{key:'code',label:'Ký hiệu',req:true},{key:'val',label:'Giá trị theo hợp đồng (đồng)',type:'money',req:true},{key:'name',label:'Sản phẩm tư vấn',req:true,full:true,hint:'Ví dụ: Nhiệm vụ và phương án khảo sát; Báo cáo kinh tế - kỹ thuật; Hồ sơ thiết kế bản vẽ thi công và dự toán.'}];
ACT['add-cbsp']=(cid)=>openForm({title:'Thêm sản phẩm của hợp đồng tư vấn', narrow:true, fields:cbSpFields(), onSave:v=>save('boq',{code:v.code, name:v.name, unit:'Sản phẩm', qty:1, price:N(v.val), contractId:cid}, v.name)});
function cbSpEdit(b){ openForm({title:'Cập nhật sản phẩm', narrow:true, fields:cbSpFields(), value:{...b, val:N(b.qty)*N(b.price)}, onSave:v=>{
  const q=N(b.qty)||1, acc=boqAccAll(b)*N(b.price);
  if(N(v.val)+0.5<acc){ $('#mform_err').textContent=`Giá trị sản phẩm không được nhỏ hơn giá trị đã nghiệm thu (${fmtVND(acc)} đ).`; return false; }
  return save('boq',{...b, code:v.code, name:v.name, price:N(v.val)/q}, v.name); }}); }
/* Lập, sửa đợt nghiệm thu sản phẩm: nhập giá trị nghiệm thu đợt này của từng sản phẩm; chặn khi lũy kế vượt giá trị sản phẩm */
function cbVbForm(cid, b){
  const bq=D('boq').filter(x=>x.contractId===cid).sort(byCode);
  if(!bq.length) return toast('Hợp đồng chưa khai báo sản phẩm. Vui lòng thêm sản phẩm trước.','err');
  const mine=b? D('volumes').filter(v=>v.batchId===b.id) : [];
  const cur=id=>mine.find(v=>v.boqId===id);
  const val=x=>N(x.qty)*N(x.price), prevAcc=x=>(boqAccAll(x)-N((cur(x.id)||{}).acceptedQty))*N(x.price);
  const grid=`<div class="tw vb-grid"><table><thead><tr><th>Ký hiệu</th><th>Sản phẩm</th><th class="r">Giá trị theo HĐ</th><th class="r">Đã nghiệm thu trước</th><th class="r">Còn lại</th><th class="r">Giá trị nghiệm thu đợt này (đồng)</th></tr></thead><tbody>
    ${bq.map(x=>{ const v=cur(x.id); const a=v? Math.round(N(v.acceptedQty)*N(x.price)) : ''; return `<tr data-b="${esc(x.id)}"><td class="num">${esc(x.code)}</td><td>${esc(x.name)}</td><td class="r num">${fmtVND(val(x))}</td><td class="r num">${fmtVND(prevAcc(x))}</td><td class="r num">${fmtVND(val(x)-prevAcc(x))}</td>
      <td class="r"><input type="number" step="any" min="0" class="num vbq" data-k="a" value="${a}" aria-label="Giá trị nghiệm thu ${esc(x.code)}"></td></tr>`; }).join('')}
    </tbody><tfoot><tr><td colspan="5">Giá trị nghiệm thu của đợt</td><td class="r num" id="vb_ta">0</td></tr></tfoot></table></div>
    <p class="small muted" style="margin:6px 0 0">Lũy kế giá trị nghiệm thu của mỗi sản phẩm không được vượt giá trị theo hợp đồng; dòng tô đỏ là dòng vượt. Cần điều chỉnh thì lập phụ lục hợp đồng trước.</p>`;
  openForm({title:(b?'Sửa ':'Lập ')+'đợt nghiệm thu sản phẩm'+(b?': '+b.name:''), wide:true, value:b||{name:vbNextName(cid), date:TODAY},
    fields:[{key:'name',label:'Tên đợt',req:true,suggest:()=>b?[]:[vbNextName(cid)]},{key:'number',label:'Số biên bản nghiệm thu'},{key:'date',label:'Ngày nghiệm thu',type:'date',req:true},{key:'note',label:'Ghi chú'},
      {key:'grid',type:'html',label:'Giá trị nghiệm thu các sản phẩm trong đợt',full:true,html:grid},
      {key:'att',label:'Biên bản nghiệm thu sản phẩm (bản scan PDF, ảnh)',type:'attach',col:'vbatches',kind:'Biên bản nghiệm thu',full:true}],
    onSave:async v=>{ const err=$('#mform_err'); const lines=[...$('#ov').querySelectorAll('.vb-grid tbody tr')].map(tr=>({id:tr.dataset.b, a:N(tr.querySelector('[data-k=a]').value)})); const bad=[];
      if(!lines.some(l=>l.a)){ err.textContent='Chưa nhập giá trị nghiệm thu cho sản phẩm nào.'; return false; }
      lines.forEach(l=>{ const x=get('boq',l.id); if(l.a<0) bad.push(x.code+' (số âm)'); else if(prevAcc(x)+l.a>val(x)+0.5) bad.push(`${x.code}: lũy kế ${fmtVND(prevAcc(x)+l.a)} đ vượt giá trị sản phẩm ${fmtVND(val(x))} đ`); });
      if(bad.length){ err.textContent='Không lưu được: '+bad.slice(0,3).join('; ')+(bad.length>3?'…':'')+'. Cần phụ lục điều chỉnh hợp đồng trước.'; return false; }
      if(D('vbatches').some(o=>o.contractId===cid && o.id!==(b&&b.id) && norm(o.name)===norm(v.name))){ err.textContent='Hợp đồng đã có đợt tên "'+v.name+'".'; return false; }
      const rec=await save('vbatches',{...(b||{}), contractId:cid, name:v.name, number:v.number, date:v.date, note:v.note});
      for(const l of lines){ const old=cur(l.id); const x=get('boq',l.id);
        if(!l.a){ if(old) await Store.del('volumes', old.id); continue; }
        const q=l.a/(N(x.price)||1);
        await save('volumes',{...(old||{}), contractId:cid, boqId:l.id, batchId:rec.id, date:v.date, period:v.name, note:v.number||'', doneQty:q, acceptedQty:q}); }
      return rec; }});
  const ov=$('#ov'); const tb=ov.querySelector('.vb-grid tbody');
  const recalc=()=>{ let ta=0; tb.querySelectorAll('tr').forEach(tr=>{ const x=get('boq',tr.dataset.b); const a=N(tr.querySelector('[data-k=a]').value); ta+=a; tr.classList.toggle('bad', prevAcc(x)+a>val(x)+0.5); }); $('#vb_ta',ov).textContent=fmtVND(ta); };
  tb.addEventListener('input', recalc); recalc();
}
const planFields=(cid)=>[{key:'contractId',label:'Hợp đồng',type:'select',options:()=>contractOpts(S.pid, cid?cidPhase(cid):routePh()),req:true,full:true,def:cid},{key:'phase',label:'Đợt thanh toán',req:true},{key:'planDate',label:'Thời gian dự kiến',type:'date',req:true},{key:'amount',label:'Giá trị kế hoạch (đồng)',type:'money',req:true},{key:'note',label:'Ghi chú',type:'textarea'},{key:'att',label:'QĐ giao kế hoạch vốn, văn bản đăng ký kế hoạch',type:'attach',col:'payplans'}];
ACT['add-plan']=(cid)=>openForm({wf:'payplans', title:'Thêm kế hoạch thanh toán', fields:planFields(cid), onSave:v=>save('payplans',v,v.phase)});
ACT['edit-payplans']=(id)=>openForm({wf:'payplans', title:'Cập nhật kế hoạch thanh toán', fields:planFields(), value:get('payplans',id), onSave:v=>save('payplans',v,v.phase)});
const payFields=(cid, rec)=>[{key:'contractId',label:'Hợp đồng',type:'select',options:()=>contractOpts(S.pid, cid?cidPhase(cid):routePh()),req:true,full:true,def:cid},{key:'number',label:'Số hồ sơ',req:true},{key:'date',label:'Ngày',type:'date',req:true,def:TODAY},
  {key:'kind',label:'Loại thanh toán',type:'select',options:()=>catalog('Loại thanh toán'),req:true},{key:'statusInfo',type:'html',label:'Trạng thái',html:`<div style="padding:7px 0">${rec? wfPill('payments',rec) : pill('Đề nghị')}<div class="small muted" style="margin-top:4px">Trạng thái tự chuyển theo các nút Trình duyệt, Duyệt, Xác nhận đã chi.</div></div>`},
  {key:'amount',label:'Giá trị (đồng)',type:'money',req:true},{key:'payPlanId',label:'Thuộc đợt kế hoạch thanh toán',type:'select',dep:'contractId',full:true,options:c=>D('payplans').filter(p=>p.contractId===c).sort(by('planDate')).map(p=>[p.id, `${p.phase} · hạn ${fmtDate(p.planDate)} · ${fmtVND(p.amount)} đ · ${planState(p).t}`])},{key:'content',label:'Nội dung',full:true},{key:'att',label:'Bộ hồ sơ thanh toán (giấy đề nghị, bảng xác định giá trị, biên bản nghiệm thu…)',type:'attach',col:'payments',kind:'Hồ sơ đề nghị thanh toán'}];
async function payCheck(v, self){ /* trả false để giữ biểu mẫu mở */ const c=get('contracts',v.contractId); const live=p=>p.contractId===c.id && p.id!==(self&&self.id) && p.status!=='Từ chối' && !wfReturned('payments',p);
  const others=sum(D('payments').filter(live),payAmt); if(v.kind!==PAY_RECOVER && others+N(v.amount)>contractValue(c)+1){ $('#mform_err').textContent=`Tổng giá trị thanh toán (${fmtVND(others+N(v.amount))} đ) vượt giá trị hợp đồng (${fmtVND(contractValue(c))} đ). Hồ sơ bị trả lại không tính vào hạn mức; hồ sơ đang lập, chờ duyệt, đã trình Kho bạc và đã chi đều được tính.`; return false; }
  /* Mục 31: thanh toán khối lượng hoàn thành không vượt giá trị đã nghiệm thu (đợt nghiệm thu đã duyệt). Khi lập chỉ nhắc; khi trình, duyệt máy chủ sẽ chặn. */
  /* HĐ không lập bảng khối lượng chi tiết (tư vấn, mua sắm, dịch vụ) chỉ kiểm soát trần giá trị hợp đồng */
  if(payIsVol(v) && contractHasBoq(c.id)){ const acc=contractAcc(c.id), before=sum(D('payments').filter(p=>live(p) && payIsVol(p)),'amount'), room=Math.max(0, acc-before);
    const key=c.id+'|'+N(v.amount); const f=$('#mform');
    if(before+N(v.amount)>acc+1 && !(f && f.dataset.warned===key)){ if(f) f.dataset.warned=key;
      $('#mform_err').innerHTML=`Lũy kế thanh toán khối lượng sẽ là ${fmtVND(before+N(v.amount))} đ, vượt giá trị đã nghiệm thu được duyệt ${fmtVND(acc)} đ; hồ sơ này chỉ được thanh toán tối đa ${fmtVND(room)} đ. Bấm Lưu lần nữa để vẫn lưu dự thảo (phần mềm sẽ không cho trình duyệt khi chưa đủ khối lượng nghiệm thu).`; return false; } }
  return true; }
ACT['add-pay']=(cid)=>openForm({wf:'payments', title:'Lập hồ sơ thanh toán', fields:payFields(cid), onSave:async v=>await payCheck(v)? save('payments', {...v, status:'Đề nghị'}, v.number):false});
ACT['edit-payments']=(id)=>{ const o=get('payments',id); openForm({wf:'payments', title:'Cập nhật hồ sơ thanh toán', fields:payFields(null,o), value:o, onSave:async v=>await payCheck(v,o)? save('payments', {...v, status:o.status}, v.number):false}); };
ACT['pay-done']=(id)=>{ const p=get('payments',id);
  openForm({title:'Xác nhận đã chi: '+p.number, narrow:true, submit:'Xác nhận đã chi', value:{...p, paidDate:TODAY},
    fields:[{key:'info',type:'html',label:'',full:true,html:`<p style="margin:0">Hồ sơ <b>${esc(p.number)}</b> đã được Kho bạc chi <b>${fmtVND(p.amount)} đồng</b>?</p>`},{key:'paidDate',label:'Ngày Kho bạc chi',type:'date',req:true,full:true},{key:'att',label:'Chứng từ Kho bạc (giấy rút vốn, ủy nhiệm chi…)',type:'attach',col:'payments',kind:'Chứng từ Kho bạc',cur:null,full:true}],
    onSave:v=>save('payments',{...v, status:'Đã thanh toán'}, p.number+' đã thanh toán')}); };

/* ===== BÁO CÁO, THỐNG KÊ (UC43–48) ===== */
const REPORTS = [
  ['tonghop','Báo cáo tổng hợp tình hình thực hiện dự án'],['tiendo','Báo cáo tiến độ thực hiện dự án và các gói thầu'],['hopdong','Báo cáo tình hình thực hiện hợp đồng'],
  ['khoiluong','Báo cáo khối lượng thực hiện, nghiệm thu và thanh toán'],['thoigian','Báo cáo tổng hợp theo dự án, gói thầu và thời gian'],
  ['giaingan','Báo cáo tình hình giải ngân kế hoạch vốn đầu tư công'],['quyettoan','Báo cáo tình hình quyết toán dự án hoàn thành']];
function buildReport(type, f){
  const ps=projects().filter(p=>inFilter(p.id) && (!f.pid||p.id===f.pid));
  const pids=ps.map(p=>p.id);
  const ks=D('packages').filter(k=>pids.includes(k.projectId) && (!f.kid||k.id===f.kid));
  const cs=D('contracts').filter(c=>ks.some(k=>k.id===c.packageId));
  const upto=f.to||null;
  if(type==='tonghop') return {head:['Mã dự án','Tên dự án','Trạng thái','Tổng mức đầu tư','Số gói thầu','Giá trị hợp đồng','Giá trị thực hiện','Giá trị nghiệm thu','Đã thanh toán','Giải ngân/TMĐT (%)','Tiến độ thực tế (%)','Tiến độ kế hoạch (%)'], money:[3,5,6,7,8],
    rows:ps.map(p=>{ const c=cs.filter(x=>contractPid(x)===p.id); return [p.code,p.name,p.status,N(p.tmdt),ks.filter(k=>k.projectId===p.id).length,sum(c,contractValue),sum(c,x=>contractDone(x.id,upto)),sum(c,x=>contractAcc(x.id,upto)),sum(c,x=>contractPaid(x.id,upto)),+pct(sum(c,x=>contractPaid(x.id,upto)),p.tmdt).toFixed(2),+projProgress(p.id).toFixed(1),+projExpected(p.id).toFixed(1)]; })};
  if(type==='tiendo'){ const ss=SCHED().filter(s=>ks.some(k=>k.id===s.packageId)).sort((a,b)=>((pkgOf(a.packageId)||{}).code+a.planStart).localeCompare((pkgOf(b.packageId)||{}).code+b.planStart));
    return {head:['Dự án','Gói thầu','Hạng mục','Bắt đầu KH','Kết thúc KH','Trọng số','Kế hoạch đến nay (%)','Thực tế (%)','Chênh lệch (%)','Tình trạng'], rows:ss.map(s=>[(projOf(s.projectId)||{}).code,(pkgOf(s.packageId)||{}).code,s.name,fmtDate(s.planStart),fmtDate(s.planEnd),N(s.weight),+expectedPct(s).toFixed(1),N(s.progress),+(N(s.progress)-expectedPct(s)).toFixed(1),schedState(s).t])}; }
  if(type==='hopdong') return {head:['Số hợp đồng','Gói thầu','Nhà thầu','Ngày ký','Giá trị ký kết','Điều chỉnh','Giá trị sau điều chỉnh','Thời hạn','Thời gian đã qua (%)','Giá trị thực hiện','Thực hiện (%)','Giá trị nghiệm thu lũy kế','Đã thanh toán','Còn lại'], money:[4,5,6,9,11,12,13],
    rows:cs.map(c=>{ const cv=contractValue(c), e=contractEnd(c); const d=contractDone(c.id,upto); return [c.number,(pkgOf(c.packageId)||{}).code,c.contractor,fmtDate(c.signDate),N(c.value),cv-N(c.value),cv,fmtDate(c.start)+' – '+fmtDate(e),+Math.min(100,pct(Math.max(0,days(c.start,upto||TODAY)),days(c.start,e))).toFixed(1),d,+pct(d,cv).toFixed(1),contractAcc(c.id,upto),contractPaid(c.id,upto),cv-contractPaid(c.id,upto)]; })};
  if(type==='khoiluong'){ const bq=D('boq').filter(b=>cs.some(c=>c.id===b.contractId)).sort((a,b)=>(a.contractId+a.code).localeCompare(b.contractId+b.code));
    const inR=v=>(!f.from||v.date>=f.from)&&(!f.to||v.date<=f.to);
    /* Đơn giá không cộng ở dòng Tổng cộng (khác đơn vị tính); thêm Thành tiền hợp đồng, Giá trị thực hiện lũy kế để đối soát */
    return {head:['Hợp đồng','Mã hiệu','Nội dung công việc','ĐVT','KL hợp đồng','Đơn giá','Thành tiền hợp đồng','KL thực hiện kỳ','KL nghiệm thu kỳ','KL thực hiện lũy kế','KL nghiệm thu lũy kế','Giá trị thực hiện lũy kế','Giá trị nghiệm thu lũy kế','Thực hiện (%)'], money:[5,6,11,12], total:[6,11,12],
      rows:bq.map(b=>{ const vs=D('volumes').filter(v=>v.boqId===b.id); const dq=sum(vs.filter(v=>!f.to||v.date<=f.to),'doneQty'), aq=sum(vs.filter(v=>!f.to||v.date<=f.to),'acceptedQty'); return [(get('contracts',b.contractId)||{}).number,b.code,b.name,b.unit,N(b.qty),N(b.price),N(b.qty)*N(b.price),sum(vs.filter(inR),'doneQty'),sum(vs.filter(inR),'acceptedQty'),dq,aq,dq*N(b.price),aq*N(b.price),+pct(dq,b.qty).toFixed(1)]; })}; }
  if(type==='giaingan'){ const Y=(f.to||TODAY).slice(0,4), upto=f.to||(Y===TODAY.slice(0,4)?TODAY:Y+'-12-31');
    return {head:['Mã dự án','Tên dự án','Vai trò của Ban','Nguồn vốn','KH trung hạn','Kế hoạch vốn năm '+Y,'Giải ngân đến '+fmtDate(upto),'Tỷ lệ giải ngân (%)','Kịch bản đến kỳ (%)','Chênh lệch (%)'], money:[4,5,6],
      rows:ps.map(p=>{ const plan=capPlan(p.id,Y), d=disbursed(p.id,Y,upto), tg=capTargetAt(p.id,Y,upto); return [p.code,p.name,p.boardRole||'',p.capital||'',capMidTerm(p.id),plan,d,+pct(d,plan).toFixed(2),+tg.toFixed(1),+(pct(d,plan)-tg).toFixed(2)]; }).filter(r=>r[4]||r[5]||r[6])}; }
  if(type==='quyettoan') return {head:['Mã dự án','Tên dự án','Trạng thái dự án','Ngày hoàn thành','Hạn lập quyết toán','Ngày trình','Giá trị đề nghị','Giá trị thẩm tra','Giá trị phê duyệt','Quyết định phê duyệt','Ngày tất toán','Tình trạng'], money:[6,7,8],
    rows:ps.flatMap(p=>{ const xs=D('settlements').filter(x=>x.projectId===p.id); if(!xs.length) return /hoàn thành|bàn giao|quyết toán/i.test(p.status||'')? [[p.code,p.name,p.status,'','','',0,0,0,'','','Chưa lập hồ sơ quyết toán']] : [];
      return xs.map(x=>[p.code,p.name,p.status,fmtDate(x.completedDate),fmtDate(x.deadline),fmtDate(x.submittedDate),N(x.proposedValue),N(x.auditedValue),N(x.approvedValue),(x.number||'')+(x.approvalDate?' ngày '+fmtDate(x.approvalDate):''),fmtDate(x.closedDate),settleState(x).t]); })};
  // theo thời gian: gom theo tháng
  const m={}; const inR=d=>(!f.from||d>=f.from)&&(!f.to||d<=f.to);
  D('volumes').filter(v=>cs.some(c=>c.id===v.contractId) && inR(v.date)).forEach(v=>{ const b=get('boq',v.boqId); if(!b) return; const c=get('contracts',v.contractId); const key=v.date.slice(0,7)+'|'+c.packageId; const o=m[key]=m[key]||{dv:0,av:0,pd:0,pid:contractPid(c),kid:c.packageId}; o.dv+=N(v.doneQty)*N(b.price); o.av+=N(v.acceptedQty)*N(b.price); });
  /* Gói thầu phân biệt theo mã gói (gắn với dự án), không theo ký hiệu chữ; kỳ giải ngân theo ngày Kho bạc chi */
  D('payments').filter(p=>p.status==='Đã thanh toán' && cs.some(c=>c.id===p.contractId) && inR(payDay(p))).forEach(p=>{ const c=get('contracts',p.contractId); const key=payDay(p).slice(0,7)+'|'+c.packageId; const o=m[key]=m[key]||{dv:0,av:0,pd:0,pid:contractPid(c),kid:c.packageId}; o.pd+=payAmt(p); });
  const pc=o=>(projOf(o.pid)||{}).code||'', kc=o=>(pkgOf(o.kid)||{}).code||'';
  return {head:['Tháng','Dự án','Gói thầu','Giá trị thực hiện','Giá trị nghiệm thu','Giá trị thanh toán'], money:[3,4,5], rows:Object.entries(m).sort((a,b)=>a[0].slice(0,7).localeCompare(b[0].slice(0,7)) || (pc(a[1])+kc(a[1])).localeCompare(pc(b[1])+kc(b[1]))).map(([k,o])=>{ const mo=k.slice(0,7); return [mo.slice(5)+'/'+mo.slice(0,4),pc(o),kc(o),o.dv,o.av,o.pd]; })};
}
/* Gói thầu đang chọn không thuộc dự án đang xem (vừa đổi dự án) thì tự trả về "Tất cả gói thầu" */
function rptFilter(){ const f={pid:S.pid||S.f.bcp||'', kid:S.f.bck||'', from:S.f.bcf||'', to:S.f.bctt||''};
  if(f.kid && !pkgOpts(f.pid).some(o=>o[0]===f.kid)){ f.kid=''; S.f.bck=''; } return f; }
/* Cột được cộng ở dòng Tổng cộng: mặc định các cột tiền; báo cáo có cột đơn giá thì khai báo riêng (total) */
const rptTotalCols = R => R.total || R.money || [];
VIEWS['bao-cao']=()=>{
  const type=S.f.bct||'tonghop'; const f=rptFilter();
  const R=buildReport(type,f); const q=S.f.bcq||''; const rows=R.rows.filter(r=>!q||norm(r.join(' ')).includes(norm(q)));
  const money=R.money||[]; const isNum=(v)=>typeof v==='number';
  const tc=rptTotalCols(R); const totals=R.head.map((h,i)=> i===0?'Tổng cộng': tc.includes(i)? fmtVND(sum(rows,r=>r[i])) : '');
  const title=REPORTS.find(r=>r[0]===type)[1];
  return `<div class="head"><div class="grow"><h1>Báo cáo, thống kê</h1><p>Chọn loại báo cáo, lọc theo dự án, gói thầu, thời gian rồi in hoặc xuất ra Excel, PDF, CSV</p></div><div class="toolbar" style="margin:0"><button class="btn" data-act="export-report-pdf" title="Mở hộp thoại in; chọn máy in hoặc Lưu thành PDF">In / Xuất PDF</button><button class="btn" data-act="export-report-csv">Xuất CSV</button><button class="btn" data-act="export-report-json" title="Tệp dữ liệu JSON để chia sẻ, liên thông với phần mềm khác">Xuất JSON</button><button class="btn primary" data-act="export-report">Xuất Excel</button></div></div>
  <div class="card"><div class="toolbar filters"><select data-f="bct" aria-label="Loại báo cáo" style="flex:1 1 320px;max-width:520px">${opts(REPORTS,type)}</select>
    ${!S.pid?`<select data-f="bcp" aria-label="Dự án">${opts(projOpts(),f.pid,'Tất cả dự án')}</select>`:''}<select data-f="bck" aria-label="Gói thầu">${opts(pkgOpts(f.pid),f.kid,'Tất cả gói thầu')}</select>
    <label class="small muted">Từ <input type="date" data-f="bcf" value="${esc(f.from)}"></label><label class="small muted">Đến <input type="date" data-f="bctt" value="${esc(f.to)}"></label><input type="search" data-f="bcq" value="${esc(q)}" placeholder="Tra cứu trong báo cáo…" aria-label="Tra cứu"></div></div>
  <div class="card"><div class="ch"><h2>${esc(title)}</h2><span class="small muted">${rows.length} dòng, lập ngày ${fmtDate(TODAY)}${f.from||f.to?', kỳ báo cáo '+fmtDate(f.from)+' – '+fmtDate(f.to):''}</span></div>
  ${rows.length?`<div class="tw"><table><thead><tr>${R.head.map((h,i)=>`<th class="${isNum(R.rows[0]&&R.rows[0][i])?'r':''}">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((v,i)=>`<td class="${isNum(v)?'r':''}">${isNum(v)?(money.includes(i)?fmtVND(v):fmtN(v,2)):esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>${money.length?`<tfoot><tr>${totals.map((t,i)=>`<td class="${money.includes(i)?'r':''}">${t}</td>`).join('')}</tr></tfoot>`:''}</table></div>`:emptyBox('Không có số liệu phù hợp bộ lọc.')}</div>`;
};
/** Số liệu báo cáo đang xem (cùng bộ lọc, tra cứu trên màn hình) để xuất Excel, PDF, CSV. */
function reportNow(){
  const type=S.f.bct||'tonghop'; const f=rptFilter();
  const R=buildReport(type,f); const q=S.f.bcq||''; const rows=R.rows.filter(r=>!q||norm(r.join(' ')).includes(norm(q)));
  const name=REPORTS.find(r=>r[0]===type)[1];
  const sub=BR.reportOrg+' · Lập ngày '+fmtDate(TODAY)+(f.pid?' · '+(projOf(f.pid)||{}).code:'')+(f.from||f.to?' · Kỳ '+fmtDate(f.from)+' – '+fmtDate(f.to):'');
  const money=R.money||[]; const tc=rptTotalCols(R); const tot=R.head.map((h,i)=>i===0?'Tổng cộng':tc.includes(i)?sum(rows,r=>r[i]):'');
  return {type, f, R, rows, name, title:name.toUpperCase(), sub, money, tot};
}
ACT['export-report']=()=>{
  const x=reportNow();
  exportXlsx(`BaoCao_${x.type}_${TODAY}.xlsx`, [{name:'Bao cao', title:x.title, sub:x.sub, head:x.R.head, money:x.money, total:!!x.money.length, rows:[...x.rows, ...(x.money.length?[x.tot]:[])]}]);
  log('Xuất báo cáo','logs',x.name);
};
ACT['export-report-json']=()=>{ const x=reportNow(); exportJson(`BaoCao_${x.type}_${TODAY}.json`, {title:x.name, sub:x.sub, head:x.R.head, rows:x.rows}); log('Xuất báo cáo JSON','logs',x.name); };
/** CSV (UTF-8 có BOM để Excel mở đúng tiếng Việt, phân cách dấu phẩy, số không định dạng). */
ACT['export-report-csv']=()=>{
  const x=reportNow(); const cell=v=>{ const t=v==null?'':String(v); return /[",\n;]/.test(t)? '"'+t.replace(/"/g,'""')+'"' : t; };
  const lines=[x.R.head, ...x.rows, ...(x.money.length?[x.tot]:[])].map(r=>r.map(cell).join(','));
  const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=`BaoCao_${x.type}_${TODAY}.csv`; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1000);
  log('Xuất báo cáo CSV','logs',x.name);
};
/** In / lưu PDF: trang A4 (tự xoay ngang khi bảng nhiều cột) có tên cơ quan, quốc hiệu, tiêu đề, bảng số liệu, dòng tổng, khung ký;
 *  người dùng chọn "Lưu thành PDF" trong hộp thoại in của trình duyệt. */
function reportPrintHTML(x){
  const isNum=v=>typeof v==='number'; const land=x.R.head.length>6;
  const fmt=(v,i)=>isNum(v)?(x.money.includes(i)?fmtVND(v):fmtN(v,2)):esc(v??'');
  const d=TODAY.split('-');
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(x.name)}</title><style>
  @page{size:A4 ${land?'landscape':'portrait'}; margin:14mm 12mm}
  body{font:12.5px/1.4 "Times New Roman",Times,serif; color:#000; margin:0}
  .hd{display:grid; grid-template-columns:1fr 1.2fr; text-align:center; margin-bottom:14px}
  .hd b{display:block} .hd .u{display:inline-block; border-top:1px solid #000; width:40%; margin-top:2px}
  h1{font-size:15px; text-align:center; margin:10px 0 2px} .sub{text-align:center; font-style:italic; margin-bottom:10px}
  table{width:100%; border-collapse:collapse} th,td{border:1px solid #000; padding:3px 5px; vertical-align:top} th{background:#eee; font-weight:bold}
  td.r{text-align:right; white-space:nowrap} tfoot td{font-weight:bold} thead{display:table-header-group} tr{page-break-inside:avoid}
  .sign{display:grid; grid-template-columns:1fr 1fr; text-align:center; margin-top:18px; page-break-inside:avoid} .sign i{display:block; margin-bottom:2px}
  .sign .sp{height:70px}
  </style></head><body>
  ${printHead()}
  <h1>${esc(x.title)}</h1><div class="sub">${esc(x.sub)}</div>
  <table><thead><tr><th>STT</th>${x.R.head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>
  <tbody>${x.rows.map((r,k)=>`<tr><td class="r">${k+1}</td>${r.map((v,i)=>`<td class="${isNum(v)?'r':''}">${fmt(v,i)}</td>`).join('')}</tr>`).join('')}</tbody>
  ${x.money.length?`<tfoot><tr><td></td>${x.tot.map((v,i)=>`<td class="${isNum(v)?'r':''}">${fmt(v,i)}</td>`).join('')}</tr></tfoot>`:''}</table>
  <div class="sign"><div><b>NGƯỜI LẬP</b><i>(Ký, ghi rõ họ tên)</i><div class="sp"></div>${esc(S.user&&S.user.name||'')}</div>
    <div><i>${printDate()}</i><b>${esc(BR.signReport)}</b><i>(Ký, ghi rõ họ tên, đóng dấu)</i><div class="sp"></div></div></div>
  </body></html>`;
}
ACT['export-report-pdf']=()=>{
  const x=reportNow(); if(!x.rows.length) return toast('Không có số liệu để in.','err');
  const fr=document.createElement('iframe'); fr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0'; fr.title='In báo cáo';
  document.body.appendChild(fr); const doc=fr.contentDocument; doc.open(); doc.write(reportPrintHTML(x)); doc.close();
  setTimeout(()=>{ try{ fr.contentWindow.focus(); fr.contentWindow.print(); }finally{ setTimeout(()=>fr.remove(), 60000); } }, 250);
  log('In / xuất PDF báo cáo','logs',x.name);
};

/* ===== QUẢN TRỊ HỆ THỐNG (UC49–53) ===== */
VIEWS['quan-tri']=()=>{
  const t=S.tab.qt||'users';
  const tabs=[['users','Người dùng'],['groups','Nhóm và phân quyền'],['cats','Danh mục dùng chung'],['logs','Nhật ký hoạt động'],['org','Thông tin đơn vị, giao diện'],['files','Kho tệp, thùng rác'],['dk','Dữ liệu đầu kỳ'],['sys','Sao lưu, hệ thống']];
  let body='';
  if(t==='users'){ const q=S.f.uq||'';
    const rows=D('users').filter(u=>has(u,q)).sort(by('username'));
    body=`<div class="card"><div class="ch"><h2>Người dùng</h2><input type="search" data-f="uq" value="${esc(q)}" placeholder="Tìm người dùng…" aria-label="Tìm người dùng" style="max-width:260px"><button class="btn primary sm" data-act="add-user">+ Thêm người dùng</button></div>
    ${table([{h:'Tên đăng nhập',f:r=>`<span class="num">${esc(r.username)}</span>`},{h:'Họ và tên',f:r=>`${esc(r.name)}${r.id===Store.meta.ownerId?' <span class="pill acc" title="Được quản lý các tài khoản quản trị khác">Quản trị chính</span>':''}`},{h:'Đơn vị',k:'unit'},{h:'Nhóm',f:r=>esc((get('groups',r.groupId)||{}).name||'—')},{h:'Trạng thái',f:r=>r.active===false?pill('Đã khóa','bad'):pill('Hoạt động','ok')},{h:'Xác thực 2 lớp',f:r=>r.twoFactor?pill('Đã bật','ok'):(get('groups',r.groupId)||{}).admin?pill('Chờ thiết lập','warn'):'<span class="muted small">Không bắt buộc</span>'},{h:'Đăng nhập gần nhất',f:r=>`<span class="num small">${fmtDT(r.lastLogin)}</span>`}], rows,
      {actions:r=>userBtns(r)})}
    <p class="small muted" style="margin:10px 0 0">Quản trị chính là tài khoản quản trị duy nhất được tạo, sửa, khóa, xóa, đặt lại mật khẩu và xác thực 2 lớp cho các quản trị viên khác. Quản trị viên khác chỉ tự sửa tài khoản của mình và quản lý tài khoản nghiệp vụ.</p></div>`; }
  else if(t==='groups') body=`<div class="card"><div class="ch"><h2>Nhóm người dùng và phân quyền</h2><button class="btn primary sm" data-act="add-group">+ Thêm nhóm</button></div>
    ${table([{h:'Nhóm',f:r=>`<b style="font-weight:600">${esc(r.name)}</b><div class="small muted">${esc(r.desc||'')}</div>`},{h:'Số người dùng',r:1,f:r=>D('users').filter(u=>u.groupId===r.id).length},{h:'Quyền chức năng',f:r=>r.admin?pill('Toàn quyền','acc'):MODULES.map(m=>{ const p=(r.perms||{})[m.key]; return p==='edit'?pill(m.label,'ok'):p==='view'?pill(m.label):''; }).join(' ')},{h:'Phạm vi dữ liệu',f:r=>r.admin||!(r.scope||[]).length?'Tất cả dự án':(r.scope||[]).map(id=>esc((get('projects',id)||{}).code||id)).join(', ')}], D('groups').sort(by('name')),
      {actions:r=>`<button class="btn sm ghost" data-act="edit-groups" data-id="${r.id}">Phân quyền</button>${r.id!=='g-admin'?`<button class="btn sm ghost danger" data-act="del" data-col="groups" data-id="${r.id}">Xóa</button>`:''}`})}
    <p class="small muted" style="margin:10px 0 0">Màu xanh: được xem và cập nhật · màu xám: chỉ xem · không hiển thị: không truy cập. Phạm vi dữ liệu giới hạn các dự án nhóm được khai thác.</p></div>`;
  else if(t==='cats'){ const types=[...new Set(D('catalogs').map(c=>c.type))].sort(); const ct=S.f.cty&&types.includes(S.f.cty)?S.f.cty:types[0];
    body=`<div class="grid g3"><div class="card"><h2>Loại danh mục</h2><div class="list">${types.map(x=>`<button class="btn ${x===ct?'primary':'ghost'}" style="justify-content:space-between" data-act="pick-cat" data-id="${esc(x)}">${esc(x)} <span class="num">${D('catalogs').filter(c=>c.type===x).length}</span></button>`).join('')}</div></div>
    <div class="card span2"><div class="ch"><h2>${esc(ct||'')}</h2><button class="btn primary sm" data-act="add-cat" data-id="${esc(ct||'')}">+ Thêm giá trị</button></div>${table([{h:'Thứ tự',r:1,k:'order'},{h:'Giá trị',k:'value'}], D('catalogs').filter(c=>c.type===ct).sort(by('order')), {actions:r=>editBtns('quan-tri','catalogs',r.id)})}</div></div>`; }
  else if(t==='logs'){ const q=S.f.lq||'', um=S.f.lu||'';
    const rows=D('logs').filter(l=>(!um||l.userId===um) && has(l,q)).sort(by('ts',-1));
    body=`<div class="card"><div class="ch"><h2>Nhật ký hoạt động</h2><select data-f="lu" aria-label="Người dùng">${opts(D('users').map(u=>[u.id,u.username]),um,'Mọi người dùng')}</select><input type="search" data-f="lq" value="${esc(q)}" placeholder="Tìm thao tác, đối tượng…" aria-label="Tìm nhật ký" style="max-width:260px"><button class="btn sm" data-act="export-logs">Xuất Excel</button></div>
    ${table([{h:'Thời gian',f:r=>`<span class="num small">${fmtDT(r.ts)}</span>`},{h:'Người dùng',f:r=>`${esc(r.fullname||'')} <span class="small muted num">${esc(r.username)}</span>`},{h:'Thao tác',f:r=>pill(r.action, r.action==='Xóa'?'bad':r.action==='Thêm mới'?'ok':r.action==='Đăng nhập'?'info':'')},{h:'Phân hệ',k:'module'},{h:'Đối tượng',k:'target'}], rows, {empty:'Chưa có hoạt động.'})}
    <p class="small muted" style="margin:8px 0 0">Máy chủ gửi 500 hoạt động gần nhất; dùng nút Xuất Excel hoặc bộ lọc để tra cứu.</p></div>`; }
  else if(t==='files') body=storageView();
  else if(t==='org') body=brandView();
  else if(t==='dk') body=openingView();
  else { const cnt=COLS.filter(c=>c!=='logs').map(c=>[COL_LABEL[c], D(c).length]);
    body=`<div class="grid g2"><div class="card"><h2>Thông tin hệ thống</h2><dl class="kv"><dt>Chế độ lưu trữ</dt><dd>Cơ sở dữ liệu tập trung trên máy chủ</dd><dt>Kho tệp đính kèm</dt><dd>Thư mục App_Data/files trên máy chủ (tối đa 500 MB mỗi tệp)</dd><dt>Ngày hệ thống</dt><dd>${fmtDate(TODAY)}</dd></dl>
      <h3 style="margin-top:14px">Số bản ghi</h3>${table([{h:'Loại dữ liệu',f:r=>esc(r[0])},{h:'Số bản ghi',r:1,f:r=>r[1]}], cnt.map(x=>Object.assign(x,{id:x[0]})))}</div>
      <div class="card"><h2>Sao lưu và phục hồi dữ liệu</h2><p class="muted">Tệp sao lưu .json chứa toàn bộ dữ liệu nghiệp vụ, danh mục, nhóm quyền, người dùng (mật khẩu đã mã hóa) và danh sách tệp đính kèm. Bản sao lưu đầy đủ (.zip) chứa thêm toàn bộ tệp đính kèm. Chỉ quản trị hệ thống được sao lưu, phục hồi.</p>
      <div class="toolbar"><button class="btn primary" data-act="backup">Tải tệp sao lưu dữ liệu (.json)</button><button class="btn" data-act="backup-full">Tải bản sao lưu đầy đủ kèm tệp (.zip)</button><button class="btn" data-act="restore">Phục hồi từ tệp sao lưu</button></div>
      <p class="small muted" style="margin-top:12px">Khi phục hồi, chọn đưa dữ liệu về đúng thời điểm sao lưu (hồ sơ nhập sau sẽ bị thay thế) hoặc chỉ ghi đè, bổ sung để giữ hồ sơ nhập sau thời điểm sao lưu.</p>
      <h3 style="margin-top:16px">Sao lưu tự động trên máy chủ</h3>${autoBackupView()}</div></div>`; }
  return `<div class="head"><div class="grow"><h1>Quản trị hệ thống</h1><p>${D('users').length} người dùng, ${D('groups').length} nhóm quyền</p></div></div>
  <div class="tabs">${tabs.map(([k,l])=>`<button class="${t===k?'on':''}" data-act="tab" data-g="qt" data-id="${k}">${l}</button>`).join('')}</div>${body}`;
};
/** Mục 19 (bản 1.7): quản trị viên không thao tác được trên tài khoản quản trị khác, trừ Quản trị chính. */
const isAdminUser = u => !!(get('groups',u.groupId)||{}).admin;
const iAmOwner = () => S.user && S.user.id===Store.meta.ownerId;
const canManageUser = u => u.id===S.user.id || !isAdminUser(u) || iAmOwner();
function userBtns(r){
  if(!canManageUser(r)) return '<span class="small muted">Chỉ Quản trị chính</span>';
  const me=r.id===S.user.id; let h=`<button class="btn sm ghost" data-act="edit-users" data-id="${r.id}">Sửa</button><button class="btn sm ghost" data-act="reset-pw" data-id="${r.id}">Đặt lại mật khẩu</button>`;
  if(!me){ if(r.twoFactor&&myGroup()?.admin) h+=`<button class="btn sm ghost" data-act="reset-2fa" data-id="${r.id}">Đặt lại 2 lớp</button>`;
    h+=`<button class="btn sm ghost" data-act="lock-user" data-id="${r.id}">${r.active===false?'Mở khóa':'Khóa'}</button><button class="btn sm ghost danger" data-act="del" data-col="users" data-id="${r.id}">Xóa</button>`;
    if(iAmOwner() && isAdminUser(r) && r.active!==false) h+=`<button class="btn sm ghost" data-act="owner-to" data-id="${r.id}">Chuyển giao quản trị chính</button>`; }
  return h; }
ACT['owner-to']=(id)=>{ const u=get('users',id); const need=!!(S.user&&S.user.twoFactor);
  openForm({title:'Chuyển giao quyền Quản trị chính', narrow:true, submit:'Chuyển giao', value:{}, fields:[{key:'info',type:'html',label:'',full:true,html:`<p style="margin:0">Chuyển quyền Quản trị chính cho <b>${esc(u.name)}</b> (${esc(u.username)})? Sau khi chuyển, bạn trở thành quản trị viên thường và không còn sửa được tài khoản quản trị khác.</p>`},
    ...(need?[{key:'code',label:'Mã xác thực 2 lớp của bạn',req:true,full:true}]:[])],
    onSave:async v=>{ const r=await api('POST','/api/users/'+encodeURIComponent(id)+'/owner',{code:v.code||''}); Store.meta.ownerId=r.ownerId; Store.soon(); return r; }}); };
const userFields=(isNew)=>[{key:'username',label:'Tên đăng nhập',req:true},{key:'name',label:'Họ và tên',req:true},{key:'unit',label:'Đơn vị / phòng ban'},{key:'groupId',label:'Nhóm người dùng',type:'select',options:()=>D('groups').filter(g=>!g.admin||iAmOwner()||(S.f._ug===g.id)).map(g=>[g.id,g.name]),req:true},{key:'email',label:'Thư điện tử'},{key:'phone',label:'Điện thoại'},{key:'orgId',label:'Thuộc đơn vị (nhà thầu, đơn vị giám sát)',type:'select',full:true,options:()=>orgList().filter(o=>o.active!==false).map(o=>[o.id,o.name+' ('+ORG_KIND[o.kind]+')']),hint:'Để trống với cán bộ của Ban. Tài khoản thuộc đơn vị chỉ thấy các gói thầu mà đơn vị được chọn.'},...(isNew?[{key:'pw',label:'Mật khẩu ban đầu (≥ 8 ký tự, có chữ và số)',type:'password',req:true,full:true}]:[])];
ACT['add-user']=()=>{ S.f._ug=''; return openForm({title:'Thêm người dùng', fields:userFields(true), onSave:async v=>{ v.username=v.username.toLowerCase(); const err=$('#mform_err');
  if(!/^[a-z0-9._-]{3,32}$/.test(v.username)){ err.textContent='Tên đăng nhập 3–32 ký tự: chữ thường không dấu, số, dấu chấm, gạch.'; return false; }
  if(D('users').some(u=>u.username===v.username)){ err.textContent='Tên đăng nhập đã tồn tại.'; return false; }
  if(!pwOk(v.pw)){ err.textContent='Mật khẩu cần ≥ 8 ký tự, gồm cả chữ và số.'; return false; }
  const r=await api('POST','/api/users',{...v, password:v.pw}); Store.setLocal('users',r); }}); };
ACT['edit-users']=(id)=>{ S.f._ug=(get('users',id)||{}).groupId; return openForm({title:'Cập nhật người dùng', fields:userFields(false), value:get('users',id), onSave:async v=>{ v.username=v.username.toLowerCase(); if(D('users').some(u=>u.username===v.username&&u.id!==id)){ $('#mform_err').textContent='Tên đăng nhập đã tồn tại.'; return false; } const r=await api('PUT','/api/users/'+encodeURIComponent(id),v); Store.setLocal('users',r); if(id===S.user.id) S.user={...S.user,...r}; }}); };
ACT['reset-pw']=(id)=>{ const u=get('users',id); openForm({title:'Đặt lại mật khẩu cho '+u.username, narrow:true, fields:[{key:'pw',label:'Mật khẩu mới (≥ 8 ký tự, có chữ và số)',type:'password',req:true,full:true}], onSave:async v=>{ if(!pwOk(v.pw)){ $('#mform_err').textContent='Mật khẩu cần ≥ 8 ký tự, gồm cả chữ và số.'; return false; } await api('POST','/api/users/'+encodeURIComponent(id)+'/reset-password',{password:v.pw}); }}); };
ACT['reset-2fa']=async(id)=>{ const u=get('users',id);
  if(!await confirmBox(`Đặt lại xác thực 2 lớp cho <b>${esc(u.username)}</b>? Dùng khi người dùng mất hoặc đổi điện thoại. Mã cũ và mã khôi phục hết hiệu lực; lần đăng nhập sau người dùng phải quét mã QR mới.`,'Đặt lại')) return;
  try{ const r=await api('POST','/api/users/'+encodeURIComponent(id)+'/reset-2fa'); Store.setLocal('users',r); toast('Đã đặt lại xác thực 2 lớp'); }catch(ex){ toast(errText(ex),'err'); } };
ACT['lock-user']=async(id)=>{ const u=get('users',id); try{ const r=await api('POST','/api/users/'+encodeURIComponent(id)+'/active',{active:u.active===false}); Store.setLocal('users',r); toast(r.active?'Đã mở khóa tài khoản':'Đã khóa tài khoản'); }catch(ex){ toast(errText(ex),'err'); } };
function groupForm(g){
  const permHtml=`<table class="perm"><thead><tr><th>Phân hệ</th><th>Không truy cập</th><th>Chỉ xem</th><th>Xem và cập nhật</th><th>Duyệt hồ sơ</th><th>Kiểm tra hồ sơ</th></tr></thead><tbody>${MODULES.map(m=>{ const gp=(g&&g.perms)||{}, p=gp[m.key]||'none'; const wfm=Object.values(WF).some(w=>w.mod===m.key); return `<tr><td>${esc(m.label)}</td>${['none','view','edit'].map(l=>`<td><input type="radio" name="perm_${m.key}" value="${l}" ${p===l?'checked':''} aria-label="${esc(m.label)} ${l}"></td>`).join('')}<td>${wfm?`<input type="checkbox" name="duyet_${m.key}" ${gp[m.key+':duyet']==='1'?'checked':''} aria-label="${esc(m.label)} duyệt hồ sơ" title="Duyệt, trả lại, thu hồi hồ sơ trình duyệt của phân hệ">`:''}</td><td>${wfm?`<input type="checkbox" name="kiemtra_${m.key}" ${gp[m.key+':kiemtra']==='1'?'checked':''} aria-label="${esc(m.label)} kiểm tra hồ sơ" title="Kiểm tra, xác nhận hồ sơ trước khi trình lãnh đạo duyệt (ví dụ tư vấn giám sát xác nhận khối lượng nghiệm thu)">`:''}</td></tr>`; }).join('')}</tbody></table><p class="small muted" style="margin:6px 0 0">Duyệt hồ sơ: duyệt phụ lục hợp đồng (Gói thầu và hợp đồng), kế hoạch tiến độ, đợt nghiệm thu khối lượng, hồ sơ thanh toán, biên bản nghiệm thu. Kiểm tra hồ sơ: xác nhận ở bước kiểm tra (nếu loại hồ sơ đó có bước kiểm tra), ví dụ tư vấn giám sát xác nhận khối lượng nghiệm thu. Người duyệt, người kiểm tra cần thêm quyền xem phân hệ.</p>`;
  openForm({title:g?'Phân quyền nhóm: '+g.name:'Thêm nhóm người dùng', value:g||{}, fields:[{key:'name',label:'Tên nhóm',req:true},{key:'desc',label:'Mô tả'},
    {key:'perm',label:'Phân quyền chức năng',type:'html',full:true,html:permHtml},{key:'scope',label:'Phạm vi dữ liệu: chỉ các dự án (để trống = tất cả dự án)',type:'checks',options:()=>D('projects').sort(by('code')).map(p=>[p.id,p.code])}],
    onSave:v=>{ const perms={}; MODULES.forEach(m=>{ const r=document.querySelector(`input[name="perm_${m.key}"]:checked`); perms[m.key]=r?r.value:'none'; const d=document.querySelector(`input[name="duyet_${m.key}"]`); if(d&&d.checked) perms[m.key+':duyet']='1'; const k=document.querySelector(`input[name="kiemtra_${m.key}"]`); if(k&&k.checked) perms[m.key+':kiemtra']='1'; }); if(!perms['tong-quan']||perms['tong-quan']==='none') perms['tong-quan']='view'; return save('groups',{...v, perms, admin:!!(g&&g.admin)}, v.name); }});
}
ACT['add-group']=()=>groupForm(null);
ACT['edit-groups']=(id)=>groupForm(get('groups',id));
ACT['pick-cat']=(id)=>{ S.f.cty=id; render(); };
ACT['add-cat']=(type)=>openForm({title:'Thêm giá trị danh mục', narrow:true, fields:[{key:'type',label:'Loại danh mục (nhập tên mới để tạo loại mới)',req:true,full:true,def:type},{key:'value',label:'Giá trị',req:true,full:true},{key:'order',label:'Thứ tự',type:'number',full:true,def:D('catalogs').filter(c=>c.type===type).length}], onSave:v=>save('catalogs',v,v.type+': '+v.value)});
ACT['edit-catalogs']=(id)=>openForm({title:'Sửa giá trị danh mục', narrow:true, fields:[{key:'value',label:'Giá trị',req:true,full:true},{key:'order',label:'Thứ tự',type:'number',full:true}], value:get('catalogs',id), onSave:v=>save('catalogs',v,v.type+': '+v.value)});
ACT['export-logs']=()=>exportXlsx(`NhatKyHoatDong_${TODAY}.xlsx`,[{name:'Nhat ky',title:'NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG',money:[],sub:'Xuất ngày '+fmtDate(TODAY),head:['Thời gian','Tên đăng nhập','Họ tên','Thao tác','Phân hệ','Đối tượng'],rows:D('logs').sort(by('ts',-1)).map(l=>[fmtDT(l.ts),l.username,l.fullname,l.action,l.module,l.target])}]);
ACT.backup=()=>{ const a=document.createElement('a'); a.href='/api/backup'; a.download=''; document.body.appendChild(a); a.click(); a.remove(); toast('Đang tạo tệp sao lưu…'); };
ACT['backup-full']=()=>{ const a=document.createElement('a'); a.href='/api/backup/full'; a.download=''; document.body.appendChild(a); a.click(); a.remove(); toast('Đang đóng gói dữ liệu và tệp đính kèm, có thể mất vài phút nếu kho tệp lớn…'); };
/* Dữ liệu quản trị tải riêng khi mở thẻ (kho tệp, sao lưu tự động) */
const ADM={};
function admLoad(key, url){ if(ADM[key]===undefined){ ADM[key]=null; api('GET',url).then(r=>{ ADM[key]=r; render(); }).catch(ex=>{ ADM[key]={error:errText(ex)}; render(); }); } return ADM[key]; }
function admReload(key){ delete ADM[key]; render(); }
function autoBackupView(){
  const b=admLoad('auto','/api/backup/auto'); if(!b) return '<p class="muted small">Đang tải…</p>'; if(b.error) return `<div class="alert bad">${esc(b.error)}</div>`;
  return `<p class="small muted" style="margin:0 0 8px">${b.enabled?`Hằng đêm từ ${b.hour} giờ, hệ thống tự ghi một bản sao lưu dữ liệu và chép thêm các tệp đính kèm mới vào thư mục sao lưu, giữ ${b.keep} bản gần nhất.`:'Sao lưu tự động đang tắt (Backup:Enabled = false trong appsettings.json).'} Thư mục: <span class="num">${esc(b.dir)}</span>. Nên cấu hình thư mục này trên ổ đĩa khác hoặc ổ mạng (Storage:BackupPath).</p>
  <div class="toolbar"><button class="btn sm" data-act="backup-now">Sao lưu lên máy chủ ngay</button></div>
  ${table([{h:'Bản sao lưu',f:r=>`<a href="/api/backup/auto/${encodeURIComponent(r.name)}">${esc(r.name)}</a>`},{h:'Thời điểm',f:r=>`<span class="num small">${fmtDT(r.createdAt)}</span>`},{h:'Dung lượng',r:1,f:r=>fmtSize(r.size)}], (b.items||[]).map(x=>({...x,id:x.name})), {empty:'Chưa có bản sao lưu tự động nào.'})}`;
}
ACT['backup-now']=async()=>{ toast('Đang sao lưu…'); const r=await api('POST','/api/backup/auto'); toast(`Đã sao lưu ${r.name}, chép thêm ${r.copied} tệp`); admReload('auto'); };
function storageView(){
  const st=admLoad('storage','/api/attachments/storage'); if(!st) return emptyBox('Đang tải thông tin kho tệp…'); if(st.error) return `<div class="alert bad">${esc(st.error)}</div>`;
  const colName=c=>COL_LABEL[c]||c;
  return `<div class="grid g4"><div class="card kpi"><div class="eyebrow">Tổng số tệp</div><div class="v">${fmtN(st.files)}</div></div><div class="card kpi"><div class="eyebrow">Dung lượng kho tệp</div><div class="v">${fmtSize(st.size)}</div></div>
    <div class="card kpi"><div class="eyebrow">Trong thùng rác</div><div class="v">${st.trash.length}</div><div class="s">Tự xóa hẳn sau ${st.trashDays} ngày</div></div><div class="card kpi"><div class="eyebrow">Tệp không còn sử dụng</div><div class="v">${st.orphans.count}</div><div class="s">${fmtSize(st.orphans.size)}</div></div></div>
  <div class="grid g2"><div class="card"><div class="ch"><h2>Tệp đính kèm theo loại dữ liệu</h2><button class="btn sm ghost" data-act="storage-reload">Làm mới</button></div>${table([{h:'Loại dữ liệu',k:'label'},{h:'Số tệp',r:1,f:r=>fmtN(r.count)},{h:'Dung lượng',r:1,f:r=>fmtSize(r.size)}], st.byCollection.map(x=>({...x,id:x.collection})), {empty:'Chưa có tệp đính kèm.'})}</div>
  <div class="card"><h2>Tệp không còn sử dụng</h2><p class="muted small">Tệp đã bị thay thế hoặc ảnh đã bỏ khỏi nhật ký, không còn bản ghi nào dùng tới (chỉ tính tệp tải lên quá 1 ngày).</p>${st.orphans.count?`<button class="btn danger" data-act="storage-cleanup">Dọn ${st.orphans.count} tệp (${fmtSize(st.orphans.size)})</button>`:'<p class="small">Không có tệp thừa.</p>'}</div></div>
  <div class="card"><h2>Thùng rác tệp đính kèm</h2>${table([{h:'Tệp',f:r=>`<a href="/api/files/${encodeURIComponent(r.fileId)}" target="_blank" rel="noopener">${esc(r.fileName)}</a>${r.kind?`<div class="small muted">${esc(r.kind)}</div>`:''}`},{h:'Thuộc',f:r=>esc(colName(r.collection))},{h:'Dung lượng',r:1,f:r=>fmtSize(r.size)},{h:'Người gỡ',k:'deletedBy'},{h:'Ngày gỡ',f:r=>`<span class="num small">${fmtDT(r.deletedAt)}</span>`}], st.trash,
    {actions:r=>`<button class="btn sm ghost" data-act="att-restore" data-id="${esc(r.id)}">Khôi phục</button><button class="btn sm ghost danger" data-act="att-purge" data-id="${esc(r.id)}">Xóa hẳn</button>`, empty:'Thùng rác trống.'})}</div>`;
}
ACT['storage-reload']=()=>admReload('storage');
ACT['att-restore']=async(id)=>{ await api('POST','/api/attachments/'+encodeURIComponent(id)+'/restore'); toast('Đã khôi phục tệp'); admReload('storage'); Store.load(); };
ACT['att-purge']=async(id)=>{ if(!await confirmBox('Xóa vĩnh viễn tệp này khỏi máy chủ? Không khôi phục được.')) return; await api('DELETE','/api/attachments/'+encodeURIComponent(id)+'/purge'); toast('Đã xóa vĩnh viễn'); admReload('storage'); };
ACT['storage-cleanup']=async()=>{ if(!await confirmBox('Xóa vĩnh viễn các tệp không còn bản ghi nào sử dụng?','Dọn tệp')) return; const r=await api('POST','/api/attachments/cleanup'); toast(`Đã dọn ${r.removed} tệp (${fmtSize(r.size)})`); admReload('storage'); };
const RESTORE_MODES=[['replace','Đưa dữ liệu về đúng thời điểm sao lưu (khuyến nghị)'],['merge','Chỉ ghi đè, bổ sung; giữ hồ sơ nhập sau thời điểm sao lưu']];
ACT.restore=()=>openForm({title:'Phục hồi dữ liệu từ tệp sao lưu', narrow:true, submit:'Phục hồi', fields:[{key:'file',label:'Tệp sao lưu .json',type:'files',accept:'.json,application/json',req:true,full:true},
  {key:'mode',label:'Cách phục hồi',type:'select',options:()=>RESTORE_MODES,def:'replace',req:true,full:true,hint:'Đưa về thời điểm sao lưu: hồ sơ nghiệp vụ nhập sau thời điểm đó bị xóa (tệp đính kèm vào thùng rác); phần mềm tự sao lưu dữ liệu hiện tại lên máy chủ trước. Tài khoản, nhóm quyền, danh mục, nhật ký luôn được giữ.'},
  {key:'confirm',label:'Gõ PHUC HOI để xác nhận',req:true,full:true}], onSave:async v=>{
  if(String(v.confirm||'').trim().toUpperCase()!=='PHUC HOI'){ $('#mform_err').textContent='Gõ đúng PHUC HOI để xác nhận.'; return false; }
  let o; try{ o=JSON.parse(await v.file[0].text()); }catch{ $('#mform_err').textContent='Tệp không đọc được.'; return false; }
  if(o.app!=='qlda-ttts'||!o.data){ $('#mform_err').textContent='Tệp không đúng định dạng sao lưu của phần mềm.'; return false; }
  $('#mform_err').textContent='Đang phục hồi…';
  const r=await api('POST','/api/backup',{...o, mode:v.mode||'replace'}); await Store.load();
  toast(r.mode==='replace'?`Đã đưa dữ liệu về thời điểm sao lưu: ${r.restored} bản ghi, bỏ ${r.removed} bản ghi phát sinh sau. Bản sao lưu trước khi phục hồi: ${r.backup}`:'Đã phục hồi '+r.restored+' bản ghi'); }});

/* ===== ỨNG DỤNG HIỆN TRƯỜNG TRÊN DI ĐỘNG (UC54–62) ===== */
VIEWS['hien-truong']=()=>{
  const tiles=[
    ['du-an','proj','Tra cứu dự án','Thông tin, hồ sơ, tình trạng'],['upd-quick','gantt','Cập nhật tiến độ','Nhập % hoàn thành hạng mục','tien-do'],['add-diary','book','Ghi nhật ký thi công','Kèm hình ảnh hiện trường','nhat-ky'],
    ['goi-thau','doc','Hợp đồng','Tra cứu hợp đồng, phụ lục'],['khoi-luong','ruler','Khối lượng','Thực hiện và nghiệm thu'],['thanh-toan','coin','Thanh toán','Giá trị đã thanh toán'],
    ['tong-quan','dash','Tổng quan','Bảng điều hành'],['bao-cao','chart','Báo cáo','Xem, xuất báo cáo'],['huong-dan','help','Hướng dẫn','Tài liệu, video hướng dẫn'],['chpw','key','Đổi mật khẩu','Bảo mật tài khoản'],['logout','out','Đăng xuất','Thoát khỏi hệ thống']];
  const my=D('diaries').filter(d=>inFilter(d.projectId)).sort(by('date',-1)).slice(0,3);
  return `<div class="head"><div class="grow"><div class="eyebrow">Xin chào</div><h1>${esc(S.user.name)}</h1><p>${esc((myGroup()||{}).name||'')}, ngày ${fmtDate(TODAY)}</p></div></div>
  <div class="tiles">${tiles.filter(t=>{ const mod=t[4]||t[0]; return ['chpw','logout'].includes(t[0]) || (t[4]? can(t[4],'edit') : can(mod)); }).map(([k,i,l,s,m])=>`<button class="tile" ${MODULES.some(x=>x.key===k)?`data-act="go" data-id="${k}"`:`data-act="${k}"`}>${ic(i)}<b>${l}</b><span>${s}</span></button>`).join('')}</div>
  ${my.length?`<div class="card"><h2>Nhật ký gần đây</h2><div class="list">${my.map(d=>`<div class="small"><b class="num">${fmtDate(d.date)}</b> · ${esc((pkgOf(d.packageId)||{}).code||'')} · ${esc(parseWorks(d.works)[0]?.name||'')}</div>`).join('')}</div></div>`:''}
  <p class="small muted">Trang này tối ưu cho điện thoại: mở địa chỉ phần mềm trên trình duyệt điện thoại hoặc ứng dụng QLDA TTTS (Android), đăng nhập bằng tài khoản được cấp.</p>`;
};
ACT['huong-dan']=()=>{ location.hash='huong-dan'; };
ACT['upd-quick']=()=>openForm({title:'Cập nhật tiến độ hiện trường', narrow:true, fields:[{key:'sid',label:'Hạng mục tiến độ',type:'select',req:true,full:true,options:()=>SCHED().filter(s=>inFilter(s.projectId)&&N(s.progress)<100).sort(by('planEnd')).map(s=>[s.id,(pkgOf(s.packageId)||{}).code+' · '+s.name+' ('+N(s.progress)+'%)'])},{key:'progress',label:'Tiến độ thực tế lũy kế (%)',type:'percent',req:true,full:true},{key:'note',label:'Ghi chú',type:'textarea'},{...PROG_ATT(null), rid:(r,v)=>v.sid, ref:TODAY, refFrom:null}],
  onSave:v=>{ const s=get('schedule',v.sid); const h=[...(s.history||[]).filter(x=>x.date!==TODAY), {date:TODAY, progress:v.progress, note:v.note||'', by:S.user.name}].sort(by('date')); return save('schedule',{...s, progress:v.progress, history:h, actualStart:s.actualStart||TODAY, actualEnd:v.progress>=100?TODAY:''}, s.name+' → '+v.progress+'%'); }});

/* ===== DANH MỤC CHỨC NĂNG (62 chức năng gốc + bổ sung cấp xã) ===== */
const UCS = [
 ['Quản lý dự án','du-an',['Danh sách dự án','Thêm, cập nhật thông tin dự án','Quản lý công việc thuộc dự án','Quản lý hồ sơ pháp lý thuộc dự án','Theo dõi tình trạng thực hiện dự án']],
 ['Mô hình hóa công trình','mo-hinh',['Quản lý file mô hình công trình','Cập nhật file mô hình công trình','Tìm kiếm','Quản lý thông tin các hạng mục công trình']],
 ['Quản lý gói thầu và hợp đồng','goi-thau',['Quản lý danh sách gói thầu','Quản lý hồ sơ pháp lý gói thầu','Quản lý thông tin hợp đồng','Theo dõi tiến độ thực hiện hợp đồng','Quản lý điều chỉnh, phụ lục hợp đồng']],
 ['Quản lý tiến độ','tien-do',['Lập kế hoạch tiến độ','Cập nhật tiến độ thực hiện','Theo dõi tiến độ theo dự án','Theo dõi tiến độ theo gói thầu','Cảnh báo chậm tiến độ']],
 ['Quản lý nhật ký thi công','nhat-ky',['Tạo và cập nhật nhật ký thi công','Quản lý thông tin công việc thực hiện','Cập nhật hình ảnh hiện trường','Theo dõi và tra cứu nhật ký']],
 ['Quản lý khối lượng','khoi-luong',['Quản lý khối lượng theo hợp đồng','Cập nhật khối lượng thực hiện','Theo dõi khối lượng nghiệm thu','Tổng hợp khối lượng thực hiện']],
 ['Quản lý thanh toán','thanh-toan',['Quản lý kế hoạch thanh toán','Quản lý hồ sơ thanh toán','Theo dõi giá trị đã thanh toán','Tổng hợp giá trị thanh toán']],
 ['Tổng quan điều hành','tong-quan',['Xem tổng quan tình hình thực hiện các dự án','Hiển thị số lượng dự án theo trạng thái','Tổng hợp tiến độ thực hiện dự án và gói thầu','Tổng hợp tình hình thực hiện hợp đồng','Tổng hợp khối lượng thực hiện và thanh toán','Hiển thị các cảnh báo, công việc và vấn đề cần xử lý']],
 ['Biểu đồ trực quan','tong-quan',['Biểu đồ tổng hợp tình hình dự án','Biểu đồ theo dõi tiến độ thực hiện','Biểu đồ giá trị hợp đồng và thực hiện hợp đồng','Biểu đồ khối lượng thực hiện, nghiệm thu và thanh toán','Biểu đồ so sánh kế hoạch và thực tế']],
 ['Báo cáo, thống kê','bao-cao',['Báo cáo tổng hợp tình hình thực hiện dự án','Báo cáo tiến độ thực hiện dự án và các gói thầu','Báo cáo tình hình thực hiện hợp đồng','Báo cáo khối lượng thực hiện, nghiệm thu và thanh toán','Báo cáo tổng hợp theo từng dự án, gói thầu và thời gian','Cho phép lọc, tra cứu và xuất báo cáo']],
 ['Quản trị hệ thống','quan-tri',['Quản lý người dùng','Quản lý nhóm người dùng','Phân quyền chức năng và dữ liệu','Quản lý danh mục dùng chung','Theo dõi nhật ký hoạt động']],
 ['Ứng dụng trên thiết bị di động','hien-truong',['Đăng nhập, xác thực người dùng','Tra cứu thông tin dự án','Cập nhật tiến độ thực hiện','Cập nhật nhật ký thi công, hình ảnh hiện trường','Tra cứu thông tin hợp đồng, khối lượng và thanh toán','Xem tổng quan điều hành','Xem báo cáo, thống kê','Cập nhật, thay đổi mật khẩu người dùng','Đăng xuất khỏi hệ thống']],
 ['Vai trò, hình thức quản lý dự án (Luật Xây dựng 2025)','du-an',['Ghi vai trò của Ban: chủ đầu tư, quản lý dự án, tư vấn quản lý dự án','Ghi người quyết định đầu tư, hình thức tổ chức quản lý dự án','Phân loại dự án và hồ sơ dự án (BCNCKT, BCKTKT)']],
 ['Kế hoạch vốn, giải ngân','von',['Quản lý kế hoạch vốn trung hạn và vốn giao hằng năm','Theo dõi giải ngân so với kịch bản theo quý','Cảnh báo dự án chậm giải ngân','Báo cáo tình hình giải ngân']],
 ['Giải phóng mặt bằng','gpmb',['Theo dõi bồi thường, chi trả theo khu vực','Theo dõi bàn giao mặt bằng, cảnh báo chậm bàn giao']],
 ['Nghiệm thu, bàn giao, bảo hành','nghiem-thu',['Nghiệm thu theo giai đoạn thi công (NĐ 207/2026)','Nghiệm thu hoàn thành, bàn giao đưa vào sử dụng','Theo dõi bảo hành, bảo lãnh bảo hành, cảnh báo trước 30 ngày']],
 ['Quyết toán dự án hoàn thành','quyet-toan',['Theo dõi hạn lập, thẩm tra, phê duyệt quyết toán','Cảnh báo quá hạn quyết toán, chưa tất toán tài khoản','Báo cáo tình hình quyết toán']]
];
const UC_WHERE = {
 1:'Danh sách, tìm kiếm, lọc trạng thái',2:'Biểu mẫu thêm/sửa dự án',3:'Tab Công việc, cảnh báo quá hạn',4:'Tab Hồ sơ pháp lý, đính kèm tệp',5:'Tab Tình trạng thực hiện, đường cong S',
 6:'Lưu trữ tệp mô hình (IFC, RVT, DWG, NWD, PDF), tải lên, tải về',7:'Cập nhật phiên bản mới, lưu lịch sử phiên bản',8:'Tìm theo từ khóa, lọc định dạng, lọc hạng mục',9:'Danh mục hạng mục: kết cấu, diện tích, số tầng, tiến độ',
 10:'Danh sách gói thầu, bộ lọc',11:'Hồ sơ pháp lý gói thầu',12:'Thông tin hợp đồng',13:'Thời gian, tiến độ, khối lượng, thanh toán của HĐ',14:'Phụ lục: điều chỉnh giá trị, gia hạn',
 15:'Lập hạng mục tiến độ, trọng số',16:'Cập nhật % kèm lịch sử',17:'Tab Theo dự án',18:'Tab Theo gói thầu, Gantt',19:'Cảnh báo chậm/quá hạn, đếm trên menu',
 20:'Ghi/sửa nhật ký',21:'Bảng công việc thực hiện trong nhật ký',22:'Thêm ảnh, xem ảnh phóng to',23:'Lọc gói thầu, khoảng ngày, từ khóa',
 24:'Bảng khối lượng hợp đồng',25:'Cập nhật khối lượng theo đợt, kiểm tra vượt KL',26:'Tab Theo dõi nghiệm thu',27:'Tab Tổng hợp theo tháng',
 28:'Tab Kế hoạch thanh toán',29:'Tab Hồ sơ thanh toán, xác nhận đã chi',30:'Tab Theo dõi đã thanh toán',31:'Tab Tổng hợp theo quý, theo dự án',
 32:'Các chỉ số tổng hợp',33:'Biểu đồ vành khuyên theo trạng thái',34:'Biểu đồ tiến độ gói thầu, bảng dự án',35:'Biểu đồ hợp đồng',36:'Biểu đồ khối lượng – thanh toán',37:'Khối cảnh báo và công việc đang mở',
 38:'Biểu đồ trạng thái dự án',39:'Biểu đồ tiến độ kế hoạch – thực tế',40:'Biểu đồ giá trị HĐ, thực hiện, thanh toán',41:'Biểu đồ thực hiện, nghiệm thu, thanh toán',42:'Đường cong S',
 43:'Mẫu báo cáo 1',44:'Mẫu báo cáo 2',45:'Mẫu báo cáo 3',46:'Mẫu báo cáo 4',47:'Mẫu báo cáo 5 theo tháng',48:'Bộ lọc, tra cứu, xuất Excel',
 49:'Thêm, sửa, khóa, đặt lại mật khẩu',50:'Nhóm người dùng',51:'Ma trận quyền theo phân hệ + phạm vi dự án',52:'14 loại danh mục, thêm loại mới',53:'Nhật ký thao tác, đăng nhập, xuất Excel',
 54:'Màn hình đăng nhập, mật khẩu băm PBKDF2 trên máy chủ, khóa 15 phút khi sai 5 lần',55:'Ô Tra cứu dự án',56:'Ô Cập nhật tiến độ nhanh',57:'Ô Ghi nhật ký, chụp/chọn ảnh',58:'Ô Hợp đồng, Khối lượng, Thanh toán',59:'Ô Tổng quan',60:'Ô Báo cáo',61:'Ô Đổi mật khẩu',62:'Ô Đăng xuất',
 63:'Biểu mẫu dự án: trường Vai trò của Ban',64:'Biểu mẫu dự án: Người quyết định đầu tư, Hình thức quản lý dự án',65:'Biểu mẫu dự án: Loại dự án, Hồ sơ dự án',
 66:'Thẻ Kế hoạch vốn: trung hạn, vốn năm, bổ sung, điều chỉnh giảm',67:'Thẻ Theo dõi giải ngân, Lũy kế theo quý; kịch bản nhập theo dự án',68:'Cảnh báo trên Tổng quan và menu khi chậm quá 10%',69:'Mẫu báo cáo 6, xuất Excel',
 70:'Bảng tiến độ bồi thường theo khu vực, đoạn tuyến',71:'Hạn bàn giao, cảnh báo chậm bàn giao',
 72:'Loại nghiệm thu theo giai đoạn, đính kèm biên bản',73:'Nghiệm thu hoàn thành, bàn giao, đơn vị tiếp nhận',74:'Thẻ Theo dõi bảo hành, cảnh báo 30 ngày',
 75:'Ngày trình, thẩm tra, phê duyệt, tất toán; danh sách dự án hoàn thành chưa lập hồ sơ',76:'Cảnh báo quá hạn, phê duyệt quá 60 ngày chưa tất toán',77:'Mẫu báo cáo 7, xuất Excel'};
VIEWS['doi-chieu']=()=>{
  let n=0; const rows=[]; UCS.forEach(([g,mod,list])=>list.forEach(u=>{ n++; rows.push({id:'uc'+n, n, g, mod, u, w:UC_WHERE[n]||''}); }));
  return `<div class="head"><div class="grow"><h1>Danh mục chức năng</h1><p>${rows.length} chức năng, ${UCS.length} nhóm nghiệp vụ, bám sát chức năng, nhiệm vụ của Ban Quản lý dự án cấp xã theo Luật Xây dựng 2025, Nghị định 217/2026/NĐ-CP và Nghị định 207/2026/NĐ-CP.</p></div></div>
  <div class="grid g4"><div class="card kpi"><div class="eyebrow">Chức năng</div><div class="v">${rows.length}</div><div class="s">Đáp ứng đầy đủ, dùng được ngay</div></div><div class="card kpi"><div class="eyebrow">Phân hệ nghiệp vụ</div><div class="v">11</div><div class="s">Từ chuẩn bị đầu tư, vốn, GPMB, thi công đến nghiệm thu, quyết toán</div></div><div class="card kpi"><div class="eyebrow">Nhóm chức năng</div><div class="v">${UCS.length}</div><div class="s">Kể cả tổng quan, biểu đồ, báo cáo</div></div><div class="card kpi"><div class="eyebrow">Giao diện</div><div class="v" style="font-size:1.05rem;font-family:var(--f-ui)">Web + di động</div><div class="s">Tự thích ứng màn hình</div></div></div>
  ${table([{h:'STT',r:1,k:'n'},{h:'Nhóm chức năng',k:'g'},{h:'Chức năng',k:'u'},{h:'Thực hiện trong phần mềm',k:'w'},{h:'Đáp ứng',f:()=>pill('Đã đáp ứng','ok')},{h:'',f:r=>can(r.mod)?`<a href="#${r.mod}">Mở</a>`:''}], rows)}`;
};


/* ===== THÔNG TIN ĐƠN VỊ, GIAO DIỆN (triển khai cho nhiều đơn vị) ===== */
const BR_YN=[['1','Có'],['0','Không']];
/* Các mục quản trị tự thiết lập, chia theo nơi hiển thị. Kiểu: không ghi là ô chữ, 'area' nhiều dòng, danh sách là ô chọn */
const BR_SECS=[
  ['Tên đơn vị và phần mềm', '', [['orgShort','Tên đơn vị rút gọn (thanh bên trái, phía trên tên phần mềm)'],['appName','Tên phần mềm (thanh bên trái, tiêu đề trình duyệt)'],
    ['orgName','Tên cơ quan chủ quản (trang đăng nhập dòng 1, đầu mẫu in)'],['unitName','Tên đơn vị sử dụng (trang đăng nhập dòng 2, đầu mẫu in)'],
    ['support','Thông tin hỗ trợ (cuối thanh bên trái)'],['footer','Chân trang ({năm} tự thay bằng năm hiện tại)','area']]],
  ['Trang đăng nhập', 'Banner bên trái và khung đăng nhập bên phải.', [['bannerTitle','Tiêu đề banner'],['bannerText','Mô tả dưới tiêu đề banner','area'],['address','Địa chỉ (cuối banner)'],
    ['bannerDeco','Họa tiết trống đồng và vạch màu đỏ, vàng trên banner',BR_YN],
    ['loginTitle','Tiêu đề khung đăng nhập'],['loginHint','Dòng hướng dẫn dưới tiêu đề'],['forgotText','Dòng hướng dẫn khi quên mật khẩu','area']]],
  ['Màu giao diện', 'Áp dụng cho mọi người dùng để tông màu «Theo đơn vị» trong hộp thoại Giao diện (mặc định). Người đã tự chọn màu khác vẫn giữ lựa chọn của mình.',
    [['color','Tông màu chủ đạo của đơn vị',()=>UI_OPTS.color.list.filter(x=>x[0]!=='unit').map(x=>[x[0],x[1]])]]],
  ['Báo cáo và mẫu in', 'Dùng cho báo cáo xuất Excel, in PDF, phiếu trình, bảng đối soát hợp đồng.', [['reportOrg','Tên đơn vị trên báo cáo xuất Excel'],['place','Địa danh ghi trước ngày tháng (ví dụ: Cần Thơ)'],
    ['printNation','In quốc hiệu, tiêu ngữ ở đầu mẫu in',BR_YN],['signReport','Chức danh ký báo cáo'],['signApprove','Chức danh lãnh đạo ký phiếu trình, bảng đối soát'],
    ['signTech','Chức danh ký bảng đối soát, cột thứ nhất'],['signAcc','Chức danh ký bảng đối soát, cột thứ hai']]],
  ['Nhập liệu', '', [['ownerDefault','Chủ đầu tư / cơ quan ban hành mặc định khi nhập liệu']]]];
const BR_FIELDS=BR_SECS.flatMap(x=>x[2]);
function brField([k,l,t],ed){
  const dis=ed?'':'disabled', id='br_'+k;
  if(typeof t==='function'||Array.isArray(t)){ const list=typeof t==='function'?t():t;
    return `<div class="fld"><label for="${id}">${esc(l)}</label><select id="${id}" ${dis}>${list.map(([v,n])=>`<option value="${esc(v)}" ${String(BR[k])===v?'selected':''}>${esc(n)}</option>`).join('')}</select></div>`; }
  if(t==='area') return `<div class="fld full"><label for="${id}">${esc(l)}</label><textarea id="${id}" rows="2" ${dis}>${esc(BR[k])}</textarea></div>`;
  return `<div class="fld"><label for="${id}">${esc(l)}</label><input id="${id}" value="${esc(BR[k])}" ${dis}></div>`;
}
function brImg(kind, ed){
  const lg=kind==='logo', url=lg?BR.logo:BR.loginBg, act=lg?'brand-logo-del':'brand-bg-del';
  return ed?`<div class="toolbar"><label class="btn ${url?'':'primary'}" style="cursor:pointer">${AICO.clip} ${url?'Thay ảnh khác':'Chọn ảnh'}<input type="file" id="br_${kind}" data-kind="${kind}" accept=".png,.jpg,.jpeg,.webp,.gif" hidden></label>${url?`<button class="btn ghost danger" data-act="${act}">Xóa ảnh</button>`:''}</div>`:'';
}
function brandView(){
  const ed=can('quan-tri','edit'); S.after.push(_brWire);
  return `<div class="grid g3"><div class="card span2"><div class="ch"><h2>Thông tin đơn vị và nhận diện giao diện</h2></div>
    <p class="muted small" style="margin-top:0">Quản trị hệ thống tự thiết lập toàn bộ thông tin hiển thị của đơn vị: tên gọi, trang đăng nhập, màu giao diện, mẫu in. Bấm Lưu thông tin là áp dụng ngay cho mọi người dùng, không cần cài lại phần mềm.</p>
    <form id="brform" class="fgrid">${BR_SECS.map(([h,n,f])=>`<h3 class="br-sec">${esc(h)}</h3>${n?`<p class="muted small br-note">${esc(n)}</p>`:''}${f.map(x=>brField(x,ed)).join('')}`).join('')}</form>
    ${ed?`<div class="toolbar" style="margin-top:12px"><button class="btn primary" data-act="brand-save">Lưu thông tin</button><button class="btn ghost" data-act="brand-reset">Khôi phục mặc định</button></div>`:''}</div>
    <div class="card"><h2>Logo đơn vị</h2><div class="brand-prev"><div class="side-prev"><div class="mark${BR.logo?' logo':''}">${brandMark()}</div><div><span>${esc(BR.orgShort)}</span><b>${esc(BR.appName)}</b></div></div></div>
    <p class="muted small">Ảnh PNG, JPG hoặc WEBP, tối đa 2 MB, nên dùng ảnh vuông nền trong suốt. Logo hiện ở thanh bên, trang đăng nhập và làm biểu tượng trên thẻ trình duyệt. Chưa có logo thì phần mềm dùng biểu tượng mặt trống đồng.</p>
    ${brImg('logo',ed)}
    <h2 style="margin-top:20px">Ảnh nền trang đăng nhập</h2><div class="bg-prev${BR.loginBg?'':' none'}" ${BR.loginBg?`style="background-image:url('${esc(BR.loginBg)}')"`:''}><b>${esc(BR.bannerTitle)}</b></div>
    <p class="muted small">Ảnh ngang (trụ sở, công trình tiêu biểu…), PNG, JPG hoặc WEBP, tối đa 5 MB, nên rộng từ 1600 điểm ảnh. Phần mềm phủ một lớp màu chủ đạo lên ảnh để chữ trên banner luôn đọc rõ. Chưa có ảnh thì banner dùng nền màu.</p>
    ${brImg('loginbg',ed)}
    <h3 style="margin-top:16px">Xem trước chân trang</h3><p class="small">${brandFoot()}</p>
    <h3 style="margin-top:12px">Xem trước dòng ký trên báo cáo</h3><p class="small"><i>${printDate()}</i><br><b>${esc(BR.signReport)}</b></p></div></div>`;
}
const _brWire=()=>{ $$('input[type=file][data-kind]').forEach(f=>{ if(f._w) return; f._w=1; f.onchange=async()=>{ const file=f.files[0]; if(!file) return;
  const lg=f.dataset.kind==='logo', mb=lg?2:5;
  if(file.size>mb*1024*1024) return toast((lg?'Logo':'Ảnh nền')+' tối đa '+mb+' MB','err');
  const fd=new FormData(); fd.append('file',file);
  try{ setBrand(await api('POST','/api/branding/'+f.dataset.kind,fd)); toast(lg?'Đã cập nhật logo':'Đã cập nhật ảnh nền trang đăng nhập'); render(); }catch(ex){ toast(errText(ex),'err'); } }; }); };
ACT['brand-save']=async()=>{ const b={}; BR_FIELDS.forEach(([k])=>b[k]=$('#br_'+k).value.trim());
  try{ setBrand(await api('PUT','/api/branding',b)); toast('Đã lưu thông tin đơn vị'); render(); }catch(ex){ toast(errText(ex),'err'); } };
ACT['brand-reset']=async()=>{ if(!await confirmBox('Đưa toàn bộ thông tin đơn vị, trang đăng nhập, màu giao diện, mẫu in về mặc định? Logo và ảnh nền giữ nguyên.','Khôi phục')) return;
  try{ setBrand(await api('PUT','/api/branding',{})); toast('Đã khôi phục mặc định'); render(); }catch(ex){ toast(errText(ex),'err'); } };
ACT['brand-logo-del']=async()=>{ if(!await confirmBox('Xóa logo đơn vị và dùng lại biểu tượng mặc định?')) return;
  try{ setBrand(await api('DELETE','/api/branding/logo')); toast('Đã xóa logo'); render(); }catch(ex){ toast(errText(ex),'err'); } };
ACT['brand-bg-del']=async()=>{ if(!await confirmBox('Xóa ảnh nền trang đăng nhập và dùng lại nền màu?')) return;
  try{ setBrand(await api('DELETE','/api/branding/loginbg')); toast('Đã xóa ảnh nền'); render(); }catch(ex){ toast(errText(ex),'err'); } };

/* ===== HƯỚNG DẪN SỬ DỤNG: mỗi nhóm người dùng xem hướng dẫn của mình, quản trị cập nhật ===== */
const isVideo=a=>/^video\//.test(a.contentType)||/\.(mp4|webm|mov|m4v)$/i.test(a.fileName);
function guideFiles(g){
  const list=atts('guides',g.id); if(!list.length) return '';
  const vids=list.filter(isVideo), imgs=list.filter(a=>!isVideo(a)&&/^image\//.test(a.contentType)), docs=list.filter(a=>!isVideo(a)&&!/^image\//.test(a.contentType));
  return `${docs.length?`<div class="guide-docs">${docs.map(a=>`<div class="guide-doc">${attIcon(a)}<div class="grow"><b>${esc(a.fileName)}</b><div class="small muted">${attMeta(a)}</div></div>
      <a class="btn sm" href="${attUrl(a)}" target="_blank" rel="noopener" ${isPdf(a)?pdfAttr(attUrl(a),a.fileName):''}>Mở</a><a class="btn sm ghost" href="${attUrl(a)}?download=true">Tải về</a></div>`).join('')}</div>`:''}
    ${vids.map(a=>`<figure class="guide-video"><video controls preload="metadata" src="${attUrl(a)}"></video><figcaption class="small muted">${esc(a.fileName)} · ${fmtSize(a.size)}</figcaption></figure>`).join('')}
    ${imgs.length?`<div class="guide-imgs">${imgs.map(a=>`<a href="${attUrl(a)}" data-act="att-view" data-id="${esc(a.id)}"><img src="${attUrl(a)}" alt="${esc(a.fileName)}" loading="lazy"></a>`).join('')}</div>`:''}`;
}
VIEWS['huong-dan']=()=>{
  const ed=can('quan-tri','edit'), q=S.f.hq||'', gf=ed?(S.f.hg||''):'';
  const gname=id=>(get('groups',id)||{}).name||id;
  const rows=D('guides').filter(g=>(!gf||!(g.groups||[]).length||(g.groups||[]).includes(gf)) && (!q||has({t:g.title,c:g.content,k:g.category},q))).sort((a,b)=>(a.order||0)-(b.order||0)||a.title.localeCompare(b.title));
  const cats=[...new Set(rows.map(g=>g.category||'Hướng dẫn khác'))];
  return `<div class="head"><div class="grow"><h1>Hướng dẫn sử dụng</h1><p>${ed?'Quản trị hệ thống xem toàn bộ hướng dẫn và cập nhật nội dung, tệp, video cho từng nhóm người dùng.':`Tài liệu và video hướng dẫn dành cho nhóm «${esc((myGroup()||{}).name||'')}».`}</p></div>
    ${ed?'<button class="btn primary" data-act="add-guide">+ Thêm hướng dẫn</button>':''}</div>
  <div class="toolbar"><input type="search" data-f="hq" value="${esc(q)}" placeholder="Tìm trong hướng dẫn…" aria-label="Tìm hướng dẫn" style="max-width:320px">
    ${ed?`<select data-f="hg" aria-label="Nhóm người dùng">${opts(D('groups').map(g=>[g.id,g.name]),gf,'Mọi nhóm người dùng')}</select>`:''}</div>
  ${rows.length?cats.map(c=>`<h3 class="guide-cat">${esc(c)}</h3>${rows.filter(g=>(g.category||'Hướng dẫn khác')===c).map(g=>`<article class="card guide">
    <div class="ch"><h2>${esc(g.title)}</h2>${ed?`<span class="guide-groups">${(g.groups||[]).length?(g.groups||[]).map(id=>pill(gname(id),'info')).join(''):pill('Mọi người dùng','ok')}</span>
      <button class="btn sm ghost" data-act="edit-guides" data-id="${g.id}">Sửa</button><button class="btn sm ghost danger" data-act="del" data-col="guides" data-id="${g.id}">Xóa</button>`:''}</div>
    ${g.content?`<div class="guide-text">${esc(g.content)}</div>`:''}${guideFiles(g)}
    <div class="small muted" style="margin-top:8px">Cập nhật ${fmtDT(g.updatedAt)}</div></article>`).join('')}`).join('')
   : emptyBox(ed?'Chưa có hướng dẫn nào.':'Chưa có hướng dẫn dành cho nhóm của bạn. Liên hệ quản trị hệ thống.', ed?'<button class="btn primary" data-act="add-guide">+ Thêm hướng dẫn</button>':'')}`;
};
const guideFields=()=>[{key:'title',label:'Tiêu đề hướng dẫn',req:true,full:true},{key:'category',label:'Nhóm nội dung (ví dụ: Tài liệu hướng dẫn sử dụng, Video hướng dẫn)',def:'Tài liệu hướng dẫn sử dụng'},{key:'order',label:'Thứ tự hiển thị',type:'number',def:D('guides').length+1},
  {key:'groups',label:'Dành cho nhóm người dùng (để trống = mọi người dùng)',type:'checks',options:()=>D('groups').map(g=>[g.id,g.name])},
  {key:'content',label:'Nội dung, ghi chú hướng dẫn',type:'textarea',rows:6},
  {key:'att',label:'Tệp hướng dẫn, video clip (PDF, Word, ảnh, MP4…)',type:'attach',col:'guides',accept:ATT_ACCEPT+','+VIDEO_ACCEPT}];
ACT['add-guide']=()=>openForm({title:'Thêm hướng dẫn sử dụng', fields:guideFields(), onSave:v=>save('guides',{...v, order:N(v.order)})});
ACT['edit-guides']=(id)=>openForm({title:'Cập nhật hướng dẫn sử dụng', fields:guideFields(), value:get('guides',id), onSave:v=>save('guides',{...v, order:N(v.order)})});

/* ===== Khởi động ===== */
render();
Store.init();
