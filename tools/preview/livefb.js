try{localStorage.setItem('usbudget_intro','1')}catch(e){}
window.__auth={currentUser:{uid:'U1',email:'o@example.com',getIdToken:async()=>'t'},onAuthStateChanged(cb){setTimeout(()=>cb(this.currentUser),0)},signOut:async()=>{}};
(function(){
 const tree={}; const L=[]; const cl=v=>v===undefined?null:JSON.parse(JSON.stringify(v));
 const parts=p=>String(p||'').split('/').filter(Boolean);
 const get=p=>parts(p).reduce((o,k)=>o&&typeof o==='object'?o[k]:undefined,tree);
 function put(p,v){const ks=parts(p);let o=tree;for(let i=0;i<ks.length-1;i++){if(!o[ks[i]]||typeof o[ks[i]]!=='object')o[ks[i]]={};o=o[ks[i]];}const k=ks.at(-1);if(v===null||v===undefined)delete o[k];else o[k]=cl(v);}
 function fire(){L.forEach(l=>{const v=cl(get(l.p));l.cb({val:()=>v});});}
 window.__tree=tree;
 function ref(p){p=p||'';return{
  on(ev,cb){if(p==='.info/connected'){setTimeout(()=>cb({val:()=>true}),0);return;}L.push({p,cb});setTimeout(()=>{const v=cl(get(p));cb({val:()=>v});},0);},
  set(v){put(p,v);fire();return Promise.resolve();},
  update(u){Object.keys(u).forEach(k=>put(p+'/'+k,u[k]));fire();return Promise.resolve();},
  remove(){put(p,null);fire();return Promise.resolve();},
  once(){const v=cl(get(p));return Promise.resolve({val:()=>v});}
 };}
 window.firebase={initializeApp(){},auth(){return window.__auth},database(){return{ref}}};
})();
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{try{if(!state.expenses.length){confirmResetToDemo();document.getElementById('modal-confirm-btn').click();closeModal();}}catch(e){}},400));
