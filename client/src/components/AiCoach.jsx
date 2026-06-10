import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { aiAPI } from '../api/axios';

export default function AiCoach({ userData }) {
  const [insight, setInsight] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchInsight();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchInsight = async () => {
    try {
      const { data } = await aiAPI.getWeeklyInsight();
      setInsight(data);
    } catch (error) {
      console.error('Failed to fetch insight:', error);
      setInsight({
        insight: 'Unable to generate insight right now. Try logging some actions first!',
        actions: [],
        encouragement: 'Keep tracking your carbon footprint — every action matters!'
      });
    } finally {
      setInsightLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const { data } = await aiAPI.chat(userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-5 flex flex-col" style={{ maxHeight: '600px' }}>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        🤖 <span>Your AI Carbon Coach</span>
      </h3>

      {/* Weekly insight */}
      {insightLoading ? (
        <div className="mb-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20 animate-pulse">
          <div className="h-4 bg-green-500/10 rounded mb-2 w-3/4" />
          <div className="h-4 bg-green-500/10 rounded mb-2 w-1/2" />
          <div className="h-4 bg-green-500/10 rounded w-2/3" />
        </div>
      ) : insight && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20"
        >
          <p className="text-sm text-gray-300 mb-3">{insight.insight}</p>

          {insight.actions?.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-xs font-medium text-green-400 uppercase tracking-wider">This week's actions:</p>
              {insight.actions.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span className="text-gray-300">{a.action}
                    <span className="text-green-400 text-xs ml-1">({a.saving})</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {insight.encouragement && (
            <p className="text-sm text-green-400/80 italic">{insight.encouragement}</p>
          )}
        </motion.div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-[100px] max-h-[250px] pr-1">
        {messages.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">Ask me anything about reducing your footprint!</p>
            <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
              {['How can I reduce transport emissions?', 'Is my diet score good?', 'What\'s the biggest impact change?'].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-[#1f2937] text-gray-400 hover:text-green-400 hover:border-green-500/30 border border-transparent transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
              msg.role === 'user'
                ? 'bg-green-500/20 text-green-100'
                : 'bg-[#1f2937] text-gray-300'
            }`}>
              {msg.content}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1f2937] px-4 py-2 rounded-xl">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your Carbon Coach..."
          className="input-field flex-1 text-sm py-2.5"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary px-4 py-2.5 disabled:opacity-40"
        >
          →
        </button>
      </form>
    </div>
  );
}
