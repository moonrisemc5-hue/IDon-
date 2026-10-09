import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export const Route = createFileRoute('/')({ component: DaApps })

type AppItem = { name:string; url?:string; kind:'external'|'settings'|'music'; glyph:string; tone:string; logo?:string }
const apps:AppItem[] = [
 {name:'DaEconomy',url:'https://xt0tiedcmrq9i5amck0jexb0.macaly.app/',kind:'external',glyph:'▰',tone:'economy'},
 {name:'DaCourt',url:'https://jquv9w2u2tbwtpi6qdd4ze7n.macaly.app/',kind:'external',glyph:'⚖',tone:'court'},
 {name:'DaMusic',kind:'music',glyph:'♪',tone:'music'},
 {name:'Settings',kind:'settings',glyph:'⚙',tone:'settings'},
 {name:'DeviceTest',kind:'settings',glyph:'◉',tone:'test'}
]
const tracks = Array.from({length:8},(_,i)=>[`DaMusic Radio ${String(i+1).padStart(2,'0')}`,'DaBoys Radio',`https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i+1}.mp3`] as const)

function Icon({app}:{app:AppItem}){
 const customLogo = app.tone==='economy'
  ? <svg className="brand-svg" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 24h48v30H8z"/><path d="M5 24 32 9l27 15H5z"/><path d="M15 30v18M25 30v18M39 30v18M49 30v18M5 52h54" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  : app.tone==='court'
  ? <svg className="brand-svg" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8v45M18 54h28M12 54h40" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/><path d="M9 20h46M15 20l-9 18h18L15 20ZM49 20l-9 18h18l-9-18Z" fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round"/></svg>
  : null
 return <div className={'app-icon '+app.tone}>{customLogo || <span>{app.glyph}</span>}</div>
}

export function DaApps(){
 const [wallpaper,setWallpaper]=useState(()=>typeof window==='undefined'?'aurora':localStorage.getItem('daapps-wallpaper')||'aurora')
 const [customWallpaper,setCustomWallpaper]=useState(()=>typeof window==='undefined'?'':localStorage.getItem('daapps-custom-wallpaper')||'')
 const [panel,setPanel]=useState<'none'|'settings'|'music'>('none')
 const [controlCenter,setControlCenter]=useState(false)
 const [topHint,setTopHint]=useState(false)
 const [volume,setVolume]=useState(62)
 const [track,setTrack]=useState(0),[playing,setPlaying]=useState(false)
 const [isMobile,setIsMobile]=useState(()=>typeof window!=='undefined'&&window.innerWidth<=720)
 const [editMode,setEditMode]=useState(false)
 const [dragging,setDragging]=useState<string|null>(null)
 const [mobilePage,setMobilePage]=useState(0)
 const [mobilePageTotal,setMobilePageTotal]=useState(()=>typeof window==='undefined'?1:Number(localStorage.getItem('daapps-page-total')||1))
 const [mobileApps,setMobileApps]=useState<AppItem[]>(apps)
 const [mobileSlots,setMobileSlots]=useState<(string|null)[]>(()=>{if(typeof window==='undefined')return [...apps.map(a=>a.name),...Array(19).fill(null)];try{const saved=JSON.parse(localStorage.getItem('daapps-mobile-slots')||'null');return Array.isArray(saved)&&saved.length>=24?saved:[...apps.map(a=>a.name),...Array(19).fill(null)]}catch{return [...apps.map(a=>a.name),...Array(19).fill(null)]}})
 const [folders,setFolders]=useState<Record<string,string[]>>(()=>{try{return JSON.parse(localStorage.getItem('daapps-folders')||'{}')}catch{return {}}})
 const [folderLabels,setFolderLabels]=useState<Record<string,string>>(()=>{try{return JSON.parse(localStorage.getItem('daapps-folder-labels')||'{}')}catch{return {}}})
 const [openFolder,setOpenFolder]=useState<string|null>(null)
 const [renamingFolder,setRenamingFolder]=useState<string|null>(null)
 const [folderNameDraft,setFolderNameDraft]=useState('')
 const [deleteTarget,setDeleteTarget]=useState<AppItem|null>(null)

 const [positions,setPositions]=useState<Record<string,{x:number;y:number}>>({DaEconomy:{x:5,y:3},DaCourt:{x:30,y:3},DaMusic:{x:55,y:3},Settings:{x:80,y:3},DeviceTest:{x:5,y:20}})
 const dragRef=useRef<{name:string;offsetX:number;offsetY:number}|null>(null)
 const mobileSwipeRef=useRef<{x:number;y:number}|null>(null)
 const mobileLongPressRef=useRef<number|null>(null)
 const mobileBackgroundLongPressRef=useRef<number|null>(null)
 const mobileHomeRef=useRef<HTMLDivElement|null>(null)
 const mobilePressAppRef=useRef<string|null>(null)
 const mobilePressPointerIdRef=useRef<number|null>(null)
 const mobileDragRef=useRef<string|null>(null)
 const mobileDragIndexRef=useRef<number|null>(null)
 const mobileDragStartRef=useRef<{x:number;y:number}|null>(null)
 const mobileMovedRef=useRef(false)
 const [mobileDragPoint,setMobileDragPoint]=useState({x:0,y:0})
 const [mobileDropAnimating,setMobileDropAnimating]=useState(false)
 const mobileDropTimerRef=useRef<number|null>(null)
 const mobileReorderTimerRef=useRef<number|null>(null)
 const mobileFolderTimerRef=useRef<number|null>(null)
 const mobileFolderTargetRef=useRef<{page:number;slot:number;name:string}|null>(null)
 const mobileFolderDragRef=useRef<{folderId:string;appName:string;pointerId:number}|null>(null)
 const mobileFolderWindowHoldRef=useRef<number|null>(null)
 const mobileSlotsRef=useRef(mobileSlots)
 const [mobileSwipeOffset,setMobileSwipeOffset]=useState(0)
 const mobileSwipeDragRef=useRef<{x:number;page:number}|null>(null)
 const mobilePageTransitionRef=useRef(false)
 const mobileDragPageRef=useRef(0)
 const mobileEdgeLockRef=useRef<'left'|'right'|null>(null)
 const mobileDragPointRef=useRef({x:0,y:0})
 const mobileDropTargetRef=useRef<{page:number;slot:number}|null>(null)
 const mobilePointerRef=useRef({x:0,y:0})
 const mobileDragRafRef=useRef<number|null>(null)
 const mobileDragElementRef=useRef<HTMLElement|null>(null)
 const mobileLastSlotRef=useRef<number|null>(null)
 const mobileReorderLockRef=useRef(false)
 const mobileFirstRectsRef=useRef<Map<string,DOMRect>|null>(null)
 const mobileTileRefs=useRef<Record<string,HTMLElement|null>>({})
 const MOBILE_PER_PAGE=24
 const audio=useRef<HTMLAudioElement>(null)

 useEffect(()=>{localStorage.setItem('daapps-wallpaper',wallpaper)},[wallpaper])
 useEffect(()=>{localStorage.setItem('daapps-page-total',String(mobilePageTotal));localStorage.setItem('daapps-mobile-slots',JSON.stringify(mobileSlots))},[mobilePageTotal,mobileSlots])
 useEffect(()=>{localStorage.setItem('daapps-folders',JSON.stringify(folders))},[folders])
 useEffect(()=>{localStorage.setItem('daapps-folder-labels',JSON.stringify(folderLabels))},[folderLabels])
 useEffect(()=>{mobileSlotsRef.current=mobileSlots},[mobileSlots])
 useEffect(()=>{const onResize=()=>setIsMobile(window.innerWidth<=720);onResize();window.addEventListener('resize',onResize);return()=>window.removeEventListener('resize',onResize)},[])
 useEffect(()=>{if(customWallpaper)localStorage.setItem('daapps-custom-wallpaper',customWallpaper);else localStorage.removeItem('daapps-custom-wallpaper')},[customWallpaper])
 useEffect(()=>{
  const move=(e:MouseEvent)=>{if(window.innerWidth>720)setTopHint(e.clientY<85)}
  window.addEventListener('mousemove',move); return()=>window.removeEventListener('mousemove',move)
 },[])
 useEffect(()=>{if(!audio.current)return;audio.current.src=tracks[track][2];audio.current.load();if(playing)void audio.current.play().catch(()=>setPlaying(false))},[track])
 useEffect(()=>{if(!audio.current)return;playing?void audio.current.play().catch(()=>setPlaying(false)):audio.current.pause()},[playing])

 const mobilePageCount=Math.max(1,mobilePageTotal)
 const clearMobileLongPress=()=>{if(mobileLongPressRef.current){clearTimeout(mobileLongPressRef.current);mobileLongPressRef.current=null}if(mobileBackgroundLongPressRef.current){clearTimeout(mobileBackgroundLongPressRef.current);mobileBackgroundLongPressRef.current=null}if(mobileFolderWindowHoldRef.current){clearTimeout(mobileFolderWindowHoldRef.current);mobileFolderWindowHoldRef.current=null}}
 const clearFolderHover=()=>{if(mobileFolderTimerRef.current){clearTimeout(mobileFolderTimerRef.current);mobileFolderTimerRef.current=null}mobileFolderTargetRef.current=null}
 const exitEdit=()=>{clearMobileLongPress();setEditMode(false);setDragging(null);dragRef.current=null;mobileDragRef.current=null;mobileDragIndexRef.current=null;mobileDragStartRef.current=null;mobileMovedRef.current=false;setMobileDragPoint({x:0,y:0})}
 const deleteMobileApp=(name:string)=>{setMobileApps(prev=>prev.filter(a=>a.name!==name));setMobileSlots(prev=>prev.map(x=>x===name?null:x));setFolders(prev=>{const next={...prev};Object.keys(next).forEach(id=>{next[id]=next[id].filter(x=>x!==name);if(!next[id].length)delete next[id]});return next});setDeleteTarget(null);exitEdit()}
 const beginFolderRename=()=>{if(!openFolder)return;setFolderNameDraft(folderLabels[openFolder]||'Folder');setRenamingFolder(openFolder)}
 const finishFolderRename=()=>{if(!renamingFolder)return;const n=folderNameDraft.trim();if(n)setFolderLabels(prev=>({...prev,[renamingFolder]:n}));setRenamingFolder(null)}
 const createMobileFolder=(dragName:string,targetName:string,targetPage:number,targetSlot:number)=>{if(!editMode||dragName===targetName||dragName.startsWith('folder-'))return;const current=mobileSlotsRef.current;const from=current.findIndex(x=>x===dragName);if(from<0)return;if(targetName.startsWith('folder-')){const existing=folders[targetName]||[];if(existing.includes(dragName)||existing.length>=12)return;const next=[...current];next[from]=null;setFolders(prev=>({...prev,[targetName]:[...(prev[targetName]||[]),dragName]}));captureMobileRects();mobileSlotsRef.current=next;setMobileSlots(next);mobileDropTargetRef.current={page:targetPage,slot:targetSlot};return}const target=current.findIndex(x=>x===targetName);if(target<0)return;const id='folder-'+Date.now();const next=[...current];next[from]=null;next[target]=id;setFolders(prev=>({...prev,[id]:[targetName,dragName]}));captureMobileRects();mobileSlotsRef.current=next;setMobileSlots(next);mobileDropTargetRef.current={page:targetPage,slot:targetSlot}}
 const captureMobileRects=()=>{
  const map=new Map<string,DOMRect>()
  Object.entries(mobileTileRefs.current).forEach(([name,el])=>{if(el)map.set(name,el.getBoundingClientRect())})
  mobileFirstRectsRef.current=map
 }
 const moveMobileAppToSlot=(name:string,targetPage:number,targetSlot:number)=>{
  if(!editMode)return
  setMobileSlots(prev=>{
   const next=[...prev]
   const from=next.findIndex(x=>x===name)
   if(from<0)return prev
   const pageStart=targetPage*MOBILE_PER_PAGE
   const target=Math.max(pageStart,Math.min(pageStart+MOBILE_PER_PAGE-1,pageStart+targetSlot))
   if(from===target)return prev
   next[from]=null
   const pageEnd=pageStart+MOBILE_PER_PAGE
   let empty=-1
   for(let i=pageStart;i<pageEnd;i++){if(next[i]===null){empty=i;break}}
   if(empty<0){next[target]=name;return next}
   if(empty<target){for(let i=empty;i<target;i++)next[i]=next[i+1]}
   else if(empty>target){for(let i=empty;i>target;i--)next[i]=next[i-1]}
   next[target]=name
   return next
  })
 }
 const reorderMobileApp=(name:string,targetPage:number,targetSlot:number)=>{
  if(!editMode)return
  const current=mobileSlotsRef.current
  const from=current.findIndex(x=>x===name); if(from<0)return
  const target=targetPage*MOBILE_PER_PAGE+Math.max(0,Math.min(MOBILE_PER_PAGE-1,targetSlot))
  if(target<0||target>=current.length)return
  if(from===target)return
  const next=[...current]
  const targetValue=next[target]
  if(targetValue===null){
   next[from]=null
   next[target]=name
  }else{
   const fromPage=Math.floor(from/MOBILE_PER_PAGE)
   const targetPageStart=targetPage*MOBILE_PER_PAGE
   const sourceStart=fromPage*MOBILE_PER_PAGE
   const sourceItems=next.slice(sourceStart,sourceStart+MOBILE_PER_PAGE).filter(Boolean) as string[]
   const targetItems=targetPage===fromPage?sourceItems:[...next.slice(targetPageStart,targetPageStart+MOBILE_PER_PAGE).filter(Boolean) as string[]]
   const sourceIndex=sourceItems.indexOf(name); if(sourceIndex<0)return
   sourceItems.splice(sourceIndex,1)
   const hoveredIndex=targetItems.indexOf(targetValue)
   const insertAt=hoveredIndex>=0?hoveredIndex:Math.min(targetSlot,targetItems.length)
   targetItems.splice(insertAt,0,name)
   const pack=(items:string[])=>{const out=Array(MOBILE_PER_PAGE).fill(null) as (string|null)[];items.slice(0,MOBILE_PER_PAGE).forEach((v,i)=>out[i]=v);return out}
   next.splice(sourceStart,MOBILE_PER_PAGE,...pack(sourceItems))
   if(targetPage!==fromPage)next.splice(targetPageStart,MOBILE_PER_PAGE,...pack(targetItems))
  }
  captureMobileRects(); mobileSlotsRef.current=next; setMobileSlots(next)
 }
 const startMobileItem=(e:React.PointerEvent,name:string)=>{
  if(!isMobile||e.pointerType==='mouse')return
  e.stopPropagation();clearMobileLongPress();mobileMovedRef.current=false
  mobilePressAppRef.current=name
  mobilePressPointerIdRef.current=e.pointerId
  mobileLongPressRef.current=window.setTimeout(()=>{
   if(mobilePressAppRef.current!==name)return
   setEditMode(true)
   mobileDragRef.current=name
   mobileDragIndexRef.current=mobileSlotsRef.current.findIndex(x=>x===name)
   mobileDragStartRef.current={x:e.clientX,y:e.clientY}
   mobilePointerRef.current={x:e.clientX,y:e.clientY}
   mobileLastSlotRef.current=mobileDragIndexRef.current
   mobileDragPageRef.current=mobilePage
   mobileEdgeLockRef.current=null
   mobileDropTargetRef.current={page:mobilePage,slot:Math.max(0,mobileDragIndexRef.current-mobilePage*MOBILE_PER_PAGE)}
   setMobileDragPoint({x:e.clientX,y:e.clientY})
   setDragging(name)
   mobileHomeRef.current?.setPointerCapture?.(e.pointerId)
  },550)
 }
 const startMobileApp=(e:React.PointerEvent,a:AppItem)=>startMobileItem(e,a.name)
 const moveMobileName=(e:React.PointerEvent,name:string)=>{
  if(!isMobile||mobileDragRef.current!==name)return
  e.stopPropagation();e.preventDefault();if(!editMode||!mobileDragStartRef.current)return
  mobileMovedRef.current=true;mobilePointerRef.current={x:e.clientX,y:e.clientY};setMobileDragPoint({x:e.clientX,y:e.clientY})
  const edge=48
  if(e.clientX>window.innerWidth-edge&&mobileDragPageRef.current<mobilePageCount-1){
   if(mobileEdgeLockRef.current!=='right'&&!mobilePageTransitionRef.current){
    mobileEdgeLockRef.current='right';
    mobilePageTransitionRef.current=true;
    mobileDragPageRef.current+=1;
    setMobilePage(mobileDragPageRef.current);
    window.setTimeout(()=>{mobilePageTransitionRef.current=false},320)
   }
  }else if(e.clientX<edge&&mobileDragPageRef.current>0){
   if(mobileEdgeLockRef.current!=='left'&&!mobilePageTransitionRef.current){
    mobileEdgeLockRef.current='left';
    mobilePageTransitionRef.current=true;
    mobileDragPageRef.current-=1;
    setMobilePage(mobileDragPageRef.current);
    window.setTimeout(()=>{mobilePageTransitionRef.current=false},320)
   }
  }else if(e.clientX>=edge&&e.clientX<=window.innerWidth-edge){mobileEdgeLockRef.current=null}
  const page=mobileDragPageRef.current
  const x=e.clientX
  const y=e.clientY
  const col=Math.max(0,Math.min(3,Math.floor((x/window.innerWidth)*4)))
  const top=54
  const usable=Math.max(1,window.innerHeight-126)
  const row=Math.max(0,Math.min(5,Math.floor(((y-top)/usable)*6)))
  let targetSlot=row*4+col
  const hovered=Object.entries(mobileTileRefs.current).find(([tileName,el])=>{
   if(!el||tileName===name)return false
   const r=el.getBoundingClientRect()
   return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom
  })
  let hoveredAppName:string|null=null
  if(hovered){
   if(hovered[0].startsWith('empty-')){
    const parts=hovered[0].split('-')
    const hp=Number(parts[1]), hs=Number(parts[2])
    if(hp===page&&Number.isFinite(hs))targetSlot=hs
   }else{
    const hoveredIndex=mobileSlotsRef.current.findIndex(v=>v===hovered[0])
    if(hoveredIndex>=page*MOBILE_PER_PAGE&&hoveredIndex<(page+1)*MOBILE_PER_PAGE){targetSlot=hoveredIndex-page*MOBILE_PER_PAGE;hoveredAppName=hovered[0]}
   }
  }
  // Reordering should happen when the finger enters an app. A folder is a
  // deliberate action: the finger must stay over the middle of the target
  // app for a moment instead of creating one from a tiny accidental overlap.
  let centeredHover=false
  if(hoveredAppName && !name.startsWith('folder-')){
   const targetEl=mobileTileRefs.current[hoveredAppName]
   const r=targetEl?.getBoundingClientRect()
   if(r){
    const insetX=r.width*.27, insetY=r.height*.27
    centeredHover=x>=r.left+insetX&&x<=r.right-insetX&&y>=r.top+insetY&&y<=r.bottom-insetY
   }
  }
  if(centeredHover && hoveredAppName && !name.startsWith('folder-')){
   const ft=mobileFolderTargetRef.current
   if(!ft||ft.page!==page||ft.slot!==targetSlot||ft.name!==hoveredAppName){
    clearFolderHover();mobileFolderTargetRef.current={page,slot:targetSlot,name:hoveredAppName}
    mobileFolderTimerRef.current=window.setTimeout(()=>{
     if(mobileDragRef.current===name&&mobileFolderTargetRef.current?.name===hoveredAppName)
      createMobileFolder(name,hoveredAppName,page,targetSlot)
     mobileFolderTimerRef.current=null
    },700)
   }
  }else clearFolderHover()
  mobileDropTargetRef.current={page,slot:targetSlot}
  const previous=mobileLastSlotRef.current
  if(previous!==targetSlot||mobileDragPageRef.current!==page){
   if(mobileReorderTimerRef.current)window.clearTimeout(mobileReorderTimerRef.current)
   mobileReorderTimerRef.current=window.setTimeout(()=>{
    if(mobileDragRef.current===name){
     reorderMobileApp(name,page,targetSlot)
     mobileLastSlotRef.current=targetSlot
    }
    mobileReorderTimerRef.current=null
   },140)
  }
 }
 const moveMobileApp=(e:React.PointerEvent,a:AppItem)=>moveMobileName(e,a.name)
 const dropMobileApp=(e:React.PointerEvent)=>{
  if(!isMobile||!mobileDragRef.current||!editMode)return endMobileApp()
  e.stopPropagation();e.preventDefault()
  clearMobileLongPress()
  clearFolderHover()
  if(mobileReorderTimerRef.current)window.clearTimeout(mobileReorderTimerRef.current)
  mobileReorderTimerRef.current=null
  const target=mobileDropTargetRef.current
  const page=target?.page ?? mobileDragPageRef.current
  const slot=target?.slot ?? 0
  const name=mobileDragRef.current
  const targetX=((slot%4)+.5)*(window.innerWidth/4)
  const targetY=54+((Math.floor(slot/4)+.5)*Math.max(1,window.innerHeight-126)/6)
  reorderMobileApp(name,page,slot)
  setMobileDropAnimating(true)
  setMobileDragPoint({x:targetX,y:targetY})
  if(mobileDropTimerRef.current)window.clearTimeout(mobileDropTimerRef.current)
  mobileDropTimerRef.current=window.setTimeout(()=>{
   setMobileDropAnimating(false)
   mobileDropTimerRef.current=null
   mobilePressAppRef.current=null
   mobilePressPointerIdRef.current=null
   mobileDragRef.current=null
   mobileEdgeLockRef.current=null
   mobilePageTransitionRef.current=false
   mobileDragIndexRef.current=null
   mobileDragStartRef.current=null
   if(mobileDragRafRef.current)cancelAnimationFrame(mobileDragRafRef.current)
   if(mobileDragElementRef.current){mobileDragElementRef.current.releasePointerCapture?.(e.pointerId);mobileDragElementRef.current.style.transform='';mobileDragElementRef.current=null}
   mobileReorderLockRef.current=false
   mobileDragPointRef.current={x:0,y:0};mobileDropTargetRef.current=null;setMobileDragPoint({x:0,y:0})
   setDragging(null)
   mobileMovedRef.current=false
  },190)
  return
 }
 const startFolderAppDrag=(e:React.PointerEvent,folderId:string,appName:string)=>{
  if(!isMobile||e.pointerType==='mouse')return
  e.stopPropagation();clearMobileLongPress();mobileFolderDragRef.current={folderId,appName,pointerId:e.pointerId};mobileMovedRef.current=false
  mobileLongPressRef.current=window.setTimeout(()=>{
   if(mobileFolderDragRef.current?.folderId!==folderId||mobileFolderDragRef.current?.appName!==appName)return
   const current=mobileSlotsRef.current
   let empty=current.findIndex(x=>x===null)
   if(empty<0){
    const newPage=Math.max(1,mobilePageCount)
    const next=[...current,...Array(MOBILE_PER_PAGE).fill(null)]
    empty=newPage*MOBILE_PER_PAGE
    mobileSlotsRef.current=next;setMobileSlots(next);setMobilePageTotal(p=>p+1)
   }
   setEditMode(true)
   const remaining=(folders[folderId]||[]).filter(x=>x!==appName)
   const folderSlot=current.findIndex(x=>x===folderId)
   if(remaining.length<=1&&folderSlot>=0){
    const next=[...current];next[folderSlot]=remaining[0]||null
    mobileSlotsRef.current=next;setMobileSlots(next)
    setFolders(prev=>{const nextFolders={...prev};delete nextFolders[folderId];return nextFolders})
   }else setFolders(prev=>{const next={...prev};next[folderId]=remaining;return next})
   const next=[...mobileSlotsRef.current];next[empty]=appName;mobileSlotsRef.current=next;setMobileSlots(next);setOpenFolder(null)
   mobileFolderDragRef.current=null;mobileDragRef.current=appName;mobileDragIndexRef.current=empty;mobileDragStartRef.current={x:e.clientX,y:e.clientY};mobilePointerRef.current={x:e.clientX,y:e.clientY};mobileLastSlotRef.current=empty;mobileDragPageRef.current=Math.floor(empty/MOBILE_PER_PAGE);mobileDropTargetRef.current={page:Math.floor(empty/MOBILE_PER_PAGE),slot:empty%MOBILE_PER_PAGE};setDragging(appName);setMobileDragPoint({x:e.clientX,y:e.clientY});mobileHomeRef.current?.setPointerCapture?.(e.pointerId)
  },550)
}
const moveFolderAppDrag=(e:React.PointerEvent)=>{if(mobileDragRef.current){moveMobileName(e,mobileDragRef.current);return}const d=mobileFolderDragRef.current;if(!d)return;const dx=e.clientX-mobilePointerRef.current.x,dy=e.clientY-mobilePointerRef.current.y;if(Math.hypot(dx,dy)>10){mobileMovedRef.current=true;clearMobileLongPress()}}
const endFolderAppDrag=()=>{clearMobileLongPress();mobileFolderDragRef.current=null}
 const endMobileApp=()=>{clearMobileLongPress();clearFolderHover();if(mobileDropTimerRef.current)window.clearTimeout(mobileDropTimerRef.current);setMobileDropAnimating(false);mobileDropTimerRef.current=null;if(mobileDragRafRef.current)cancelAnimationFrame(mobileDragRafRef.current);if(mobileDragElementRef.current)mobileDragElementRef.current.style.transform='';mobileDragElementRef.current=null;mobileLastSlotRef.current=null;mobileReorderLockRef.current=false;mobilePressAppRef.current=null;mobilePressPointerIdRef.current=null;mobileDragRef.current=null;mobileEdgeLockRef.current=null;mobileDragIndexRef.current=null;mobileDragStartRef.current=null;setDragging(null);mobileDragPointRef.current={x:0,y:0};setMobileDragPoint({x:0,y:0});mobileMovedRef.current=false}
 useLayoutEffect(()=>{
  const first=mobileFirstRectsRef.current
  if(!first||!isMobile)return
  mobileFirstRectsRef.current=null
  Object.entries(mobileTileRefs.current).forEach(([name,el])=>{
   const before=first.get(name); if(!el||!before)return
   const after=el.getBoundingClientRect(); const dx=before.left-after.left,dy=before.top-after.top
   if(Math.abs(dx)>1||Math.abs(dy)>1)el.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}],{duration:440,easing:'cubic-bezier(.2,.75,.25,1)'})
  })
 },[mobileSlots,isMobile])
 const addMobilePage=()=>{setMobileSlots(s=>[...s,...Array(MOBILE_PER_PAGE).fill(null)]);setMobilePageTotal(p=>p+1);setMobilePage(p=>p+1)}
 const removeMobilePage=()=>{if(mobilePage<=0||mobilePageCount<=1)return;const start=mobilePage*MOBILE_PER_PAGE;const end=start+MOBILE_PER_PAGE;setMobileSlots(prev=>{const removed=prev.slice(start,end).filter(Boolean) as string[];const next=[...prev.slice(0,start),...prev.slice(end)];let empty=0;for(const name of removed){while(empty<next.length&&next[empty]!==null)empty++;if(empty<next.length){next[empty]=name;empty++}}return next});setMobilePageTotal(p=>Math.max(1,p-1));setMobilePage(p=>Math.max(0,p-1))}
 const startMobileBackgroundHold=(e:React.PointerEvent)=>{
  if(!isMobile||e.pointerType==='mouse'||editMode)return
  if((e.target as HTMLElement).closest('.app-tile,.delete-x'))return
  e.preventDefault()
  clearMobileLongPress()
  mobileBackgroundLongPressRef.current=window.setTimeout(()=>setEditMode(true),550)
 }
 const open=(a:AppItem)=>{if(editMode)return;if(a.kind==='external'&&a.url){window.location.href=a.url;return}setPanel(a.kind==='music'?'music':'settings')}
 const startEdit=(e:React.PointerEvent,a:AppItem)=>{
  if(e.button!==0)return
  const target=e.currentTarget as HTMLElement
  const pointerId=e.pointerId
  const timer=window.setTimeout(()=>{
   setEditMode(true)
   const r=target.getBoundingClientRect()
   dragRef.current={name:a.name,offsetX:e.clientX-r.left,offsetY:e.clientY-r.top}
   target.setPointerCapture?.(pointerId)
  },550)
  const cancel=()=>window.clearTimeout(timer)
  target.addEventListener('pointerup',cancel,{once:true})
  target.addEventListener('pointercancel',cancel,{once:true})
  target.addEventListener('pointerleave',()=>{if(!editMode)cancel()},{once:true})
 }
 const dragApp=(e:React.PointerEvent,a:AppItem)=>{
  if(!editMode||dragRef.current?.name!==a.name)return
  const area=(e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
  const tile=(e.currentTarget as HTMLElement).getBoundingClientRect()
  const x=Math.max(0,Math.min(100,(e.clientX-area.left-dragRef.current.offsetX)/(area.width-tile.width)*100))
  const y=Math.max(0,Math.min(100,(e.clientY-area.top-dragRef.current.offsetY)/(area.height-tile.height)*100))
  setPositions(p=>({...p,[a.name]:{x,y}}))
 }
 const endDrag=()=>{dragRef.current=null;setDragging(null)}

 const handleWallpaperUpload=(file:File)=>{if(!file.type.startsWith('image/'))return;const reader=new FileReader();reader.onload=()=>{const value=String(reader.result||'');setCustomWallpaper(value);setWallpaper('custom')};reader.readAsDataURL(file)}
 const shellStyle=customWallpaper?{backgroundImage:`linear-gradient(hsl(220 35% 5%/.28),hsl(220 35% 5%/.28)),url(${customWallpaper})`}:{}
 return <main className={'da-shell wallpaper-'+wallpaper+(editMode?' edit-mode':'')} style={shellStyle} onPointerDown={e=>{if(editMode&&!((e.target as HTMLElement).closest('.app-tile'))){setEditMode(false);endDrag()}}} onPointerUp={endDrag}>
  <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
  <section className="device">
   <div ref={mobileHomeRef} className="home-screen" onPointerDown={e=>{if(isMobile&&!editMode&&e.pointerType!=='mouse'){mobileSwipeRef.current={x:e.clientX,y:e.clientY};mobileSwipeDragRef.current={x:e.clientX,page:mobilePage};setMobileSwipeOffset(0);startMobileBackgroundHold(e)}if(editMode&&!((e.target as HTMLElement).closest('.app-tile')||(e.target as HTMLElement).closest('.delete-x')))exitEdit()}} onPointerMove={e=>{if(!isMobile)return;if(mobileDragRef.current&&editMode){const name=mobileDragRef.current;moveMobileName(e,name);return}const start=mobileSwipeRef.current;if(start&&!editMode){const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dx)>10||Math.abs(dy)>10){clearMobileLongPress();if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.15){setMobileSwipeOffset(Math.max(-window.innerWidth*.95,Math.min(window.innerWidth*.95,dx)))}else if(Math.abs(dy)>10)mobileSwipeRef.current=null}}}} onPointerUp={e=>{const start=mobileSwipeDragRef.current;const offset=mobileSwipeOffset;mobileSwipeRef.current=null;mobileSwipeDragRef.current=null;if(start&&!editMode&&Math.abs(offset)>window.innerWidth*.25){setMobilePage(Math.max(0,Math.min(mobilePageCount-1,start.page+(offset<0?1:-1))))}setMobileSwipeOffset(0);if(mobileDragRef.current)dropMobileApp(e);else endMobileApp()}} onPointerCancel={()=>{mobileSwipeRef.current=null;if(!mobileDragRef.current)endMobileApp()}}>
    {isMobile && dragging ? <div className={'mobile-drag-proxy'+(mobileDropAnimating?' drop-snap':'')} style={{left:mobileDragPoint.x,top:mobileDragPoint.y}}>{dragging.startsWith('folder-') ? <div className="mobile-folder-icon mobile-drag-folder-icon">{(folders[dragging]||[]).slice(0,4).map(appName=>{const fa=apps.find(x=>x.name===appName);return fa?<div key={appName} className="folder-mini"><Icon app={fa}/></div>:null})}</div> : <Icon app={apps.find(x=>x.name===dragging)!}/>}<strong>{dragging==='DeviceTest'?'hello':dragging.startsWith('folder-')?(folderLabels[dragging]||'Folder'):dragging}</strong></div> : null}
    {isMobile && openFolder && folders[openFolder] ? <div className="mobile-folder-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)setOpenFolder(null)}}><section className="mobile-folder-window" onPointerDown={e=>{e.stopPropagation();if(e.pointerType!=='mouse'&&!editMode){clearMobileLongPress();mobileFolderWindowHoldRef.current=window.setTimeout(()=>{setEditMode(true);mobileFolderWindowHoldRef.current=null},550)}}} onPointerMove={e=>moveFolderAppDrag(e)} onPointerUp={e=>{e.stopPropagation();clearMobileLongPress();if(mobileDragRef.current)dropMobileApp(e)}}><div className="mobile-folder-head"><strong onPointerDown={e=>{if(e.pointerType!=='mouse'&&editMode){e.stopPropagation();clearMobileLongPress();mobileFolderWindowHoldRef.current=window.setTimeout(beginFolderRename,550)}}}>{renamingFolder===openFolder?<input className="folder-name-input" autoFocus value={folderNameDraft} onChange={e=>setFolderNameDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')finishFolderRename();if(e.key==='Escape'){setRenamingFolder(null)}}} onBlur={finishFolderRename}/>:folderLabels[openFolder]||'Folder'}</strong><button onClick={()=>setOpenFolder(null)}>×</button></div><div className="mobile-folder-grid">{folders[openFolder].map(name=>{const a=apps.find(x=>x.name===name);if(!a)return null;return <button key={name} className="mobile-folder-app" onPointerDown={e=>startFolderAppDrag(e,openFolder,name)} onPointerUp={endFolderAppDrag} onPointerCancel={endFolderAppDrag} onClick={()=>{if(!mobileMovedRef.current){setOpenFolder(null);open(a)}}}><Icon app={a}/><strong>{name==='DeviceTest'?'hello':name}</strong></button>})}</div></section></div> : null}
    {isMobile ? <><div className="mobile-pages" style={{transform:'translate3d(calc(-'+(mobilePage*100)+'vw + '+mobileSwipeOffset+'px),0,0)',transition:mobileSwipeDragRef.current?'none':'transform .42s cubic-bezier(.22,.8,.22,1)',willChange:'transform'}}>{Array.from({length:mobilePageCount},(_,page)=><div className="mobile-page" key={page}><div className="app-grid mobile-grid">{mobileSlots.slice(page*MOBILE_PER_PAGE,(page+1)*MOBILE_PER_PAGE).map((name,slotIndex)=>{if(!name)return <div ref={el=>{mobileTileRefs.current['empty-'+page+'-'+slotIndex]=el}} className="mobile-empty-slot" key={'empty-'+slotIndex}/>;if(name.startsWith('folder-')){const folderApps=folders[name]||[];return <button key={name} ref={el=>{mobileTileRefs.current[name]=el}} className={'app-tile mobile-folder-tile '+(dragging===name?'is-dragging':'')} style={dragging===name?{opacity:0,pointerEvents:'none'}:undefined} onPointerDown={e=>startMobileItem(e,name)} onPointerMove={e=>{if(dragging===name)moveMobileName(e,name)}} onPointerUp={e=>{if(dragging===name)dropMobileApp(e);else if(!editMode)setOpenFolder(name)}} onPointerCancel={endMobileApp} onClick={()=>{if(!editMode&&!mobileMovedRef.current)setOpenFolder(name)}}><div className="mobile-folder-icon">{folderApps.slice(0,4).map(appName=>{const fa=apps.find(x=>x.name===appName);return fa?<div key={appName} className="folder-mini"><Icon app={fa}/></div>:null})}</div><strong>{folderLabels[name]||'Folder'}</strong></button>}const a=apps.find(x=>x.name===name)!;const label=a.name==='DeviceTest'?'hello':a.name;return <button key={a.name} ref={el=>{mobileTileRefs.current[a.name]=el}} className={'app-tile '+(a.name==='DeviceTest'?'device-test-app ':'')+(dragging===a.name?'is-dragging':'')} style={dragging===a.name?{opacity:0,pointerEvents:'none'}:undefined} onPointerDown={e=>startMobileApp(e,a)} onPointerMove={e=>moveMobileApp(e,a)} onPointerUp={dropMobileApp} onPointerCancel={endMobileApp} onContextMenu={e=>e.preventDefault()} onClick={()=>{if(!editMode&&!mobileMovedRef.current)open(a)}}>{editMode&&<span className="delete-x" onPointerDown={e=>{e.stopPropagation();e.preventDefault();if(e.currentTarget.parentElement)e.currentTarget.parentElement.releasePointerCapture?.(e.pointerId)}} onClick={e=>{e.stopPropagation();setDeleteTarget(a)}}>×</span>}<Icon app={a}/><strong>{label}</strong></button>})}</div></div>)}</div><div className="page-dots">{Array.from({length:mobilePageCount},(_,i)=><span key={i} className={i===mobilePage?'active':''}/>)}</div>{editMode&&<div className="page-actions"><button className="add-page-button" onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();addMobilePage()}}>＋ Add page</button>{mobilePage>0&&<button className="remove-page-button" onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();removeMobilePage()}}>− Remove page</button>}</div>}</>  : <div className="app-grid">{apps.map((a,i)=>{const label=a.name==='DeviceTest'?(isMobile?'hello':'wsp'):a.name;return <button key={a.name} className={'app-tile '+(a.name==='DeviceTest'?'device-test-app':'')} style={{animationDelay:i*90+'ms',left:positions[a.name]?.x+'%',top:positions[a.name]?.y+'%'}} onPointerDown={e=>{setDragging(a.name);startEdit(e,a)}} onPointerMove={e=>dragApp(e,a)} onPointerUp={endDrag} onPointerCancel={endDrag} onClick={()=>open(a)}><Icon app={a}/><strong>{label}</strong></button>})}</div>}
   </div>
  </section>

  {deleteTarget && <div className="delete-confirm-backdrop" onClick={()=>setDeleteTarget(null)}><section className="delete-confirm" onClick={e=>e.stopPropagation()}><div className="delete-confirm-icon"><Icon app={deleteTarget}/></div><h3>Delete “{deleteTarget.name==='DeviceTest'?'hello':deleteTarget.name}”?</h3><p>Deleting this app will remove it from your DaApps home screen.</p><div className="delete-actions"><button onClick={()=>setDeleteTarget(null)}>Cancel</button><button className="delete-danger" onClick={()=>deleteMobileApp(deleteTarget.name)}>Delete App</button></div></section></div>}

  {topHint && <button className="pc-swipe-hint" onClick={()=>{setControlCenter(true);setTopHint(false)}} aria-label="Open Control Center">⌃</button>}

  {controlCenter && <div className="control-center-backdrop" onClick={()=>setControlCenter(false)}>
   <section className="control-center" onClick={e=>e.stopPropagation()}>
    <div className="cc-head"><div><strong>{new Date().toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}</strong><span>{new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</span></div><button onClick={()=>setControlCenter(false)}>×</button></div>
    <label className="cc-slider">🔊<input type="range" min="0" max="100" value={volume} onChange={e=>{setVolume(+e.target.value);if(audio.current)audio.current.volume=+e.target.value/100}}/></label>
    <div className="cc-bottom"><div><b>DaApps</b><span>Control Center</span></div><div><b>{volume}%</b><span>Volume</span></div></div>
   </section>
  </div>}

  {panel!=='none' && <div className="modal-backdrop" onClick={()=>setPanel('none')}>
   <section className="app-window" onClick={e=>e.stopPropagation()}>
    <div className="window-head"><div className="window-title"><div className="mini-icon">{panel==='music'?'♪':'⚙'}</div><div><b>{panel==='music'?'DaMusic':'Settings'}</b><span>{panel==='music'?'DaMusic player':'DaApps preferences'}</span></div></div><button className="close" onClick={()=>setPanel('none')}>×</button></div>
    {panel==='settings'
     ? <div className="settings-body"><div className="setting-section"><p className="section-label">WALLPAPER</p><h3>Choose your DaApps background</h3><p className="muted">Saved on this device automatically.</p><div className="wallpapers">{(['aurora','midnight','sunset','ocean'] as const).map(w=><button key={w} className={'wallpaper '+w+(wallpaper===w?' selected':'')} onClick={()=>{setWallpaper(w);setCustomWallpaper('')}}><span>{w[0].toUpperCase()}</span><b>{w}</b></button>)}<label className={'wallpaper custom'+(wallpaper==='custom'?' selected':'')}><input type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(file)handleWallpaperUpload(file)}}/><span>＋</span><b>My image</b></label></div>{customWallpaper&&<button className="remove-wallpaper" onClick={()=>{setCustomWallpaper('');setWallpaper('aurora')}}>Remove custom wallpaper</button>}</div><div className="setting-section"><p className="section-label">DAOS</p><div className="setting-row"><span>Interface</span><b>iPhone + Windows</b></div><div className="setting-row"><span>Installed apps</span><b>{apps.length}</b></div></div></div>
     : <div className="music-body"><div className="music-hero"><div className="music-logo">♪</div><div><p className="section-label">NOW PLAYING</p><h2>{tracks[track][0]}</h2><p>{tracks[track][1]}</p></div></div><audio ref={audio} onEnded={()=>setTrack((track+1)%tracks.length)}/><div className="player-controls"><button onClick={()=>setTrack((track-1+tracks.length)%tracks.length)}>⏮</button><button className="play" onClick={()=>setPlaying(!playing)}>{playing?'Ⅱ':'▶'}</button><button onClick={()=>setTrack((track+1)%tracks.length)}>⏭</button></div><div className="track-list">{tracks.map((t,i)=><button key={t[0]} className={i===track?'active-track':''} onClick={()=>{setTrack(i);setPlaying(true)}}><span>{String(i+1).padStart(2,'0')}</span><div><b>{t[0]}</b><small>{t[1]}</small></div><em>{i===track&&playing?'Playing':'Play'}</em></button>)}</div><p className="music-note">These are demo/royalty-friendly radio tracks. Licensed or user-uploaded music can be added later.</p></div>}
   </section>
  </div>}
 </main>
}
