import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { aiAPI } from '../api/axios';
import { FileText, Sparkles, Lightbulb, Target, TrendingDown, TrendingUp } from 'lucide-react';

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
          className="btn-primary shrink-0 disabled:opacity-50 gap-2"
        >
          <Sparkles size={14} />
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </motion.header>

      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="surface animate-shimmer p-6 rounded-2xl">
              <div className="mb-3 h-4 w-1/4 rounded bg-sand-100/6" />
              <div className="mb-2 h-4 w-3/4 rounded bg-sand-100/6" />
              <div className="h-4 w-1/2 rounded bg-sand-100/6" />
            </div>
          ))}
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="surface p-16 text-center rounded-2xl">
          <FileText size={40} className="text-sand-600 mx-auto mb-4" />
          <p className="text-lg font-bold text-sand-100">No reports yet</p>
          <p className="mt-2 text-sand-500">Generate your first weekly report to build a progress archive.</p>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div className="space-y-5">
          {reports.map((report, index) => (
            <motion.article
              key={report._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="surface p-6 rounded-2xl"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/8 border border-teal-400/15">
                    <FileText size={16} className="text-teal-400" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-sand-100">Week of {formatDate(report.weekStart)}</p>
                    <p className="text-xs text-sand-500">{report.actionsCount} actions logged</p>
                  </div>
                </div>
                <div className={`rounded-lg px-3 py-1.5 text-sm font-mono font-bold flex items-center gap-1.5 ${
                  (report.totalDelta || 0) <= 0
                    ? 'bg-sage-400/8 text-sage-400'
                    : 'bg-coral-400/8 text-coral-400'
                }`}>
                  {(report.totalDelta || 0) <= 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                  {(report.totalDelta || 0) <= 0 ? '-' : '+'}{Math.abs(report.totalDelta || 0).toFixed(1)} kg CO2
                </div>
              </div>

              {report.summary === 'Generating...' ? (
                <div className="py-2 flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-sand-400 font-medium">
                    <div className="h-3.5 w-3.5 border-2 border-teal-400/25 border-t-teal-400 rounded-full animate-spin" />
                    <span>Your AI Coach is compiling the weekly insights...</span>
                  </div>
                  <div className="space-y-2.5 mt-1">
                    <div className="h-3.5 w-full rounded bg-sand-100/6 animate-pulse" />
                    <div className="h-3.5 w-3/4 rounded bg-sand-100/6 animate-pulse" />
                  </div>
                </div>
              ) : (
                <>
                  {report.summary && (
                    <p className="mb-5 text-sm leading-relaxed text-sand-300">{report.summary}</p>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {report.insight && (
                      <div className="surface-soft rounded-xl p-4 border-l-2 border-teal-400">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Lightbulb size={12} className="text-teal-400" />
                          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Insight</p>
                        </div>
                        <p className="text-sm text-sand-300 leading-relaxed">{report.insight}</p>
                      </div>
                    )}

                    {report.goal && (
                      <div className="surface-soft rounded-xl p-4 border-l-2 border-sage-400">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Target size={12} className="text-sage-400" />
                          <p className="text-[10px] font-bold uppercase tracking-wider text-sage-400">Next goal</p>
                        </div>
                        <p className="text-sm text-sand-300 leading-relaxed">{report.goal}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {report.categoryBreakdown && Object.keys(report.categoryBreakdown).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(report.categoryBreakdown).map(([cat, delta]) => (
                    <span key={cat} className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      delta <= 0 ? 'bg-sage-400/8 text-sage-400' : 'bg-coral-400/8 text-coral-400'
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
