/*
http server with liveReload for pagedjs
*/

var G=Object.create;var C=Object.defineProperty;var Q=Object.getOwnPropertyDescriptor;var K=Object.getOwnPropertyNames;var X=Object.getPrototypeOf,Z=Object.prototype.hasOwnProperty;var ee=(d,t)=>{for(var e in t)C(d,e,{get:t[e],enumerable:!0})},B=(d,t,e,s)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of K(t))!Z.call(d,i)&&i!==e&&C(d,i,{get:()=>t[i],enumerable:!(s=Q(t,i))||s.enumerable});return d};var w=(d,t,e)=>(e=d!=null?G(X(d)):{},B(t||!d||!d.__esModule?C(e,"default",{value:d,enumerable:!0}):e,d)),te=d=>B(C({},"__esModule",{value:!0}),d);var se={};ee(se,{default:()=>j});module.exports=te(se);var h=require("obsidian"),H=w(require("path"));var u=class{constructor(){this.logHistory=[];this.maxHistorySize=100}static getInstance(){return u.instance||(u.instance=new u),u.instance}log(t,e,s){let i={level:t,message:e,timestamp:Date.now(),category:s};this.logHistory.push(i),this.logHistory.length>this.maxHistorySize&&this.logHistory.shift();let n=`${this.getEmoji(t,s)} [${(s==null?void 0:s.toUpperCase())||t.toUpperCase()}] ${e}`;switch(t){case"debug":break;case"info":break;case"warn":break;case"error":break}}getEmoji(t,e){return e?{server:"\u{1F680}",reload:"\u{1F504}",status:"\u{1F4E1}",file:"\u{1F4C1}",request:"\u{1F310}",error:"\u274C",template:"\u{1F3A8}"}[e.toLowerCase()]||"\u{1F4DD}":{debug:"\u{1F50D}",info:"\u2139\uFE0F",warn:"\u26A0\uFE0F",error:"\u274C"}[t]||"\u{1F4DD}"}debug(t,e){this.log("debug",t,e)}info(t,e){this.log("info",t,e)}warn(t,e){this.log("warn",t,e)}error(t,e){this.log("error",t,e)}getHistory(){return[...this.logHistory]}clearHistory(){this.logHistory=[]}};var Y=w(require("http")),q=w(require("fs")),S=w(require("path")),U=w(require("url"));var F=class{constructor(t){this.server=null;this.startTime=0;this.lastModified=Date.now();this.mimeTypes={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"application/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".gif":"image/gif",".svg":"image/svg+xml",".ico":"image/x-icon",".txt":"text/plain; charset=utf-8",".pdf":"application/pdf"};this.config=t,this.logger=u.getInstance()}async start(){if(this.server){this.logger.warn("Le serveur est d\xE9j\xE0 en cours d'ex\xE9cution","server");return}return new Promise((t,e)=>{try{this.server=Y.createServer((s,i)=>{this.handleRequest(s,i)}),this.server.listen(this.config.port,()=>{this.startTime=Date.now(),this.logger.info(`Serveur d\xE9marr\xE9 sur http://localhost:${this.config.port}`,"server"),this.logger.info(`Dossier public : ${this.config.publicPath}`,"server"),t()}),this.server.on("error",s=>{s.code==="EADDRINUSE"?(this.config.port++,this.logger.warn(`Port occup\xE9, essai du port ${this.config.port}`,"server"),this.server=null,this.start().then(t).catch(e)):(this.logger.error(`Erreur serveur : ${s.message}`,"server"),e(s))})}catch(s){this.logger.error(`Erreur lors du d\xE9marrage : ${s.message}`,"server"),e(s)}})}async stop(){if(!this.server){this.logger.warn("Aucun serveur en cours d'ex\xE9cution","server");return}return new Promise(t=>{this.server.close(()=>{this.logger.info("Serveur HTTP arr\xEAt\xE9","server"),this.server=null,this.startTime=0,t()})})}getStatus(){return{isRunning:this.server!==null,port:this.config.port,lastModified:this.lastModified,uptime:this.startTime?Date.now()-this.startTime:0}}getPort(){return this.config.port}isRunning(){return this.server!==null}updateLastModified(t){this.lastModified=t,this.logger.debug(`LastModified mis \xE0 jour: ${t}`,"reload")}updatePublicPath(t){this.config.publicPath=t,this.logger.info(`Chemin public mis \xE0 jour: ${t}`,"server")}handleRequest(t,e){let s=U.parse(t.url||"/",!0),i=s.pathname||"/",r=s.query;this.logger.debug(`${t.method} ${i}`,"request");try{i==="/status"?this.handleStatusRequest(e):i==="/api/logs"?this.handleLogsRequest(r,e):this.handleStaticFile(i,e)}catch(n){this.logger.error(`Erreur lors du traitement de la requ\xEAte: ${n.message}`,"request"),this.sendErrorResponse(e,500,"Erreur interne du serveur")}}handleStatusRequest(t){let e={status:"ok",lastModified:this.lastModified,time:Date.now(),uptime:this.startTime?Date.now()-this.startTime:0,version:"1.0.0"};this.sendJsonResponse(t,e)}handleLogsRequest(t,e){let s=this.logger.getHistory(),i=parseInt(t.limit)||50,r=s.slice(-i);this.sendJsonResponse(e,{logs:r,total:s.length,limit:i})}handleStaticFile(t,e){t==="/"&&(t="/index.html");let s=S.join(this.config.publicPath,t);if(!this.isPathSafe(s)){this.logger.warn(`Tentative d'acc\xE8s non autoris\xE9: ${t}`,"request"),this.sendErrorResponse(e,403,"Acc\xE8s interdit");return}this.serveFile(s,e)}isPathSafe(t){let e=S.resolve(t),s=S.resolve(this.config.publicPath);return e.startsWith(s)}serveFile(t,e){q.readFile(t,(s,i)=>{if(s){s.code==="ENOENT"?this.send404Response(e):(this.logger.error(`Erreur lors de la lecture du fichier ${t}: ${s.message}`,"request"),this.sendErrorResponse(e,500,"Erreur lors de la lecture du fichier"));return}let r=S.extname(t).toLowerCase(),n=this.getContentType(r);if(e.writeHead(200,{"Content-Type":n,"Access-Control-Allow-Origin":"*","Cache-Control":"no-cache, no-store, must-revalidate",Pragma:"no-cache",Expires:"0"}),r===".html"){let a=this.injectReloadScript(i.toString());e.end(a)}else e.end(i)})}getContentType(t){return this.mimeTypes[t]||"application/octet-stream"}injectReloadScript(t){let e=`
<script>
(function() {
    let lastCheck = ${this.lastModified};
    console.log('\u{1F680} [AUTO-RELOAD] Script initialis\xE9 - lastCheck:', lastCheck);
    
    async function checkForUpdates() {
        try {
            const response = await fetch('/status');
            const data = await response.json();
            
            if (data.lastModified > lastCheck) {
                console.log('\u{1F504} [AUTO-RELOAD] Changement d\xE9tect\xE9 - Rechargement !');
                console.log('\u{1F504} [AUTO-RELOAD] Ancien:', lastCheck, 'Nouveau:', data.lastModified);
                location.reload();
            }
            lastCheck = data.lastModified;
        } catch (error) {
            console.warn('\u274C [AUTO-RELOAD] Erreur de connexion:', error);
        }
    }
    
    // V\xE9rifier toutes les secondes
    setInterval(checkForUpdates, 1000);
    
    console.log('\u{1F3AF} [AUTO-RELOAD] Pr\xEAt - Modifiez un fichier .md pour tester !');
})();
<\/script>`;return t.replace("</body>",e+"</body>")}send404Response(t){let e=this.get404Template();t.writeHead(404,{"Content-Type":"text/html; charset=utf-8"}),t.end(e)}get404Template(){return`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page non trouv\xE9e</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        .container {
            background: rgba(255, 255, 255, 0.95);
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }
        .error-code {
            font-size: 6rem;
            font-weight: 900;
            color: #667eea;
            margin-bottom: 20px;
        }
        .error-title {
            font-size: 2rem;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 20px;
        }
        .error-message {
            font-size: 1.1rem;
            color: #7f8c8d;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .path-info {
            background: #e8f4fd;
            border: 1px solid #bee5eb;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-family: monospace;
            font-size: 0.9rem;
            word-break: break-all;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 10px;
            transition: transform 0.3s ease;
            cursor: pointer;
            border: none;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .help {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
        }
        code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-code">404</div>
        <h1 class="error-title">Page non trouv\xE9e</h1>
        <p class="error-message">
            Le fichier que vous cherchez n'existe pas.
        </p>
        
        <div class="path-info">
            <strong>\u{1F4C2} Chemin public :</strong><br>
            ${this.config.publicPath}
        </div>
        
        <div class="help">
            <h3>\u{1F4A1} Pour commencer :</h3>
            <ol>
                <li>Cr\xE9ez le dossier <code>${S.basename(this.config.publicPath)}/</code> dans votre coffre Obsidian</li>
                <li>Placez votre fichier <code>index.html</code> dans ce dossier</li>
                <li>Actualisez cette page</li>
            </ol>
        </div>
        
        <button onclick="location.href='/'" class="btn">\u{1F3E0} Retour \xE0 l'accueil</button>
        <button onclick="location.reload()" class="btn">\u{1F504} Actualiser</button>
    </div>
</body>
</html>`}sendJsonResponse(t,e){t.writeHead(200,{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}),t.end(JSON.stringify(e,null,2))}sendErrorResponse(t,e,s){t.writeHead(e,{"Content-Type":"text/plain"}),t.end(s)}};var L=class{constructor(t,e=["md"],s=""){this.changeCallbacks=[];this.publicFolderPath="";this.vault=t,this.logger=u.getInstance(),this.watchedExtensions=e,this.publicFolderPath=s}startWatching(){this.vault.on("modify",t=>{this.handleFileChange(t,"modify")}),this.vault.on("create",t=>{this.handleFileChange(t,"create")}),this.vault.on("delete",t=>{this.handleFileChange(t,"delete")}),this.logger.info(`Surveillance activ\xE9e pour les extensions: ${this.watchedExtensions.join(", ")}`,"file"),this.logger.info(`Dossier surveill\xE9: ${this.publicFolderPath||"TOUS LES DOSSIERS"}`,"file")}handleFileChange(t,e){if(!this.watchedExtensions.includes(t.extension))return;if(!this.isFileInPublicFolder(t)){this.logger.debug(`Fichier ${t.path} ignor\xE9 - en dehors du dossier public`,"file");return}let s={filePath:t.path,fileName:t.name,extension:t.extension,changeType:e,timestamp:Date.now()};this.logger.info(`Fichier ${e}: ${t.name} (dans ${this.publicFolderPath})`,"file"),this.changeCallbacks.forEach(i=>{try{i(s)}catch(r){this.logger.error(`Erreur dans le callback de changement de fichier: ${r}`,"file")}})}isFileInPublicFolder(t){if(!this.publicFolderPath||this.publicFolderPath.trim()==="")return!0;let e=this.publicFolderPath.replace(/\\/g,"/").replace(/\/$/,""),s=t.path.replace(/\\/g,"/"),i=s.startsWith(e+"/")||s===e;return i?this.logger.debug(`\u2705 Fichier ${t.name} est dans le dossier public ${e}`,"file"):this.logger.debug(`\u274C Fichier ${t.name} n'est PAS dans le dossier public ${e}`,"file"),i}onFileChange(t){this.changeCallbacks.push(t)}removeFileChangeCallback(t){let e=this.changeCallbacks.indexOf(t);e>-1&&this.changeCallbacks.splice(e,1)}stopWatching(){this.changeCallbacks=[],this.logger.info("Surveillance des fichiers arr\xEAt\xE9e","file")}setWatchedExtensions(t){this.watchedExtensions=t,this.logger.info(`Extensions surveill\xE9es mises \xE0 jour: ${t.join(", ")}`,"file")}setPublicFolderPath(t){this.publicFolderPath=t,this.logger.info(`Dossier public mis \xE0 jour: ${t||"TOUS LES DOSSIERS"}`,"file")}getPublicFolderPath(){return this.publicFolderPath}getWatchingStats(){return{extensions:[...this.watchedExtensions],publicFolder:this.publicFolderPath,callbacksCount:this.changeCallbacks.length}}};var f=require("obsidian");var $=class{constructor(t){this.plugin=t,this.logger=u.getInstance()}async toggleServer(){this.plugin.isServerRunning()?(await this.plugin.stopServer(),this.logger.info("Serveur arr\xEAt\xE9 via commande","server")):(await this.plugin.startServer(),this.logger.info("Serveur d\xE9marr\xE9 via commande","server"))}openInBrowser(){if(!this.plugin.isServerRunning()){new f.Notice("\u274C Le serveur n'est pas d\xE9marr\xE9"),this.logger.warn("Tentative d'ouverture navigateur avec serveur arr\xEAt\xE9","server");return}let e=`http://localhost:${this.plugin.getServerPort()}`;try{require("electron").shell.openExternal(e),new f.Notice(`\u{1F310} Ouverture de ${e}`),this.logger.info(`Navigateur ouvert sur ${e}`,"server")}catch(s){new f.Notice(`\u274C Erreur lors de l'ouverture du navigateur: ${s.message}`),this.logger.error(`Erreur ouverture navigateur: ${s.message}`,"server")}}showStatus(){let t=this.plugin.getServerStatus();if(!t){new f.Notice("\u274C Serveur non initialis\xE9");return}let e=t.isRunning?`\u2705 Serveur actif sur le port ${t.port}
\u23F1\uFE0F Uptime: ${this.formatUptime(t.uptime)}
\u{1F504} Derni\xE8re modification: ${new Date(t.lastModified).toLocaleString()}`:"\u274C Serveur arr\xEAt\xE9";new f.Notice(e,5e3),this.logger.info("Statut affich\xE9 via commande","server")}showLogs(){new O(this.plugin.app,this.logger.getHistory()).open(),this.logger.info("Logs affich\xE9s via commande","server")}async restartServer(){this.logger.info("Red\xE9marrage du serveur via commande","server"),new f.Notice("\u{1F504} Red\xE9marrage du serveur..."),this.plugin.isServerRunning()&&await this.plugin.stopServer(),await new Promise(t=>setTimeout(t,500)),await this.plugin.startServer(),new f.Notice("\u2705 Serveur red\xE9marr\xE9")}formatUptime(t){let e=Math.floor(t/1e3),s=Math.floor(e/60),i=Math.floor(s/60);return i>0?`${i}h ${s%60}m ${e%60}s`:s>0?`${s}m ${e%60}s`:`${e}s`}},O=class extends f.Modal{constructor(e,s){super(e);this.logs=s}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h2",{text:"\u{1F4CB} Journaux du serveur"});let s=this.getLogStats(),i=e.createDiv("log-stats");i.innerHTML=`
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
                <div style="text-align: center; padding: 10px; background: #e3f2fd; border-radius: 6px;">
                    <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${s.total}</div>
                    <div style="font-size: 12px; color: #666;">Total</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #fff3e0; border-radius: 6px;">
                    <div style="font-size: 24px; font-weight: bold; color: #f57c00;">${s.warn}</div>
                    <div style="font-size: 12px; color: #666;">Warnings</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #ffebee; border-radius: 6px;">
                    <div style="font-size: 24px; font-weight: bold; color: #d32f2f;">${s.error}</div>
                    <div style="font-size: 12px; color: #666;">Erreurs</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #e8f5e8; border-radius: 6px;">
                    <div style="font-size: 24px; font-weight: bold; color: #388e3c;">${s.info}</div>
                    <div style="font-size: 12px; color: #666;">Info</div>
                </div>
            </div>
        `;let r=e.createDiv("logs-container");r.style.cssText=`
            max-height: 400px; 
            overflow-y: auto; 
            border: 1px solid #ddd; 
            border-radius: 6px; 
            background: #fafafa;
        `;let n=this.logs.slice(-50).reverse();n.length===0?r.createDiv().innerHTML=`
                <div style="padding: 20px; text-align: center; color: #666;">
                    \u{1F4DD} Aucun log disponible
                </div>
            `:n.forEach(g=>{let o=r.createDiv("log-entry");o.style.cssText=`
                    padding: 8px 12px; 
                    border-bottom: 1px solid #eee; 
                    font-family: 'Courier New', monospace; 
                    font-size: 12px;
                `;let p=this.getLevelColor(g.level),m=new Date(g.timestamp).toLocaleTimeString();o.innerHTML=`
                    <span style="color: #666;">${m}</span>
                    <span style="color: ${p}; font-weight: bold; margin: 0 8px;">[${g.level.toUpperCase()}]</span>
                    ${g.category?`<span style="color: #2196F3; margin-right: 8px;">[${g.category.toUpperCase()}]</span>`:""}
                    <span>${g.message}</span>
                `});let a=e.createDiv();a.style.cssText="margin-top: 20px; text-align: right;";let l=a.createEl("button",{text:"\u{1F5D1}\uFE0F Vider les logs"});l.style.cssText="margin-right: 10px; padding: 8px 16px;",l.onclick=()=>{u.getInstance().clearHistory(),new f.Notice("\u{1F4DD} Logs vid\xE9s"),this.close()};let c=a.createEl("button",{text:"Fermer"});c.style.cssText="padding: 8px 16px;",c.onclick=()=>this.close()}getLogStats(){return{total:this.logs.length,error:this.logs.filter(e=>e.level==="error").length,warn:this.logs.filter(e=>e.level==="warn").length,info:this.logs.filter(e=>e.level==="info").length,debug:this.logs.filter(e=>e.level==="debug").length}}getLevelColor(e){return{error:"#d32f2f",warn:"#f57c00",info:"#1976d2",debug:"#388e3c"}[e]||"#666"}onClose(){let{contentEl:e}=this;e.empty()}};var z=require("obsidian");var T=require("obsidian");var M=require("obsidian"),x=class{constructor(t){this.app=t}async saveConfigToYaml(t){try{let e=this.getConfigPath(t),s=this.configToYaml(t);if(!this.app.vault.getAbstractFileByPath(t.publicFolder))return;await this.writeFile(e,s)}catch(e){}}async loadConfigFromYaml(t){try{if(!this.configFileExists(t))return null;let e=this.getConfigPath(t),s=this.app.vault.getAbstractFileByPath(e);if(!(s instanceof M.TFile))return null;let i=await this.app.vault.read(s);return this.yamlToConfig(i)}catch(e){return null}}async saveOptionsToYaml(t){try{let e=this.getOptionsPath(t),s=this.optionsToYaml(t),i=`${t.publicFolder}/${t.theme}`;if(!this.app.vault.getAbstractFileByPath(i))return;await this.writeFile(e,s)}catch(e){}}configFileExists(t){try{let e=this.getConfigPath(t),s=require("fs"),i=require("path"),r=this.app.vault.adapter.basePath,n=i.join(r,e);return s.existsSync(n)}catch(e){return!1}}optionsFileExists(t){let e=this.getOptionsPath(t);return this.app.vault.getAbstractFileByPath(e)instanceof M.TFile}getConfigPath(t){return`${t.publicFolder}/config.yml`}getOptionsPath(t){return`${t.publicFolder}/${t.theme}/options.yml`}configToYaml(t){let e=`# Configuration du document PagedJS
# G\xE9n\xE9r\xE9 automatiquement - vous pouvez modifier ce fichier

# === DOSSIER PUBLIC ===
publicFolder: "${t.publicFolder}"

# === INFORMATIONS DU DOCUMENT ===
theme: "${t.theme}"
title: "${t.title}"
subtitle: "${t.subtitle}"
runningtitle: "${t.runningtitle}"

# === AUTEUR ===
name: "${t.name}"
mention: "${t.mention}"
option: "${t.option}"
year: "${t.year}"

# === INSTITUTION ===
directeur: "${t.directeur}"
ecole: "${t.ecole}"

# === FICHIERS ===
pdf: "${t.pdf}"
`;return t.parts&&t.parts.length>0&&(e+=`
# === STRUCTURE DU DOCUMENT ===
parts:
`,t.parts.filter(i=>i.export!==!1).forEach(i=>{e+=`  - title: "${i.title}"
`,i.template&&(e+=`    template: "${i.template}"
`),i.file&&(e+=`    file: "${i.file}"
`),i.css&&(e+=`    css: "${i.css}"
`),i.pad&&(e+=`    pad: "${i.pad}"
`)})),e}optionsToYaml(t){return`# Options PagedJS
# G\xE9n\xE9r\xE9 automatiquement pour le th\xE8me ${t.theme}

# === DIMENSIONS DE LA PAGE (mm) ===
width: ${t.width}
height: ${t.height}

# === MARGES G\xC9N\xC9RALES (mm) ===
margin_top: ${t.margin_top}
margin_right: ${t.margin_right}
margin_bottom: ${t.margin_bottom}
margin_left: ${t.margin_left}

# === MARGES PAGES GAUCHE (mm) ===
page_left_margin_top: ${t.page_left_margin_top}
page_left_margin_bottom: ${t.page_left_margin_bottom}
page_left_margin_left: ${t.page_left_margin_left}
page_left_margin_right: ${t.page_left_margin_right}

# === MARGES PAGES DROITE (mm) ===
page_right_margin_top: ${t.page_right_margin_top}
page_right_margin_bottom: ${t.page_right_margin_bottom}
page_right_margin_left: ${t.page_right_margin_left}
page_right_margin_right: ${t.page_right_margin_right}

# === OPTIONS DE MISE EN PAGE ===
bleed: ${t.bleed}
marks: ${t.marks}
recto_verso: ${t.recto_verso}

# === OPTIONS DES NOTES ===
printNotes: "${t.printNotes}"
imageNotes: ${t.imageNotes}

# === OPTIONS AVANC\xC9ES ===
ragadjust: ${t.ragadjust}
typesetting: ${t.typesetting}
ep_markdown: ${t.ep_markdown}
tailwind: ${t.tailwind}
auto: ${t.auto}
baseline: ${t.baseline}
`}yamlToConfig(t){let e={},s=["theme","title","subtitle","runningtitle","name","mention","option","year","directeur","ecole","pdf"],i=t.split(`
`),r=!1,n=null,a=[];for(let l=0;l<i.length;l++){let c=i[l],g=c.trim();if(!(g.startsWith("#")||g==="")){if(g==="parts:"){r=!0;continue}if(r){if(c.startsWith("  - title:")||c.startsWith("- title:")){n&&a.push(n);let o=g.startsWith("- title:")?g.substring(8):g.substring(10);n={title:this.extractValue(o),export:!0}}else if(n&&c.startsWith("    ")){let o=c.substring(4).trim();o.startsWith("title:")?n.title=this.extractValue(o.substring(6)):o.startsWith("template:")?n.template=this.extractValue(o.substring(9)):o.startsWith("file:")?n.file=this.extractValue(o.substring(5)):o.startsWith("css:")?n.css=this.extractValue(o.substring(4)):o.startsWith("pad:")&&(n.pad=this.extractValue(o.substring(4)))}else if(!c.startsWith(" ")&&g.includes(":")){n&&(a.push(n),n=null),r=!1;let o=g.indexOf(":"),p=g.substring(0,o).trim(),m=this.extractValue(g.substring(o+1));s.includes(p)&&(e[p]=m)}}else{let o=g.indexOf(":");if(o===-1)continue;let p=g.substring(0,o).trim(),m=this.extractValue(g.substring(o+1));s.includes(p)&&(e[p]=m)}}}return n&&a.push(n),a.length>0&&(e.parts=a),e}extractValue(t){let e=t.trim();return e.startsWith('"')&&e.endsWith('"')&&(e=e.slice(1,-1)),e}async writeFile(t,e){let s=this.app.vault.getAbstractFileByPath(t);s instanceof M.TFile?await this.app.vault.modify(s,e):await this.app.vault.create(t,e)}async ensureFolder(t){this.app.vault.getAbstractFileByPath(t)||await this.app.vault.createFolder(t)}async saveToYaml(t){return this.saveConfigToYaml(t)}async loadFromYaml(){return null}async exportPagedJSOnly(t){return this.saveOptionsToYaml(t)}};var v=class{constructor(t,e){this.app=t,this.plugin=e,this.yamlManager=new x(t)}async saveSettings(){await this.plugin.saveData(this.plugin.settings);try{(this.yamlManager.configFileExists(this.plugin.settings)||this.folderExists(this.plugin.settings.publicFolder))&&await this.yamlManager.saveConfigToYaml(this.plugin.settings)}catch(e){}let t=new CustomEvent("pagedjs-settings-refreshed",{detail:{settings:this.plugin.settings,source:"tab-save"}});document.dispatchEvent(t)}async saveSettingsQuietly(){await this.plugin.saveData(this.plugin.settings);try{(this.yamlManager.configFileExists(this.plugin.settings)||this.folderExists(this.plugin.settings.publicFolder))&&await this.yamlManager.saveConfigToYaml(this.plugin.settings)}catch(t){}}folderExists(t){try{return this.app.vault.getAbstractFileByPath(t)!==null}catch(e){return!1}}async restartServerIfRunning(){this.plugin.isServerRunning()&&(await this.plugin.stopServer(),await this.plugin.startServer())}createSectionTitle(t,e){return t.createEl("h3",{text:e})}createContainer(t,e){return t.createEl("div",{cls:e})}parseNumber(t,e){let s=parseInt(t);return isNaN(s)?e:s}getDefaultPlaceholder(t){return(t==null?void 0:t.toString())||""}};var k=class extends v{display(t){t.createEl("h2",{text:"\u{1F4DD} Configurations du document"}),this.createServerSettings(t),this.createThemeSettings(t),this.createDocumentMetadata(t),this.createAuthorSettings(t),this.createInstitutionSettings(t)}createServerSettings(t){new T.Setting(t).setName("Dossier \xE0 servir").setDesc("Nom du dossier contenant les fichiers \xE0 servir").addText(e=>e.setPlaceholder("public").setValue(this.plugin.settings.publicFolder).onChange(async s=>{let i=this.plugin.settings.publicFolder,r=s||"public";if(i!==r){if(this.folderExists(i))try{let n={...this.plugin.settings};n.publicFolder=i,await this.yamlManager.saveConfigToYaml(n)}catch(n){}this.plugin.updatePublicFolder(r),await this.saveSettings(),await this.plugin.reloadConfigFromNewFolder()}}))}createThemeSettings(t){new T.Setting(t).setName("Th\xE8me").setDesc("Th\xE8me de mise en page du document").addText(e=>e.setPlaceholder("valentine").setValue(this.plugin.settings.theme).onChange(async s=>{this.plugin.settings.theme=s||"valentine",await this.saveSettings()}))}createDocumentMetadata(t){[{key:"title",name:"Titre",desc:"Titre principal du document",placeholder:"Titre",default:"Titre"},{key:"subtitle",name:"Sous-titre",desc:"Sous-titre du document",placeholder:"",default:""},{key:"runningtitle",name:"Titre courant",desc:"Titre affich\xE9 en en-t\xEAte des pages",placeholder:"",default:""},{key:"pdf",name:"PDF",desc:"Chemin vers le fichier PDF (optionnel)",placeholder:"",default:""}].forEach(s=>{new T.Setting(t).setName(s.name).setDesc(s.desc).addText(i=>i.setPlaceholder(s.placeholder).setValue(this.plugin.settings[s.key]).onChange(async r=>{this.plugin.settings[s.key]=r||s.default,await this.saveSettings()}))})}createAuthorSettings(t){[{key:"name",name:"Nom de l'auteur",desc:"Nom et pr\xE9nom de l'auteur",placeholder:"Pr\xE9nom Nom",default:"Pr\xE9nom Nom"},{key:"mention",name:"Mention",desc:"Type de dipl\xF4me ou mention",placeholder:"M\xE9moire de Dipl\xF4me National Sup\xE9rieur d'Expression Plastique",default:"M\xE9moire de Dipl\xF4me National Sup\xE9rieur d'Expression Plastique"},{key:"option",name:"Option",desc:"Sp\xE9cialit\xE9 ou option d'\xE9tudes",placeholder:"Design",default:"Design"},{key:"year",name:"Ann\xE9e",desc:"Ann\xE9e acad\xE9mique",placeholder:"2024 \u2013 2025",default:"2024 \u2013 2025"}].forEach(s=>{new T.Setting(t).setName(s.name).setDesc(s.desc).addText(i=>i.setPlaceholder(s.placeholder).setValue(this.plugin.settings[s.key]).onChange(async r=>{this.plugin.settings[s.key]=r||s.default,await this.saveSettings()}))})}createInstitutionSettings(t){[{key:"directeur",name:"Directeur",desc:"Directeur de m\xE9moire ou encadrant",placeholder:"sous la direction de ",default:""},{key:"ecole",name:"\xC9cole",desc:"Nom de l'\xE9tablissement",placeholder:"ebabx \u2013 \xE9cole sup\xE9rieure des beaux-arts de Bordeaux",default:""}].forEach(s=>{new T.Setting(t).setName(s.name).setDesc(s.desc).addText(i=>i.setPlaceholder(s.placeholder).setValue(this.plugin.settings[s.key]).onChange(async r=>{this.plugin.settings[s.key]=r||s.default,await this.saveSettings()}))})}};var y=require("obsidian");var _=class extends v{display(t){this.createPageDimensions(t),this.createGeneralMargins(t),this.pageLeftMargins(t),this.pageRightMargins(t),this.createLayoutOptions(t),this.createNotesOptions(t),this.createAdvancedOptions(t)}createPageDimensions(t){t.createEl("h5",{text:"Dimensions de la page (mm)"});let e=this.createContainer(t,"pagedjs-dimensions-row");new y.Setting(e).setName("Largeur").setDesc("Largeur de la page en mm").addText(s=>s.setPlaceholder("165").setValue(this.plugin.settings.width.toString()).onChange(async i=>{this.plugin.settings.width=this.parseNumber(i,165),await this.saveSettings()})),new y.Setting(e).setName("Hauteur").setDesc("Hauteur de la page en mm").addText(s=>s.setPlaceholder("240").setValue(this.plugin.settings.height.toString()).onChange(async i=>{this.plugin.settings.height=this.parseNumber(i,240),await this.saveSettings()}))}createGeneralMargins(t){t.createEl("h5",{text:"Marges g\xE9n\xE9rales (mm)"});let e=this.createContainer(t,"pagedjs-margins-row");[{key:"margin_top",name:"Haut",default:10},{key:"margin_right",name:"Droite",default:10},{key:"margin_bottom",name:"Bas",default:10},{key:"margin_left",name:"Gauche",default:10}].forEach(i=>{new y.Setting(e).setName(i.name).addText(r=>r.setPlaceholder(i.default.toString()).setValue(this.plugin.settings[i.key].toString()).onChange(async n=>{this.plugin.settings[i.key]=this.parseNumber(n,i.default),await this.saveSettings()}))})}pageLeftMargins(t){t.createEl("h5",{text:"Marges de la page de gauche (mm)"});let e=this.createContainer(t,"pagedjs-margins-row"),s=[{key:"page_left_margin_top",name:"Haut",default:10},{key:"page_left_margin_bottom",name:"Bas",default:10},{key:"page_left_margin_left",name:"Gauche",default:10},{key:"page_left_margin_right",name:"Droite",default:10}],i=[{key:"page_right_margin_top",name:"Haut",default:10},{key:"page_right_margin_bottom",name:"Bas",default:10},{key:"page_right_margin_left",name:"Gauche",default:10},{key:"page_right_margin_right",name:"Droite",default:10}];s.forEach(r=>{new y.Setting(e).setName(r.name).addText(n=>n.setPlaceholder(r.default.toString()).setValue(this.plugin.settings[r.key].toString()).onChange(async a=>{this.plugin.settings[r.key]=this.parseNumber(a,r.default),await this.saveSettings()}))})}pageRightMargins(t){t.createEl("h5",{text:"Marges de la page de droite (mm)"});let e=this.createContainer(t,"pagedjs-margins-row");[{key:"page_right_margin_top",name:"Haut",default:10},{key:"page_right_margin_bottom",name:"Bas",default:10},{key:"page_right_margin_left",name:"Gauche",default:10},{key:"page_right_margin_right",name:"Droite",default:10}].forEach(i=>{new y.Setting(e).setName(i.name).addText(r=>r.setPlaceholder(i.default.toString()).setValue(this.plugin.settings[i.key].toString()).onChange(async n=>{this.plugin.settings[i.key]=this.parseNumber(n,i.default),await this.saveSettings()}))})}createLayoutOptions(t){this.createSectionTitle(t,"Options de mise en page"),[{key:"bleed",name:"Fond perdu (Bleed)",desc:"Activer le fond perdu pour l'impression"},{key:"marks",name:"Rep\xE8res de coupe (Marks)",desc:"Afficher les rep\xE8res de coupe"},{key:"recto_verso",name:"Recto-verso",desc:"Activer l'impression recto-verso"}].forEach(s=>{new y.Setting(t).setName(s.name).setDesc(s.desc).addToggle(i=>i.setValue(this.plugin.settings[s.key]).onChange(async r=>{this.plugin.settings[s.key]=r,await this.saveSettings()}))})}createNotesOptions(t){this.createSectionTitle(t,"Options des notes"),new y.Setting(t).setName("Position des notes").setDesc("O\xF9 afficher les notes de bas de page").addDropdown(e=>e.addOption("bottom","Bas de page").addOption("margin","Dans la marge").setValue(this.plugin.settings.printNotes).onChange(async s=>{this.plugin.settings.printNotes=s,await this.saveSettings()})),new y.Setting(t).setName("Images dans les notes").setDesc("Permettre les images dans les notes de marge").addToggle(e=>e.setValue(this.plugin.settings.imageNotes).onChange(async s=>{this.plugin.settings.imageNotes=s,await this.saveSettings()}))}createAdvancedOptions(t){this.createSectionTitle(t,"\u2699\uFE0F Options avanc\xE9es"),[{key:"ragadjust",name:"Ragadjust",desc:"Ajustement automatique des lignes"},{key:"typesetting",name:"Typesetting",desc:"Composition typographique avanc\xE9e"},{key:"ep_markdown",name:"EP Markdown",desc:"Support markdown \xE9tendu"},{key:"tailwind",name:"Tailwind CSS",desc:"Utiliser Tailwind CSS"},{key:"auto",name:"Mode automatique",desc:"Configuration automatique"},{key:"baseline",name:"Grille de base",desc:"Aligner sur une grille de base"}].forEach(s=>{new y.Setting(t).setName(s.name).setDesc(s.desc).addToggle(i=>i.setValue(this.plugin.settings[s.key]).onChange(async r=>{this.plugin.settings[s.key]=r,await this.saveSettings()}))})}};var D=require("obsidian");var A=class extends v{constructor(t,e){super(t,e)}display(t){t.createEl("h2",{text:"\u{1F4BE} Sauvegarde et import"}),this.createConfigurationSection(t),this.createOptionsSection(t),this.createStatusSection(t),this.createInfoSection(t)}createConfigurationSection(t){this.createSectionTitle(t,"\u{1F4DD} Configurations du document"),new D.Setting(t).setName("Sauvegarder les configurations").setDesc(`Sauvegarder les informations du document dans ${this.plugin.settings.publicFolder}/config.yml`).addButton(e=>e.setButtonText("\u{1F4BE} Sauvegarder config.yml").setCta().onClick(async()=>{await this.yamlManager.saveConfigToYaml(this.plugin.settings)})),new D.Setting(t).setName("Charger les configurations").setDesc(`Charger les configurations depuis ${this.plugin.settings.publicFolder}/config.yml`).addButton(e=>e.setButtonText("\u{1F4C2} Charger config.yml").onClick(async()=>{let s=await this.yamlManager.loadConfigFromYaml(this.plugin.settings);s&&(this.mergeSettings(this.plugin.settings,s),await this.saveSettings(),this.refreshParentDisplay())}))}mergeSettings(t,e){for(let s in e)e.hasOwnProperty(s)&&(s==="parts"&&Array.isArray(e[s])?t[s]=[...e[s]]:typeof e[s]=="object"&&e[s]!==null&&!Array.isArray(e[s])?((!t[s]||typeof t[s]!="object")&&(t[s]={}),this.mergeSettings(t[s],e[s])):t[s]=e[s])}createOptionsSection(t){this.createSectionTitle(t,"\u2699\uFE0F Options PagedJS"),new D.Setting(t).setName("Exporter les options").setDesc(`Exporter les options PagedJS dans ${this.plugin.settings.publicFolder}/${this.plugin.settings.theme}/options.yml`).addButton(e=>e.setButtonText("\u{1F4E4} Exporter options.yml").onClick(async()=>{await this.yamlManager.saveOptionsToYaml(this.plugin.settings)}))}createStatusSection(t){this.createSectionTitle(t,"\u{1F4CB} Statut des fichiers");let e=this.createContainer(t,"pagedjs-files-status");this.yamlManager.configFileExists(this.plugin.settings)?e.createEl("p",{text:`\u2705 Configurations sauv\xE9es: ${this.yamlManager.getConfigPath(this.plugin.settings)}`,cls:"status-success"}):e.createEl("p",{text:`\u274C Aucune sauvegarde de config: ${this.yamlManager.getConfigPath(this.plugin.settings)}`,cls:"status-error"});let s=this.yamlManager.getOptionsPath(this.plugin.settings);this.yamlManager.optionsFileExists(this.plugin.settings)?e.createEl("p",{text:`\u2705 Options export\xE9es: ${s}`,cls:"status-success"}):e.createEl("p",{text:`\u274C Options non export\xE9es: ${s}`,cls:"status-error"})}createInfoSection(t){this.createSectionTitle(t,"\u2139\uFE0F Informations");let e=this.createContainer(t,"pagedjs-info-section");e.createEl("div",{cls:"info-item"}).innerHTML=`
            <strong>\u{1F4C4} config.yml</strong><br>
            <em>Contient : th\xE8me, titre, auteur, \xE9cole, etc.</em><br>
            <code>Emplacement : ${this.plugin.settings.publicFolder}/</code>
        `,e.createEl("div",{cls:"info-item"}).innerHTML=`
            <strong>\u2699\uFE0F options.yml</strong><br>
            <em>Contient : dimensions, marges, options PagedJS</em><br>
            <code>Emplacement : ${this.plugin.settings.publicFolder}/${this.plugin.settings.theme}/</code>
        `}refreshParentDisplay(){var s;let t=new CustomEvent("pagedjs-settings-refreshed",{detail:{settings:this.plugin.settings}});document.dispatchEvent(t);let e=document.querySelector(".pagedjs-tab-button.active");e&&((s=e.textContent)!=null&&s.includes("Structure"))&&setTimeout(()=>{e.click()},100)}};var E=require("obsidian");var I=class extends v{display(t){t.createEl("h2",{text:"\u{1F5A5}\uFE0F Configuration du serveur"}),this.createServerControls(t),this.createServerSettings(t),this.createServerActions(t),this.createServerInfo(t),this.createFileWatcherInfo(t)}createServerControls(t){new E.Setting(t).setName("Serveur HTTP").setDesc("D\xE9marrer ou arr\xEAter le serveur HTTP").addToggle(e=>e.setValue(this.plugin.isServerRunning()).onChange(async s=>{s?await this.plugin.startServer():await this.plugin.stopServer(),this.refreshDisplay(t)}))}createServerSettings(t){new E.Setting(t).setName("D\xE9marrage automatique").setDesc("D\xE9marrer le serveur automatiquement au chargement du plugin").addToggle(e=>e.setValue(this.plugin.settings.autoStart).onChange(async s=>{this.plugin.settings.autoStart=s,await this.saveSettings()}))}createServerActions(t){this.createSectionTitle(t,"\u{1F527} Actions du serveur"),new E.Setting(t).setName("Ouvrir dans le navigateur").setDesc("Ouvrir l'interface web du serveur dans votre navigateur").addButton(e=>{e.setButtonText("\u{1F310} Ouvrir").setIcon("external-link").setCta().onClick(()=>{this.plugin.openInBrowser()}),this.plugin.isServerRunning()||(e.setDisabled(!0),e.setTooltip("Le serveur doit \xEAtre d\xE9marr\xE9 pour ouvrir le navigateur"))}),new E.Setting(t).setName("Red\xE9marrer le serveur").setDesc("Red\xE9marrer le serveur HTTP (utile apr\xE8s changement de configuration)").addButton(e=>{e.setButtonText("\u{1F504} Red\xE9marrer").setWarning().onClick(async()=>{await this.restartServer(),this.refreshDisplay(t)}),this.plugin.isServerRunning()||(e.setDisabled(!0),e.setTooltip("Le serveur doit \xEAtre d\xE9marr\xE9 pour \xEAtre red\xE9marr\xE9"))}),new E.Setting(t).setName("Afficher les logs").setDesc("Ouvrir la fen\xEAtre des journaux du serveur").addButton(e=>e.setButtonText("\u{1F4CB} Logs").onClick(()=>{this.plugin.showLogs()}))}createServerInfo(t){this.createSectionTitle(t,"\u2139\uFE0F Informations du serveur");let e=this.createContainer(t,"pagedjs-info-section"),s=this.plugin.getServerStatus();if(s){let i=e.createEl("div",{cls:"info-item"});if(i.innerHTML=`
                <strong>\u{1F4E1} Statut :</strong> 
                <span class="${s.isRunning?"status-success":"status-error"}">
                    ${s.isRunning?"\u{1F7E2} En ligne":"\u{1F534} Arr\xEAt\xE9"}
                </span>
            `,s.isRunning){let r=e.createEl("div",{cls:"info-item"});r.innerHTML=`
                    <strong>\u{1F50C} Port :</strong> 
                    <code>${s.port}</code>
                `;let n=e.createEl("div",{cls:"info-item"});n.innerHTML=`
                    <strong>\u{1F310} URL :</strong> 
                    <code>http://localhost:${s.port}</code>
                `;let a=e.createEl("div",{cls:"info-item"});a.innerHTML=`
                    <strong>\u23F1\uFE0F Uptime :</strong> 
                    <span>${this.formatUptime(s.uptime)}</span>
                `;let l=e.createEl("div",{cls:"info-item"});l.innerHTML=`
                    <strong>\u{1F504} Derni\xE8re modification :</strong> 
                    <span>${new Date(s.lastModified).toLocaleString()}</span>
                `;let c=e.createEl("div",{cls:"info-item"});c.innerHTML=`
                    <strong>\u{1F4C1} Dossier servi :</strong> 
                    <code>${this.plugin.settings.publicFolder}</code>
                `}}else{let i=e.createEl("div",{cls:"info-item"});i.innerHTML=`
                <span class="status-error">\u274C Aucune information disponible</span>
            `}}createFileWatcherInfo(t){this.createSectionTitle(t,"\u{1F441}\uFE0F Surveillance des fichiers");let e=this.createContainer(t,"pagedjs-info-section");if(this.plugin.fileWatcher){let s=this.plugin.fileWatcher.getWatchingStats(),i=e.createEl("div",{cls:"info-item"});i.innerHTML=`
                <strong>\u{1F4C2} Dossier surveill\xE9 :</strong> 
                <code>${s.publicFolder||"\u274C TOUS LES DOSSIERS (non configur\xE9)"}</code>
            `;let r=e.createEl("div",{cls:"info-item"});r.innerHTML=`
                <strong>\u{1F4C4} Extensions surveill\xE9es :</strong> 
                <code>${s.extensions.join(", ")}</code>
            `;let n=e.createEl("div",{cls:"info-item"});n.innerHTML=`
                <strong>\u{1F517} Callbacks actifs :</strong> 
                <span>${s.callbacksCount}</span>
            `;let a=this.plugin.isServerRunning(),l=e.createEl("div",{cls:"info-item"});if(l.innerHTML=`
                <strong>\u{1F440} \xC9tat surveillance :</strong> 
                <span class="${a?"status-success":"status-error"}">
                    ${a?"\u{1F7E2} Active":"\u{1F534} Inactive"}
                </span>
            `,!s.publicFolder||s.publicFolder.trim()===""){let c=e.createEl("div",{cls:"info-item"});c.innerHTML=`
                    <span class="status-error">
                        \u26A0\uFE0F La surveillance s'applique \xE0 TOUS les fichiers .md du coffre !<br>
                        <em>Configurez le "Dossier \xE0 servir" dans l'onglet Configurations pour limiter la surveillance.</em>
                    </span>
                `}else{let c=e.createEl("div",{cls:"info-item"});c.innerHTML=`
                    <span class="status-success">
                        \u2705 Surveillance limit\xE9e au dossier sp\xE9cifi\xE9 uniquement
                    </span>
                `}}else{let s=e.createEl("div",{cls:"info-item"});s.innerHTML=`
                <span class="status-error">\u274C FileWatcher non initialis\xE9</span>
            `}}async restartServer(){await this.plugin.stopServer(),await new Promise(t=>setTimeout(t,500)),await this.plugin.startServer()}formatUptime(t){let e=Math.floor(t/1e3),s=Math.floor(e/60),i=Math.floor(s/60),r=Math.floor(i/24);return r>0?`${r}j ${i%24}h ${s%60}m`:i>0?`${i}h ${s%60}m ${e%60}s`:s>0?`${s}m ${e%60}s`:`${e}s`}refreshDisplay(t){t.empty(),this.display(t)}};var N=class extends v{constructor(e,s){super(e,s);this.draggedElement=null;this.draggedIndex=-1;this.isInternalAction=!1;document.addEventListener("pagedjs-settings-refreshed",i=>{var r;this.isInternalAction||((r=i.detail.source)!=null&&r.includes("folder-change")||i.detail.source==="save"&&i.detail.partsLoaded>0)&&setTimeout(()=>{this.refreshDisplayIfActive()},100)})}display(e){e.createEl("h2",{text:"\u{1F4D6} Structure du document"}),this.ensureCurrentDataIfNeeded().then(()=>{this.createPartsManager(e),this.createActions(e)})}async ensureCurrentDataIfNeeded(){if(!this.plugin.settings.parts||this.plugin.settings.parts.length===0){let s=await this.plugin.forceReloadCurrentConfig()}}refreshDisplayIfActive(){var i;if(this.isInternalAction)return;let e=document.querySelector(".pagedjs-tab-button.active"),s=document.querySelector(".pagedjs-tab-content.structure");e&&((i=e.textContent)!=null&&i.includes("Structure"))&&s&&this.refreshDisplay()}createPartsManager(e){this.plugin.settings.parts||(this.plugin.settings.parts=[]);let s=e.createEl("div",{cls:"parts-container"});this.plugin.settings.parts.forEach((i,r)=>{this.createPartEditor(s,i,r)}),this.plugin.settings.parts.length===0&&(s.createEl("div",{text:"Aucune partie. Cliquez sur 'Ajouter' pour commencer."}).style.cssText="text-align: center; padding: 20px; color: var(--text-muted);")}createPartEditor(e,s,i){let r=e.createEl("div",{cls:"part-item"});r.style.cssText=`
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.2s ease;
        `;let n=r.createEl("div",{cls:"drag-handle",text:"\u22EE\u22EE",attr:{draggable:"true","data-index":i.toString()}});n.style.cssText=`
            color: var(--text-muted);
            cursor: grab;
            padding: 8px;
            user-select: none;
            border-radius: 4px;
            transition: all 0.2s ease;
        `,this.setupNativeDragAndDrop(r,n,i),this.createRestOfPartEditor(r,s,i)}setupNativeDragAndDrop(e,s,i){s.addEventListener("dragstart",r=>{this.draggedElement=e,this.draggedIndex=i,e.style.opacity="0.5",s.style.cursor="grabbing",r.dataTransfer.effectAllowed="move",r.dataTransfer.setData("text/html","")}),s.addEventListener("dragend",r=>{e.style.opacity="1",s.style.cursor="grab",this.draggedElement=null,this.draggedIndex=-1,this.clearDropIndicators()}),e.addEventListener("dragover",r=>{r.preventDefault(),r.dataTransfer.dropEffect="move",this.draggedElement&&this.draggedElement!==e&&this.showDropIndicator(e,r)}),e.addEventListener("dragleave",r=>{this.hideDropIndicator(e)}),e.addEventListener("drop",r=>{var n;if(r.preventDefault(),this.draggedElement&&this.draggedIndex!==-1){let a=parseInt(((n=e.querySelector(".drag-handle"))==null?void 0:n.getAttribute("data-index"))||"-1");a!==-1&&this.draggedIndex!==a&&(this.reorderParts(this.draggedIndex,a),this.refreshDisplay())}this.clearDropIndicators()})}showDropIndicator(e,s){let i=e.getBoundingClientRect(),r=i.top+i.height/2;e.style.borderColor="var(--interactive-accent)",s.clientY<r?(e.style.borderTopWidth="3px",e.style.borderBottomWidth="1px"):(e.style.borderTopWidth="1px",e.style.borderBottomWidth="3px")}hideDropIndicator(e){e.style.borderColor="var(--background-modifier-border)",e.style.borderTopWidth="1px",e.style.borderBottomWidth="1px"}clearDropIndicators(){document.querySelectorAll(".part-item").forEach(s=>{this.hideDropIndicator(s)})}createRestOfPartEditor(e,s,i){let r=e.createEl("input");r.type="text",r.value=s.title||"",r.placeholder="Titre de la partie",r.style.cssText=`
            padding: 6px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            background: var(--background-primary);
            width: 150px;
        `,r.addEventListener("input",async()=>{!this.plugin.settings.parts||!this.plugin.settings.parts[i]||(this.plugin.settings.parts[i].title=r.value,await this.saveSettingsQuietlyInternal())});let n=e.createEl("input");n.type="text",n.value=s.template||"",n.placeholder="template.html ou dossier/template.html",n.style.cssText=`
            padding: 6px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            background: var(--background-primary);
            width: 180px;
        `,n.addEventListener("input",async()=>{!this.plugin.settings.parts||!this.plugin.settings.parts[i]||(this.plugin.settings.parts[i].template=n.value,await this.saveSettingsQuietlyInternal())}),this.createTypeAndPathControl(e,s,i);let a=e.createEl("input");a.type="checkbox",a.checked=s.export!==!1,a.style.cssText=`
            width: 16px;
            height: 16px;
            cursor: pointer;
        `,a.addEventListener("change",async()=>{!this.plugin.settings.parts||!this.plugin.settings.parts[i]||(this.plugin.settings.parts[i].export=a.checked,await this.saveSettingsQuietlyInternal())});let l=e.createEl("button",{text:"\xD7"});l.style.cssText=`
            background: none;
            border: none;
            color: var(--text-error);
            cursor: pointer;
            font-size: 18px;
            padding: 5px;
            border-radius: 3px;
        `,l.onclick=()=>this.deletePart(i)}async getMarkdownFiles(){try{let e=this.plugin.settings.publicFolder,s=this.app.vault.getAbstractFileByPath(e);if(!s||!("children"in s))return[];let i=(n,a="")=>{let l=[];return n.children&&n.children.forEach(c=>{let g=a?`${a}/${c.name}`:c.name;if(c.extension==="md")l.push(g);else if("children"in c){let o=i(c,g);l.push(...o)}}),l},r=i(s);return r.sort((n,a)=>{let l=p=>{let m=p.match(/(\d+)/);return m?parseInt(m[1]):999999},c=p=>p.split("/").pop()||p,g=l(c(n)),o=l(c(a));return g!==999999&&o!==999999?g-o:n.localeCompare(a)}),r.forEach(n=>{}),r}catch(e){return[]}}async populateFileSuggestions(e){try{let s=await this.getMarkdownFiles();e.empty(),s.forEach(i=>{let r=document.createElement("option");r.value=i,e.appendChild(r)})}catch(s){}}createTypeAndPathControl(e,s,i){let r="file",n="";s.file!==void 0?(r="file",n=s.file):s.css!==void 0?(r="css",n=s.css):s.pad!==void 0&&(r="pad",n=s.pad);let a=e.createEl("div");a.style.cssText=`
            display: flex;
            gap: 8px;
            flex: 1;
            align-items: center;
        `;let l=a.createEl("select");l.style.cssText=`
            padding: 6px;
            background: var(--background-primary);
            min-width: 100px;
        `,[{value:"file",text:"\u{1F4C4} Fichier"},{value:"css",text:"\u{1F3A8} CSS"},{value:"pad",text:"\u{1F4DD} Pad"}].forEach(b=>{let P=document.createElement("option");P.value=b.value,P.textContent=b.text,b.value===r&&(P.selected=!0),l.appendChild(P)});let g=a.createEl("div");g.style.cssText=`
            display: flex;
            align-items: center;
            flex: 1;
            position: relative;
        `;let o=g.createEl("input");o.type="text",o.value=n,o.style.cssText=`
            flex: 1;
            padding: 6px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            background: var(--background-primary);
        `;let p=`file-suggestions-${i}`,m=g.createEl("datalist");m.id=p,o.setAttribute("list",p);let V={file:"fichier.md ou dossier/fichier.md",css:"style.css",pad:"https://pad.com/123"},W=async()=>{let b=l.value;o.placeholder=V[b],b==="file"?await this.populateFileSuggestions(m):m.empty()};W(),l.addEventListener("change",async()=>{if(!this.plugin.settings.parts||!this.plugin.settings.parts[i])return;let b=l.value;delete this.plugin.settings.parts[i].file,delete this.plugin.settings.parts[i].css,delete this.plugin.settings.parts[i].pad,this.plugin.settings.parts[i][b]=o.value,await W(),await this.saveSettingsQuietlyInternal()}),o.addEventListener("input",async()=>{if(!this.plugin.settings.parts||!this.plugin.settings.parts[i])return;let b=l.value;delete this.plugin.settings.parts[i].file,delete this.plugin.settings.parts[i].css,delete this.plugin.settings.parts[i].pad,this.plugin.settings.parts[i][b]=o.value,await this.saveSettingsQuietly()})}createActions(e){let s=e.createEl("div");s.style.cssText=`
            display: flex;
            gap: 10px;
            margin: 20px 0;
        `;let i=s.createEl("button",{text:"+ Ajouter"});if(i.style.cssText=`
            padding: 10px 20px;
            background: var(--interactive-accent);
            color: var(--text-on-accent);
            border: none;
            border-radius: 6px;
            cursor: pointer;
        `,i.onclick=()=>this.addPart(),this.plugin.settings.parts&&this.plugin.settings.parts.length>0){let r=s.createEl("button",{text:"\u{1F5D1}\uFE0F Vider"});r.style.cssText=`
                padding: 10px 20px;
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                cursor: pointer;
                color: var(--text-error);
            `,r.onclick=()=>this.clearAll()}}async saveSettingsQuietlyInternal(){this.isInternalAction=!0;try{await super.saveSettingsQuietly()}catch(e){}finally{setTimeout(()=>{this.isInternalAction=!1},100)}}async saveSettingsWithRefresh(){try{await super.saveSettings()}catch(e){}}reorderParts(e,s){if(!this.plugin.settings.parts){this.plugin.settings.parts=[];return}let[i]=this.plugin.settings.parts.splice(e,1);this.plugin.settings.parts.splice(s,0,i),this.saveSettingsQuietlyInternal()}addPart(){this.plugin.settings.parts||(this.plugin.settings.parts=[]),this.plugin.settings.parts.push({title:`Partie ${this.plugin.settings.parts.length+1}`,file:"",export:!0}),this.saveSettingsWithRefresh(),this.refreshDisplay()}deletePart(e){if(!this.plugin.settings.parts){this.plugin.settings.parts=[];return}this.plugin.settings.parts.splice(e,1),this.saveSettingsWithRefresh(),this.refreshDisplay()}clearAll(){confirm("Supprimer toutes les parties ?")&&(this.plugin.settings.parts=[],this.saveSettingsWithRefresh(),this.refreshDisplay())}refreshDisplay(){let e=document.querySelector(".pagedjs-tab-content");e&&(e.empty(),this.display(e))}};var J={autoStart:!0,publicFolder:"public",width:165,height:240,margin_top:10,margin_right:10,margin_bottom:10,margin_left:10,page_left_margin_top:10,page_left_margin_bottom:10,page_left_margin_left:25,page_left_margin_right:10,page_right_margin_top:10,page_right_margin_bottom:10,page_right_margin_left:10,page_right_margin_right:25,bleed:!0,marks:!0,recto_verso:!1,printNotes:"bottom",imageNotes:!1,ragadjust:!1,typesetting:!0,ep_markdown:!1,tailwind:!0,auto:!1,baseline:!1,theme:"",title:"",subtitle:"",runningtitle:"",name:"",mention:"",option:"",year:"",directeur:"",ecole:"",pdf:"",parts:[]},R=class extends z.PluginSettingTab{constructor(e,s){super(e,s);this.activeTab="structure";this.plugin=s,this.configurationsTab=new k(e,s),this.optionsTab=new _(e,s),this.saveLoadTab=new A(e,s),this.serverTab=new I(e,s),this.structureTab=new N(e,s),this.setupRefreshListener()}setupRefreshListener(){this.refreshListener=e=>{setTimeout(()=>{this.display()},50)},document.addEventListener("pagedjs-refresh-settings",this.refreshListener),document.addEventListener("pagedjs-settings-changed",this.refreshListener)}display(){let{containerEl:e}=this;e.empty(),e.createEl("h1",{text:"Pagedjs Server"}),this.createTabNavigation(e);let s=e.createEl("div",{cls:"pagedjs-tab-content"});switch(this.activeTab){case"configurations":s.addClass("configurations"),this.configurationsTab.display(s);break;case"options":s.addClass("options"),this.optionsTab.display(s);break;case"structure":s.addClass("structure"),this.structureTab.display(s);break;case"saveload":s.addClass("saveload"),this.saveLoadTab.display(s);break;case"server":s.addClass("server"),this.serverTab.display(s);break}}createTabNavigation(e){let s=e.createEl("div",{cls:"pagedjs-tab-nav"});[{id:"structure",label:"\u{1F4D6} Sommaire"},{id:"options",label:"\u2699\uFE0F Configuration du livre"},{id:"configurations",label:"\u{1F4DD} Options"},{id:"saveload",label:"\u{1F4BE} Sauvegarde"},{id:"server",label:"\u{1F5A5}\uFE0F Serveur"}].forEach(r=>{let n=s.createEl("button",{cls:`pagedjs-tab-button ${this.activeTab===r.id?"active":""}`,text:r.label});n.onclick=()=>{this.activeTab=r.id,this.display()}})}hide(){this.refreshListener&&(document.removeEventListener("pagedjs-refresh-settings",this.refreshListener),document.removeEventListener("pagedjs-settings-changed",this.refreshListener)),super.hide()}};var j=class extends h.Plugin{constructor(e,s){super(e,s);this.server=null;this.fileWatcher=null;this.serverCommands=null;this.logger=u.getInstance(),this.yamlManager=new x(e),this.config={port:3001,publicPath:"",autoStart:!0,watchExtensions:["md"]}}async onload(){this.logger.info("Chargement du plugin pagedjs-server","server"),await this.loadSettings(),this.config={port:3001,publicPath:"",autoStart:this.settings.autoStart,watchExtensions:["md"]},this.config.publicPath=H.join(this.app.vault.adapter.basePath,this.settings.publicFolder),this.initializeComponents(),this.setupCommands(),this.config.autoStart&&await this.startServer(),this.addRibbonIcon("globe","Ouvrir PagedJS Server",e=>{this.openInBrowser()}),this.logger.info("Plugin pagedjs-server charg\xE9 avec succ\xE8s","server"),this.addSettingTab(new R(this.app,this))}initializeComponents(){this.server=new F(this.config),this.fileWatcher=new L(this.app.vault,this.config.watchExtensions,this.settings.publicFolder),this.serverCommands=new $(this),this.fileWatcher.onFileChange(e=>{this.server&&(this.server.updateLastModified(e.timestamp),this.logger.info(`Auto-reload d\xE9clench\xE9 par: ${e.fileName} (dossier: ${this.settings.publicFolder})`,"reload"))})}setupCommands(){this.serverCommands&&(this.addCommand({id:"toggle-pagedjs-server",name:"D\xE9marrer/Arr\xEAter le serveur",callback:()=>this.serverCommands.toggleServer()}),this.addCommand({id:"open-in-browser",name:"Ouvrir dans le navigateur",callback:()=>this.serverCommands.openInBrowser()}),this.addCommand({id:"server-status",name:"Statut du serveur",callback:()=>this.serverCommands.showStatus()}),this.addCommand({id:"show-logs",name:"Afficher les logs",callback:()=>this.serverCommands.showLogs()}))}showLogs(){this.serverCommands?this.serverCommands.showLogs():new h.Notice("\u274C Le serveur n'est pas initialis\xE9")}openInBrowser(){this.serverCommands?this.serverCommands.openInBrowser():new h.Notice("\u274C Le serveur n'est pas initialis\xE9")}async restartServer(){this.logger.info("Red\xE9marrage du serveur via interface","server"),new h.Notice("\u{1F504} Red\xE9marrage du serveur..."),await this.stopServer(),await new Promise(e=>setTimeout(e,500)),await this.startServer(),new h.Notice("\u2705 Serveur red\xE9marr\xE9")}getServerInstance(){return this.server}async forceReloadCurrentConfig(){try{let s=await this.yamlManager.loadConfigFromYaml(this.settings);if(s){let i=this.settings.publicFolder,r=this.settings.autoStart;return Object.assign(this.settings,s),this.settings.publicFolder=i,this.settings.autoStart=r,await this.saveData(this.settings),!0}else return!1}catch(s){return!1}}async reloadConfigFromNewFolder(){var n;let e=`${this.settings.publicFolder}/config.yml`,s=H.join(this.app.vault.adapter.basePath,this.settings.publicFolder);this.config.publicPath=s,this.fileWatcher&&this.fileWatcher.setPublicFolderPath(this.settings.publicFolder),this.server&&this.server.isRunning()&&this.server.updatePublicPath(s);try{let a=await this.yamlManager.loadConfigFromYaml(this.settings);if(a){let l=this.settings.publicFolder;Object.assign(this.settings,a);let c={autoStart:this.settings.autoStart,publicFolder:l};Object.assign(this.settings,c),await this.saveData(this.settings);let g=new CustomEvent("pagedjs-settings-refreshed",{detail:{settings:this.settings,source:"folder-change",partsLoaded:((n=this.settings.parts)==null?void 0:n.length)||0}});document.dispatchEvent(g)}else{let l=new CustomEvent("pagedjs-settings-refreshed",{detail:{settings:this.settings,source:"folder-change-no-config",partsLoaded:0}});document.dispatchEvent(l)}}catch(a){}}updatePublicFolder(e){this.settings.publicFolder=e,this.config.publicPath=H.join(this.app.vault.adapter.basePath,e),this.fileWatcher&&this.fileWatcher.setPublicFolderPath(e),this.server&&this.server.isRunning()&&this.server.updatePublicPath(this.config.publicPath)}async startServer(){if(!this.server||!this.fileWatcher){this.logger.error("Composants non initialis\xE9s","server");return}try{await this.server.start(),this.fileWatcher.startWatching(),new h.Notice(`Serveur d\xE9marr\xE9 sur le port ${this.server.getPort()}`),this.logger.info("Serveur et surveillance d\xE9marr\xE9s","server");let e=this.fileWatcher.getWatchingStats();this.logger.info(`Surveillance: ${e.extensions.join(", ")} dans ${e.publicFolder||"TOUS LES DOSSIERS"}`,"file")}catch(e){new h.Notice(`Erreur de d\xE9marrage: ${e.message}`),this.logger.error(`Erreur de d\xE9marrage: ${e.message}`,"server")}}async stopServer(){if(!this.server||!this.fileWatcher){new h.Notice("Aucun serveur en cours d'ex\xE9cution");return}await this.server.stop(),this.fileWatcher.stopWatching(),new h.Notice("Serveur arr\xEAt\xE9"),this.logger.info("Serveur et surveillance arr\xEAt\xE9s","server")}getServerStatus(){var e;return((e=this.server)==null?void 0:e.getStatus())||null}isServerRunning(){var e;return((e=this.server)==null?void 0:e.isRunning())||!1}getServerPort(){var e;return((e=this.server)==null?void 0:e.getPort())||this.config.port}async loadSettings(){var a;let e=Object.assign({},J,await this.loadData()),s=`${e.publicFolder}/config.yml`;if(this.app.vault.getAbstractFileByPath(s)instanceof h.TFile){this.logger.info("config.yml trouv\xE9, chargement depuis YAML","config");try{let c=await this.yamlManager.loadConfigFromYaml(e);c?(this.settings=Object.assign({},e,c),this.logger.info(`Config YAML charg\xE9e avec ${((a=this.settings.parts)==null?void 0:a.length)||0} parties`,"config")):this.settings=e;return}catch(c){this.logger.error(`Erreur lecture config.yml: ${c.message}`,"config")}}this.settings=e}async saveSettings(){await this.saveData(this.settings);let e=new CustomEvent("pagedjs-settings-refreshed",{detail:{settings:this.settings,source:"save"}});document.dispatchEvent(e)}async onunload(){var e,s;this.logger.info("D\xE9chargement du plugin pagedjs-server","server"),(e=this.server)!=null&&e.isRunning()&&await this.stopServer(),(s=this.fileWatcher)==null||s.stopWatching(),this.logger.clearHistory(),this.logger.info("Plugin pagedjs-server d\xE9charg\xE9","server")}};
