declare module 'bpmn-js/lib/NavigatedViewer' {
  interface BpmnJSOptions {
    container?: HTMLElement | string;
    keyboard?: {
      bindTo?: Window | Document | HTMLElement;
    };
    width?: string | number;
    height?: string | number;
    moddleExtensions?: Record<string, unknown>;
    additionalModules?: unknown[];
  }

  interface Canvas {
    zoom(level: 'fit-viewport' | number): number;
    viewbox(): {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }

  interface ImportResult {
    warnings: string[];
  }

  class BpmnJS {
    constructor(options?: BpmnJSOptions);
    
    importXML(xml: string): Promise<ImportResult>;
    saveXML(options?: { format?: boolean }): Promise<{ xml: string }>;
    saveSVG(): Promise<{ svg: string }>;
    
    get<T = unknown>(name: string): T;
    
    on(event: string, callback: (...args: unknown[]) => void): void;
    off(event: string, callback?: (...args: unknown[]) => void): void;
    
    destroy(): void;
    detach(): void;
    attachTo(parentNode: HTMLElement): void;
  }

  export default BpmnJS;
}

declare module 'bpmn-js/dist/assets/diagram-js.css';
declare module 'bpmn-js/dist/assets/bpmn-js.css';
declare module 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
