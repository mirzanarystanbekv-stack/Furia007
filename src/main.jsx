import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { ProfileProvider } from './context/ProfileContext.jsx'
import Layout from './components/Layout.jsx'
import Landing from './pages/Landing.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import Diagnostics from './pages/Diagnostics.jsx'
import Recommendations from './pages/Recommendations.jsx'
import Compare from './pages/Compare.jsx'
import RoadmapPage from './pages/RoadmapPage.jsx'
import NextAction from './pages/NextAction.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <ProfileProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/diagnostics" element={<Diagnostics />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/next" element={<NextAction />} />
            <Route path="*" element={<Landing />} />
          </Route>
        </Routes>
      </ProfileProvider>
    </HashRouter>
  </React.StrictMode>,
)
