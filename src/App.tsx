import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { ScrollContext } from './hooks/useScrollContext'
import { useLenisScroll, useReducedMotion } from './hooks/useLenisScroll'
import { useRoute } from './hooks/useRoute'
import { Experience } from './scene/Experience'
import { Chapters } from './overlays/Chapters'
import { BrandNav } from './overlays/BrandNav'
import { VisionPage } from './overlays/VisionPage'
import { WhyNowPage } from './overlays/WhyNowPage'
import { ForceStudioPage } from './overlays/ForceStudioPage'
import { LavaLamp } from './overlays/LavaLamp'
import './index.css'

function CanvasScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 44, near: 0.1, far: 120, position: [0.2, 3.8, 3.2] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <Experience />
      </Suspense>
    </Canvas>
  )
}

export default function App() {
  const reducedMotion = useReducedMotion()
  const { path, navigate } = useRoute()
  const onHome = path === '/'
  const { progress, scrollToProgress } = useLenisScroll(reducedMotion, onHome)
  const scrollValue = useMemo(
    () => ({
      progress: onHome ? progress : 0,
      reducedMotion,
      scrollToProgress,
      path,
      navigate,
    }),
    [progress, reducedMotion, scrollToProgress, path, navigate, onHome],
  )

  return (
    <ScrollContext.Provider value={scrollValue}>
      <div className={`app${onHome ? '' : ' app--page'}`}>
        <div className={`lava-shell${onHome ? '' : ' lava-shell--dim'}`} aria-hidden="true">
          <LavaLamp reducedMotion={reducedMotion} />
        </div>
        <div className={`canvas-shell${onHome ? '' : ' canvas-shell--dim'}`} aria-hidden={!onHome}>
          <CanvasScene />
        </div>
        <BrandNav />
        {path === '/' && (
          <>
            <Chapters />
            <div className="scroll-track" aria-hidden="true" />
          </>
        )}
        {path === '/vision' && <VisionPage onHome={() => navigate('/')} />}
        {path === '/why-now' && <WhyNowPage onHome={() => navigate('/')} variant="why-now" />}
        {path === '/about' && <WhyNowPage onHome={() => navigate('/')} variant="about" />}
        {path === '/force-studio' && <ForceStudioPage onHome={() => navigate('/')} />}
      </div>
    </ScrollContext.Provider>
  )
}
