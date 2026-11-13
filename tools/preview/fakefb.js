try{localStorage.setItem('usbudget_intro','1')}catch(e){}
window.__auth={currentUser:{uid:'U1',email:'olena@example.com',getIdToken:async()=>'t'},onAuthStateChanged(cb){setTimeout(()=>cb(this.currentUser),0)},signOut:async()=>{}};
window.firebase={initializeApp(){},auth(){return window.__auth},database(){return{ref(){return{on(){},set(){return Promise.resolve()},update(){return Promise.resolve()},remove(){return Promise.resolve()}}}}}};
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{try{if(!state.expenses.length){confirmResetToDemo();document.getElementById('modal-confirm-btn').click();closeModal();}var t=new URLSearchParams(location.search).get('tab');if(t)switchTab(t);}catch(e){}},400));
