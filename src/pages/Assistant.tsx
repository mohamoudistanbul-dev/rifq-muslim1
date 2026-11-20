import React, { useRef, useState } from 'react';
import { Page } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { post } from '../lib/api';

interface Answer {
  answer: string;
  references: { text: string; source: string }[];
  mode: string;
  disclaimer: string;
}

interface Message extends Answer {
  question: string;
}

export default function Assistant() {
  const { t, lang, toast } = useStore();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const send = async () => {
    const q = question.trim();
    if (q.length < 4) return toast(t('Please write a complete question'), 'error');
    setBusy(true);
    setQuestion('');
    try {
      const res = await post<Answer>('/assistant', {
        question: q,
        lang,
        history: messages.slice(-4).map((m) => ({ question: m.question, answer: m.answer })),
      });
      setMessages((list) => [...list, { ...res, question: q }]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    } catch (err) {
      toast((err as Error).message || t('The assistant is unavailable right now'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Assistant" subtitle={t('Answers with Quran and hadith references')}>
      <div className="notice">
        <p className="small" style={{ margin: 0 }}>
          {t('This assistant is a study aid, not a mufti. It never invents references; when it has no verified source it says so. For rulings on your situation, ask a qualified scholar.')}
        </p>
      </div>

      {messages.length === 0 && (
        <div className="card">
          <h3 className="section-title">{t('Example questions')}</h3>
          <div className="stack" style={{ gap: 8 }}>
            {[
              'How many surahs are in the Quran?',
              'What are the conditions of a valid prayer?',
              'How is Zakat calculated on gold?',
              'What are the steps of Umrah?',
            ].map((q) => (
              <button key={q} className="btn btn-soft btn-block" style={{ justifyContent: 'flex-start' }} onClick={() => setQuestion(q)}>
                {t(q)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className="stack" style={{ gap: 8 }}>
            <div className="bubble me">{m.question}</div>
            <div className="bubble">
              <p style={{ margin: 0 }}>{m.answer}</p>
              {m.references?.length > 0 && (
                <div className="refs">
                  {m.references.map((r, j) => (
                    <p key={j} className="tiny" style={{ margin: 0 }}>
                      <strong>{r.source}</strong> — {r.text}
                    </p>
                  ))}
                </div>
              )}
              <p className="tiny muted" style={{ margin: '8px 0 0' }}>
                {m.disclaimer}
                {m.mode === 'offline' ? ` · ${t('answered from the built-in reference library')}` : ''}
              </p>
            </div>
          </div>
        ))}
        {busy && <div className="bubble">{t('Searching the references…')}</div>}
        <div ref={endRef} />
      </div>

      <div className="audio-bar">
        <input
          className="input"
          placeholder={t('Ask about prayer, fasting, Quran, history…')}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !busy && void send()}
        />
        <button className="btn btn-primary" onClick={() => void send()} disabled={busy}>
          <AppIcon name="chat" size={16} />
        </button>
      </div>
    </Page>
  );
}
