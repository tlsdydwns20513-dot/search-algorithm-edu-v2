import { useState } from 'react'
import './App.css'
import Navigation from './components/Navigation'
import IntroSection from './components/IntroSection'
import SearchSpaceSection from './components/SearchSpaceSection'
import RiverCrossingSection from './components/RiverCrossingSection'
import DFSSection from './components/DFSSection'
import BFSSection from './components/BFSSection'
import InformedSearchIntro from './components/InformedSearchIntro'
import HillClimbingSection from './components/HillClimbingSection'
import BestFirstSection from './components/BestFirstSection'
import AStarSection from './components/AStarSection'
import MinimaxSection from './components/MinimaxSection'
import { AlgorithmType } from './types/index'

function App() {
  const [currentSection, setCurrentSection] = useState<AlgorithmType>('intro')
  const [completedSections, setCompletedSections] = useState<Set<AlgorithmType>>(new Set())

  const handleComplete = (section: AlgorithmType) => {
    setCompletedSections(prev => new Set([...prev, section]))
  }

  const renderSection = () => {
    switch (currentSection) {
      case 'intro':
        return <IntroSection onComplete={() => handleComplete('intro')} />
      case 'search-space':
        return <SearchSpaceSection onComplete={() => handleComplete('search-space')} />
      case 'river-crossing':
        return <RiverCrossingSection onComplete={() => handleComplete('river-crossing')} />
      case 'dfs':
        return <DFSSection onComplete={() => handleComplete('dfs')} />
      case 'bfs':
        return <BFSSection onComplete={() => handleComplete('bfs')} />
      case 'informed-intro':
        return <InformedSearchIntro onComplete={() => handleComplete('informed-intro')} />
      case 'hill-climbing':
        return <HillClimbingSection onComplete={() => handleComplete('hill-climbing')} />
      case 'best-first':
        return <BestFirstSection onComplete={() => handleComplete('best-first')} />
      case 'astar':
        return <AStarSection onComplete={() => handleComplete('astar')} />
      case 'minimax':
        return <MinimaxSection onComplete={() => handleComplete('minimax')} />
      default:
        return <IntroSection onComplete={() => handleComplete('intro')} />
    }
  }

  return (
    <div className="app">
      <Navigation
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        completedSections={completedSections}
      />
      <main className="main-content">
        {renderSection()}
      </main>
    </div>
  )
}

export default App
