const ProcessingScreen = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Rings */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-t-cyan-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          Prozess wird analysiert...
        </h2>
        <p className="text-slate-400 mb-8">
          Unsere KI untersucht Ihre Dateien
        </p>

        {/* Progress Bar */}
        <div className="w-80 mx-auto">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-progress"></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ProcessingScreen;
