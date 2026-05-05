// Performance monitoring utility
export const performanceMonitor = {
  marks: new Map<string, number>(),

  start(label: string) {
    this.marks.set(label, performance.now());
  },

  end(label: string) {
    const start = this.marks.get(label);
    if (start === undefined) {
      console.warn(`No start mark for ${label}`);
      return;
    }
    
    const duration = performance.now() - start;
    const level = duration > 1000 ? 'warn' : duration > 500 ? 'info' : 'debug';
    console[level](`⏱️  [${label}]: ${duration.toFixed(2)}ms`);
    
    this.marks.delete(label);
    return duration;
  },

  measure(label: string, fn: () => any) {
    this.start(label);
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.finally(() => this.end(label));
      }
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  },

  async measureAsync(label: string, fn: () => Promise<any>) {
    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  },

  reportWebVitals() {
    if ('web-vital' in window) return;
    
    const vitals = {
      LCP: performance.getEntriesByName('largest-contentful-paint').pop(),
      FCP: performance.getEntriesByName('first-contentful-paint').pop(),
      CLS: 0,
      FID: 0,
      TTFB: 0,
    };

    console.group('📊 Web Vitals');
    Object.entries(vitals).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && 'startTime' in value) {
        console.log(`${key}: ${value.startTime.toFixed(2)}ms`);
      }
    });
    console.groupEnd();
  }
};

// Initialize performance monitoring
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('load', () => {
    setTimeout(() => performanceMonitor.reportWebVitals(), 100);
  });
}
