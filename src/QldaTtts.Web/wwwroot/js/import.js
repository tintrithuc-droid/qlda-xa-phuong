/* ===== NHẬP TỪ EXCEL (bản 1.5, cập nhật 1.7) =====
   Bảng khối lượng hợp đồng, khối lượng thực hiện và nghiệm thu, kế hoạch tiến độ.
   Các bước: tải tệp mẫu, chọn tệp Excel, xem trước bảng kiểm tra (dòng lỗi được đánh dấu và bỏ qua), rồi mới lưu.
   Mỗi dòng được ghi qua /api/data như khi nhập tay, nên máy chủ vẫn kiểm tra quyền, phạm vi dự án và quy trình duyệt. */

/** Chữ thường, bỏ dấu, gộp khoảng trắng: dùng để nhận tiêu đề cột viết hơi khác tệp mẫu. */
function impKey(s){ return String(s??'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/\(.*?\)/g,' ').replace(/[^a-z0-9]+/g,' ').trim(); }
/** Số trong ô Excel: số thật, hoặc chữ theo kiểu Việt Nam (18.500 · 1.234,5) hay kiểu Anh (18,500 · 1234.5). */
function impNum(v){
  if(v===null || v===undefined || v==='') return null;
  if(typeof v==='number') return isFinite(v)? v : NaN;
  let t=String(v).replace(/\s|đ|₫|vnd/gi,'');
  if(!t) return null;
  if(t.includes('.') && t.includes(',')) t = t.lastIndexOf(',')>t.lastIndexOf('.') ? t.replace(/\./g,'').replace(',','.') : t.replace(/,/g,'');
  else if(/^-?\d{1,3}(\.\d{3})+$/.test(t)) t=t.replace(/\./g,'');
  else if(/^-?\d{1,3}(,\d{3})+$/.test(t)) t=t.replace(/,/g,'');
  else t=t.replace(',','.');
  const n=Number(t); return isFinite(n)? n : NaN;
}
/** Ngày trong ô Excel: số ngày kiểu Excel, ngày/tháng/năm hoặc năm-tháng-ngày. Trả '' nếu trống, null nếu sai. */
function impDate(v){
  if(v===null || v===undefined || v==='') return '';
  if(v instanceof Date) return isNaN(v)? null : isoLocal(v);
  if(typeof v==='number'){ const p=window.XLSX && XLSX.SSF.parse_date_code(v); return p&&p.y>=1900? p.y+'-'+pad(p.m)+'-'+pad(p.d) : null; }
  const t=String(v).trim(); const m=t.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
  if(m){ const s=m[1]+'-'+pad(+m[2])+'-'+pad(+m[3]); const d=new Date(s+'T00:00:00'); return isNaN(d)||isoLocal(d)!==s? null : s; }
  return parseVNDate(t);
}

const IMPORTS = {
  boq: {
    title:'Nhập bảng khối lượng hợp đồng từ Excel', file:'Mau nhap khoi luong hop dong.xlsx', mod:'khoi-luong',
    intro:'Mỗi dòng là một công việc trong bảng khối lượng hợp đồng (dự toán trúng thầu). Mã hiệu đã có trong hợp đồng thì dòng đó được cập nhật nội dung, đơn vị, khối lượng, đơn giá.',
    cols:[{k:'code',h:'Mã hiệu',req:true,al:['ma','ma cong viec','ma dinh muc','ma hieu dinh muc']},
          {k:'name',h:'Nội dung công việc',req:true,al:['noi dung','ten cong viec','cong viec','noi dung cong viec','hang muc cong viec']},
          {k:'unit',h:'Đơn vị tính',req:true,al:['dvt','don vi']},
          {k:'qty',h:'Khối lượng hợp đồng',req:true,num:true,al:['khoi luong','kl','kl hop dong','khoi luong hd']},
          {k:'price',h:'Đơn giá (đồng)',req:true,num:true,al:['don gia','don gia dong','don gia vnd']}],
    sample:[['AB.11','Đào nền đường đất cấp II','m3',18500,62000],['AD.11','Móng cấp phối đá dăm loại 1','m3',8800,520000],['AD.23','Mặt đường bê tông nhựa chặt 12,5','m2',25200,280000]],
    check(rows, x){
      const have=new Map(D('boq').filter(b=>b.contractId===x.cid).map(b=>[String(b.code).trim().toLowerCase(), b]));
      const units=new Set(catalog('Đơn vị tính').map(u=>u.toLowerCase())); const seen=new Set();
      rows.forEach(r=>{ const v=r.v, key=String(v.code||'').trim().toLowerCase();
        if(key && seen.has(key)) r.err.push('Trùng mã hiệu với dòng phía trên'); seen.add(key);
        if(v.qty!=null && !isNaN(v.qty) && v.qty<=0) r.err.push('Khối lượng phải lớn hơn 0');
        if(v.price!=null && !isNaN(v.price) && v.price<0) r.err.push('Đơn giá không được âm');
        if(v.unit && units.size && !units.has(String(v.unit).toLowerCase())) r.warn.push('Đơn vị "'+v.unit+'" chưa có trong danh mục');
        const old=have.get(key); if(old){ r.old=old; r.warn.push('Đã có mã này, sẽ cập nhật'); } });
    },
    summary(ok, x){
      const c=get('contracts',x.cid); const upd=new Set(ok.filter(r=>r.old).map(r=>r.old.id));
      const keep=sum(D('boq').filter(b=>b.contractId===x.cid && !upd.has(b.id)), b=>N(b.qty)*N(b.price));
      const tv=keep+sum(ok, r=>N(r.v.qty)*N(r.v.price)), cv=c? contractValue(c) : 0, d=cv-tv;
      return `Tổng thành tiền bảng khối lượng sau khi nhập: <b>${fmtVND(tv)} đ</b>; giá trị hợp đồng sau điều chỉnh: <b>${fmtVND(cv)} đ</b>.`
        + (Math.abs(d)>1? ` <span style="color:var(--amber)">Chênh lệch ${fmtVND(d)} đ, kiểm tra lại đơn giá hoặc khối lượng trước khi lưu.</span>` : ' <span style="color:var(--green)">Khớp giá trị hợp đồng.</span>');
    },
    build(r, x){ const v=r.v; return {...(r.old||{contractId:x.cid}), code:String(v.code).trim(), name:String(v.name).trim(), unit:String(v.unit).trim(), qty:v.qty, price:v.price}; },
    col:'boq', label:r=>r.v.code+' '+r.v.name
  },

  vol: {
    title:'Nhập khối lượng thực hiện, nghiệm thu từ Excel', file:'Mau nhap khoi luong nghiem thu.xlsx', mod:'khoi-luong',
    intro:'Mỗi dòng là khối lượng thực hiện và khối lượng được nghiệm thu trong đợt của một công việc, khớp theo Mã hiệu của bảng khối lượng hợp đồng. Ngày và đợt bỏ trống thì lấy theo ô bên dưới. Các dòng cùng đợt được gom vào một đợt nghiệm thu ở trạng thái Dự thảo, kiểm tra xong mới trình duyệt.',
    extra:x=>[{key:'date',label:'Ngày nghiệm thu (áp dụng cho dòng không ghi ngày)',type:'date',def:TODAY,req:true},
              {key:'period',label:'Đợt nghiệm thu (áp dụng cho dòng không ghi đợt)',def:vbNextName(x.cid),req:true}],
    cols:[{k:'code',h:'Mã hiệu',req:true,al:['ma','ma cong viec','ma dinh muc']},
          {k:'name',h:'Nội dung công việc (để đối chiếu)',al:['noi dung','ten cong viec','cong viec','noi dung cong viec']},
          {k:'doneQty',h:'Khối lượng thực hiện trong kỳ',req:true,num:true,al:['kl thuc hien','khoi luong thuc hien','thuc hien','kl thuc hien trong ky']},
          {k:'acceptedQty',h:'Khối lượng nghiệm thu',num:true,al:['kl nghiem thu','nghiem thu','khoi luong duoc nghiem thu','kl duoc nghiem thu']},
          {k:'date',h:'Ngày',date:true,al:['ngay nghiem thu','ngay thuc hien']},
          {k:'period',h:'Đợt',al:['dot','ky','dot ky']},
          {k:'note',h:'Số biên bản / ghi chú',al:['so bien ban','bien ban','ghi chu']}],
    sample:[['AB.11','Đào nền đường đất cấp II',1200,1200,'','','BB 05/NT'],['AD.11','Móng cấp phối đá dăm loại 1',650,600,'','','BB 05/NT']],
    check(rows, x){
      const boq=new Map(D('boq').filter(b=>b.contractId===x.cid).map(b=>[String(b.code).trim().toLowerCase(), b]));
      const bat=new Map(D('vbatches').filter(b=>b.contractId===x.cid).map(b=>[norm(b.name), b]));
      const addD={}, addA={}, seen=new Set();
      rows.forEach(r=>{ const v=r.v; const b=boq.get(String(v.code||'').trim().toLowerCase());
        if(v.code && !b){ r.err.push('Không có mã hiệu này trong bảng khối lượng của hợp đồng'); return; }
        if(!b) return; r.boq=b;
        const pn=String(v.period||x.period||'').trim(), bt=bat.get(norm(pn)); r.pname=pn;
        if(bt && bt.status && bt.status!=='Soạn thảo'){ r.err.push(`${bt.name} đang ở trạng thái "${bt.status}", không nhập thêm được`); return; }
        const key=norm(pn)+'|'+b.id; if(seen.has(key)){ r.err.push('Trùng mã hiệu trong cùng một đợt'); return; } seen.add(key);
        r.old=bt? D('volumes').find(o=>o.batchId===bt.id && o.boqId===b.id) : null;
        if(v.doneQty!=null && !isNaN(v.doneQty) && v.doneQty<0) r.err.push('Khối lượng thực hiện không được âm');
        if(N(v.acceptedQty)<0) r.err.push('Khối lượng nghiệm thu không được âm');
        if(r.err.length) return;
        /* Mục 29: so theo lũy kế, gồm các đợt trước và các dòng phía trên trong tệp */
        addD[b.id]=(addD[b.id]||0)+N(v.doneQty)-N(r.old&&r.old.doneQty); addA[b.id]=(addA[b.id]||0)+N(v.acceptedQty)-N(r.old&&r.old.acceptedQty);
        const cd=boqDone(b)+addD[b.id], ca=boqAccAll(b)+addA[b.id];
        if(ca>cd+1e-9){ r.err.push(`Lũy kế nghiệm thu ${fmtN(ca,2)} vượt lũy kế thực hiện ${fmtN(cd,2)} ${b.unit||''}`); addD[b.id]-=N(v.doneQty)-N(r.old&&r.old.doneQty); addA[b.id]-=N(v.acceptedQty)-N(r.old&&r.old.acceptedQty); return; }
        if(cd>N(b.qty)*1.0001) r.warn.push(`Lũy kế ${fmtN(cd,2)} vượt khối lượng hợp đồng ${fmtN(b.qty,2)} ${b.unit||''}`);
        if(r.old) r.warn.push('Đã có trong '+pn+', sẽ cập nhật');
        if(v.name && impKey(v.name)!==impKey(b.name)) r.warn.push('Nội dung khác bảng khối lượng: '+b.name); });
    },
    summary(ok){ const tv=sum(ok,r=>N(r.v.doneQty)*N(r.boq&&r.boq.price)), ta=sum(ok,r=>N(r.v.acceptedQty)*N(r.boq&&r.boq.price));
      const ps=[...new Set(ok.map(r=>r.pname))];
      return `Giá trị thực hiện: <b>${fmtVND(tv)} đ</b>; giá trị nghiệm thu: <b>${fmtVND(ta)} đ</b>. Ghi vào: <b>${esc(ps.join(', '))}</b> (dự thảo, cần trình duyệt sau khi kiểm tra).`; },
    /** Tạo trước các đợt nghiệm thu dự thảo cho những đợt chưa có */
    async prepare(ok, x){
      x.bmap={}; D('vbatches').filter(b=>b.contractId===x.cid).forEach(b=>x.bmap[norm(b.name)]=b.id);
      for(const pn of new Set(ok.map(r=>r.pname))){ if(x.bmap[norm(pn)]) continue;
        const d=(ok.find(r=>r.pname===pn && r.v.date)||{v:{}}).v.date||x.date;
        const rec=await Store.put('vbatches',{contractId:x.cid, name:pn, date:d, note:'Nhập từ Excel', status:'Soạn thảo'}); x.bmap[norm(pn)]=rec.id; }
    },
    build(r, x){ const v=r.v; return {...(r.old||{}), contractId:x.cid, boqId:r.boq.id, batchId:x.bmap[norm(r.pname)], date:v.date||x.date, period:r.pname, doneQty:v.doneQty, acceptedQty:v.acceptedQty??0, note:String(v.note||'').trim()}; },
    col:'volumes', label:r=>r.v.code+' '+(r.v.period||'')
  },

  sched: {
    title:'Nhập kế hoạch tiến độ từ Excel', file:'Mau nhap ke hoach tien do.xlsx', mod:'tien-do',
    intro:'Mỗi dòng là một đầu việc trong kế hoạch tiến độ của gói thầu chọn bên dưới. Các đầu việc nhập vào ở trạng thái Soạn thảo; trình duyệt xong mới được tính vào tiến độ.',
    extra:x=>[{key:'packageId',label:'Gói thầu',type:'select',options:()=>pkgOpts(S.pid),req:true,full:true,def:x.kid||S.f.tdk||''}],
    cols:[{k:'name',h:'Tên công việc',req:true,al:['ten hang muc','hang muc cong viec','cong viec','noi dung','ten dau viec']},
          {k:'start',h:'Ngày bắt đầu',req:true,date:true,al:['bat dau','bat dau ke hoach','tu ngay']},
          {k:'end',h:'Ngày kết thúc',req:true,date:true,al:['ket thuc','ket thuc ke hoach','den ngay','hoan thanh']},
          {k:'weight',h:'Trọng số (%)',num:true,al:['trong so','ty trong','ti trong']},
          {k:'item',h:'Mã hạng mục công trình',al:['ma hang muc','hang muc']}],
    sample:[['Đào đất hố móng','01/12/2026','20/12/2026',10,''],['Bê tông móng','21/12/2026','15/01/2027',25,''],['Xây thân, hoàn thiện','16/01/2027','31/03/2027',65,'']],
    check(rows, x){
      const k=pkgOf(x.packageId); if(!k){ rows.forEach(r=>r.err.push('Chưa chọn gói thầu')); return; }
      const items=D('items').filter(i=>i.projectId===k.projectId);
      rows.forEach(r=>{ const v=r.v;
        if(v.start && v.end && v.end<v.start) r.err.push('Ngày kết thúc trước ngày bắt đầu');
        if(v.weight!=null && !isNaN(v.weight) && v.weight<0) r.err.push('Trọng số không được âm');
        if(v.item){ const it=items.find(i=>impKey(i.code)===impKey(v.item) || impKey(i.name)===impKey(v.item)); if(it) r.itemId=it.id; else r.warn.push('Không tìm thấy hạng mục "'+v.item+'", đầu việc không gắn hạng mục'); }
        if(v.weight==null) r.warn.push('Không ghi trọng số, tính là 1'); });
    },
    summary(ok, x){
      const old=sum(D('schedule').filter(s=>s.packageId===x.packageId), s=>N(s.weight)||1), add=sum(ok, r=>r.v.weight==null? 1 : N(r.v.weight)), t=old+add;
      return `Tổng trọng số các đầu việc của gói sau khi nhập: <b>${fmtN(t,2)}%</b>`+(old? ` (đã có ${fmtN(old,2)}%, nhập thêm ${fmtN(add,2)}%)` : '')+'.'
        + (Math.abs(t-100)>0.01? ` <span style="color:var(--amber)">Tổng khác 100%, vẫn lưu được; phần mềm tự quy về 100% khi tính tiến độ.</span>` : '');
    },
    build(r, x){ const v=r.v, k=pkgOf(x.packageId); return {projectId:k.projectId, packageId:k.id, itemId:r.itemId||'', name:String(v.name).trim(), planStart:v.start, planEnd:v.end, weight:v.weight==null? 1 : v.weight, progress:0, history:[], status:'Soạn thảo'}; },
    col:'schedule', label:r=>r.v.name
  }
};

/** Mục 25: tệp mẫu có định dạng (ExcelJS): dòng tiêu đề tô màu, cột bắt buộc đánh dấu, kẻ khung, định dạng số và ngày,
    ô Đơn vị tính chọn từ danh mục, kèm trang Hướng dẫn. Dòng tiêu đề nằm ở dòng 1 để đọc lại được ngay. */
async function impTemplate(t){
  try{ await loadExcel(); }catch(e){ toast('Không tải được thư viện Excel, thử lại sau.','err'); return; }
  const C=IMPORTS[t], wb=new ExcelJS.Workbook(); wb.creator=BR.appName||'QLDA'; wb.created=new Date();
  const thin={style:'thin',color:{argb:XL.line}}, box={top:thin,left:thin,bottom:thin,right:thin};
  const ws=wb.addWorksheet('Du lieu',{views:[{state:'frozen', ySplit:1}], pageSetup:{paperSize:9, orientation:'landscape', fitToPage:true, fitToWidth:1, fitToHeight:0}});
  const hr=ws.getRow(1);
  C.cols.forEach((c,i)=>{ const x=hr.getCell(i+1); x.value=c.h+(c.req?' *':''); x.font={name:XL.font, bold:true, color:{argb:XL.headInk}};
    x.fill={type:'pattern', pattern:'solid', fgColor:{argb:c.req?XL.head:'FF5B7A99'}}; x.alignment={horizontal:'center', vertical:'middle', wrapText:true}; x.border=box;
    ws.getColumn(i+1).width=c.num?18:c.date?14:Math.max(14, Math.min(46, c.h.length+6)); });
  hr.height=36;
  const toDate=v=>{ const d=impDate(v); return d? new Date(d+'T00:00:00Z') : null; };
  const units=catalog('Đơn vị tính');
  let lst=null; if(units.length && C.cols.some(c=>c.k==='unit')){ lst=wb.addWorksheet('Danh muc',{state:'hidden'}); units.forEach((u,i)=>lst.getCell(i+1,1).value=u); }
  const N_ROWS=200;
  for(let r=2;r<=N_ROWS+1;r++){ const row=ws.getRow(r); const smp=C.sample[r-2];
    C.cols.forEach((c,i)=>{ const x=row.getCell(i+1); x.font={name:XL.font, color:{argb:smp?'FF7F7F7F':'FF000000'}, italic:!!smp}; x.border=box;
      if(smp){ const v=smp[i]; x.value= v===''||v==null? null : c.date? toDate(v) : v; }
      if(c.num){ x.numFmt='#,##0.###'; x.alignment={horizontal:'right'}; x.dataValidation={type:'decimal', operator:'greaterThanOrEqual', formulae:[0], allowBlank:true, showErrorMessage:true, errorTitle:'Số không hợp lệ', error:c.h+' phải là số không âm.'}; }
      else if(c.date){ x.numFmt='dd/mm/yyyy'; x.alignment={horizontal:'center'}; x.dataValidation={type:'date', operator:'greaterThan', formulae:[new Date(Date.UTC(2000,0,1))], allowBlank:true, showErrorMessage:true, errorTitle:'Ngày không hợp lệ', error:'Gõ ngày theo dạng ngày/tháng/năm, ví dụ 03/11/2026.'}; }
      else if(c.k==='unit' && lst){ x.dataValidation={type:'list', allowBlank:true, formulae:[`'Danh muc'!$A$1:$A$${units.length}`], showErrorMessage:false, promptTitle:'Đơn vị tính', prompt:'Chọn trong danh mục hoặc gõ đơn vị khác.', showInputMessage:true}; }
    }); }
  ws.autoFilter={from:{row:1,column:1}, to:{row:1,column:C.cols.length}};
  const g=wb.addWorksheet('Huong dan'); g.getColumn(1).width=36; g.getColumn(2).width=12; g.getColumn(3).width=70;
  g.mergeCells('A1:C1'); g.getCell('A1').value=C.title; g.getCell('A1').font={name:XL.font, size:14, bold:true};
  g.mergeCells('A2:C2'); g.getCell('A2').value=C.intro; g.getCell('A2').alignment={wrapText:true, vertical:'top'}; g.getRow(2).height=48; g.getCell('A2').font={name:XL.font};
  const gh=g.getRow(4); ['Cột','Bắt buộc','Cách điền'].forEach((h,i)=>{ const x=gh.getCell(i+1); x.value=h; x.font={name:XL.font, bold:true, color:{argb:XL.headInk}}; x.fill={type:'pattern', pattern:'solid', fgColor:{argb:XL.head}}; x.border=box; });
  C.cols.forEach((c,i)=>{ const row=g.getRow(5+i); [c.h, c.req?'Có':'Không', c.num?'Số; có thể gõ 18.500 hoặc 1.234,5':c.date?'Ngày theo dạng ngày/tháng/năm, ví dụ 03/11/2026':c.k==='unit'?'Chọn trong danh sách (lấy từ danh mục Đơn vị tính của phần mềm)':'Chữ']
    .forEach((v,k)=>{ const x=row.getCell(k+1); x.value=v; x.font={name:XL.font, bold:k===1&&c.req}; x.border=box; x.alignment={wrapText:true}; }); });
  const tip=5+C.cols.length+1;
  ['Cột có dấu * và tiêu đề màu xanh đậm là bắt buộc.','Các dòng chữ xám nghiêng là ví dụ, xóa đi trước khi điền số liệu thật.','Có thể dán từ bảng dự toán sẵn có, miễn là giữ nguyên dòng tiêu đề ở dòng 1.']
    .forEach((v,k)=>{ g.mergeCells(tip+k,1,tip+k,3); const x=g.getCell(tip+k,1); x.value='• '+v; x.font={name:XL.font, italic:true}; });
  const out=await wb.xlsx.writeBuffer();
  saveFile(C.file, new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
}

/** Đọc tệp: tìm dòng tiêu đề trong 15 dòng đầu (khớp ít nhất 2 cột), ghép cột theo tên; không thấy tiêu đề thì đọc theo thứ tự cột của mẫu. */
function impParse(t, aoa){
  const C=IMPORTS[t]; const names=C.cols.map(c=>[c.k, [c.h, ...(c.al||[])].map(impKey)]);
  const match=row=>{ const m={}; (row||[]).forEach((cell,i)=>{ const key=impKey(cell); if(!key) return; const hit=names.find(([k,ns])=>m[k]===undefined && ns.includes(key)); if(hit) m[hit[0]]=i; }); return m; };
  let hdr=-1, map=null;
  for(let i=0;i<Math.min(15,aoa.length);i++){ const m=match(aoa[i]); if(Object.keys(m).length>=2){ hdr=i; map=m; break; } }
  if(!map){ map={}; C.cols.forEach((c,i)=>map[c.k]=i); }
  const miss=C.cols.filter(c=>c.req && map[c.k]===undefined).map(c=>c.h);
  const rows=[];
  aoa.slice(hdr+1).forEach((raw,i)=>{
    if(!raw || raw.every(x=>x===null||x===undefined||String(x).trim()==='')) return;
    const v={}, err=[], warn=[];
    C.cols.forEach(c=>{ const cell=map[c.k]===undefined? null : raw[map[c.k]];
      if(c.num){ const n=impNum(cell); if(Number.isNaN(n)) err.push(c.h+' không phải là số'); v[c.k]=Number.isNaN(n)? null : n; }
      else if(c.date){ const d=impDate(cell); if(d===null) err.push(c.h+' không đúng ngày'); v[c.k]=d||''; }
      else v[c.k]= cell==null? '' : String(cell).trim();
      if(c.req && (v[c.k]===null || v[c.k]==='') && !err.some(e=>e.startsWith(c.h))) err.push('Thiếu '+c.h.toLowerCase()); });
    /* dòng tổng cộng của bảng dự toán: bỏ qua, không báo lỗi */
    if(Object.values(v).some(x=>['tong','tong cong','cong'].includes(impKey(x)))) return;
    rows.push({line:hdr+2+i, v, err, warn});
  });
  return {rows, miss, hdr};
}

/** Hộp thoại nhập: x là ngữ cảnh (hợp đồng, gói thầu…). */
ACT.imp=(key)=>{
  const [t, ctx]=key.split('|'); const C=IMPORTS[t]; if(!C || !can(C.mod,'edit')) return;
  const x={cid:t==='sched'?'':ctx, kid:t==='sched'?ctx:''};
  const extra=C.extra? C.extra(x) : [];
  const st={rows:null, name:''};
  openModal(`<div class="mform imp"><header><h3>${esc(C.title)}</h3><button type="button" class="icon-btn" data-close aria-label="Đóng">×</button></header>
    <div class="imp-body">
      <p class="small muted" style="margin:0">${esc(C.intro)}${t!=='sched'&&get('contracts',x.cid)?' Hợp đồng: <b>'+esc(get('contracts',x.cid).number)+'</b>.':''}</p>
      <div class="imp-step"><b>1.</b><span>Tải tệp mẫu, điền số liệu (hoặc dán từ bảng dự toán), giữ dòng tiêu đề.</span><button type="button" class="btn sm" data-act="imp-tpl" data-id="${t}">Tải tệp mẫu</button></div>
      ${extra.length?`<div class="fgrid">${extra.map(f=>fieldHTML(f, f.def)).join('')}</div>`:''}
      <div class="imp-step"><b>2.</b><span>Chọn tệp Excel đã điền (.xlsx, .xls).</span><label class="btn sm primary" for="imp_file">Chọn tệp</label><input type="file" id="imp_file" accept=".xlsx,.xls,.csv" hidden></div>
      <div id="imp_res"></div>
    </div>
    <footer><span class="small muted" id="imp_msg" style="flex:1"></span><button type="button" class="btn ghost" data-close>Hủy</button><button type="button" class="btn primary" id="imp_save" disabled>Lưu</button></footer></div>`);
  const ov=$('#ov');
  const ctxNow=()=>{ const o={...x}; extra.forEach(f=>{ const el=$('#f_'+f.key,ov); if(el) o[f.key]=el.value; }); return o; };
  const show=()=>{
    if(!st.rows) return; const o=ctxNow(); const rows=st.rows.map(r=>({...r, err:[...r.err], warn:[...r.warn]}));
    C.check(rows, o); const ok=rows.filter(r=>!r.err.length), bad=rows.length-ok.length; st.ok=ok; st.o=o;
    const cols=[{h:'Dòng',f:r=>`<span class="num small">${r.line}</span>`}, ...C.cols.map(c=>({h:c.h, r:c.num, f:r=>{ const v=r.v[c.k]; return c.num? (v==null?'':fmtN(v,3)) : c.date? (v?`<span class="num">${fmtDate(v)}</span>`:'') : esc(v); }})),
      {h:'Kiểm tra', f:r=> r.err.length? `<span class="pill bad">Lỗi</span><div class="small" style="color:var(--red)">${esc(r.err.join('; '))}</div>` : r.warn.length? `<span class="pill warn">Lưu ý</span><div class="small muted">${esc(r.warn.join('; '))}</div>` : '<span class="pill ok">Hợp lệ</span>'}];
    $('#imp_res',ov).innerHTML=`<div class="imp-sum small"><b>${esc(st.name)}</b>: ${rows.length} dòng, ${ok.length} dòng hợp lệ${bad?`, <span style="color:var(--red)">${bad} dòng lỗi sẽ bỏ qua</span>`:''}.</div>
      ${ok.length? `<div class="imp-sum small">${C.summary(ok,o)}</div>` : ''}
      ${table(cols, rows.map((r,i)=>({...r,id:'r'+i})), {nopage:true, empty:'Không có dòng số liệu nào.'})}`;
    fitTables($('#imp_res',ov));
    const b=$('#imp_save',ov); b.disabled=!ok.length; b.textContent=ok.length? `Lưu ${ok.length} dòng hợp lệ` : 'Lưu';
  };
  extra.forEach(f=>{ const el=$('#f_'+f.key,ov); if(el){ el.addEventListener('change',show); el.addEventListener('input',show); } });
  $('#imp_file',ov).addEventListener('change', async e=>{
    const file=e.target.files[0]; if(!file) return; e.target.value='';
    if(!window.XLSX){ toast('Thư viện Excel chưa tải xong, thử lại sau.','err'); return; }
    try{
      const wb=XLSX.read(await file.arrayBuffer(), {type:'array'}); const ws=wb.Sheets[wb.SheetNames[0]];
      const aoa=XLSX.utils.sheet_to_json(ws, {header:1, raw:true, defval:null});
      const p=impParse(t, aoa);
      if(p.miss.length){ st.rows=null; $('#imp_res',ov).innerHTML=`<div class="alert bad">Tệp thiếu cột: ${esc(p.miss.join(', '))}. Hãy dùng tệp mẫu hoặc đặt đúng tên cột ở dòng tiêu đề.</div>`; $('#imp_save',ov).disabled=true; return; }
      st.rows=p.rows; st.name=file.name; show();
    }catch(ex){ console.error(ex); st.rows=null; $('#imp_res',ov).innerHTML='<div class="alert bad">Không đọc được tệp. Kiểm tra tệp có đúng định dạng Excel (.xlsx, .xls) không.</div>'; }
  });
  $('#imp_save',ov).addEventListener('click', async ()=>{
    const ok=st.ok||[], o=st.o; if(!ok.length) return;
    for(const f of extra) if(f.req && !o[f.key]){ $('#imp_msg',ov).textContent='Vui lòng nhập '+f.label.toLowerCase()+'.'; return; }
    const b=$('#imp_save',ov); b.disabled=true; let done=0; const fail=[];
    if(C.prepare){ try{ await C.prepare(ok,o); }catch(ex){ b.disabled=false; $('#imp_msg',ov).innerHTML=`<span style="color:var(--red)">${esc(errText(ex))}</span>`; return; } }
    for(const r of ok){
      try{ await Store.put(C.col, C.build(r,o)); done++; }catch(ex){ fail.push('dòng '+r.line+': '+errText(ex)); }
      b.textContent=`Đang lưu ${done+fail.length}/${ok.length}…`;
    }
    api('POST','/api/data/logs',{action:'Nhập từ Excel', module:COL_LABEL[C.col]||C.col, target:(st.name+': '+done+' dòng').slice(0,160)}).catch(()=>{});
    if(fail.length){ b.textContent='Đã lưu '+done+' dòng'; $('#imp_msg',ov).innerHTML=`<span style="color:var(--red)">${fail.length} dòng không lưu được: ${esc(fail.slice(0,3).join('; '))}${fail.length>3?'…':''}</span>`; S.dirty=true; return; }
    closeModal(); toast(`Đã nhập ${done} dòng từ ${st.name}.`); render();
  });
};
ACT['imp-tpl']=(t)=>impTemplate(t);
