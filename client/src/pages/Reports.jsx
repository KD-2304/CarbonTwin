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
    <div className="page-container pb-24 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            📊 <span>Weekly Reports</span>
          </h1>
          <p className="text-gray-400 mt-1">AI-generated summaries of your progress</p>
        </div>
        <button
          onClick={generateReport}
          disabled={generating}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {generating ? '⏳ Generating...' : '✨ Generate This Week\'s Report'}
        </button>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-[#1f2937] rounded w-1/4 mb-3" />
              <div className="h-4 bg-[#1f2937] rounded w-3/4 mb-2" />
              <div className="h-4 bg-[#1f2937] rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Reports list */}
      {!loading && (
        <div className="space-y-4">
          {reports.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-gray-400">No reports yet. Generate your first weekly report!</p>
            </div>
          )}

          {reports.map((report, index) => (
            <motion.div
              key={report._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                    <span>📋</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Week of {formatDate(report.weekStart)}</p>
                    <p className="text-gray-500 text-xs">{report.actionsCount} actions logged</p>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-lg text-sm font-mono ${
                  (report.totalDelta || 0) <= 0
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {(report.totalDelta || 0) <= 0 ? '↓' : '↑'} {Math.abs(report.totalDelta || 0).toFixed(1)} kg CO₂
                </div>
              </div>

              {report.summary && (
                <div className="mb-3">
                  <p className="text-sm text-gray-300 leading-relaxed">{report.summary}</p>
                </div>
              )}

              {report.insight && (
                <div className="mb-3 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                  <p className="text-xs font-medium text-cyan-400 uppercase tracking-wider mb-1">💡 Insight</p>
                  <p className="text-sm text-gray-300">{report.insight}</p>
                </div>
              )}

              {report.goal && (
                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <p className="text-xs font-medium text-green-400 uppercase tracking-wider mb-1">🎯 Goal for Next Week</p>
                  <p className="text-sm text-gray-300">{report.goal}</p>
                </div>
              )}

              {/* Category breakdown */}
              {report.categoryBreakdown && Object.keys(report.categoryBreakdown).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(report.categoryBreakdown).map(([cat, delta]) => (
                    <span key={cat} className={`px-2 py-1 rounded-md text-xs ${
                      delta <= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {cat}: {delta <= 0 ? '' : '+'}{delta.toFixed(1)} kg
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
