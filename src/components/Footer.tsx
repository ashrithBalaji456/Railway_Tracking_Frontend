
export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-slate-500 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <p>&copy; {new Date().getFullYear()} RailTrack India. All rights reserved.</p>
        <p className="text-xs text-slate-600 mt-1">
          Live railway information is provided through the configured external data provider.
        </p>
      </div>
    </footer>
  );
}
