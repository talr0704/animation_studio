export const ROOT=new URL('../../assets/scenes/manicure/',import.meta.url);
export const url=path=>new URL(path,ROOT).href;
export const COLORS=['pink','lavender','mint','peach','yellow','topcoat'];
export async function loadAssets(){
 const get=async path=>{const response=await fetch(url(path));if(!response.ok)throw Error('Missing '+path);return response.json();};
 const [layout,bottles]=await Promise.all([get('assembly.json'),get('props/nail-polish/rig.json')]);
 const paths=['paw/paw.png','furniture/paw-cushion.png','furniture/tool-tray.png','furniture/dryer-open.png','furniture/dryer-front.png','furniture/dryer-light.png','furniture/bowl-back.png','furniture/bowl-front.png','furniture/water-surface.png',...['broken','partly-repaired','clean'].flatMap(s=>['nails/states/'+s+'.png','nails/masks/'+s+'.png']),...['dirt','old-polish','shine'].map(s=>'nails/overlays/'+s+'.png'),...['cotton-clean','cotton-stained','cleaning-brush','nail-file','remover','nail-buffer','towel','cream-jar','cream-lid','cuticle-stick'].map(s=>'props/care/images/'+s+'.png'),...COLORS.flatMap(c=>['bottle-back','bottle-front','brush'].map(s=>`props/nail-polish/colors/${c}/${s}.png`)),...['flower','heart','star','bow'].map(s=>'props/stickers/images/sticker-'+s+'.png'),...['soap-bottle','soap-collar','soap-pump'].map(s=>'props/soap/images/'+s+'.png'),...['sparkles','heart'].map(s=>'effects/'+s+'.png'),...['done','next','photo','undo'].map(s=>'ui/button-'+s+'.png')];
 const images={};await Promise.all(paths.map(async path=>{const image=new Image();image.src=url(path);await image.decode();images[path]=image;}));
 return {layout,bottles,images};
}
