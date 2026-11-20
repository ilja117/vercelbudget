// Перевірка «Додати» з «Нові з картки» на заглушці, що будить слухачів як справжній Firebase. Сервер :8766; запуск: node tools/preview/inbox-accept.cjs
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:900},serviceWorkers:'block'});
await ctx.route('**/fakefb.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(__dirname+'/livefb.js','utf8')}));
await ctx.addInitScript(()=>{try{localStorage.setItem('usbudget_intro','1');localStorage.setItem('usbudget_push_owner','p1')}catch(e){}});
const page=await ctx.newPage();page.on('pageerror',e=>errs.push(e.message));
await page.goto('http://localhost:8766/');await page.waitForTimeout(1800);
const res={};
for (const [k,f,kind] of [['x1','shared:p1',''],['x2','own',''],['x3','',"in"]]) {
  await page.evaluate(([k,kind])=>firebase.database().ref('inbox/'+k).set({id:k,who:'p1',ts:Date.now(),amount:123,merchant:'Тест '+k,kind:kind||undefined}),[k,kind]);
  await page.waitForTimeout(400);
  if(f) await page.selectOption(`#g-inbox [data-ib="${k}"] [data-ib-for]`, f);
  await page.click(`#g-inbox [data-ib="${k}"] [data-ib-ok]`); await page.waitForTimeout(500);
  res[k]=await page.evaluate(k=>({state:[...state.expenses,...(state.personalExpenses||[]),...(state.personalIncomes||[])].some(x=>x.id==='ib_'+k), server:JSON.stringify(window.__tree).includes('ib_'+k), inboxLeft:!!(window.__tree.inbox||{})[k]}),k);
}
// «Відмінити» повертає і запис, і платіж у «Нові з картки»
  await page.evaluate(k=>firebase.database().ref('inbox/'+k).set({id:k,who:'p1',ts:Date.now(),amount:50,merchant:'Undo'}),'x4'); await page.waitForTimeout(400);
  await page.click('#g-inbox [data-ib="x4"] [data-ib-ok]'); await page.waitForTimeout(300); await page.click('#undo-toast button'); await page.waitForTimeout(500);
  res.undo=await page.evaluate(()=>({state:state.expenses.some(x=>x.id==='ib_x4'), server:JSON.stringify(window.__tree).includes('ib_x4'), back:!!(window.__tree.inbox||{}).x4}));
  console.log(JSON.stringify(res),'errors',errs);await b.close()})();
