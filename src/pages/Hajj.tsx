import React, { useState } from 'react';
import { Page } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { HAJJ_CHECKLIST, HAJJ_STEPS, UMRAH_STEPS, type Step } from '../lib/data';
import { local } from '../lib/api';

export default function Hajj() {
  const { t } = useStore();
  const [tab, setTab] = useState<'umrah' | 'hajj'>('umrah');
  const [checked, setChecked] = useState<string[]>(() => local.get<string[]>('hajjChecklist', []));

  const toggle = (item: string) => {
    const next = checked.includes(item) ? checked.filter((c) => c !== item) : [...checked, item];
    setChecked(next);
    local.set('hajjChecklist', next);
  };

  const steps: Step[] = tab === 'umrah' ? UMRAH_STEPS : HAJJ_STEPS;

  return (
    <Page title={t('Hajj & Umrah')} subtitle={t('Step-by-step rites with practical checklists')}>
      <div className="chips">
        <button className={`chip ${tab === 'umrah' ? 'on' : ''}`} onClick={() => setTab('umrah')}>{t('Umrah')}</button>
        <button className={`chip ${tab === 'hajj' ? 'on' : ''}`} onClick={() => setTab('hajj')}>{t('Hajj')}</button>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Ihram')}</h3>
        <ul className="small" style={{ margin: 0, paddingInlineStart: 18, lineHeight: 1.7 }}>
          <li>{t('Perform ghusl, trim nails and remove unwanted hair before wearing ihram.')}</li>
          <li>{t('Men wear two unstitched white sheets; women wear modest clothing covering the body, with the face and hands uncovered.')}</li>
          <li>{t('Avoid perfume, cutting hair or nails, hunting, and marital relations while in ihram.')}</li>
          <li>{t('Make the intention at the miqat and begin the talbiyah.')}</li>
        </ul>
      </div>

      <div className="stack" style={{ gap: 8 }}>
        {steps.map((s, i) => (
          <article key={s.title} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="surah-num">{i + 1}</span>
              <span className={`badge-${s.requirement === 'required' ? 'gold' : 'soft'} tiny`}>{t(s.requirement)}</span>
            </div>
            <h3 className="section-title" style={{ margin: '8px 0 4px' }}>{s.title}</h3>
            <p className="small" style={{ margin: 0 }}>{s.detail}</p>
          </article>
        ))}
      </div>

      <div className="card">
        <h3 className="section-title">{t('Practical checklist')}</h3>
        <div className="stack" style={{ gap: 8 }}>
          {HAJJ_CHECKLIST.map((item) => (
            <label key={item} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
              <input type="checkbox" checked={checked.includes(item)} onChange={() => toggle(item)} />
              <span className="small">{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Essential duas')}</h3>
        <p className="arabic" dir="rtl" lang="ar" style={{ margin: '8px 0' }}>
          لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ
        </p>
        <p className="small" style={{ margin: 0 }}>
          {t('Talbiyah — recited from ihram until the Tawaf begins.')}
        </p>
        <div className="divider" />
        <p className="arabic" dir="rtl" lang="ar" style={{ margin: '8px 0' }}>
          رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ
        </p>
        <p className="small" style={{ margin: 0 }}>{t('Quran 2:201 — a dua encouraged between the Yemeni corner and the Black Stone.')}</p>
      </div>

      <p className="tiny muted center">
        <AppIcon name="shield" size={13} /> {t('Rites summarised from standard fiqh manuals. For your specific case, follow your group’s scholar.')}
      </p>
    </Page>
  );
}
