/* Bản 1.10.12: Hồ sơ nhân sự làm lại (góp ý anh Trí 23/11/2026: mục bằng cấp đính kèm không logic, không biết thao tác, không thấy tệp).
   Hồ sơ là MỘT TRANG riêng (không phải hộp thoại chồng hộp thoại), chia thẻ theo loại mục; mỗi mục là một thẻ có sẵn nút
   Xem, Tải về, Gỡ tệp, Đính kèm thêm, Sửa, Xóa. Thêm mục mới chọn tệp ngay trong cùng biểu mẫu (một bước).
   Người lao động mở "Hồ sơ của tôi" để xem hồ sơ của mình và tự thêm bằng cấp, giấy tờ. */
const HS = { data:{}, sum:null, loading:{} };
const HS_KINDS = [
  {k:'bang-cap', tab:'Bằng cấp, chứng chỉ', one:'bằng cấp, chứng chỉ', t:'Tên văn bằng, chứng chỉ', o:'Nơi cấp (trường, đơn vị)', n:'Số hiệu', d:'Ngày cấp', hint:'Ví dụ: Bằng kỹ sư Công nghệ thông tin; Chứng chỉ PMP. Đính kèm ảnh chụp hoặc bản scan PDF.'},
  {k:'hop-dong', tab:'Hợp đồng lao động', one:'hợp đồng', t:'Loại hợp đồng', o:'Bên ký', n:'Số hợp đồng', d:'Từ ngày', hint:'Đính kèm bản hợp đồng đã ký (PDF).'},
  {k:'cong-tac', tab:'Quá trình công tác', one:'quá trình công tác', t:'Nội dung (bổ nhiệm, điều chuyển, tăng lương…)', o:'Phòng ban, đơn vị', n:'Số quyết định', d:'Từ ngày'},
  {k:'khen-thuong', tab:'Khen thưởng', one:'khen thưởng', t:'Nội dung khen thưởng', o:'Hình thức', n:'Số quyết định', d:'Ngày', money:true},
  {k:'ky-luat', tab:'Kỷ luật', one:'kỷ luật', t:'Nội dung vi phạm', o:'Hình thức kỷ luật', n:'Số quyết định', d:'Ngày', money:true},
  {k:'giay-to', tab:'Giấy tờ (CCCD, lý lịch…)', one:'giấy tờ', t:'Tên giấy tờ', o:'Nơi cấp', n:'Số', d:'Ngày cấp', hint:'Ví dụ: Căn cước công dân (2 mặt), Sơ yếu lý lịch, Giấy khám sức khỏe.'}
];
const hsKind = k => HS_KINDS.find(x=>x.k===k) || HS_KINDS[0];
const hsUrl = f => '/api/files/'+encodeURIComponent(f.fileId);
const hsIsImg = f => /^image\//.test(f.type||'') || /\.(jpe?g|png|gif|webp|bmp)$/i.test(f.name||'');
const hsFmtSize = n => typeof fmtSize==='function' ? fmtSize(n) : (n>1048576? (n/1048576).toFixed(1)+' MB' : Math.max(1,Math.round(n/1024))+' KB');

async function hsLoad(id, force){
  if(!id || HS.loading[id] || (HS.data[id] && !force)) return;
  HS.loading[id]=true;
  try{ HS.data[id]=await api('GET','/api/vp/ho-so/'+encodeURIComponent(id)); }
  catch(e){ HS.data[id]={err:errText(e)}; }
  HS.loading[id]=false; if(S.route==='ho-so') render();
}
async function hsSumLoad(force){ if(HS.sum && !force) return; try{ HS.sum=await api('GET','/api/vp/ho-so/tong-hop'); }catch{ HS.sum={}; } if(S.route==='nhan-su') render(); }

/* Mở hồ sơ: từ danh sách nhân sự (bấm dòng hoặc nút "Xem hồ sơ") hoặc "Hồ sơ của tôi" */
ACT['vp-prof']=id=>{ S.sel.hs=id; S.tab.hs=S.tab.hs||'chung'; HS.data[id]=null; goRoute('ho-so'); };
ACT['hs-me']=()=>{ closeModal(); const me=VP.st&&VP.st.me; if(!me){ toast('Tài khoản của bạn chưa gắn với hồ sơ nhân sự. Liên hệ bộ phận nhân sự.','err'); return; } S.sel.hs=me.id; S.tab.hs='chung'; HS.data[me.id]=null; goRoute('ho-so'); };

VIEWS['ho-so']=()=>{
  if(!VP.st){ vpLoad(); return `<div class="head"><div class="grow"><h1>Hồ sơ nhân sự</h1></div></div>`+vpWait(); }
  const id=S.sel.hs || (VP.st.me&&VP.st.me.id);
  if(!id) return `<div class="head"><div class="grow"><h1>Hồ sơ của tôi</h1></div></div><div class="alert">Tài khoản của bạn chưa gắn với hồ sơ nhân sự. Liên hệ bộ phận nhân sự để được gắn.</div>`;
  const d=HS.data[id]; if(!d){ hsLoad(id); return `<div class="head"><div class="grow"><h1>Hồ sơ nhân sự</h1></div></div>`+vpWait(); }
  if(d.err) return `<div class="head"><div class="grow"><h1>Hồ sơ nhân sự</h1></div></div><div class="alert bad">${esc(d.err)}</div>`;
  const e=vpEmp(id)||{name:'',id}; const mine=d.self; const back=can('nhan-su') && !mine;
  const recs=d.records||[]; const cnt=k=>recs.filter(r=>r.kind===k).length; const files=recs.flatMap(r=>r.files.map(f=>({...f, rec:r})));
  const kinds=HS_KINDS.filter(x=>cnt(x.k) || d.canEdit || (mine && (d.selfKinds||[]).includes(x.k)));
  const t=S.tab.hs && (S.tab.hs==='chung'||S.tab.hs==='tep'||kinds.some(x=>x.k===S.tab.hs)) ? S.tab.hs : 'chung';
  const tabs=[['chung','Thông tin chung',''],...kinds.map(x=>[x.k,x.tab,cnt(x.k)]),['tep','Tất cả tệp',files.length]];
  let body='';
  if(t==='chung') body=hsGeneral(e, d, recs, kinds, files);
  else if(t==='tep') body=hsAllFiles(files, d);
  else body=hsSection(hsKind(t), recs.filter(r=>r.kind===t), d, id);
  return `<div class="head"><div class="grow">${back?`<a href="#nhan-su" class="small">← Danh sách nhân sự</a>`:''}
      <h1>${mine?'Hồ sơ của tôi':esc(e.name)}</h1><p>${[mine?e.name:'', e.position, vpDeptName(e.departmentId), e.status].filter(Boolean).map(esc).join(' · ')}</p></div>
      ${d.canEdit?`<div><button class="btn" data-act="vp-emp" data-id="${esc(id)}">Sửa thông tin chung</button></div>`:''}</div>
    <div class="tabs hs-tabs">${tabs.map(([k,l,n])=>`<button class="${t===k?'on':''}" data-act="tab" data-g="hs" data-id="${k}">${esc(l)}${n?` <span class="cnt">${n}</span>`:''}</button>`).join('')}</div>${body}`;
};

function hsGeneral(e, d, recs, kinds, files){
  const I=(l,v)=>v!=null&&v!==''?`<div class="fld"><label>${l}</label><div>${esc(String(v))}</div></div>`:'';
  const u=vpUser(e.userId);
  /* Bản 1.10.17: bỏ hàng thẻ tóm tắt (trùng các thẻ chọn phía trên) */
  return `<div class="card" style="padding:16px;margin-top:12px"><h3 style="margin:0 0 10px">Lý lịch</h3><div class="fgrid">
      ${I('Họ tên',e.name)}${I('Mã nhân viên',e.code)}${I('Phòng ban',vpDeptName(e.departmentId))}${I('Chức vụ',e.position)}${I('Trạng thái',e.status)}
      ${I('Tài khoản đăng nhập',u?u.username:'Chưa gắn')}${I('Điện thoại',e.phone)}${I('Thư điện tử',e.email)}${I('Ngày sinh',e.birthday&&fmtDate(e.birthday))}${I('Giới tính',e.gender)}
      ${I('Ngày vào làm',e.startDate&&fmtDate(e.startDate))}${I('Ngày nghỉ việc',e.endDate&&fmtDate(e.endDate))}${I('Trình độ',e.education)}${I('Chuyên ngành',e.major)}
      ${I('Dân tộc',e.ethnicity)}${I('Quốc tịch',e.nationality)}${I('Quê quán',e.hometown)}${I('Địa chỉ thường trú',e.address)}${I('Chỗ ở hiện nay',e.currentAddress)}
      ${I('Người liên hệ khẩn cấp',[e.emergencyName,e.emergencyRelation,e.emergencyPhone].filter(Boolean).join(', '))}
      ${I('Hợp đồng',[e.contractType,e.contractNo,e.contractStart&&('từ '+fmtDate(e.contractStart)),e.contractEnd&&('đến '+fmtDate(e.contractEnd))].filter(Boolean).join(', '))}
      ${I('Số CCCD',e.idNumber)}${I('Ngày cấp CCCD',e.idDate&&fmtDate(e.idDate))}${I('Nơi cấp',e.idPlace)}${I('Mã số thuế',e.taxCode)}${I('Số sổ BHXH',e.insuranceNo)}
      ${I('Tài khoản ngân hàng',[e.bankAccount,e.bankName].filter(Boolean).join(' · '))}</div>
      ${d.self&&!d.canEdit?`<p class="small muted" style="margin:10px 0 0">Thông tin sai thì báo bộ phận nhân sự để sửa.</p>`:''}</div>`;
}

function hsFileRow(f, canDel){
  const view = hsIsImg(f) ? `data-act="hs-img" data-id="${esc(f.fileId+'|'+f.name)}"` : isPdf(f) ? pdfAttr(hsUrl(f), f.name) : '';
  return `<li class="hs-file"><span class="hs-fi">${hsIsImg(f)?AICO.img:AICO.doc}</span><span class="hs-fn"><a href="${hsUrl(f)}" target="_blank" rel="noopener" ${view}>${esc(f.name)}</a>
      <span class="small muted">${hsFmtSize(f.size||0)}${f.at?' · '+fmtDate(String(f.at).slice(0,10)):''}</span></span>
    <span class="hs-fb">${view?`<button class="btn sm" ${view}>Xem</button>`:''}<a class="btn sm" href="${hsUrl(f)}?download=true">Tải về</a>${canDel?`<button class="btn sm ghost danger" data-act="hs-fdel" data-id="${esc(f.id)}" title="Gỡ tệp này">Gỡ</button>`:''}</span></li>`;
}

function hsSection(x, list, d, eid){
  const ed = d.canEdit || (d.self && (d.selfKinds||[]).includes(x.k));
  const meta=r=>[r.org&&(x.o.split(' (')[0]+': '+r.org), r.number&&(x.n+': '+r.number), r.fromDate&&(r.fromEwork&&/-01-01$/.test(r.fromDate)&&!r.toDate? 'Năm: '+r.fromDate.slice(0,4) : x.d+': '+fmtDate(r.fromDate)+(r.toDate?' – '+fmtDate(r.toDate):'')), r.amount&&('Số tiền: '+vnd(r.amount))].filter(Boolean).map(esc).join(' · ');
  const items=list.map(r=>`<div class="card hs-item" id="hs_${esc(r.id)}">
      <div class="hs-ih"><div class="grow"><b>${esc(r.title)}</b>${r.fromEwork?' '+pill('Chuyển từ e-work','info'):''}<div class="small muted">${meta(r)||'&nbsp;'}</div></div>
        ${r.canEdit?`<div class="hs-ib"><button class="btn sm" data-act="hs-rec" data-id="${esc(x.k+'|'+r.id)}">Sửa</button><button class="btn sm ghost danger" data-act="hs-del" data-id="${esc(r.id)}">Xóa</button></div>`:''}</div>
      ${r.note?`<div class="small" style="white-space:pre-wrap;margin:6px 0 0">${esc(r.note)}</div>`:''}
      <ul class="hs-files">${r.files.map(f=>hsFileRow(f, r.canEdit)).join('')||`<li class="small muted hs-nofile">Chưa có tệp đính kèm.</li>`}</ul>
      ${r.canEdit?`<label class="btn sm hs-add">${AICO.clip} Đính kèm tệp<input type="file" multiple accept="${esc(ATT_ACCEPT)}" data-hsup="${esc(r.id)}" hidden></label><span class="small muted"> hoặc kéo thả tệp vào khung này</span>`:''}
    </div>`).join('');
  return `<div class="toolbar" style="margin:12px 0">${ed?`<button class="btn primary" data-act="hs-rec" data-id="${esc(x.k+'|')}">+ Thêm ${esc(x.one)}</button>`:''}${x.hint&&ed?`<span class="small muted">${esc(x.hint)}</span>`:''}</div>
    ${items || `<div class="empty card" style="padding:24px;text-align:center"><p style="margin:0 0 6px"><b>Chưa có ${esc(x.one)}.</b></p>${ed?`<p class="small muted" style="margin:0">Bấm <b>+ Thêm ${esc(x.one)}</b>, nhập thông tin và chọn tệp (ảnh chụp, bản scan) trong cùng một lần.</p>`:''}</div>`}`;
}

function hsAllFiles(files, d){
  if(!files.length) return `<div class="empty card" style="padding:24px;text-align:center;margin-top:12px">Hồ sơ chưa có tệp nào.</div>`;
  return `<p class="small muted" style="margin:12px 0">Mọi tệp đính kèm trong hồ sơ, theo từng mục. Bấm <b>Xem</b> để mở ngay, <b>Tải về</b> để lưu về máy.</p>
    <div class="card" style="padding:4px 12px"><ul class="hs-files">${files.map(f=>`<li class="hs-file"><span class="hs-fi">${hsIsImg(f)?AICO.img:AICO.doc}</span><span class="hs-fn"><span class="small muted">${esc(hsKind(f.rec.kind).tab)} · ${esc(f.rec.title)}</span>
      <a href="${hsUrl(f)}" target="_blank" rel="noopener">${esc(f.name)}</a></span><span class="hs-fb">${hsIsImg(f)?`<button class="btn sm" data-act="hs-img" data-id="${esc(f.fileId+'|'+f.name)}">Xem</button>`:isPdf(f)?`<button class="btn sm" ${pdfAttr(hsUrl(f),f.name)}>Xem</button>`:''}<a class="btn sm" href="${hsUrl(f)}?download=true">Tải về</a></span></li>`).join('')}</ul></div>`;
}

ACT['hs-img']=key=>{ const i=key.indexOf('|'), fid=key.slice(0,i), name=key.slice(i+1); const url='/api/files/'+encodeURIComponent(fid);
  openModal(`<div class="mform wide"><header><h3>${esc(name)}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header>
    <div style="padding:12px;text-align:center;background:var(--bg2,#f4f4f4)"><img src="${url}" alt="${esc(name)}" style="max-width:100%;max-height:calc(100vh - 200px)"></div>
    <footer><a class="btn" href="${url}?download=true">Tải về</a><a class="btn" href="${url}" target="_blank" rel="noopener">Mở thẻ mới</a></footer></div>`); };

async function hsUpload(eid, rid, fileList){
  const fl=[...fileList].filter(f=>{ if(f.size>500*1024*1024){ toast('Tệp '+f.name+' vượt quá 500 MB.','err'); return false; } return true; }); if(!fl.length) return;
  const fd=new FormData(); for(const f of fl) fd.append('files', f, f.name);
  toast(`Đang tải ${fl.length} tệp lên…`);
  try{ await api('POST',`/api/vp/ho-so/${encodeURIComponent(eid)}/muc/${encodeURIComponent(rid)}/tep`, fd); toast(`Đã đính kèm ${fl.length} tệp`); HS.sum=null; await hsLoad(eid, true); }
  catch(e){ toast(errText(e),'err'); }
}
/* Nút "Đính kèm tệp" và kéo thả tệp vào thẻ mục */
document.addEventListener('change', e=>{ const inp=e.target.closest&&e.target.closest('input[data-hsup]'); if(!inp) return; hsUpload(S.sel.hs, inp.dataset.hsup, inp.files); inp.value=''; });
document.addEventListener('dragover', e=>{ const c=e.target.closest&&e.target.closest('.hs-item'); if(c && c.querySelector('input[data-hsup]')){ e.preventDefault(); c.classList.add('over'); } });
document.addEventListener('dragleave', e=>{ const c=e.target.closest&&e.target.closest('.hs-item'); if(c) c.classList.remove('over'); });
document.addEventListener('drop', e=>{ const c=e.target.closest&&e.target.closest('.hs-item'); const inp=c&&c.querySelector('input[data-hsup]'); if(!inp) return; e.preventDefault(); c.classList.remove('over'); hsUpload(S.sel.hs, inp.dataset.hsup, e.dataTransfer.files); });

ACT['hs-rec']=key=>{ const [kind,rid]=key.split('|'); const eid=S.sel.hs; const d=HS.data[eid]||{}; const r=(d.records||[]).find(x=>x.id===rid)||{kind}; const x=hsKind(kind);
  const F=[{key:'title',label:x.t,req:true,full:true,ph:x.hint?x.hint.split('. ')[0].replace(/^Ví dụ: /,''):''},{key:'org',label:x.o},{key:'number',label:x.n},{key:'fromDate',label:x.d,type:'date'},{key:'toDate',label:'Đến ngày (nếu có)',type:'date'},
    ...(x.money?[{key:'amount',label:'Số tiền (đồng)',type:'money'}]:[]),{key:'note',label:'Ghi chú',type:'textarea',keepLines:true},
    ...(rid?[]:[{key:'file',label:'Tệp đính kèm: ảnh chụp, bản scan PDF (chọn được nhiều tệp)',type:'files',multiple:true,accept:ATT_ACCEPT}])];
  openForm({title:(rid?'Sửa ':'Thêm ')+x.one+': '+((vpEmp(eid)||{}).name||''), narrow:true, fields:F, value:{...r},
    onSave:async v=>{ const nid=rid||uid('hs'); const o={id:nid, kind, title:v.title, org:v.org, number:v.number, fromDate:v.fromDate||null, toDate:v.toDate||null, amount:v.amount==null||v.amount===''?null:N(v.amount), note:v.note};
      await api('PUT',`/api/vp/ho-so/${encodeURIComponent(eid)}/muc/${encodeURIComponent(nid)}`, o);
      if(v.file&&v.file.length){ const fd=new FormData(); for(const f of v.file) fd.append('files', f, f.name); await api('POST',`/api/vp/ho-so/${encodeURIComponent(eid)}/muc/${encodeURIComponent(nid)}/tep`, fd); }
      S.tab.hs=kind; HS.sum=null; setTimeout(()=>hsLoad(eid, true),30); return true; }});
};
ACT['hs-del']=async rid=>{ const eid=S.sel.hs; const r=((HS.data[eid]||{}).records||[]).find(x=>x.id===rid); if(!r) return;
  if(!await confirmBox(`Xóa mục <b>${esc(r.title)}</b>${r.files.length?` cùng ${r.files.length} tệp đính kèm (tệp vào thùng rác 30 ngày)`:''}?`)) return;
  try{ await api('DELETE',`/api/vp/ho-so/${encodeURIComponent(eid)}/muc/${encodeURIComponent(rid)}`); toast('Đã xóa'); HS.sum=null; hsLoad(eid, true); }catch(e){ toast(errText(e),'err'); } };
ACT['hs-fdel']=async fid=>{ const eid=S.sel.hs; const f=((HS.data[eid]||{}).records||[]).flatMap(r=>r.files).find(x=>x.id===fid); if(!f) return;
  if(!await confirmBox(`Gỡ tệp <b>${esc(f.name)}</b> khỏi hồ sơ? (Quản trị khôi phục được trong 30 ngày.)`,'Gỡ tệp')) return;
  try{ await api('DELETE',`/api/vp/ho-so/${encodeURIComponent(eid)}/tep/${encodeURIComponent(fid)}`); toast('Đã gỡ tệp'); HS.sum=null; hsLoad(eid, true); }catch(e){ toast(errText(e),'err'); } };

/* Bản 1.10.12: tệp đính kèm lịch họp, thông báo, đề xuất (chủ yếu chuyển từ e-work cũ) */
const VPT = { cnt:{} };
async function vptCount(col){ if(VPT.cnt[col]) return VPT.cnt[col]; VPT.cnt[col]={}; try{ VPT.cnt[col]=await api('GET','/api/vp/tep/'+col+'/dem'); }catch{} if(['de-xuat'].includes(S.route)) render(); return VPT.cnt[col]; }
function vptFilesHtml(l){ return l.length? `<ul class="hs-files">${l.map(f=>hsFileRow(f,false)).join('')}</ul>` : ''; }
/* Chèn khối "Tệp đính kèm" vào hộp thoại đang mở (lịch họp, thông báo) */
async function vptInject(col, id, sel){ let l=[]; try{ l=await api('GET',`/api/vp/tep/${col}/${encodeURIComponent(id)}`); }catch{ return; }
  if(!l.length) return; const box=document.querySelector(sel); if(box) box.insertAdjacentHTML('beforeend', `<div class="fld full" style="padding:0 16px 12px"><label>Tệp đính kèm (${l.length})</label>${vptFilesHtml(l)}</div>`); }
{ const mt=ACT['mt-view']; if(mt) ACT['mt-view']=id=>{ mt(id); vptInject('vp-lich-hop', id, '#ov .mform .fgrid'); }; }
{ const nt=ACT['nt-open']; if(nt) ACT['nt-open']=async(id,el,ev)=>{ const p=nt(id,el,ev); setTimeout(()=>vptInject('vp-thong-bao', id, '#ov .mform > div'),60); return p; }; }
ACT['vpt-req']=async id=>{ let l=[]; try{ l=await api('GET','/api/vp/tep/vp-de-xuat/'+encodeURIComponent(id)); }catch(e){ toast(errText(e),'err'); return; }
  openModal(`<div class="mform"><header><h3>Tệp đính kèm đề xuất</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header><div style="padding:12px 16px">${vptFilesHtml(l)||'<p class="muted">Không có tệp.</p>'}</div></div>`); };
