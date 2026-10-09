import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'

type AppId = 'economy' | 'court' | 'music' | 'settings' | 'device'
type AppInfo = { id: AppId; name: string; icon: string; tone: string; url?: string }
type Folder = { id: string; name: string; apps: AppId[] }
const apps: AppInfo[] = [
  { id: 'economy', name: 'DaEconomy', icon: '▤', tone: 'gold', url: 'https://xt0tiedcmrq9i5amck0jexb0.macaly.app/' },
  { id: 'court', name: 'DaCourt', icon: '⚖', tone: 'blue', url: 'https://jquv9w2u2tbwtpi6qdd4ze7n.macaly.app/' },
  { id: 'music', name: 'DaMusic', icon: '♫', tone: 'pink' },
  { id: 'settings', name: 'Settings', icon: '⚙', tone: 'grey' },
  { id: 'device', name: 'DeviceTest', icon: '◉', tone: 'green' },
]
const tracks = Array.from({ length: 8 }, (_, i) => ({ title: 'DaBoys Radio ' + String(i + 1).padStart(2, '0'), url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-' + (i + 1) + '.mp3' }))
const PAGE_SIZE = 24
const baseSlots = (): (string | null)[] => [...apps.map(a => a.id), ...Array(PAGE_SIZE - apps.length).fill(null)]
function read<T>(key: string, fallback: T): T { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback } catch { return fallback } }

export default function App() {
  const [slots, setSlots] = useState<(string | null)[]>(() => read('daapps-slots', baseSlots()))
  const [pages, setPages] = useState(() => Math.max(1, read('daapps-pages', 1)))
  const [page, setPage] = useState(0)
  const [folders, setFolders] = useState<Folder[]>(() => read('daapps-folders', []))
  const [edit, setEdit] = useState(false)
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem('daapps-wallpaper') || 'aurora')
  const [customWallpaper, setCustomWallpaper] = useState(() => localStorage.getItem('daapps-custom') || '')
  const [panel, setPanel] = useState<'settings' | 'music' | 'device' | null>(null)
  const [folderOpen, setFolderOpen] = useState<string | null>(null)
  const [rename, setRename] = useState<string | null>(null)
  const [folderName, setFolderName] = useState('')
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [control, setControl] = useState(false)
  const [track, setTrack] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(65)
  const [toast, setToast] = useState('')
  const [dragging, setDragging] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [currentApp, setCurrentApp] = useState<string | null>(null)
  const [recentApps, setRecentApps] = useState<string[]>([])
  const [appSwitcher, setAppSwitcher] = useState(false)
  const [closingRecent, setClosingRecent] = useState<string | null>(null)
  const [navVisible, setNavVisible] = useState(false)
  const [dockApps, setDockApps] = useState<string[]>(() => read('daapps-dock', ['economy','court','music','settings']))
  const [dockDeleting, setDockDeleting] = useState<string | null>(null)
  const navTimer = useRef<number | null>(null)
  const gestureStart = useRef<{x:number;y:number}|null>(null)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const audioRef = useRef<HTMLAudioElement>(null)
  const pressTimer = useRef<number | null>(null)
  const longPress = useRef(false)
  const startX = useRef<number | null>(null)
  const swipeDX = useRef(0)
  const dragSource = useRef<string | null>(null)
  const dragTarget = useRef<string | null>(null)
  const folderHoverTimer = useRef<number | null>(null)
  const hoverTarget = useRef<string | null>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const hoverStart = useRef({ x: 0, y: 0 })
  const hoverMoved = useRef(false)
  const pageFlipTimer = useRef<number | null>(null)
  const lastDragTarget = useRef<string | null>(null)

  useEffect(() => { localStorage.setItem('daapps-slots', JSON.stringify(slots)) }, [slots])
  useEffect(() => { localStorage.setItem('daapps-pages', JSON.stringify(pages)) }, [pages])
  useEffect(() => { localStorage.setItem('daapps-folders', JSON.stringify(folders)) }, [folders])
  useEffect(() => { localStorage.setItem('daapps-dock', JSON.stringify(dockApps)) }, [dockApps])
  useEffect(() => { localStorage.setItem('daapps-wallpaper', wallpaper) }, [wallpaper])
  useEffect(() => { localStorage.setItem('daapps-custom', customWallpaper) }, [customWallpaper])
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.volume = volume / 100
    if (playing && panel === 'music') void a.play().catch(() => setPlaying(false))
    else a.pause()
  }, [playing, panel, track, volume])
  useEffect(() => () => { if (pressTimer.current) clearTimeout(pressTimer.current); if (folderHoverTimer.current) clearTimeout(folderHoverTimer.current) }, [])

  const notify = (s: string) => { setToast(s); window.setTimeout(() => setToast(''), 2000) }
  const allSlots = [...slots]
  while (allSlots.length < pages * PAGE_SIZE) allSlots.push(null)
  const getApp = (id: string | null) => apps.find(a => a.id === id)
  const getFolder = (id: string | null) => folders.find(f => f.id === id)
  const launch = (id: string) => {
    const a = getApp(id)
    if (!a || edit) return
    setRecentApps(prev => [id, ...prev.filter(v => v !== id)].slice(0, 8))
    setAppSwitcher(false); setNavVisible(false)
    if (navTimer.current) clearTimeout(navTimer.current)
    if (a.url) { setCurrentApp(id); setPanel(null); return }
    setCurrentApp(null)
    setPanel(a.id as 'settings' | 'music' | 'device')
  }
  const showNav = () => { setNavVisible(true); if (navTimer.current) clearTimeout(navTimer.current); navTimer.current = window.setTimeout(() => setNavVisible(false), 2600) }
  const goHome = () => { setCurrentApp(null); setPanel(null); setAppSwitcher(false); setNavVisible(false); if (navTimer.current) clearTimeout(navTimer.current) }
  const closeRecent = (id: string) => { setClosingRecent(id); window.setTimeout(() => { setRecentApps(prev => prev.filter(v => v !== id)); setClosingRecent(null); if (currentApp === id) goHome() }, 220) }
  const clearPress = () => { if (pressTimer.current) clearTimeout(pressTimer.current); pressTimer.current = null }
  const startAppPress = (id: string, e: ReactPointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    longPress.current = false
    pointer.current = { x: e.clientX, y: e.clientY }
    pressTimer.current = window.setTimeout(() => {
      longPress.current = true
      setEdit(true)
      setDragPosition({ x: pointer.current.x, y: pointer.current.y })
      dragSource.current = id
      dragTarget.current = id
      setDragging(id)
    }, 480)
  }
  const startEmptyPress = (e: ReactPointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    longPress.current = false
    clearPress()
    pressTimer.current = window.setTimeout(() => {
      longPress.current = true
      startX.current = null
      setEdit(true)
    }, 480)
  }
  const makeFolder = (first: string, second: string) => {
    if (first === second || first.startsWith('folder-') || second.startsWith('folder-')) return
    const i = slots.indexOf(first), j = slots.indexOf(second)
    if (i < 0 || j < 0) return
    const id = 'folder-' + Date.now()
    const folderApps = [second, first].filter((x): x is AppId => apps.some(a => a.id === x))
    if (folderApps.length < 2) return
    setFolders(prev => [...prev, { id, name: 'Folder', apps: folderApps }])
    setSlots(prev => { const next = [...prev]; next[i] = null; next[j] = id; return next })
    notify('Folder created')
  }
  const deleteDockApp = (id: string) => { setDockDeleting(id); window.setTimeout(() => { setDockApps(prev => prev.filter(v => v !== id)); setSlots(prev => { if(prev.includes(id)) return prev; const next=[...prev], i=next.indexOf(null); if(i>=0) next[i]=id; else next.push(id); return next }); setDockDeleting(null) }, 230) }
  const startDockPress = (id: string, e: ReactPointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    longPress.current = false
    pointer.current = { x: e.clientX, y: e.clientY }
    pressTimer.current = window.setTimeout(() => {
      longPress.current = true; setEdit(true)
      dragSource.current = 'dock-' + id; dragTarget.current = 'dock-' + id
      setDragging('dock-' + id); setDragPosition(pointer.current)
    }, 480)
  }
  const pointerMove = (e: React.PointerEvent) => {
    if (dragSource.current) {
      if (dragSource.current.startsWith('dock-')) {
        e.preventDefault()
        pointer.current = {x:e.clientX,y:e.clientY}
        setDragPosition({x:e.clientX,y:e.clientY})
        const target = document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-dock]')?.dataset.dock || null
        const source = dragSource.current.slice(5)
        if (target && target !== source && hoverTarget.current !== target) {
          hoverTarget.current = target
          setDockApps(prev => { const next=[...prev],a=next.indexOf(source),b=next.indexOf(target); if(a>=0&&b>=0){const [item]=next.splice(a,1);next.splice(b,0,item)} return next })
        }
        return
      }
      e.preventDefault()
      pointer.current = { x: e.clientX, y: e.clientY }
      setDragPosition({ x: e.clientX, y: e.clientY })
      const targetEl = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-slot]')
      const target = targetEl?.dataset.slot || null
      dragTarget.current = target
      if (e.clientX < 28 && page > 0 && !pageFlipTimer.current) {
        setPage(p => Math.max(0, p - 1))
        pageFlipTimer.current = window.setTimeout(() => { pageFlipTimer.current = null }, 650)
      } else if (e.clientX > window.innerWidth - 28 && page < pages - 1 && !pageFlipTimer.current) {
        setPage(p => Math.min(pages - 1, p + 1))
        pageFlipTimer.current = window.setTimeout(() => { pageFlipTimer.current = null }, 650)
      }
      const overDock = document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-dock]')?.dataset.dock || null
      if (overDock && apps.some(a=>a.id===dragSource.current) && overDock !== dragSource.current) {
        setDockApps(prev => prev.includes(dragSource.current!) ? prev : [...prev, dragSource.current!])
        setSlots(prev => prev.map(v => v === dragSource.current ? null : v))
        dragTarget.current = null
        return
      }
      if (target && target !== dragSource.current && apps.some(a => a.id === target) && apps.some(a => a.id === dragSource.current)) {
        if (hoverTarget.current !== target) {
          if (folderHoverTimer.current) clearTimeout(folderHoverTimer.current)
          hoverTarget.current = target
          hoverStart.current = { x: e.clientX, y: e.clientY }
          hoverMoved.current = false
          folderHoverTimer.current = window.setTimeout(() => {
            if (dragSource.current && hoverTarget.current === target) {
              if (hoverMoved.current) {
                setSlots(prev => {
                  const next=[...prev], a=next.indexOf(dragSource.current!), b=next.indexOf(target)
                  if(a>=0&&b>=0&&a!==b){const [item]=next.splice(a,1);next.splice(b,0,item)}
                  return next
                })
                lastDragTarget.current = target
              } else {
                makeFolder(dragSource.current, target)
                dragSource.current = null; dragTarget.current = null; setDragging(null)
              }
            }
            folderHoverTimer.current = null
          }, 300)
        }
        if (Math.hypot(e.clientX - hoverStart.current.x, e.clientY - hoverStart.current.y) > 18) hoverMoved.current = true
      } else {
        if (folderHoverTimer.current) clearTimeout(folderHoverTimer.current)
        folderHoverTimer.current = null; hoverTarget.current = null; lastDragTarget.current = null
        if (target && target !== dragSource.current && target.startsWith('empty-')) {
          const from=dragSource.current
          setSlots(prev => {
            const next=[...prev], a=next.indexOf(from!), b=Number(target.slice(6))
            if(a>=0&&b>=0&&b<next.length&&a!==b){const [item]=next.splice(a,1);next.splice(b,0,item)}
            return next
          })
          lastDragTarget.current = target
          dragTarget.current = null
        }
      }
      return
    }
    if (startX.current !== null && !edit) {
      const dx = e.clientX - startX.current
      swipeDX.current = dx
      if (Math.abs(dx) > 10) clearPress()
    }
  }
  const pointerUp = () => {
    clearPress()
    if (dragSource.current) {
      const from = dragSource.current, to = dragTarget.current
      if (from.startsWith('dock-')) { dragSource.current=null; dragTarget.current=null; hoverTarget.current=null; setDragging(null); return }
      if (to && to !== from && !to.startsWith('empty-') && lastDragTarget.current !== to) {
        setSlots(prev => {
          const next = [...prev], a = next.indexOf(from), b = next.indexOf(to)
          if (a >= 0 && b >= 0) [next[a], next[b]] = [next[b], next[a]]
          return next
        })
      }
      dragSource.current = null; dragTarget.current = null; hoverTarget.current = null
      if (folderHoverTimer.current) clearTimeout(folderHoverTimer.current)
      if (pageFlipTimer.current) clearTimeout(pageFlipTimer.current)
      pageFlipTimer.current = null
      setDragging(null)
    } else if (startX.current !== null && Math.abs(swipeDX.current) > window.innerWidth * .2) {
      setPage(p => Math.max(0, Math.min(pages - 1, p + (swipeDX.current < 0 ? 1 : -1))))
    }
    startX.current = null; swipeDX.current = 0
  }
  const addPage = () => { setSlots(prev => [...prev, ...Array(PAGE_SIZE).fill(null)]); setPages(p => p + 1); setPage(p => p + 1) }
  const removePage = () => {
    if (page <= 0 || pages <= 1) return
    const start = page * PAGE_SIZE
    const lost = allSlots.slice(start, start + PAGE_SIZE).filter(Boolean) as string[]
    setSlots(prev => { const next = [...prev.slice(0, start), ...prev.slice(start + PAGE_SIZE)]; lost.forEach(id => { const i = next.indexOf(null); if (i >= 0) next[i] = id }); return next })
    setPages(p => p - 1); setPage(p => Math.max(0, p - 1))
  }
  const saveRename = () => { if (rename) setFolders(prev => prev.map(f => f.id === rename ? { ...f, name: folderName.trim() || f.name } : f)); setRename(null) }
  const deleteApp = (id: string) => { setDeletingId(id); window.setTimeout(() => { setSlots(prev => prev.map(v => v === id ? null : v)); setDockApps(prev => prev.filter(v => v !== id)); setFolders(prev => prev.map(f => ({ ...f, apps: f.apps.filter(a => a !== id) })).filter(f => f.apps.length)); setRemoveId(null); setEdit(false); setDeletingId(null) }, 230) }
  const uploadWallpaper = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => { setCustomWallpaper(String(reader.result || '')); setWallpaper('custom') }
    reader.readAsDataURL(file)
  }
  const shellStyle: CSSProperties = customWallpaper && wallpaper === 'custom' ? { backgroundImage: 'linear-gradient(#090d19a0,#090d19a0),url("' + customWallpaper + '")' } : {}

  return <main className={'da-shell wallpaper-' + wallpaper + (edit ? ' editing' : '')} style={shellStyle} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
    <button className="quick-arrow" aria-label="Control Center" onPointerDown={e => e.stopPropagation()} onClick={() => setControl(true)}>⌃</button>
    {currentApp && <section className="app-fullscreen" key={currentApp}>
      <iframe title={getApp(currentApp)?.name || 'App'} src={getApp(currentApp)?.url} />
      <div className="app-gesture-area" onPointerDown={e => { gestureStart.current={x:e.clientX,y:e.clientY} }} onPointerUp={e => { if(gestureStart.current && gestureStart.current.y-e.clientY>40){ if(gestureStart.current.y-e.clientY>120){setAppSwitcher(true);setNavVisible(false)}else showNav() } gestureStart.current=null }}>
        <button className="app-home-indicator" aria-label="Show navigation" onClick={showNav}><span /></button>
      </div>
      {navVisible && <div className="app-nav-controls"><button aria-label="Recent apps" onClick={() => {setAppSwitcher(true);setNavVisible(false)}}>☰</button><button aria-label="Home" onClick={goHome}>○</button></div>}
    </section>}
    {appSwitcher && <div className="app-switcher" onClick={e => {if(e.target===e.currentTarget)setAppSwitcher(false)}}><div className="switcher-cards">{recentApps.map(id=>{const a=getApp(id);return a?<div className={'recent-card' + (closingRecent===id?' closing':'')} key={id} onTouchStart={e=>{(e.currentTarget as HTMLElement).dataset.startY=String(e.touches[0].clientY)}} onTouchEnd={e=>{const y=Number((e.currentTarget as HTMLElement).dataset.startY||0);if(y-e.changedTouches[0].clientY>55)closeRecent(id)}}><button className="recent-close" onClick={()=>closeRecent(id)}>×</button><div className="recent-preview"><span className={'app-icon '+a.tone}>{a.icon}</span><b>{a.name}</b></div><button className="recent-open" onClick={()=>{setAppSwitcher(false);launch(id)}}>Open</button></div>:null})}</div><button className="switcher-home" onClick={goHome}>Home</button></div>}
    <section className={'home-viewport' + (currentApp ? ' home-hidden' : '')}" onPointerDown={e => { if (!edit) { startX.current = e.clientX; swipeDX.current = 0 } }} onContextMenu={e => e.preventDefault()}>
      <div className="page-track" style={{ transform: 'translateX(calc(-' + page * 100 + 'vw + ' + swipeDX.current + 'px))', transition: startX.current !== null && swipeDX.current !== 0 ? 'none' : 'transform .35s ease' }}>
        {Array.from({ length: pages }, (_, p) => <div className="home-page" key={p}><div className="app-grid">
          {allSlots.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE).map((id, i) => {
            const index = p * PAGE_SIZE + i
            const a = getApp(id), f = getFolder(id)
            if (!id) return <div key={'empty-' + index} className="empty-slot" data-slot={'empty-' + index} onPointerDown={startEmptyPress} onContextMenu={e => e.preventDefault()} onClick={() => { if (longPress.current) { longPress.current = false; return } if (edit) setEdit(false) }} />
            if (f) return <button key={id} className="app-tile" data-slot={id} onPointerDown={e => startAppPress(id, e)} onClick={() => { if (!edit && !longPress.current) setFolderOpen(id) }}><span className="folder-icon">{f.apps.slice(0,4).map(appId => { const fa = getApp(appId); return fa ? <i key={appId} className={'folder-mini ' + fa.tone}>{fa.icon}</i> : null })}</span><b>{f.name}</b></button>
            if (!a) return null
            if (dragging === id) return <div key={id} className="drag-placeholder" data-slot={'empty-' + index} />
            return <button key={id} className={'app-tile ' + (dragging === id ? 'dragging' : '') + (deletingId === id ? ' deleting' : '')} data-slot={id} onPointerDown={e => startAppPress(id, e)} onClick={() => { if (!edit && !longPress.current && !dragging) launch(id) }} onContextMenu={e => e.preventDefault()}>{edit && <span className="remove-app" onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setRemoveId(id) }}>−</span>}<span className={'app-icon ' + a.tone}>{a.icon}</span><b>{id === 'device' ? 'hello' : a.name}</b></button>
          })}
        </div></div>)}
      </div>
      {dragging && <button className="app-tile live-drag-tile" style={{left:dragPosition.x,top:dragPosition.y}} onPointerDown={e=>e.preventDefault()}>{getApp(dragging.startsWith('dock-')?dragging.slice(5):dragging) ? <><span className={'app-icon '+getApp(dragging.startsWith('dock-')?dragging.slice(5):dragging)!.tone}>{getApp(dragging.startsWith('dock-')?dragging.slice(5):dragging)!.icon}</span><b>{getApp(dragging.startsWith('dock-')?dragging.slice(5):dragging)!.name}</b></> : null}</button>}
      <div className="page-indicators">{Array.from({ length: pages }, (_, i) => <button key={i} className={i === page ? 'active' : ''} aria-label={'Page ' + (i + 1)} onClick={() => setPage(i)} />)}</div>
      {edit && <div className="edit-actions"><button onClick={addPage}>＋ Add page</button>{page > 0 && <button onClick={removePage}>− Remove page</button>}<span className="edit-hint">Tap an empty spot to finish</span></div>}
      {!edit && <p className="gesture-hint">Touch and hold an app to edit · Swipe between pages</p>}
    </section>
    <nav className={'dock' + (edit ? ' dock-editing' : '')}>{dockApps.map(id=>{const a=getApp(id);return a?<button key={id} data-dock={id} className={(dockDeleting===id?'deleting ':'')+(dragging==='dock-'+id?'dock-source-hidden':'')} onPointerDown={e=>startDockPress(id,e)} onClick={()=>{if(!edit&&!longPress.current)launch(id)}}><span className={'app-icon '+a.tone}>{a.icon}</span>{edit&&<span className="dock-remove" onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();deleteDockApp(id)}}>−</span>}</button>:null})}</nav>
    {folderOpen && <div className="veil" onPointerDown={e => { if (e.target === e.currentTarget) setFolderOpen(null) }}><section className="folder-window"><header><b>{getFolder(folderOpen)?.name || 'Folder'}</b><div><button onClick={() => { setFolderName(getFolder(folderOpen)?.name || 'Folder'); setRename(folderOpen); setFolderOpen(null) }}>Rename</button><button onClick={() => setFolderOpen(null)}>×</button></div></header><div className="folder-apps">{(getFolder(folderOpen)?.apps || []).map(id => { const a = getApp(id); return a ? <button key={id} onClick={() => { setFolderOpen(null); launch(id) }}><span className={'app-icon ' + a.tone}>{a.icon}</span><b>{a.name}</b></button> : null })}</div></section></div>}
    {panel && <div className="veil internal-veil" onPointerDown={e => { if (e.target === e.currentTarget) setPanel(null) }}><section className="panel-window"><header><div><b>{panel === 'music' ? 'DaMusic' : panel === 'settings' ? 'Settings' : 'DeviceTest'}</b><small>{panel === 'music' ? 'DaBoys Radio' : 'DaApps preferences'}</small></div><button onClick={() => setPanel(null)}>×</button></header>
      {panel === 'settings' && <div className="panel-content"><h3>Wallpaper</h3><p>Choose a look or use your own image. Your settings are saved on this device.</p><div className="wallpaper-list">{['aurora','midnight','sunset','ocean'].map(w => <button key={w} className={'wallpaper-swatch ' + w + (wallpaper === w ? ' selected' : '')} onClick={() => { setWallpaper(w); setCustomWallpaper('') }}>{w}</button>)}<label className="wallpaper-swatch upload">＋ My image<input type="file" accept="image/*" onChange={e => uploadWallpaper(e.target.files?.[0])} /></label></div>{customWallpaper && <button className="remove-wall" onClick={() => { setCustomWallpaper(''); setWallpaper('aurora') }}>Remove custom image</button>}<p className="setting-note">{apps.length} apps · layout, folders and wallpaper saved locally</p></div>}
      {panel === 'music' && <div className="panel-content music-content"><div className="record">♫</div><h2>{tracks[track].title}</h2><p>DaBoys Radio</p><audio ref={audioRef} src={tracks[track].url} onEnded={() => setTrack(t => (t + 1) % tracks.length)} /><div className="player-controls"><button onClick={() => setTrack(t => (t - 1 + tracks.length) % tracks.length)}>⏮</button><button className="play" onClick={() => setPlaying(v => !v)}>{playing ? 'Ⅱ' : '▶'}</button><button onClick={() => setTrack(t => (t + 1) % tracks.length)}>⏭</button></div><label className="volume">🔊 <input type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))} /> {volume}%</label><div className="track-list">{tracks.map((t,i) => <button key={t.url} className={track === i ? 'selected' : ''} onClick={() => { setTrack(i); setPlaying(true) }}><span>{String(i+1).padStart(2,'0')}</span><b>{t.title}</b><small>{track === i && playing ? 'Playing' : 'Play'}</small></button>)}</div></div>}
      {panel === 'device' && <div className="panel-content"><h3>Device Test</h3><p>Screen: {window.innerWidth} × {window.innerHeight}</p><p>Local storage: available</p><button className="done wide" onClick={() => notify('Device test passed')}>Run test</button></div>}
    </section><div className="internal-gesture-area"><button className="app-home-indicator" aria-label="Show navigation" onClick={showNav}><span /></button></div>{navVisible && <div className="app-nav-controls internal-nav"><button aria-label="Recent apps" onClick={() => {setAppSwitcher(true);setNavVisible(false)}}>☰</button><button aria-label="Home" onClick={goHome}>○</button></div>}</div>}
    {control && <div className="veil" onPointerDown={e => { if (e.target === e.currentTarget) setControl(false) }}><section className="control-window"><header><b>Control Center</b><button onClick={() => setControl(false)}>×</button></header><p>{new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p><label>🔊 Sound · {volume}%<input type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))} /></label><p className="setting-note">DaApps is running</p></section></div>}
    {rename && <div className="veil"><section className="confirm-window"><h3>Rename folder</h3><input value={folderName} onChange={e => setFolderName(e.target.value)} autoFocus maxLength={24} onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setRename(null) }} /><footer><button onClick={() => setRename(null)}>Cancel</button><button className="done" onClick={saveRename}>Save</button></footer></section></div>}
    {removeId && <div className="veil"><section className="confirm-window"><h3>Remove {getApp(removeId)?.name}?</h3><p>It will be removed from this home screen.</p><footer><button onClick={() => setRemoveId(null)}>Cancel</button><button className="remove-confirm" onClick={() => deleteApp(removeId)}>Remove</button></footer></section></div>}
    {toast && <div className="toast">{toast}</div>}
  </main>
}
