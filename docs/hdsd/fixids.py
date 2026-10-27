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
        assert n[0]==e[0]
        # viền mảnh quanh ảnh chụp màn hình
        def ln(m):
            b=m.group(0)
            if 'name="shot-' not in b or '<a:ln' in b: return b
            return b.replace('</pic:spPr>','<a:ln w="6350"><a:solidFill><a:srgbClr val="9AA3B0"/></a:solidFill></a:ln></pic:spPr>')
        s=re.sub(r'<w:drawing>.*?</w:drawing>',ln,s,flags=re.S)
        d=s.encode()
    zo.writestr(it,d)
zo.close();shutil.move(tmp,fn)
