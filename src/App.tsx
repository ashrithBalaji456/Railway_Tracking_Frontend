import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StationExplorer from './pages/StationExplorer';
import TrainDetails from './pages/TrainDetails';
import MapTracker from './pages/MapTracker';
import ProtectedRoute from './components/ProtectedRoute';
import Favorites from './pages/Favorites';
import RailAiWidget from './components/RailAiWidget';
import JourneyPlanner from './pages/JourneyPlanner';
import SearchHistoryPage from './pages/SearchHistoryPage';
import DisruptionsPage from './pages/DisruptionsPage';
import Blogs from './pages/Blogs';
import BlogDetail from './pages/BlogDetail';
import PnrStatus from './pages/PnrStatus';
import { LanguageProvider } from './context/LanguageContext';
import AndroidBackButtonHandler from './components/AndroidBackButtonHandler';

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <AndroidBackButtonHandler />
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-650 selection:text-white">
          <Navbar />
          
          <main className="flex-grow max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/stations" element={<StationExplorer />} />
              <Route path="/trains/:trainNumber" element={<TrainDetails />} />
              <Route path="/map" element={<MapTracker />} />
              <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
              <Route path="/journey" element={<JourneyPlanner />} />
              <Route path="/pnr" element={<PnrStatus />} />
              <Route path="/disruptions" element={<DisruptionsPage />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blogs/:slug" element={<BlogDetail />} />
              <Route path="/history" element={<SearchHistoryPage />} />
            </Routes>
          </main>

          <Footer />
          <RailAiWidget />
        </div>
      </Router>
    </LanguageProvider>
  );
}
