// Keep immediately usable Admin HTML in sync with the shared shell. No network or backend changes.
import fs from 'node:fs';
import vm from 'node:vm';
const window={matchMedia:()=>({matches:false})};
vm.runInNewContext(fs.readFileSync('assets/js/auth-shell.js','utf8'),{window,Set});
for(const file of ['admin-bcc-login.html','admin-login.html']){
 let html=fs.readFileSync(file,'utf8');
 const start=html.indexOf('<main id="ns-admin-auth">')+'<main id="ns-admin-auth">'.length,end=html.indexOf('</main>',start);
 let content=html.slice(start,end);
 if(content.includes('<!-- AUTH_FORM_START -->'))content=content.split('<!-- AUTH_FORM_START -->')[1].split('<!-- AUTH_FORM_END -->')[0];
 const shell='<header class="ns-auth-header">'+window.NSAuthShell.brand()+'<a href="/index.html">Back to the storefront ↗</a></header>'+window.NSAuthShell.markup('admin','<!-- AUTH_FORM_START -->'+content+'<!-- AUTH_FORM_END -->','signin');
 html=html.slice(0,start)+shell+html.slice(end);fs.writeFileSync(file,html);
}
