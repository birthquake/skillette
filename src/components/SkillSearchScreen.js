import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { getRandomSkills, trackEvent } from '../firebase';
import { SkillCardSkeleton } from './Skeleton';
import ErrorBanner from './ErrorBanner';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = [
  { name: 'All',        emoji: '✨' },
  { name: 'Life Hacks', emoji: '💡' },
  { name: 'Crafts',     emoji: '🎨' },
  { name: 'Cooking',    emoji: '👨‍🍳' },
  { name: 'Magic',      emoji: '🎩' },
  { name: 'Music',      emoji: '🎵' },
  { name: 'Sports',     emoji: '⚽' },
];

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

const getDifficultyColor = (d) =>
  ({ Easy: '#4ecdc4', Medium: '#f5a623', Hard: '#ff6b6b' }[d] || '#8b8fa8');

function SkillSearchScreen({ onNavigate }) {
  const { currentUser } = useAuth();
  const [allSkills, setAllSkills]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [query, setQuery]               = useState('');
  const [category, setCategory]         = useState('All');
  const [difficulty, setDifficulty]     = useState('All');
  const [showFilters, setShowFilters]   = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const skills = await getRandomSkills(currentUser.uid, 50);
        setAllSkills(skills);
      } catch (err) {
        setError('Could not load skills.');
      } finally {
        setLoading(false);
      }
    };
    load();
    trackEvent('search_screen_opened');
  }, [currentUser.uid]);

  const filtered = allSkills.filter(skill => {
    const matchesQuery = !query || 
      skill.title?.toLowerCase().includes(query.toLowerCase()) ||
      skill.description?.toLowerCase().includes(query.toLowerCase()) ||
      skill.author?.toLowerCase().includes(query.toLowerCase());
    const matchesCat  = category === 'All' || skill.category === category;
    const matchesDiff = difficulty === 'All' || skill.difficulty === difficulty;
    return matchesQuery && matchesCat && matchesDiff;
  });

  const activeFilters = (category !== 'All' ? 1 : 0) + (difficulty !== 'All' ? 1 : 0);

  return (
    <div className="fade-in" style={{ paddingTop: '20px', paddingBottom: '20px' }}>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#555870', pointerEvents: 'none' }} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search skills, teachers..."
          style={{
            width: '100%', padding: '12px 44px 12px 40px',
            background: '#252838', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', color: '#f0f0f5', fontSize: '15px',
            outline: 'none', boxSizing: 'border-box',
            fontFamily: 'inherit'
          }}
        />
        <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '4px' }}>
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555870', padding: '6px' }}>
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{
              background: activeFilters > 0 ? 'rgba(124,106,247,0.2)' : 'none',
              border: activeFilters > 0 ? '1px solid rgba(124,106,247,0.4)' : 'none',
              borderRadius: '8px', cursor: 'pointer',
              color: activeFilters > 0 ? '#a594f9' : '#555870',
              padding: '6px', display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '12px', fontWeight: '600'
            }}
          >
            <SlidersHorizontal size={15} />
            {activeFilters > 0 && activeFilters}
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="fade-in-fast card" style={{ marginBottom: '12px' }}>
          {/* Category row */}
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#555870', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>Category</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.name}
                onClick={() => setCategory(cat.name)}
                style={{
                  padding: '6px 12px', borderRadius: '20px', border: 'none',
                  cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                  background: category === cat.name ? 'linear-gradient(135deg, #7c6af7, #9c59f5)' : '#252838',
                  color: category === cat.name ? 'white' : '#8b8fa8',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>

          {/* Difficulty row */}
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#555870', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>Difficulty</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', border: 'none',
                  cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                  background: difficulty === d
                    ? (d === 'All' ? 'linear-gradient(135deg, #7c6af7, #9c59f5)' : getDifficultyColor(d))
                    : '#252838',
                  color: difficulty === d ? 'white' : '#8b8fa8',
                  transition: 'all 0.15s ease'
                }}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Clear filters */}
          {activeFilters > 0 && (
            <button
              onClick={() => { setCategory('All'); setDifficulty('All'); }}
              style={{ marginTop: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#f5576c', fontSize: '13px', fontWeight: '600', padding: 0 }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <p style={{ fontSize: '13px', color: '#555870', marginBottom: '12px' }}>
          {filtered.length} skill{filtered.length !== 1 ? 's' : ''}
          {query || activeFilters > 0 ? ' found' : ' in the pool'}
        </p>
      )}

      {error && <ErrorBanner message={error} />}

      {/* Results */}
      {loading ? (
        <><SkillCardSkeleton /><SkillCardSkeleton /><SkillCardSkeleton /></>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#8b8fa8' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
          <p style={{ fontSize: '16px' }}>No skills match your search</p>
          <button
            onClick={() => { setQuery(''); setCategory('All'); setDifficulty('All'); }}
            style={{ marginTop: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#7c6af7', fontSize: '14px', fontWeight: '600' }}
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="stagger-children">
          {filtered.map(skill => (
            <div key={skill.id} className="card card-interactive" style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '52px', height: '52px', background: '#252838', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.07)' }}>
                  {skill.thumbnail}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f0f0f5', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {skill.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#8b8fa8', marginBottom: '6px' }}>
                    <span>by {skill.author}</span>
                    {skill.rating > 0 && (
                      <span style={{ color: '#ffd700' }}>★ {skill.rating.toFixed(1)}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ background: getDifficultyColor(skill.difficulty), color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                      {skill.difficulty}
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.07)', color: '#8b8fa8', padding: '2px 8px', borderRadius: '20px', fontSize: '11px' }}>
                      {skill.category}
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.07)', color: '#8b8fa8', padding: '2px 8px', borderRadius: '20px', fontSize: '11px' }}>
                      {skill.duration}
                    </span>
                  </div>
                </div>
              </div>
              {skill.description && (
                <p style={{ fontSize: '13px', color: '#8b8fa8', marginTop: '10px', lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {skill.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SkillSearchScreen;
