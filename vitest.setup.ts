import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { vi } from 'vitest';

// Mock IntersectionObserver globally for Framer Motion tests
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
}

// 1. Next-Auth ko crash hone se bachane ke liye env variables defaults set karo
process.env.AUTH_SECRET = 'a-super-secret-32-character-dummy-string-for-tests';
process.env.NEXTAUTH_SECRET = 'a-super-secret-32-character-dummy-string-for-tests';
process.env.GITHUB_TOKEN = 'mock-github-token-for-testing';

// Next.js ke dynamic headers context ko mock karo taaki tests crash na hon
vi.mock('next/headers', () => {
  const mockHeaders = new Headers({
    host: 'localhost:3000',
    'user-agent': 'vitest-test-agent',
  });

  return {
    headers: vi.fn(() => Promise.resolve(mockHeaders)),
    cookies: vi.fn(() => ({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    })),
  };
});

// Custom Storage prototype override to fix Node.js v25+ experimental localStorage incompatibility with JSDOM
if (typeof window !== 'undefined' && typeof window.Storage !== 'undefined') {
  const stores = new WeakMap<object, Map<string, string>>();

  const getStore = (instance: object) => {
    let store = stores.get(instance);
    if (!store) {
      store = new Map<string, string>();
      stores.set(instance, store);
    }
    return store;
  };
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  Object.defineProperty(window.Storage.prototype, 'length', {
    get() {
      return getStore(this).size;
    },
    configurable: true,
  });

  window.Storage.prototype.getItem = function (key: string) {
    return getStore(this).get(key) ?? null;
  };

  window.Storage.prototype.setItem = function (key: string, value: string) {
    getStore(this).set(key, String(value));
  };

  window.Storage.prototype.removeItem = function (key: string) {
    getStore(this).delete(key);
  };

  window.Storage.prototype.clear = function () {
    getStore(this).clear();
  };

  window.Storage.prototype.key = function (index: number) {
    return Array.from(getStore(this).keys())[index] ?? null;
  };

  // Re-create localStorage and sessionStorage to be genuine Storage instances
  const mockLocalStorage = Object.create(window.Storage.prototype);
  const mockSessionStorage = Object.create(window.Storage.prototype);

  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(globalThis, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
    configurable: true,
  });

  // Mock IntersectionObserver for Framer Motion / JSDOM compatibility
  class MockIntersectionObserver {
    disconnect = vi.fn();
    observe = vi.fn();
    takeRecords = vi.fn(() => []);
    unobserve = vi.fn();
  }
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
}

if (typeof globalThis.fetch !== 'undefined') {
  const originalFetch = globalThis.fetch;
  const guardedFetch = function (url: URL | RequestInfo, init?: RequestInit) {
    const urlString =
      typeof url === 'string'
        ? url
        : url instanceof URL
          ? url.toString()
          : url && typeof url === 'object' && 'url' in url
            ? (url as Request).url
            : '';

    // Allow localhost/127.0.0.1 and data: URLs (inline resources/WebAssembly)
    const normalizedUrl = urlString.trim().toLowerCase();
    if (
      normalizedUrl.includes('localhost') ||
      normalizedUrl.includes('127.0.0.1') ||
      normalizedUrl.startsWith('data:')
    ) {
      return originalFetch(url, init);
    }

    throw new Error(
      `[Vitest Guard] Blocked outbound network request to: ${urlString}. ` +
        `Do not make real network requests in unit tests. Please mock global.fetch or use MSW.`
    );
  } as typeof fetch;

  globalThis.fetch = guardedFetch;

  // Restore the guarded fetch after each test to prevent global fetch mock leaks
  afterEach(() => {
    globalThis.fetch = guardedFetch;
  });
}

// Global Translation Context Mock
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string | number>) => {
      const translations: Record<string, string> = {
        'dashboard.prInsights.showing_filtered': 'Showing: {{label}} PRs — click again to reset',
        'dashboard.prInsights.total': 'Total',
        'dashboard.prInsights.loader': 'Crunching your pull requests...',
        'dashboard.prInsights.error': 'Error loading insights: {{error}}',
        'dashboard.prInsights.no_activity': 'No pull request activity found.',
        'dashboard.prInsights.start_contributing': 'Start contributing to see your insights here!',
        'dashboard.prInsights.total_prs': 'Total PRs',
        'dashboard.prInsights.merge_rate': 'Merge Rate',
        'dashboard.prInsights.avg_cycle_time': 'Avg Cycle Time',
        'dashboard.prInsights.first_review': 'First Review',
        'dashboard.prInsights.this_week': '+{{count}} this week',
        'dashboard.prInsights.hrs': 'hrs',
        'dashboard.prInsights.trend_title': 'Activity Trends',
        'dashboard.prInsights.trend_subtitle': 'Pull requests over time',
        'dashboard.prInsights.monthly': 'Monthly',
        'dashboard.prInsights.weekly': 'Weekly',
        'dashboard.prInsights.prs': 'PRs',
        'dashboard.prInsights.status_title': 'Status Distribution',
        'dashboard.prInsights.status_subtitle': 'Breakdown of PR states',
        'dashboard.prInsights.merged': 'Merged',
        'dashboard.prInsights.open': 'Open',
        'dashboard.prInsights.closed': 'Closed',
        'dashboard.prInsights.highlights_title': 'Key Highlights',
        'dashboard.prInsights.highlights_subtitle':
          'Notable achievements and milestones from your pull requests',
        'dashboard.prInsights.most_discussed': 'Most Discussed',
        'dashboard.prInsights.comments': 'comments',
        'dashboard.prInsights.fastest_merged': 'Fastest Merged PR',
        'dashboard.prInsights.hours': 'hours',
        'dashboard.prInsights.minutes': 'minutes',
        'dashboard.prInsights.largest_pr': 'Largest Impact',
        'dashboard.prInsights.additions': 'additions',
        'dashboard.prInsights.deletions': 'deletions',
        'dashboard.prInsights.no_highlights': 'No data available',
        'dashboard.prInsights.reviews_title': 'Review Analytics',
        'dashboard.prInsights.reviews_subtitle': 'Peer review participation and speed',
        'dashboard.prInsights.reviews_given': 'Reviews Given',
        'dashboard.prInsights.reviews_received': 'Reviews Received',
        'dashboard.prInsights.fastest_review': 'Fastest Review',
        'dashboard.prInsights.slowest_review': 'Slowest Review',
        'dashboard.prInsights.repo_title': 'Repository Performance',
        'dashboard.prInsights.repo_subtitle': 'PR metrics by repository',
        'dashboard.prInsights.repo_header': 'Repository',
        'dashboard.prInsights.prs_header': 'PRs',
        'dashboard.prInsights.merge_rate_header': 'Merge Rate',
        'dashboard.prInsights.reviews_header': 'Reviews',
        'dashboard.prInsights.avg_review_header': 'Avg Review Time',
        'dashboard.prInsights.no_repos': 'No repository data available.',
      };

      let val = translations[key];
      if (!val) {
        const parts = key.split('.');
        val = parts[parts.length - 1];
      }

      if (options) {
        Object.keys(options).forEach((k) => {
          val = val.replace(`{{${k}}}`, String(options[k]));
        });
      }
      return val;
    },
  }),
}));
