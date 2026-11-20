import React from 'react';
import { Page } from '../components/Shell';
import { useStore } from '../lib/store';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'What we store',
    body: 'Your account stores your name, email address, a salted password hash, your language and prayer preferences, bookmarks, tasbih counts, worship tracker entries, quiz results and any community posts you publish. Prayer times are computed on your device from your coordinates; your GPS position is never sent to our servers except as coordinates needed to reverse-geocode a city name.',
  },
  {
    title: 'What we never store',
    body: 'We never store passwords in plain text, never store payment data (the app has no payments), and never sell or share personal data with advertisers.',
  },
  {
    title: 'Location',
    body: 'Location permission is requested only when you ask for it. If you decline, you can select your country and city manually and the app clearly marks the location as manually selected.',
  },
  {
    title: 'Community',
    body: 'Posts are public to signed-in members, filtered automatically for abuse and reviewed by moderators. Reports and blocks are logged. Do not post personal data.',
  },
  {
    title: 'Your controls',
    body: 'You can edit your profile, change your password, sign out of all sessions, and delete your account permanently from the profile screen. Deleting the account removes your personal records from the database.',
  },
  {
    title: 'Children',
    body: 'The Kids Academy contains no advertising, no chat and no data collection. Parental controls are stored locally on the device.',
  },
  {
    title: 'Contact',
    body: 'Questions about your data: mohamoudistanbul@gmail.com — +252-612215593.',
  },
];

export default function Privacy() {
  const { t } = useStore();
  return (
    <Page title="Privacy" subtitle={t('How RIFQ Muslim handles your data')}>
      {SECTIONS.map((s) => (
        <div key={s.title} className="card">
          <h3 className="section-title">{t(s.title)}</h3>
          <p className="small" style={{ marginBottom: 0 }}>{t(s.body)}</p>
        </div>
      ))}
      <p className="tiny muted center">Made by Eng Mohamud Yusuf · RIFQ Muslim</p>
    </Page>
  );
}
