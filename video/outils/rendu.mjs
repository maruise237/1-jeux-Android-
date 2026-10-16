// rendu.mjs <dossier> [instants...]  — sans instants : rendu complet des images
import { chromium } from 'playwright-core';
import fs from 'fs'; import path from 'path';
const FPS=30, dir=process.argv[2]||'v2';
const page_url='file://'+path.resolve(dir,'animation.html');
const instants=process.argv.slice(3).map(Number);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox','--force-color-profile=srgb','--font-render-hinting=none']});
const pg=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
await pg.goto(page_url);
await pg.evaluate(()=>document.fonts.ready);
await pg.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
await pg.waitForFunction(()=>window.PRET===true);
const DUREE=await pg.evaluate(()=>window.DUREE);
if(instants.length){
  fs.mkdirSync(path.join(dir,'planche'),{recursive:true});
  for(let i=0;i<instants.length;i++){const t=instants[i];await pg.evaluate(t=>render(t),t);
    await pg.screenshot({path:path.join(dir,'planche',`p${String(i).padStart(2,'0')}.jpg`),type:'jpeg',quality:90});}
  console.log('planche:',instants.length,'images');
}else{
  const out=path.join(dir,'images'); fs.rmSync(out,{recursive:true,force:true}); fs.mkdirSync(out,{recursive:true});
  const n=Math.round(FPS*DUREE);
  for(let f=0;f<n;f++){await pg.evaluate(t=>render(t),f/FPS);
    await pg.screenshot({path:`${out}/f${String(f).padStart(5,'0')}.jpg`,type:'jpeg',quality:93});
    if(f%120===0)process.stdout.write(f+' ');}
  console.log('\n'+n+' images');
}
await b.close();
