import React, { useEffect, useMemo, useState } from 'react';
import { Page } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { get } from '../lib/api';

interface Metals {
  goldUsdPerOunce: number;
  silverUsdPerOunce: number;
  updatedAt: string;
  source: string;
}

const OUNCE_GRAMS = 31.1034768;
const GOLD_NISAB_GRAMS = 85;
const SILVER_NISAB_GRAMS = 595;

export default function Zakat() {
  const { t, toast } = useStore();
  const [metals, setMetals] = useState<Metals | null>(null);
  const [metalsError, setMetalsError] = useState('');
  const [values, setValues] = useState({ cash: '', savings: '', gold: '', silver: '', business: '', debts: '' });
  const [basis, setBasis] = useState<'gold' | 'silver'>('gold');
  const [manualNisab, setManualNisab] = useState('');

  useEffect(() => {
    get<Metals>('/metals')
      .then(setMetals)
      .catch(() =>
        setMetalsError(
          t('Live gold and silver prices are unavailable. Enter your own nisab threshold below.')
        )
      );
  }, []);

  const pricePerGram = useMemo(() => {
    if (!metals) return null;
    return {
      gold: metals.goldUsdPerOunce / OUNCE_GRAMS,
      silver: metals.silverUsdPerOunce / OUNCE_GRAMS,
    };
  }, [metals]);

  const num = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const totals = useMemo(() => {
    const goldValue = pricePerGram ? num(values.gold) * pricePerGram.gold : 0;
    const silverValue = pricePerGram ? num(values.silver) * pricePerGram.silver : 0;
    const assets =
      num(values.cash) + num(values.savings) + num(values.business) + goldValue + silverValue;
    const net = Math.max(0, assets - num(values.debts));
    const nisab = pricePerGram
      ? basis === 'gold'
        ? GOLD_NISAB_GRAMS * pricePerGram.gold
        : SILVER_NISAB_GRAMS * pricePerGram.silver
      : num(manualNisab);
    const due = nisab > 0 && net >= nisab ? net * 0.025 : 0;
    return { goldValue, silverValue, assets, net, nisab, due, nisabManual: !pricePerGram };
  }, [values, pricePerGram, basis, manualNisab]);

  const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <Page title="Zakat" subtitle={t('Nisab and 2.5% calculation on your wealth')}>
      <div className="card">
        <h3 className="section-title">{t('Metal prices')}</h3>
        {metals ? (
          <>
            <div className="grid grid-2">
              <div className="stat">
                <span className="tiny muted">{t('Gold per gram')}</span>
                <strong>{money(pricePerGram?.gold || 0)}</strong>
              </div>
              <div className="stat">
                <span className="tiny muted">{t('Silver per gram')}</span>
                <strong>{money(pricePerGram?.silver || 0)}</strong>
              </div>
            </div>
            <p className="tiny muted" style={{ marginBottom: 0 }}>
              {metals.source} · {new Date(metals.updatedAt).toLocaleString()}
            </p>
          </>
        ) : (
          <p className="tiny muted" style={{ margin: 0 }}>{metalsError || t('Loading metal prices…')}</p>
        )}
      </div>

      <div className="card">
        <div className="field">
          <label>{t('Nisab basis')}</label>
          <select className="select" value={basis} onChange={(e) => setBasis(e.target.value as 'gold' | 'silver')}>
            <option value="gold">{t('Gold — 85 grams')}</option>
            <option value="silver">{t('Silver — 595 grams')}</option>
          </select>
        </div>
        {([
          ['cash', 'Cash in hand (USD)'],
          ['savings', 'Bank savings (USD)'],
          ['gold', 'Gold owned (grams)'],
          ['silver', 'Silver owned (grams)'],
          ['business', 'Business assets & stock (USD)'],
          ['debts', 'Debts due now (USD)'],
        ] as const).map(([key, label]) => (
          <div className="field" key={key}>
            <label>{t(label)}</label>
            <input
              className="input"
              inputMode="decimal"
              placeholder="0"
              value={values[key]}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            />
          </div>
        ))}
        {totals.nisabManual && (
          <div className="field">
            <label>{t('Nisab threshold (USD)')}</label>
            <input
              className="input"
              inputMode="decimal"
              placeholder="0"
              value={manualNisab}
              onChange={(e) => setManualNisab(e.target.value)}
            />
            <span className="tiny muted">
              {t('Nisab is the minimum wealth at which Zakat becomes due: 85 g of gold or 595 g of silver at the current price. Enter the nisab value you calculated so the 2.5% rate can be applied.')}
            </span>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">{t('Calculation breakdown')}</h3>
        <table className="table">
          <tbody>
            <tr><td>{t('Gold value')}</td><td>{money(totals.goldValue)}</td></tr>
            <tr><td>{t('Silver value')}</td><td>{money(totals.silverValue)}</td></tr>
            <tr><td>{t('Total assets')}</td><td>{money(totals.assets)}</td></tr>
            <tr><td>{t('Less debts')}</td><td>−{money(num(values.debts))}</td></tr>
            <tr><td><strong>{t('Zakatable wealth')}</strong></td><td><strong>{money(totals.net)}</strong></td></tr>
            <tr><td>{t('Nisab threshold')}</td><td>{money(totals.nisab)}</td></tr>
            <tr><td><strong>{t('Zakat due (2.5%)')}</strong></td><td><strong style={{ color: 'var(--gold-deep)' }}>{money(totals.due)}</strong></td></tr>
          </tbody>
        </table>
        {totals.nisab === 0 && (
          <p className="tiny muted" style={{ marginBottom: 0 }}>
            {t('Enter a nisab threshold above to see whether Zakat is due on your wealth.')}
          </p>
        )}
        {totals.nisab > 0 && totals.net < totals.nisab && (
          <p className="tiny muted" style={{ marginBottom: 0 }}>
            {t('Your wealth is below the nisab threshold, so no Zakat is due on these figures.')}
          </p>
        )}
        <button
          className="btn btn-soft btn-block"
          style={{ marginTop: 10 }}
          onClick={() => {
            void navigator.clipboard
              .writeText(`Zakat due: ${money(totals.due)} on ${money(totals.net)} (nisab ${money(totals.nisab)})`)
              .then(() => toast(t('Copied'), 'success'));
          }}
        >
          <AppIcon name="copy" size={15} /> {t('Copy summary')}
        </button>
      </div>

      <div className="notice">
        <p className="small" style={{ margin: 0 }}>
          {t('This is an estimate based on the figures you entered. Zakat rules for business inventory, agricultural produce, livestock and complex debts differ — consult a qualified scholar.')}
        </p>
      </div>
    </Page>
  );
}
