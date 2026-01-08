import { useEffect, useRef, useState } from 'react';
import BpmnJS from 'bpmn-js/lib/NavigatedViewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import { ZoomIn, ZoomOut, Maximize2, AlertCircle, Loader2 } from 'lucide-react';

interface BpmnViewerProps {
  bpmnXml?: string;
  bpmnUrl?: string;
  height?: number | string;
  className?: string;
  fallbackImage?: string;  // Base64-kodiertes Fallback-Bild
  onError?: (error: string) => void;
}

const BpmnViewer = ({ bpmnXml, bpmnUrl, height = 500, className = '', fallbackImage, onError }: BpmnViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BpmnJS | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [useFallback, setUseFallback] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Initialisiere den BPMN Viewer
  useEffect(() => {
    if (!containerRef.current) return;

    // Cleanup alter Viewer falls vorhanden
    if (viewerRef.current) {
      try {
        viewerRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying old viewer:', e);
      }
    }

    // Erstelle neuen Viewer
    const viewer = new BpmnJS({
      container: containerRef.current,
      keyboard: {
        bindTo: window
      }
    });

    viewerRef.current = viewer;
    setIsReady(true);

    return () => {
      setIsReady(false);
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying viewer:', e);
        }
        viewerRef.current = null;
      }
    };
  }, []);

  // Lade BPMN-Diagramm
  useEffect(() => {
    const loadDiagram = async () => {
      if (!viewerRef.current || !isReady) return;

      setLoading(true);
      setError(null);

      try {
        let xml = bpmnXml;

        // Wenn URL angegeben, lade XML von dort
        if (!xml && bpmnUrl) {
          const response = await fetch(bpmnUrl);
          if (!response.ok) {
            throw new Error(`Fehler beim Laden: ${response.statusText}`);
          }
          xml = await response.text();
        }

        if (!xml) {
          setError('Kein BPMN-XML verfügbar');
          setLoading(false);
          return;
        }

        console.log('📄 BPMN XML laden:', xml.length, 'Zeichen');

        // Importiere das Diagramm
        const result = await viewerRef.current.importXML(xml);
        
        if (result.warnings && result.warnings.length > 0) {
          console.warn('BPMN Import Warnings:', result.warnings);
          // Prüfe auf "no diagram to display" Warnung
          const noDiagramWarning = result.warnings.find(
            (w: any) => w.message?.includes('no diagram') || (typeof w === 'string' && w.includes('no diagram'))
          );
          if (noDiagramWarning) {
            const errorMsg = 'Die BPMN-Datei enthält keine Diagramm-Informationen (BPMNDiagram).';
            setError(errorMsg);
            setUseFallback(true);
            onError?.(errorMsg);
            setLoading(false);
            return;
          }
        }

        // Warte kurz, damit das Canvas initialisiert ist
        await new Promise(resolve => setTimeout(resolve, 150));

        // Zoom auf "fit viewport" und zentrieren
        try {
          const canvas = viewerRef.current.get('canvas') as any;
          if (canvas && typeof canvas.zoom === 'function') {
            // Erst fit-viewport für die richtige Größe
            canvas.zoom('fit-viewport');
            
            // Dann zentrieren
            const viewbox = canvas.viewbox();
            if (viewbox) {
              canvas.viewbox({
                x: viewbox.x,
                y: viewbox.y,
                width: viewbox.width,
                height: viewbox.height
              });
            }
            
            setZoom(canvas.zoom());
          }
        } catch (zoomErr) {
          console.warn('Could not set zoom:', zoomErr);
          // Kein kritischer Fehler - Diagramm wird trotzdem angezeigt
        }
        
        // Wende Custom-Styling auf SVG-Elemente an
        try {
          applyCustomStyling();
        } catch (styleErr) {
          console.warn('Could not apply custom styling:', styleErr);
        }

        setLoading(false);
      } catch (err) {
        console.error('BPMN Import Error:', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden des BPMN-Diagramms');
        setLoading(false);
      }
    };
    
    // Custom Styling für BPMN-Elemente
    const applyCustomStyling = () => {
      if (!containerRef.current) return;
      
      const svg = containerRef.current.querySelector('svg');
      if (!svg) return;
      
      // Setze SVG Hintergrund transparent
      svg.style.background = 'transparent';
      
      // Style alle Rechtecke (Tasks)
      const rects = svg.querySelectorAll('.djs-visual rect');
      rects.forEach((rect: Element) => {
        const r = rect as SVGRectElement;
        r.setAttribute('fill', '#151F2E');
        r.setAttribute('stroke', '#3B82F6');
        r.setAttribute('stroke-width', '2');
        r.setAttribute('rx', '8');
        r.setAttribute('ry', '8');
      });
      
      // Style Kreise (Events)
      const circles = svg.querySelectorAll('.djs-visual circle');
      circles.forEach((circle: Element) => {
        const c = circle as SVGCircleElement;
        const parent = c.closest('[data-element-id]');
        const elementId = parent?.getAttribute('data-element-id') || '';
        
        if (elementId.toLowerCase().includes('start')) {
          c.setAttribute('fill', '#0B1C14');
          c.setAttribute('stroke', '#22C55E');
          c.setAttribute('stroke-width', '2.5');
        } else if (elementId.toLowerCase().includes('end')) {
          c.setAttribute('fill', '#1C0B0B');
          c.setAttribute('stroke', '#EF4444');
          c.setAttribute('stroke-width', '3');
        } else {
          c.setAttribute('fill', '#1C1B0B');
          c.setAttribute('stroke', '#F59E0B');
          c.setAttribute('stroke-width', '2');
        }
      });
      
      // Style Polygone (Gateways - Rauten)
      const polygons = svg.querySelectorAll('.djs-visual polygon');
      polygons.forEach((polygon: Element) => {
        const p = polygon as SVGPolygonElement;
        p.setAttribute('fill', '#1C1910');
        p.setAttribute('stroke', '#F59E0B');
        p.setAttribute('stroke-width', '2.5');
      });
      
      // Style Gateway Marker Pfade (X, +, O)
      const gatewayGroups = svg.querySelectorAll('[data-element-id*="Gateway"], [data-element-id*="gateway"]');
      gatewayGroups.forEach((group: Element) => {
        const paths = group.querySelectorAll('.djs-visual path');
        paths.forEach((path: Element, index: number) => {
          const p = path as SVGPathElement;
          // Erster Pfad ist oft der Rahmen, nachfolgende sind Marker
          if (index > 0 || paths.length === 1) {
            p.setAttribute('stroke', '#F59E0B');
            p.setAttribute('stroke-width', '3');
            p.setAttribute('fill', 'none');
          }
        });
      });
      
      // Style Verbindungslinien
      const connections = svg.querySelectorAll('.djs-connection .djs-visual path');
      connections.forEach((path: Element) => {
        const p = path as SVGPathElement;
        p.setAttribute('stroke', '#4B5563');
        p.setAttribute('stroke-width', '1.5');
      });
      
      // Style Labels/Text - wichtig für bessere Lesbarkeit
      const texts = svg.querySelectorAll('text, tspan');
      texts.forEach((text: Element) => {
        const t = text as SVGTextElement;
        t.setAttribute('fill', '#E5E7EB');
        t.style.fontFamily = "'Inter', system-ui, sans-serif";
        t.style.fontSize = '11px';
        t.style.fontWeight = '500';
      });
      
      // Spezifische Labels in Tasks
      const labels = svg.querySelectorAll('.djs-label');
      labels.forEach((label: Element) => {
        const l = label as SVGElement;
        const text = l.querySelector('text');
        if (text) {
          text.setAttribute('fill', '#E5E7EB');
        }
      });
    };

    loadDiagram();
  }, [bpmnXml, bpmnUrl, isReady]);

  // Zoom-Funktionen
  const handleZoomIn = () => {
    if (!viewerRef.current) return;
    try {
      const canvas = viewerRef.current.get('canvas') as any;
      if (canvas && typeof canvas.zoom === 'function') {
        const newZoom = Math.min(zoom * 1.2, 4);
        canvas.zoom(newZoom);
        setZoom(newZoom);
      }
    } catch (e) {
      console.warn('Zoom in failed:', e);
    }
  };

  const handleZoomOut = () => {
    if (!viewerRef.current) return;
    try {
      const canvas = viewerRef.current.get('canvas') as any;
      if (canvas && typeof canvas.zoom === 'function') {
        const newZoom = Math.max(zoom / 1.2, 0.2);
        canvas.zoom(newZoom);
        setZoom(newZoom);
      }
    } catch (e) {
      console.warn('Zoom out failed:', e);
    }
  };

  const handleFitViewport = () => {
    if (!viewerRef.current) return;
    try {
      const canvas = viewerRef.current.get('canvas') as any;
      if (canvas && typeof canvas.zoom === 'function') {
        canvas.zoom('fit-viewport');
        setZoom(canvas.zoom());
      }
    } catch (e) {
      console.warn('Fit viewport failed:', e);
    }
  };

  // Error-State - zeige Fallback-Bild wenn verfügbar
  if (error || useFallback) {
    if (fallbackImage) {
      return (
        <div className={`relative bg-background-surface rounded-panel overflow-hidden ${className}`} style={{ height }}>
          <div 
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(31, 41, 55, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(31, 41, 55, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />
          <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
            <img 
              src={`data:image/png;base64,${fallbackImage}`} 
              alt="BPMN Prozess (Fallback)" 
              className="max-w-full max-h-full object-contain"
              style={{ filter: 'brightness(0.9) contrast(1.1)' }}
            />
          </div>
          <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-semantic-warning/20 border border-semantic-warning/40 rounded-button text-xs text-semantic-warning z-20">
            Fallback-Ansicht (kein BPMNDiagram)
          </div>
        </div>
      );
    }
    
    return (
      <div className={`bg-background-surface border border-semantic-error/30 rounded-panel p-8 flex flex-col items-center justify-center ${className}`} style={{ height }}>
        <AlertCircle className="w-12 h-12 text-semantic-error mb-4" />
        <p className="text-semantic-error font-medium font-display">BPMN-Visualisierung fehlgeschlagen</p>
        <p className="text-text-secondary text-sm mt-2 text-center max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative bg-background-surface rounded-panel overflow-hidden bpmn-container ${className}`} style={{ height }}>
      {/* Grid Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(31, 41, 55, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(31, 41, 55, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background-surface/90 flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-accent animate-spin mb-3" />
            <p className="text-text-secondary">Lade BPMN-Diagramm...</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-background-elevated/90 hover:bg-background-elevated border border-border/50 rounded-button transition-all duration-150 shadow-lg backdrop-blur-sm"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-text-primary" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-background-elevated/90 hover:bg-background-elevated border border-border/50 rounded-button transition-all duration-150 shadow-lg backdrop-blur-sm"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-text-primary" />
        </button>
        <button
          onClick={handleFitViewport}
          className="p-2 bg-background-elevated/90 hover:bg-background-elevated border border-border/50 rounded-button transition-all duration-150 shadow-lg backdrop-blur-sm"
          title="Fit to Viewport"
        >
          <Maximize2 className="w-4 h-4 text-text-primary" />
        </button>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-background-elevated/90 border border-border/50 rounded-button text-xs text-text-secondary z-20 backdrop-blur-sm shadow-lg font-mono">
        {Math.round(zoom * 100)}%
      </div>

      {/* BPMN Container mit dunklem Theme */}
      <div 
        ref={containerRef} 
        className="w-full h-full relative z-10"
        style={{ 
          background: 'transparent'
        }}
      />

      {/* Keine Daten Hinweis */}
      {!bpmnXml && !bpmnUrl && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background-surface z-5">
          <div className="text-center">
            <AlertCircle className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">Kein BPMN-Diagramm verfügbar</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BpmnViewer;
