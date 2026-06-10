import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { aiAPI } from '../api/axios';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data } = await aiAPI.getReports();
      setReports(data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      await aiAPI.generateWeeklyReport();
      await fetchReports();
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="page-container">
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <div>
          <p className="eyebrow">AI Reports</p>
          <h1 className="page-title">Weekly Reports</h1>
          <p className="page-subtitle">Generated summaries of your progress, insights, goals, and category changes.</p>
        </div>
        <button
          onClick={generateReport}
          disabled={generating}
          className="btn-primary shrink-0 disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </motion.header>

      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="surface animate-pulse p-6">
              <div className="mb-3 h-4 w-1/4 rounded bg-white/10" />
              <div className="mb-2 h-4 w-3/4 rounded bg-white/10" />
              <div className="h-4 w-1/2 rounded bg-white/10" />
            </div>
          ))}
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="surface p-12 text-center">
          <p className="text-lg font-bold text-white">No reports yet</p>
          <p className="mt-2 text-mist-500">Generate your first weekly report to build a progress archive.</p>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {reports.map((report, index) => (
            <motion.article
              key={report._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="surface p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-bold text-white">Week of {formatDate(report.weekStart)}</p>
                  <p className="text-sm text-mist-500">{report.actionsCount} actions logged</p>
                </div>
                <div className={`rounded-md px-3 py-1.5 text-sm font-mono font-bold ${
                  (report.totalDelta || 0) <= 0
                    ? 'bg-leaf-500/10 text-leaf-400'
                    : 'bg-rose-400/10 text-rose-400'
                }`}>
                  {(report.totalDelta || 0) <= 0 ? '-' : '+'}{Math.abs(report.totalDelta || 0).toFixed(1)} kg CO2
                </div>
              </div>

              {report.summary && (
                <p className="mb-4 text-sm leading-relaxed text-gray-300">{report.summary}</p>
              )}

              <div className="space-y-3">
                {report.insight && (
                  <div className="surface-soft border-aqua-400/20 bg-aqua-400/6 p-3">
                    <p className="meta-label text-aqua-400">Insight</p>
                    <p className="mt-1 text-sm text-gray-300">{report.insight}</p>
                  </div>
                )}

                {report.goal && (
                  <div className="surface-soft border-leaf-400/20 bg-leaf-400/6 p-3">
                    <p className="meta-label text-leaf-400">Next goal</p>
                    <p className="mt-1 text-sm text-gray-300">{report.goal}</p>
                  </div>
                )}
              </div>

              {report.categoryBreakdown && Object.keys(report.categoryBreakdown).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(report.categoryBreakdown).map(([cat, delta]) => (
                    <span key={cat} className={`rounded-md px-2 py-1 text-xs ${
                      delta <= 0 ? 'bg-leaf-500/10 text-leaf-400' : 'bg-rose-400/10 text-rose-400'
                    }`}>
                      {cat}: {delta <= 0 ? '' : '+'}{delta.toFixed(1)} kg
                    </span>
                  ))}
                </div>
              )}
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
