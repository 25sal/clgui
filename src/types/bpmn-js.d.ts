declare module 'bpmn-js/lib/NavigatedViewer' {
  export default class NavigatedViewer {
    constructor(options?: any);
    importXML(xml: string): Promise<{ warnings: any[] }>;
    get(module: string): any;
    on(event: string, callback: (e: any) => void): void;
    destroy(): void;
  }
}

declare module 'bpmn-js/lib/Modeler' {
  export default class BpmnModeler {
    constructor(options?: any);
    importXML(xml: string): Promise<{ warnings: any[] }>;
    saveXML(options?: any): Promise<{ xml: string }>;
    saveSVG(options?: any): Promise<{ svg: string }>;
    get(module: string): any;
    on(event: string, callback: (e: any) => void): void;
    destroy(): void;
  }
}

declare module 'bpmn-js' {
  export default class BpmnViewer {
    constructor(options?: any);
    importXML(xml: string): Promise<{ warnings: any[] }>;
    get(module: string): any;
    on(event: string, callback: (e: any) => void): void;
    destroy(): void;
  }
}
