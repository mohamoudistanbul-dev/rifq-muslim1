import React, { useMemo, useState } from 'react';
import { Page } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { QUIZ, type QuizQuestion } from '../lib/data';
import { post } from '../lib/api';

type Category = QuizQuestion['category'] | 'all';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All topics' },
  { id: 'quran', label: 'Quran' },
  { id: 'hadith', label: 'Hadith' },
  { id: 'prophets', label: 'Prophets' },
  { id: 'history', label: 'History' },
  { id: 'worship', label: 'Worship' },
];

export default function Quiz() {
  const { t, user, toast } = useStore();
  const [category, setCategory] = useState<Category>('all');
  const [level, setLevel] = useState<1 | 2 | 3 | 0>(0);
  const [round, setRound] = useState<QuizQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const pool = useMemo(
    () =>
      QUIZ.filter((q) => (category === 'all' || q.category === category) && (level === 0 || q.level === level)),
    [category, level]
  );

  const start = () => {
    if (pool.length === 0) return toast(t('No questions in this selection yet'), 'error');
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(8, pool.length));
    setRound(shuffled);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  const answer = (option: number) => {
    if (picked !== null || !round) return;
    setPicked(option);
    const correct = round[index].answer === option;
    if (correct) setScore((s) => s + 1);
  };

  const next = async () => {
    if (!round) return;
    if (index + 1 >= round.length) {
      setDone(true);
      if (user) {
        try {
          await post('/quiz/results', { category: category === 'all' ? 'mixed' : category, score, total: round.length });
        } catch {
          /* score saving is best-effort; the round result stays on screen */
        }
      }
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  };

  const current = round?.[index];

  return (
    <Page title="Islamic Quiz" subtitle={t('Quran, hadith, prophets, history and worship')}>
      {!round && (
        <>
          <div className="card">
            <div className="field">
              <label>{t('Topic')}</label>
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{t(c.label)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t('Difficulty')}</label>
              <select className="select" value={level} onChange={(e) => setLevel(Number(e.target.value) as 0 | 1 | 2 | 3)}>
                <option value={0}>{t('All levels')}</option>
                <option value={1}>{t('Beginner')}</option>
                <option value={2}>{t('Intermediate')}</option>
                <option value={3}>{t('Advanced')}</option>
              </select>
            </div>
            <p className="tiny muted">{pool.length} {t('questions available in this selection')}</p>
            <button className="btn btn-primary btn-block" onClick={start}>
              <AppIcon name="play" size={16} /> {t('Start quiz')}
            </button>
          </div>
          {!user && (
            <p className="tiny muted center">{t('Sign in to keep your quiz scores with your account.')}</p>
          )}
        </>
      )}

      {round && !done && current && (
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="tiny muted">{t('Question')} {index + 1} / {round.length}</span>
            <span className="badge-gold tiny">{t('Score')} {score}</span>
          </div>
          <h3 className="section-title" style={{ marginTop: 10 }}>{current.question}</h3>
          <div className="stack" style={{ gap: 8, marginTop: 8 }}>
            {current.options.map((opt, i) => {
              const isCorrect = picked !== null && i === current.answer;
              const isWrong = picked === i && i !== current.answer;
              return (
                <button
                  key={opt}
                  className="btn btn-soft btn-block"
                  onClick={() => answer(i)}
                  style={{
                    justifyContent: 'flex-start',
                    borderColor: isCorrect ? 'var(--gold)' : isWrong ? '#b4483f' : undefined,
                    background: isCorrect ? 'rgba(212,175,55,0.16)' : undefined,
                  }}
                  disabled={picked !== null}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="notice" style={{ marginTop: 12 }}>
              <p className="small" style={{ margin: 0 }}>
                <strong>{picked === current.answer ? t('Correct') : t('Not quite')}</strong> — {current.explanation}
              </p>
              <p className="tiny muted" style={{ margin: '6px 0 0' }}>{current.reference}</p>
            </div>
          )}
          <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => void next()} disabled={picked === null}>
            {index + 1 >= round.length ? t('See result') : t('Next question')}
          </button>
        </div>
      )}

      {done && round && (
        <div className="card center">
          <p className="countdown" style={{ margin: 0 }}>{score}/{round.length}</p>
          <p className="small muted">{t('May Allah increase you in knowledge.')}</p>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={start}>{t('Play again')}</button>
            <button className="btn btn-soft" onClick={() => setRound(null)}>{t('Change topic')}</button>
          </div>
        </div>
      )}
    </Page>
  );
}
