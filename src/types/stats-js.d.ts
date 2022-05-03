declare module 'stats-js' {
  class Stats {
    REVISION: number;
    dom: HTMLDivElement;
    domElement: HTMLDivElement;

    /**
     * @param value 0:fps, 1: ms, 2: mb, 3+: custom
     */
    showPanel(value: number): void;
    begin(): void;
    end(): number;
    update(): void;
  }

  export = Stats;
}
