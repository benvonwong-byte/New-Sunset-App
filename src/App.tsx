import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { MapPin, MessageCircle, Database } from 'lucide-react'
import { AppBar, AppBarTitle } from '@/components/ui/app-bar'
import { BottomNav, BottomNavItem } from '@/components/ui/bottom-nav'
import { useStore } from '@/store'
import Browse from '@/pages/Browse'
import SpaceDetail from '@/pages/SpaceDetail'
import Asks from '@/pages/Asks'
import Import from '@/pages/Import'

function navCls(active: boolean) {
  return `px-3 py-2 rounded-[var(--radius)] ${
    active ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
  }`
}

function Shell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const asks = useStore((s) => s.asks)
  const progress = useStore((s) => s.progress)
  const waiting = asks.filter((a) => a.status === 'sent').length
  const onAsks = pathname.startsWith('/asks')
  const onData = pathname.startsWith('/data')
  const onMap = !onAsks && !onData
  const dataLabel = progress ? 'Data…' : 'Data'

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <AppBar>
        <AppBarTitle>
          <Link to="/" className="font-display text-3xl leading-none tracking-tight">
            Sunset After Hours
          </Link>
        </AppBarTitle>
        <nav className="hidden md:flex items-center gap-1 ml-auto font-mono text-sm">
          <Link to="/" className={navCls(onMap)}>
            Map
          </Link>
          <Link to="/asks" className={navCls(onAsks)}>
            Asks{waiting ? ` (${waiting})` : ''}
          </Link>
          <Link to="/data" className={navCls(onData)}>
            {dataLabel}
          </Link>
        </nav>
      </AppBar>

      <main className="flex-1 pb-20 md:pb-0">
        <Routes>
          <Route path="/" element={<Browse />} />
          <Route path="/space/:id" element={<SpaceDetail />} />
          <Route path="/asks" element={<Asks />} />
          <Route path="/data" element={<Import />} />
        </Routes>
      </main>

      <div className="md:hidden">
        <BottomNav>
          <BottomNavItem icon={<MapPin />} label="Map" active={onMap} onClick={() => navigate('/')} />
          <BottomNavItem
            icon={<MessageCircle />}
            label={waiting ? `Asks (${waiting})` : 'Asks'}
            active={onAsks}
            onClick={() => navigate('/asks')}
          />
          <BottomNavItem icon={<Database />} label={dataLabel} active={onData} onClick={() => navigate('/data')} />
        </BottomNav>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  )
}