import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './lib/store';
import { BottomNav, Toasts } from './components/Shell';
import Home from './pages/Home';
import QuranList, { QuranReader } from './pages/Quran';
import Prayer from './pages/Prayer';
import Tasbih from './pages/Tasbih';
import More from './pages/More';
import Qibla from './pages/Qibla';
import Duas from './pages/Duas';
import Hadith from './pages/Hadith';
import Calendar from './pages/Calendar';
import Bookmarks from './pages/Bookmarks';
import Athan from './pages/Athan';
import Zakat from './pages/Zakat';
import Places from './pages/Places';
import Kids from './pages/Kids';
import Hajj from './pages/Hajj';
import Quiz from './pages/Quiz';
import Tracker from './pages/Tracker';
import Assistant from './pages/Assistant';
import Community from './pages/Community';
import Invite from './pages/Invite';
import Contact from './pages/Contact';
import Settings from './pages/Settings';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import { Login, Register, Forgot, Reset, Verify } from './pages/Auth';

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <div className="app-shell">
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/quran" element={<QuranList />} />
              <Route path="/quran/:number" element={<QuranReader />} />
              <Route path="/prayer" element={<Prayer />} />
              <Route path="/tasbih" element={<Tasbih />} />
              <Route path="/more" element={<More />} />
              <Route path="/qibla" element={<Qibla />} />
              <Route path="/duas" element={<Duas />} />
              <Route path="/hadith" element={<Hadith />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/athan" element={<Athan />} />
              <Route path="/zakat" element={<Zakat />} />
              <Route path="/places" element={<Places />} />
              <Route path="/kids" element={<Kids />} />
              <Route path="/hajj" element={<Hajj />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/tracker" element={<Tracker />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/community" element={<Community />} />
              <Route path="/invite" element={<Invite />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot" element={<Forgot />} />
              <Route path="/reset" element={<Reset />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
        <Toasts />
      </StoreProvider>
    </BrowserRouter>
  );
}
