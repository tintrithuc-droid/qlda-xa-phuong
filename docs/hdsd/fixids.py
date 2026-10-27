import sys,zipfile,re,shutil,os
fn=sys.argv[1];tmp=fn+'.tmp'
zi=zipfile.ZipFile(fn);zo=zipfile.ZipFile(tmp,'w',zipfile.ZIP_DEFLATED)
for it in zi.infolist():
    d=zi.read(it.filename)
    if it.filename=='word/document.xml':
        s=d.decode();n=[0]
        def st(m):
            n[0]+=1;return m.group(1)+'w:id="%d"'%(1000+n[0])
        s=re.sub(r'(<w:bookmarkStart\b[^>]*?)w:id="\d+"',st,s)
        e=[0]
        def en(m):
            e[0]+=1;return m.group(1)+'w:id="%d"'%(1000+e[0])
        s=re.sub(r'(<w:bookmarkEnd\b[^>]*?)w:id="\d+"',en,s)
        assert n[0]==e[0];d=s.encode()
    zo.writestr(it,d)
zo.close();shutil.move(tmp,fn)
