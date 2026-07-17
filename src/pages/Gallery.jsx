import { useEffect, useMemo, useState, useCallback } from 'react';
import { GALLERY } from '../data/galleryImages';
import Wheel from '../components/Wheel';

const TABS = [
  { id: 'all', label: 'All Photos' },
  { id: 'activities', label: 'Activities' },
  { id: 'installation', label: 'Installation Ceremony' },
];
const BATCH = 24;

export default function Gallery() {
  const [tab, setTab] = useState('all');
  const [shown, setShown] = useState(BATCH);
  const [lb, setLb] = useState(-1); // lightbox index into `images`

  const images = useMemo(() => {
    if (tab === 'all') return [...GALLERY.activities, ...GALLERY.installation];
    return GALLERY[tab] ?? [];
  }, [tab]);

  useEffect(() => { setShown(BATCH); }, [tab]);

  const close = useCallback(() => setLb(-1), []);
  const step = useCallback((d) => setLb((i) => (i + d + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (lb < 0) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [lb, close, step]);

  const visible = images.slice(0, shown);

  return (
    <main className="page">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow"><Wheel />Photo Gallery</p>
          <h1>Moments from the field</h1>
          <p>
            {images.length} photographs from the club's camps, drives, celebrations and the
            installation ceremony — the work of a Rotary year, in pictures.
          </p>
        </div>

        <div className="tabs" role="tablist" aria-label="Gallery categories">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'on' : ''} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="gallery-grid">
          {visible.map((src, i) => (
            <button key={src} className="gallery-item" onClick={() => setLb(i)} aria-label={`Open photo ${i + 1}`}>
              <img src={src} alt={`Rotary Club of Bardoli — ${tab === 'installation' ? 'installation ceremony' : 'club activity'} ${i + 1}`} loading="lazy" />
            </button>
          ))}
        </div>

        {shown < images.length && (
          <div style={{ textAlign: 'center', marginTop: 30 }}>
            <button className="btn btn-outline" onClick={() => setShown((n) => n + BATCH)}>
              Show more ({images.length - shown} remaining)
            </button>
          </div>
        )}
      </div>

      {lb >= 0 && (
        <div className="lightbox" onClick={close} role="dialog" aria-modal="true" aria-label="Photo viewer">
          <button className="lb-btn lb-close" aria-label="Close" onClick={close}>&times;</button>
          <button className="lb-btn lb-prev" aria-label="Previous" onClick={(e) => { e.stopPropagation(); step(-1); }}>&#8249;</button>
          <img src={images[lb]} alt="" onClick={(e) => e.stopPropagation()} />
          <button className="lb-btn lb-next" aria-label="Next" onClick={(e) => { e.stopPropagation(); step(1); }}>&#8250;</button>
          <span className="lb-count">{lb + 1} / {images.length}</span>
        </div>
      )}
    </main>
  );
}
