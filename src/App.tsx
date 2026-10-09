import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Scale, Landmark, Music2, Settings as SettingsIcon, Smartphone, Plus,
  X, ChevronLeft, ChevronRight, Play, Pause, SkipBack, SkipForward,
  Volume2, Image as ImageIcon, Trash2, Pencil, Folder, Grip, Search,
} from 'lucide-react'

type AppInfo = {
  id: string
  name: string
  subtitle: string
  color: string
  kind: 'link' | 'panel'
  url?: string
  icon: 'economy' | 'court' | 'music' | 'settings' | 'device'
}

const defaultApps: AppInfo[] = [
  { id: 'economy', name: 'DaEconomy', subtitle: 'Group economy', color: 'gold', kind: 'link', url: 'https://xt0tiedcmrq9i5amck0jexb0.macaly.app/', icon: 'economy' },
  { id: 'court', name: 'DaCourt', subtitle: 'Courtroom', color: 'blue', kind: 'link', url: 'https://jquv9w2u2tbwtpi6qdd4ze7n.macaly.app/', icon: 'court' },
  { id: 'music', name: 'DaMusic', subtitle: 'Music player', color: 'pink', kind: 'panel', icon: 'music' },
  { id: 'settings', name: 'Settings', subtitle: 'Personalize IDon', color: 'slate', kind: 'panel', icon: 'settings' },
  { id: 'device', name: 'DeviceTest', subtitle: 'Quick test', color: 'mint', kind: 'panel', icon: 'device' },
]
const songs = [
  { title: 'DaBoys Radio 01', artist: 'DaMusic Radio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { title: 'DaBoys Radio 02', artist: 'DaMusic Radio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { title: 'DaBoys Radio 03', artist: 'DaMusic Radio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { title: 'DaBoys Radio 04', artist: 'DaMusic Radio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
]
type FolderData = { id: string; name: string; appIds: string[] }

function AppGlyph({ app, small = false }: { app: AppInfo; small?: boolean }) {
  const size = small ? 18 : 29
  const icon = app.icon === 'economy' ? <Landmark size={size} strokeWidth={2.3} /> :
    app.icon === 'court' ? <Scale size={size} strokeWidth={2.3} /> :
    app.icon === 'music' ? <Music2 size={size} strokeWidth={2.3} /> :
    app.icon === 'settings' ? <SettingsIcon size={size} strokeWidth={2.3} /> :
    <Smartphone size={size} strokeWidth={2.3} />
  return <span className={'app-glyph glyph-' + app.color}>{icon}</span>
}

export default function App() {
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem('idon-wallpaper') || 'aurora')
  const [customWallpaper, setCustomWallpaper] = useState(() => localStorage.getItem('idon-custom-wallpaper') || '')
  const [activePanel, setActivePanel] = useState<'settings' | 'music' | 'device' | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [apps, setApps] = useState<AppInfo[]>(() => {
    try {
      const saved = localStorage.getItem('idon-app-order')
      if (!saved) return defaultApps
      const ids = JSON.parse(saved) as string[]
      return [...ids.map(id => defaultApps.find(a => a.id === id)).filter((a): a is AppInfo => Boolean(a)),
        ...defaultApps.filter(a => !ids.includes(a.id))]
    } catch { return defaultApps }
  })
  const [folders, setFolders] = useState<FolderData[]>(() => {
    try { return JSON.parse(localStorage.getItem('idon-folders') || '[]') } catch { return [] }
  })
  const [panelPage, setPanelPage] = useState(0)
  const [folderName, setFolderName] = useState('')
  const [folderDraft, setFolderDraft] = useState('')
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null)
  const [volume, setVolume] = useState(60)
  const [track, setTrack] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [controlCenter, setControlCenter] = useState(false)
  const [search, setSearch] = useState('')
  const [dragged, setDragged] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [now, setNow] = useState(new Date())
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => { localStorage.setItem('idon-wallpaper', wallpaper) }, [wallpaper])
  useEffect(() => { localStorage.setItem('idon-custom-wallpaper', customWallpaper) }, [customWallpaper])
  useEffect(() => { localStorage.setItem('idon-app-order', JSON.stringify(apps.map(a => a.id))) }, [apps])
  useEffect(() => { localStorage.setItem('idon-folders', JSON.stringify(folders)) }, [folders])
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    const player = audioRef.current
    if (!player) return
    player.volume = volume / 100
    if (playing && activePanel === 'music') void player.play().catch(() => setPlaying(false))
    else player.pause()
  }, [activePanel, playing, track, volume])

  const currentSong = songs[track]
  const visibleApps = useMemo(() => apps.filter(a => (a.name + ' ' + a.subtitle).toLowerCase().includes(search.toLowerCase())), [apps, search])
  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }
  const openApp = (app: AppInfo) => {
    if (editMode) return
    if (app.kind === 'link' && app.url) { window.open(app.url, '_blank', 'noopener,noreferrer'); return }
    setActivePanel(app.id === 'music' ? 'music' : app.id === 'device' ? 'device' : 'settings')
  }
  const uploadWallpaper = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => { setCustomWallpaper(String(reader.result || '')); setWallpaper('custom') }
    reader.readAsDataURL(file)
  }
  const moveApp = (fromId: string, toId: string) => {
    if (fromId === toId) return
    setApps(current => {
      const next = [...current]
      const from = next.findIndex(a => a.id === fromId)
      const to = next.findIndex(a => a.id === toId)
      if (from < 0 || to < 0) return current
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }
  const createFolder = () => {
    const name = folderName.trim() || 'New Folder'
    if (apps.length < 2) { notify('Add at least two apps first'); return }
    const id = 'folder-' + Date.now()
    setFolders(prev => [...prev, { id, name, appIds: [apps[0].id, apps[1].id] }])
    setFolderName('')
    setPanelPage(1)
    notify('Folder created')
  }
  const removeApp = (id: string) => {
    setApps(prev => prev.filter(a => a.id !== id))
    setFolders(prev => prev.map(f => ({ ...f, appIds: f.appIds.filter(appId => appId !== id) })).filter(f => f.appIds.length > 0))
    notify('App removed from this home screen')
  }
  const wallpaperStyle = wallpaper === 'custom' && customWallpaper
    ? { backgroundImage: 'linear-gradient(#07111a55,#07111a66),url(' + customWallpaper + ')', backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined

  return <main className={'idon-shell wallpaper-' + wallpaper} style={wallpaperStyle}>
    <div className="ambient ambient-a" /><div className="ambient ambient-b" />
    <header className="topbar">
      <a className="wordmark" href="#" onClick={e => e.preventDefault()}><span className="brand-mark">i</span><span>IDon</span></a>
      <div className="topbar-center"><span className="status-dot" /> DaBoys workspace</div>
      <div className="topbar-right"><span className="clock">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><button className="icon-button" aria-label="Control Center" onClick={() => setControlCenter(true)}><Grip size={19} /></button></div>
    </header>

    <section className="welcome-row">
      <div><p className="eyebrow">YOUR DIGITAL SPACE</p><h1>Good to see you.</h1><p className="subheading">Your apps, your setup, your rules.</p></div>
      <div className="welcome-actions"><button className={'soft-button ' + (editMode ? 'selected' : '')} onClick={() => setEditMode(!editMode)}><Pencil size={15} />{editMode ? 'Done editing' : 'Edit home'}</button><button className="primary-button" onClick={() => { setPanelPage(1); document.getElementById('organize')?.scrollIntoView({ behavior: 'smooth' }) }}><Plus size={16} /> Organize</button></div>
    </section>

    <section className="workspace-grid">
      <div className="desktop-card home-card">
        <div className="card-heading"><div><p className="eyebrow">HOME SCREEN</p><h2>My apps <span className="count-pill">{visibleApps.length}</span></h2></div><label className="search-box"><Search size={15} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find an app" /></label></div>
        {editMode && <div className="edit-banner"><Grip size={16} /> Edit mode is on. Drag an app onto another to reorder it, or use the remove button.</div>}
        <div className="apps-grid">
          {visibleApps.map(app => <div className={'app-tile ' + (dragged === app.id ? 'dragging' : '')} key={app.id} draggable={editMode} onDragStart={() => setDragged(app.id)} onDragOver={e => { if (editMode) e.preventDefault() }} onDrop={e => { e.preventDefault(); if (dragged) moveApp(dragged, app.id); setDragged(null) }} onDragEnd={() => setDragged(null)}>
            {editMode && <button className="remove-app" title={'Remove ' + app.name} onClick={() => removeApp(app.id)}><X size={13} /></button>}
            <button className="app-launcher" onClick={() => openApp(app)}><AppGlyph app={app} /><span className="app-name">{app.name}</span><span className="app-subtitle">{app.subtitle}</span></button>
          </div>)}
          {!visibleApps.length && <p className="empty-state">No apps match “{search}”.</p>}
          {folders.map(folder => <button className="folder-tile" key={folder.id} onClick={() => { setFolderDraft(folder.name); setRenamingFolder(folder.id); setPanelPage(1) }}><span className="folder-art"><Folder size={25} /></span><span className="app-name">{folder.name}</span><span className="app-subtitle">{folder.appIds.length} apps</span></button>)}
        </div>
        <div className="card-footer"><span><span className="live-dot" /> Saved on this device</span><span>Drag to reorder when editing</span></div>
      </div>

      <aside className="side-column">
        <div className="desktop-card glance-card"><p className="eyebrow">AT A GLANCE</p><div className="big-clock">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div><p className="date-line">{now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p><div className="glance-divider" /><div className="glance-stat"><span>Installed apps</span><strong>{apps.length}</strong></div><div className="glance-stat"><span>Folders</span><strong>{folders.length}</strong></div></div>
        <div className="desktop-card quick-card"><p className="eyebrow">QUICK ACCESS</p><button onClick={() => setActivePanel('music')}><span className="quick-icon pink"><Music2 size={17} /></span><span><b>DaMusic</b><small>Listen to radio tracks</small></span><ChevronRight size={16} /></button><button onClick={() => setActivePanel('settings')}><span className="quick-icon slate"><SettingsIcon size={17} /></span><span><b>Personalize</b><small>Change your wallpaper</small></span><ChevronRight size={16} /></button><button onClick={() => setControlCenter(true)}><span className="quick-icon blue"><Volume2 size={17} /></span><span><b>Control Center</b><small>Adjust sound and status</small></span><ChevronRight size={16} /></button></div>
      </aside>
    </section>

    <section className="desktop-card organizer" id="organize">
      <div className="card-heading"><div><p className="eyebrow">MAKE IT YOURS</p><h2>Organize your space</h2></div><span className="organizer-number">01 / 03</span></div>
      <div className="organizer-grid">
        <div className="organizer-item"><span className="organizer-icon purple"><Folder size={20} /></span><div><h3>App folders</h3><p>Group apps together on your home screen.</p><div className="inline-form"><input value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="Folder name" maxLength={24} /><button onClick={createFolder}><Plus size={15} /> Create</button></div></div></div>
        <div className="organizer-item"><span className="organizer-icon blue"><Grip size={20} /></span><div><h3>Rearrange apps</h3><p>Turn on edit mode, then drag an app onto another position.</p><button className="text-button" onClick={() => setEditMode(!editMode)}>{editMode ? 'Finish editing' : 'Enable edit mode'} <ChevronRight size={14} /></button></div></div>
        <div className="organizer-item"><span className="organizer-icon orange"><ImageIcon size={20} /></span><div><h3>Personal wallpaper</h3><p>Choose a built-in look or use an image you own.</p><button className="text-button" onClick={() => setActivePanel('settings')}>Open settings <ChevronRight size={14} /></button></div></div>
      </div>
    </section>

    <footer className="footer"><span><span className="brand-mark small">i</span> IDon <span className="footer-muted">· DaBoys apps hub</span></span><span>Independent project · v1.0</span></footer>

    {activePanel && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) setActivePanel(null) }}><section className="modal">
      <div className="modal-head"><div className="modal-title">{activePanel === 'settings' ? <SettingsIcon size={19} /> : activePanel === 'music' ? <Music2 size={19} /> : <Smartphone size={19} />}<div><h2>{activePanel === 'settings' ? 'Settings' : activePanel === 'music' ? 'DaMusic' : 'Device Test'}</h2><p>{activePanel === 'settings' ? 'Personalize your IDon space' : activePanel === 'music' ? 'A small radio player for your workspace' : 'Your interface is ready'}</p></div></div><button className="icon-button" onClick={() => setActivePanel(null)} aria-label="Close"><X size={19} /></button></div>
      {activePanel === 'settings' && <div className="modal-body"><h3>Wallpaper</h3><p className="modal-copy">Choose a background. Your choice is saved in this browser.</p><div className="wallpaper-options">{['aurora','midnight','sunset','ocean'].map(w => <button key={w} className={'wallpaper-choice choice-' + w + (wallpaper === w ? ' active' : '')} onClick={() => { setWallpaper(w); setCustomWallpaper('') }}><span />{w[0].toUpperCase() + w.slice(1)}</button>)}<label className={'wallpaper-choice upload-choice ' + (wallpaper === 'custom' ? 'active' : '')}><input type="file" accept="image/*" onChange={e => uploadWallpaper(e.target.files?.[0])} /><span><ImageIcon size={18} /></span>My image</label></div>{customWallpaper && <button className="danger-text" onClick={() => { setCustomWallpaper(''); setWallpaper('aurora') }}><Trash2 size={14} /> Remove custom image</button>}<div className="settings-note"><Smartphone size={18} /><div><b>Local preferences</b><p>Wallpaper, app order and folders are stored in this browser on this device.</p></div></div></div>}
      {activePanel === 'music' && <div className="modal-body music-player"><div className="album-art"><Music2 size={44} /></div><p className="eyebrow">NOW PLAYING</p><h3>{currentSong.title}</h3><p className="modal-copy">{currentSong.artist}</p><audio key={currentSong.url} ref={audioRef} src={currentSong.url} onEnded={() => setTrack(v => (v + 1) % songs.length)} /><div className="player-buttons"><button aria-label="Previous track" onClick={() => setTrack(v => (v - 1 + songs.length) % songs.length)}><SkipBack size={19} /></button><button className="play-button" aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying(v => !v)}>{playing ? <Pause size={21} /> : <Play size={21} />}</button><button aria-label="Next track" onClick={() => setTrack(v => (v + 1) % songs.length)}><SkipForward size={19} /></button></div><label className="volume-control"><Volume2 size={17} /><input type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))} /><span>{volume}%</span></label><div className="song-list">{songs.map((song, i) => <button key={song.url} className={i === track ? 'current' : ''} onClick={() => { setTrack(i); setPlaying(true) }}><span className="song-index">{String(i + 1).padStart(2, '0')}</span><span><b>{song.title}</b><small>{song.artist}</small></span><Play size={14} /></button>)}</div><p className="fine-print">Demo audio streams are used here. Add your own licensed tracks when ready.</p></div>}
      {activePanel === 'device' && <div className="modal-body"><div className="device-check"><span><Smartphone size={26} /></span><h3>Device interface</h3><p>This independent IDon build is running in your browser.</p><div className="check-row"><span>Screen size</span><b>{window.innerWidth} × {window.innerHeight}</b></div><div className="check-row"><span>Browser storage</span><b>Available</b></div><button className="primary-button wide" onClick={() => notify('Everything looks good')}>Run quick check</button></div></div>}
    </section></div>}

    {controlCenter && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) setControlCenter(false) }}><section className="control-modal"><div className="modal-head"><div className="modal-title"><Grip size={19} /><div><h2>Control Center</h2><p>{now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p></div></div><button className="icon-button" onClick={() => setControlCenter(false)} aria-label="Close"><X size={19} /></button></div><div className="volume-card"><div className="volume-title"><Volume2 size={20} /><b>Sound</b><strong>{volume}%</strong></div><input type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))} /></div><div className="control-info"><span className="status-dot" /> IDon is running <span className="control-time">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div></section></div>}
    {renamingFolder && <div className="overlay"><section className="small-modal"><div className="modal-head"><div className="modal-title"><Folder size={19} /><div><h2>Rename folder</h2><p>Choose a label for this folder.</p></div></div><button className="icon-button" onClick={() => setRenamingFolder(null)}><X size={19} /></button></div><div className="modal-body"><input className="full-input" value={folderDraft} onChange={e => setFolderDraft(e.target.value)} maxLength={24} autoFocus /><div className="modal-actions"><button className="soft-button" onClick={() => setRenamingFolder(null)}>Cancel</button><button className="primary-button" onClick={() => { setFolders(prev => prev.map(f => f.id === renamingFolder ? { ...f, name: folderDraft.trim() || f.name } : f)); setRenamingFolder(null) }}>Save name</button></div></div></section></div>}
    {toast && <div className="toast">{toast}</div>}
  </main>
}