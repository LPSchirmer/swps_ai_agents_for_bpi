const ProcessingScreen = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {/* Animated Rings */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-accent/20 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-t-accent border-r-accent/50 border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-display font-bold text-text-primary mb-3">
          🤖 KI-Agenten analysieren Ihren Prozess...
        </h2>
        <p className="text-text-secondary mb-4">
          Dies kann 1-3 Minuten dauern
        </p>
        
        {/* Processing Steps */}
        <div className="text-left max-w-md mx-auto mb-8 space-y-2">
          <div className="flex items-center text-sm text-text-primary">
            <div className="w-2 h-2 bg-semantic-success rounded-full mr-3 animate-pulse"></div>
            <span>Daten werden verarbeitet...</span>
          </div>
          <div className="flex items-center text-sm text-text-primary">
            <div className="w-2 h-2 bg-semantic-success rounded-full mr-3 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            <span>CrewAI Agenten starten Analyse...</span>
          </div>
          <div className="flex items-center text-sm text-text-primary">
            <div className="w-2 h-2 bg-semantic-success rounded-full mr-3 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
            <span>Optimierungsvorschläge werden generiert...</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-80 mx-auto">
          <div className="h-2 bg-background-elevated rounded-full overflow-hidden">
            <div className="h-full bg-accent animate-progress-infinite"></div>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Bitte warten Sie, bis die Analyse abgeschlossen ist...
          </p>
        </div>
      </div>

      <style>{`
        @keyframes progress-infinite {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .animate-progress-infinite {
          animation: progress-infinite 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ProcessingScreen;
