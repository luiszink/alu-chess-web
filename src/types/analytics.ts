// Spark-Analytics-Zusammenfassung, berechnet vom spark-analytics-Service und
// nach MongoDB geschrieben. Wird ueber den Controller-Endpoint
// GET /api/controller/analytics/summary ausgeliefert.
export interface AnalyticsSummary {
  /** false, solange Spark noch keine Auswertung erzeugt hat (oder Mongo nicht erreichbar ist). */
  available: boolean;
  generatedAt: string | null;
  totalGames: number;
  averageMoveCount: number;
  /** Partien je Ergebnis, z. B. { "1-0": 5, "0-1": 4, "1/2-1/2": 3 }. */
  resultCounts: Record<string, number>;
  /** Partien je Zeitkontrolle, z. B. { "Blitz": 8, "none": 4 }. */
  timeControlCounts: Record<string, number>;
}
