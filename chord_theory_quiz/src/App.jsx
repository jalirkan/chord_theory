import { useEffect } from "react";
import { Link, NavLink, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { TriadMark } from "./components/Icons.jsx";
import SoundToggle from "./components/SoundToggle.jsx";
import Custom from "./pages/Custom.jsx";
import DeckPage from "./pages/DeckPage.jsx";
import Home from "./pages/Home.jsx";
import Play from "./pages/Play.jsx";
import Progress from "./pages/Progress.jsx";
import { streak } from "./store/progress.js";
import { useProgress } from "./store/ProgressContext.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Layout() {
  const { progress } = useProgress();
  const days = streak(progress.days);
  return (
    <>
      <header className="app-header">
        <div className="wrap">
          <Link to="/" className="brand" aria-label="Chord Theory home">
            <TriadMark className="brand-mark" />
            <span className="brand-word">Chord Theory</span>
          </Link>
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end>
              Decks
            </NavLink>
            <NavLink to="/custom">Custom</NavLink>
            <NavLink to="/progress">Progress</NavLink>
          </nav>
          {days > 0 && (
            <span className="streak-chip num" title={`${days}-day streak`}>
              {days} <span className="streak-word">{days === 1 ? "day" : "days"}</span>
            </span>
          )}
          <SoundToggle />
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <span>Progress is saved in this browser.</span>
          <span>
            <kbd>1</kbd>–<kbd>4</kbd> answer · <kbd>Enter</kbd> next · <kbd>R</kbd> replay · <kbd>Esc</kbd> quit
          </span>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="deck/:deckId" element={<DeckPage />} />
          <Route path="custom" element={<Custom />} />
          <Route path="progress" element={<Progress />} />
          <Route path="*" element={<Home />} />
        </Route>
        <Route path="play/:modeId/:setId" element={<Play />} />
      </Routes>
    </>
  );
}
