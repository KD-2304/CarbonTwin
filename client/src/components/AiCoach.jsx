import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { aiAPI } from '../api/axios';
import { Bot, Send, Sparkles } from 'lucide-react';

export default function AiCoach() {
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
        encouragement: 'Keep tracking your carbon footprint. Every action matters!'
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
    <div className="surface flex max-h-[640px] flex-col p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-400/10 border border-violet-400/15">
          <Bot size={14} className="text-violet-400" />
        </div>
        <div>
          <p className="section-title text-sm">AI Carbon Coach</p>
          <p className="text-[11px] text-sand-500">Weekly insight plus quick climate coaching.</p>
        </div>
      </div>

      {insightLoading ? (
        <div className="surface-soft mb-4 animate-shimmer p-4 rounded-xl">
          <div className="mb-2 h-4 w-3/4 rounded bg-sage-400/8" />
          <div className="mb-2 h-4 w-1/2 rounded bg-sage-400/8" />
          <div className="h-4 w-2/3 rounded bg-sage-400/8" />
        </div>
      ) : insight && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-soft mb-4 border-l-2 border-sage-400 bg-sage-400/5 p-4 rounded-xl"
        >
          <p className="text-sm leading-relaxed text-sand-300">{insight.insight}</p>

          {insight.actions?.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sage-400">This week</p>
              {insight.actions.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-400" />
                  <span className="text-sand-300">{a.action}
                    <span className="ml-1 text-xs text-sage-400 font-medium">({a.saving})</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {insight.encouragement && (
            <p className="mt-3 text-sm text-sage-400/80 flex items-start gap-1.5">
              <Sparkles size={12} className="mt-0.5 shrink-0" />
              {insight.encouragement}
            </p>
          )}
        </motion.div>
      )}

      <div className="mb-3 min-h-[130px] flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="py-2">
            <p className="text-sm text-sand-500">Start with one of these prompts.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Reduce transport emissions', 'Review my diet score', 'Find my biggest change'].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="rounded-lg border border-sand-100/6 bg-sand-100/[0.02] px-2.5 py-1.5 text-left text-xs text-sand-400 transition-all hover:border-sage-400/20 hover:text-sage-400 hover:bg-sage-400/5"
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
            <div className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-sage-400/12 text-sand-200 rounded-br-md'
                : 'bg-base-800/70 text-sand-300 rounded-bl-md'
            }`}>
              {msg.content}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-base-800/70 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 animate-bounce rounded-full bg-sage-400" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-sage-400" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-sage-400" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          id="ai-coach-message-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach..."
          aria-label="Ask your carbon coach"
          className="input-field flex-1 py-2.5 text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary px-3.5 py-2.5 disabled:opacity-30"
          aria-label="Send message to carbon coach"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
