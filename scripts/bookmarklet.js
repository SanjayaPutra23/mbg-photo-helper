/**
 * MBG Local Photo Helper - Bookmarklet Source (Readable & Ultra-Compact)
 * Versi 2.1.1 (Debugging Mobile, Memory Protection & Auto-Advance)
 * Mendukung HP (Android Chrome, iOS Safari, Kiwi) dan Desktop tanpa ekstensi.
 */
(function(){
    'use strict';

    // 1. Bersihkan atribut capture terus-menerus
    function cleanCapture(){
        document.querySelectorAll('input[type="file"]').forEach(i=>{
            if(i.id!=='mbg-bm-file'&&i.hasAttribute('capture'))i.removeAttribute('capture');
        });
    }
    cleanCapture();
    if(!window._mbgCleanTimer)window._mbgCleanTimer=setInterval(cleanCapture,2000);

    const CATS=['1. Makanan / Masakan','2. Ompreng / Wadah','3. Cuci Ompreng','4. Pendukung'];

    if(!window._mbgBmState){
        window._mbgBmState={photos:[],idx:0,autoNext:true,min:false,stage:'Siap memilih foto'};
    }
    const st=window._mbgBmState;

    // Suntik style kompak sekali saja
    if(!document.getElementById('mbg-bm-css')){
        const s=document.createElement('style');
        s.id='mbg-bm-css';
        s.textContent='#mbg-quick-bypass{position:fixed;bottom:14px;right:14px;z-index:999999999;background:#0f172a;color:#fff;border:2px solid #3b82f6;border-radius:12px;padding:10px;font-family:sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.6);width:290px;max-width:calc(100vw - 28px);box-sizing:border-box;font-size:12px}'+
            '.mbg-r{display:flex;align-items:center;justify-content:space-between}'+
            '.mbg-c{display:flex;align-items:center;background:#1e293b;border-radius:6px;padding:4px 6px;gap:6px;font-size:11px}'+
            '.mbg-b{border:none;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:bold;cursor:pointer}'+
            '.mbg-bb{background:#2563eb;color:#fff}.mbg-bg{background:#16a34a;color:#fff}.mbg-bd{background:#334155;color:#cbd5e1}.mbg-br{background:#991b1b;color:#fecaca}'+
            '.mbg-t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
            '.mbg-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;box-shadow:0 0 6px #22c55e}';
        (document.head||document.documentElement).appendChild(s);
    }

    function setStage(msg){
        st.stage=msg;
        const el=document.getElementById('mbg-bm-stage');
        if(el)el.innerText='Tahap: '+msg;
    }

    function sync(){
        const p=st.photos[st.idx];
        window.mbgSelectedFile=(p&&p.file)?p.file:null;
        window.mbgPhotoList=st.photos;
    }

    function advance(isSuccess){
        if(isSuccess&&st.photos[st.idx])st.photos[st.idx].status='success';
        const next=st.photos.findIndex((p,i)=>i>st.idx&&p.status==='pending');
        const any=next!==-1?next:st.photos.findIndex(p=>p.status==='pending');
        if(any!==-1){
            st.photos.forEach((p,i)=>{if(p.status==='active'&&i!==any)p.status='pending';});
            st.idx=any;
            st.photos[any].status='active';
            setStage('Kamera siap: foto #'+(any+1));
        } else {
            const all=st.photos.length>0&&st.photos.every(p=>p.status==='success');
            setStage(all?'Semua foto selesai! 🎉':'Antrean selesai');
        }
        sync();
        render();
    }

    function render(){
        let d=document.getElementById('mbg-quick-bypass');
        if(!d){
            d=document.createElement('div');
            d.id='mbg-quick-bypass';
            (document.body||document.documentElement).appendChild(d);
        }

        const total=st.photos.length;
        const done=st.photos.filter(p=>p.status==='success').length;
        const cur=st.photos[st.idx];

        if(st.min){
            d.style.cssText='position:fixed;bottom:14px;right:14px;z-index:999999999;background:#0f172a;color:#fff;border:2px solid #3b82f6;border-radius:20px;padding:6px 12px;font-family:sans-serif;font-size:11px;display:flex;align-items:center;gap:6px;cursor:pointer;';
            d.innerHTML='<span class="mbg-dot"></span><b>MBG ('+done+'/'+total+')</b> [Buka]';
            d.onclick=()=>{st.min=false;render();};
            return;
        }

        d.style.cssText='position:fixed;bottom:14px;right:14px;z-index:999999999;background:#0f172a;color:#fff;border:2px solid #3b82f6;border-radius:12px;padding:10px;font-family:sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.6);width:290px;max-width:calc(100vw - 28px);box-sizing:border-box;font-size:12px;';
        d.onclick=null;

        let h='<div class="mbg-r" style="margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #334155;">'+
            '<div style="display:flex;align-items:center;gap:6px;"><span class="mbg-dot"></span><b>MBG Multi-Foto v2.1</b></div>'+
            '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:10px;color:#94a3b8;">'+done+'/'+total+' Selesai</span><button id="mbg-bm-min" class="mbg-b mbg-bd" style="padding:1px 6px;">−</button></div>'+
            '</div>'+
            '<div style="display:flex;gap:6px;margin-bottom:8px;">'+
            '<button id="mbg-bm-add" class="mbg-b mbg-bb" style="flex:1;padding:6px;font-size:11px;">+ Pilih / Tambah Foto</button>'+
            '<input type="file" id="mbg-bm-file" accept="image/*" multiple style="position:absolute;left:-9999px;opacity:0;width:1px;height:1px;"/>'+
            (total>0?'<button id="mbg-bm-clr" class="mbg-b mbg-bd" style="color:#f87171;padding:6px 8px;">Reset</button>':'')+
            '</div>';

        if(total===0){
            h+='<div style="border:1px dashed #475569;border-radius:6px;padding:12px;text-align:center;color:#94a3b8;font-size:11px;">Pilih 4 foto dokumentasi (Makanan, Ompreng, Cuci, Pendukung) dari Galeri HP Anda.</div>';
        } else {
            h+='<div style="background:#1e293b;border-radius:6px;padding:6px;margin-bottom:6px;border:'+(cur&&cur.status==='active'?'2px solid #38bdf8':'1px solid #334155')+';">'+
                '<div class="mbg-r" style="margin-bottom:2px;">'+
                '<span style="font-size:10px;color:#38bdf8;font-weight:bold;">📷 AKTIF DI KAMERA (#'+(st.idx+1)+'):</span>'+
                (cur&&cur.status==='active'?'<button data-act="done" class="mbg-b mbg-bg" title="Tandai foto ini selesai diunggah">✓ Selesai</button>':'')+
                '</div>'+
                '<div style="display:flex;align-items:center;gap:6px;">'+
                (cur?'<img src="'+cur.url+'" style="width:36px;height:36px;object-fit:cover;border-radius:4px;border:1px solid #475569;"/>':'')+
                '<div style="flex:1;min-width:0;"><div class="mbg-t" style="font-weight:bold;">'+(cur?cur.cat:'-')+'</div><div class="mbg-t" style="font-size:10px;color:#94a3b8;">'+(cur?cur.name:'')+'</div></div>'+
                '</div></div>'+
                '<div style="max-height:120px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;margin-bottom:6px;">';

            st.photos.forEach((p,i)=>{
                const isAct=(i===st.idx);
                let badge='<span style="color:#cbd5e1;font-size:9px;">Menunggu</span>';
                if(isAct)badge='<span style="color:#38bdf8;font-weight:bold;font-size:9px;">Aktif</span>';
                if(p.status==='success')badge='<span style="color:#4ade80;font-weight:bold;font-size:9px;">✓ Selesai</span>';
                if(p.status==='failed')badge='<span style="color:#f87171;font-weight:bold;font-size:9px;">✕ Gagal</span>';

                h+='<div class="mbg-c">'+
                    '<span class="mbg-t" style="flex:1;">'+(i+1)+'. '+p.cat+'</span>'+
                    badge+
                    (!isAct&&p.status!=='success'?'<button data-act="sel" data-i="'+i+'" class="mbg-b mbg-bb" style="padding:1px 4px;font-size:9px;">Pilih</button>':'')+
                    (p.status==='failed'?'<button data-act="ret" data-i="'+i+'" class="mbg-b mbg-br" style="padding:1px 4px;font-size:9px;">Ulang</button>':'')+
                    '<button data-act="del" data-i="'+i+'" style="background:transparent;color:#94a3b8;border:none;cursor:pointer;font-size:11px;">✕</button>'+
                    '</div>';
            });
            h+='</div>';
        }

        h+='<div id="mbg-bm-stage" class="mbg-t" style="font-size:10px;color:#38bdf8;margin-bottom:6px;">Tahap: '+st.stage+'</div>'+
            '<div class="mbg-r" style="font-size:10px;color:#94a3b8;border-top:1px solid #334155;padding-top:6px;">'+
            '<label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="mbg-bm-auto" '+(st.autoNext?'checked':'')+'/> Auto-Next</label>'+
            '<button id="mbg-bm-next" class="mbg-b mbg-bd" style="color:#38bdf8;">Next >></button>'+
            '</div>';

        d.innerHTML=h;

        d.querySelector('#mbg-bm-min').onclick=(e)=>{e.stopPropagation();st.min=true;render();};
        const btnAdd=d.querySelector('#mbg-bm-add');
        const fInput=d.querySelector('#mbg-bm-file');

        btnAdd.onclick=()=>{fInput.value='';fInput.click();};

        fInput.onchange=(e)=>{
            if(e.target.files&&e.target.files.length>0){
                let added=0;
                for(let i=0;i<e.target.files.length;i++){
                    const fl=e.target.files[i];
                    if(fl.size>15*1024*1024){setStage('File >15MB dilewati');continue;}
                    const num=st.photos.length;
                    st.photos.push({
                        file:fl,
                        name:fl.name,
                        url:URL.createObjectURL(fl),
                        cat:num<CATS.length?CATS[num]:'Pendukung #'+(num+1),
                        status:st.photos.length===0?'active':'pending'
                    });
                    added++;
                }
                if(st.photos.length>0&&!st.photos.some(p=>p.status==='active')){
                    st.idx=0;
                    st.photos[0].status='active';
                }
                setStage(added+' foto ditambahkan');
                sync();
                render();
            }
        };

        const clr=d.querySelector('#mbg-bm-clr');
        if(clr)clr.onclick=()=>{
            st.photos.forEach(p=>{try{URL.revokeObjectURL(p.url);}catch(e){}});
            st.photos=[];
            st.idx=0;
            setStage('Antrean dikosongkan');
            sync();
            render();
        };

        const chkAuto=d.querySelector('#mbg-bm-auto');
        if(chkAuto)chkAuto.onchange=(e)=>{st.autoNext=e.target.checked;};

        const btnNxt=d.querySelector('#mbg-bm-next');
        if(btnNxt)btnNxt.onclick=()=>{advance(false);};

        d.querySelectorAll('[data-act]').forEach(b=>{
            b.onclick=(e)=>{
                e.stopPropagation();
                const act=b.getAttribute('data-act');
                const i=parseInt(b.getAttribute('data-i'),10);
                if(act==='del'){
                    try{URL.revokeObjectURL(st.photos[i].url);}catch(e){}
                    st.photos.splice(i,1);
                    if(st.idx>=st.photos.length)st.idx=Math.max(0,st.photos.length-1);
                    if(st.photos[st.idx]&&st.photos[st.idx].status==='pending')st.photos[st.idx].status='active';
                    setStage('Foto dihapus');
                    sync();
                    render();
                } else if(act==='sel'){
                    st.photos.forEach((p,idx)=>{if(p.status==='active'&&idx!==i)p.status='pending';});
                    st.idx=i;
                    if(st.photos[i].status!=='success')st.photos[i].status='active';
                    setStage('Kamera siap: foto #'+(i+1));
                    sync();
                    render();
                } else if(act==='ret'){
                    st.photos[i].status='pending';
                    st.idx=i;
                    st.photos[i].status='active';
                    setStage('Foto #'+(i+1)+' disiapkan ulang');
                    sync();
                    render();
                } else if(act==='done'){
                    advance(true);
                }
            };
        });
    }

    // 3. Jembatan WebRTC MediaStream Virtual Canvas dengan Proteksi Memori Mobile
    if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&!window._mbgBmHooked){
        window._mbgBmHooked=true;
        const origGUM=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

        navigator.mediaDevices.getUserMedia=async(c)=>{
            const cur=st.photos[st.idx];
            if(c&&c.video&&cur&&cur.file){
                setStage('Mengalirkan ['+cur.cat+'] ke kamera...');
                try {
                    const cv=document.createElement('canvas');
                    const im=new Image();
                    im.src=cur.url;

                    // Fallback timeout agar tidak hang di HP
                    await new Promise(r=>{
                        if(im.complete&&im.naturalWidth)return r();
                        im.onload=()=>r();
                        im.onerror=()=>r();
                        setTimeout(r,2000);
                    });

                    // Skala resolusi aman (max 1280px)
                    let w=im.naturalWidth||1280;
                    let h=im.naturalHeight||720;
                    const maxDim=1280;
                    if(w>maxDim||h>maxDim){
                        if(w>h){h=Math.round((h*maxDim)/w);w=maxDim;}
                        else{w=Math.round((w*maxDim)/h);h=maxDim;}
                    }
                    cv.width=w;
                    cv.height=h;

                    const cx=cv.getContext('2d');
                    cx.drawImage(im,0,0,w,h);

                    const stream=cv.captureStream(20);
                    const timer=setInterval(()=>{
                        try{cx.drawImage(im,0,0,w,h);}catch(e){clearInterval(timer);}
                    },50);

                    const track=stream.getVideoTracks()[0];
                    if(track){
                        let done=false;
                        const finalize=()=>{
                            if(done)return;
                            done=true;
                            clearInterval(timer);
                            cur.status='success';
                            setStage('Foto #'+(st.idx+1)+' sukses dijepret!');
                            if(st.autoNext)advance(true);
                            else{sync();render();}
                        };
                        const origStop=track.stop.bind(track);
                        track.stop=()=>{origStop();finalize();};
                        track.addEventListener('ended',finalize);
                    }
                    return stream;
                } catch(err){
                    setStage('Error kamera: '+(err.message||'Gagal'));
                    cur.status='failed';
                    render();
                    throw err;
                }
            }
            return origGUM(c);
        };
    }

    render();
})();
