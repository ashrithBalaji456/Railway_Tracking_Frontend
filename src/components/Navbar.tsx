import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Train, LogOut, User as UserIcon, Heart, Globe, History } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  
  const token = localStorage.getItem('accessToken');
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('userId');
    localStorage.removeItem('roles');
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-indigo-400 font-semibold' : 'text-slate-300 hover:text-indigo-400 transition-colors';
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 transition-colors">
              <Train className="h-8 w-8" />
              <span className="font-bold text-xl tracking-wider text-slate-100">RailTrack <span className="text-indigo-400 font-medium">India</span></span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className={isActive('/')}>{t('navHome')}</Link>
            <Link to="/stations" className={isActive('/stations')}>{t('navStations')}</Link>
            <Link to="/map" className={isActive('/map')}>{t('navLiveMap')}</Link>
            <Link to="/journey" className={isActive('/journey')}>{t('navPlanner')}</Link>
            <Link to="/history" className={`${isActive('/history')} flex items-center space-x-1`}>
              <History className="h-4 w-4" />
              <span>{t('navHistory')}</span>
            </Link>

            {/* Language Selector */}
            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-400 focus-within:border-indigo-500 transition-colors">
              <Globe className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent border-0 text-slate-300 py-0.5 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="en">English 🇬🇧</option>
                <option value="hi">हिन्दी 🇮🇳</option>
                <option value="te">తెలుగు 🇮🇳</option>
                <option value="bn">বাংলা 🇮🇳</option>
              </select>
            </div>
            
            {token ? (
              <>
                <Link to="/favorites" className={`${isActive('/favorites')} flex items-center space-x-1`}>
                  <Heart className="h-4 w-4" />
                  <span>{t('navFavorites')}</span>
                </Link>
                <div className="flex items-center space-x-4 pl-4 border-l border-slate-800">
                  <div className="flex items-center space-x-1 text-slate-300 text-sm">
                    <UserIcon className="h-4 w-4 text-indigo-400" />
                    <span>{username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-slate-400 hover:text-red-400 text-sm font-medium transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('navLogout')}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4 pl-4 border-l border-slate-800">
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-indigo-400 text-sm font-medium transition-colors"
                >
                  {t('navLogin')}
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-md shadow-indigo-600/20"
                >
                  {t('navRegister')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-400 hover:text-white p-2 rounded-md transition-colors focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Links */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-855 border-slate-800 px-2 pt-2 pb-4 space-y-1 sm:px-3">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-indigo-400 hover:bg-slate-800 transition-all"
          >
            {t('navHome')}
          </Link>
          <Link
            to="/stations"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-indigo-400 hover:bg-slate-800 transition-all"
          >
            {t('navStations')}
          </Link>
          <Link
            to="/map"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-indigo-400 hover:bg-slate-800 transition-all"
          >
            {t('navLiveMap')}
          </Link>
          <Link
            to="/journey"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-indigo-400 hover:bg-slate-800 transition-all"
          >
            {t('navPlanner')}
          </Link>
          <Link
            to="/history"
            onClick={() => setIsOpen(false)}
            className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-indigo-400 hover:bg-slate-800 transition-all"
          >
            <History className="h-5 w-5 text-indigo-400" />
            <span>{t('navHistory')}</span>
          </Link>

          {/* Mobile Language Selector */}
          <div className="px-3 py-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-400 font-semibold flex items-center space-x-1.5">
              <Globe className="h-4 w-4 text-indigo-400" />
              <span>Language</span>
            </span>
            <select
              value={language}
              onChange={(e) => {
                setIsOpen(false);
                setLanguage(e.target.value as any);
              }}
              className="bg-slate-950 border border-slate-800 text-slate-300 py-1.5 px-2.5 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="en">English 🇬🇧</option>
              <option value="hi">हिन्दी 🇮🇳</option>
              <option value="te">తెలుగు 🇮🇳</option>
              <option value="bn">বাংলা 🇮🇳</option>
            </select>
          </div>

          {token ? (
            <>
              <Link
                to="/favorites"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-indigo-400 hover:bg-slate-800 transition-all"
              >
                <Heart className="h-5 w-5 text-indigo-400" />
                <span>{t('navFavorites')}</span>
              </Link>
              <div className="border-t border-slate-800 pt-4 mt-4 px-3 flex items-center justify-between">
                <span className="text-slate-400 text-sm font-medium flex items-center space-x-2">
                  <UserIcon className="h-5 w-5 text-indigo-400" />
                  <span>{username}</span>
                </span>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="text-red-400 hover:text-red-300 text-sm font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('navLogout')}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="border-t border-slate-800 pt-4 mt-4 px-3 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="text-center block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-indigo-400 hover:bg-slate-800 transition-all"
              >
                {t('navLogin')}
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="text-center block bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-md text-base font-medium transition-all shadow-md shadow-indigo-600/10"
              >
                {t('navRegister')}
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
