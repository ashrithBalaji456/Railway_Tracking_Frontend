import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import StationExplorer from './pages/StationExplorer';
import TrainDetails from './pages/TrainDetails';
import MapTracker from './pages/MapTracker';
import ProtectedRoute from './components/ProtectedRoute';
import Favorites from './pages/Favorites';
import RailAiWidget from './components/RailAiWidget';
import JourneyPlanner from './pages/JourneyPlanner';
import TrainsBetweenStations from './pages/TrainsBetweenStations';
import SearchHistoryPage from './pages/SearchHistoryPage';
import DisruptionsPage from './pages/DisruptionsPage';
import Blogs from './pages/Blogs';
import BlogDetail from './pages/BlogDetail';
import PnrStatus from './pages/PnrStatus';
import { LanguageProvider } from './context/LanguageContext';
import AndroidBackButtonHandler from './components/AndroidBackButtonHandler';
import InAppNotificationToast from './components/InAppNotificationToast';
import ActiveAlarmBanner from './components/ActiveAlarmBanner';
import PermissionPromptBanner from './components/PermissionPromptBanner';
import WelcomeGuideModal from './components/WelcomeGuideModal';

export default function App() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    // If user has not marked the guide as read, pop it up automatically on launch
    const hasRead = localStorage.getItem('railtrack_welcome_guide_read') === 'true';
    if (!hasRead) {
      setIsGuideOpen(true);
    }

    // Allow any button (e.g. on Home page or Navbar) to open the guide document anytime
    const handleOpenGuide = () => {
      setIsGuideOpen(true);
    };

    window.addEventListener('app:open-welcome-guide', handleOpenGuide);
    return () => {
      window.removeEventListener('app:open-welcome-guide', handleOpenGuide);
    };
  }, []);

  return (
    <LanguageProvider>
      <Router>
        <AndroidBackButtonHandler />
        <ActiveAlarmBanner />
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-650 selection:text-white">
          <Navbar />
          
          <main className="flex-grow max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/stations" element={<StationExplorer />} />
              <Route path="/trains/:trainNumber" element={<TrainDetails />} />
              <Route path="/map" element={<MapTracker />} />
              <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
              <Route path="/reminders" element={<PnrStatus />} />
              <Route path="/journey" element={<JourneyPlanner />} />
              <Route path="/trains-between" element={<TrainsBetweenStations />} />
              <Route path="/pnr" element={<PnrStatus />} />
              <Route path="/disruptions" element={<DisruptionsPage />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blogs/:slug" element={<BlogDetail />} />
              <Route path="/history" element={<SearchHistoryPage />} />
            </Routes>
          </main>

          <Footer />
          <RailAiWidget />
          <InAppNotificationToast />
          <PermissionPromptBanner />
          <WelcomeGuideModal
            isOpen={isGuideOpen}
            onClose={() => setIsGuideOpen(false)}
            onMarkAsRead={() => setIsGuideOpen(false)}
          />
        </div>
      </Router>
    </LanguageProvider>
  );
}
