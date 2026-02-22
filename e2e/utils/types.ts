export interface DiscoveredRoute {
  url: string;
  path: string;
  source: string;
  title?: string;
  status?: number;
  visitedAt: string;
  issues: string[];
}

export interface DiscoveredAction {
  route: string;
  action: string;
  outcome: "passed" | "failed" | "skipped";
  details?: string;
  at: string;
}

export interface AppMap {
  baseURL: string;
  startedAt: string;
  finishedAt?: string;
  routes: DiscoveredRoute[];
  actions: DiscoveredAction[];
  notes: string[];
}

export interface VisitResult {
  route: string;
  title: string;
  status?: number;
  issues: string[];
}
