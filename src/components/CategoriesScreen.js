import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { getRandomSkills, trackEvent } from '../firebase';
import { SkillCardSkeleton } from './Skeleton';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = [
  { name: 'Life Hacks', emoji: '💡', color: '#ff6b6b' },
  { name: 'Crafts',     emoji: '🎨', color: '#4ecdc4' },
  { name: 'Cooking',    emoji: '👨‍🍳', color: '#45b7d1' },
  { name: 'Magic',      emoji: '🎩', color: '#96ceb4' },
  { name: 'Music',      emoji: '🎵', color: '#a78bfa' },
  { name: 'Sports',     emoji: '⚽', color: '#f093fb' },
];

const getDifficultyColor = (d) =>
  ({ Easy: '#4ecdc4', Medium: '#f5a623', Hard: '#ff6b6b' }[d] || '#8b8fa8');

function CategoriesScreen({ onBack, onViewSkill }) {
  const { currentUser } = useAuth();
  const [allSkills, setAllSkills]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null); // null = overview

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const skills = await getRandomSkills(currentUser.uid, 80);
        setAllSkills(skills);
        trackEvent('categories_viewed');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser.uid]);

  const countFor = (name) => allSkills.filter(s => s.category === name).length;
  const skillsFor = (name) => allSkills.filter(s => s.category === name);

  // Category detail view
  if (selected) {
    const cat = CATEGORIES.find(c => c.name === selected);
    const skills = skillsFor(selected);
    return (
      <div className="fade-in" style={{ paddingTop: '20px', paddingBottom: '32px' }}>
        <button
          onClick={() => setSelected(null)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#8b8fa8', fontSize: '14px', fontWeight: '600', marginBottom: '16px', padding: 0 }}
        >
          <ArrowLeft size={16} /> All Categories
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${cat.color}20`, border: `1px solid ${cat.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            {cat.emoji}
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f0f0f5' }}>{cat.name}</h1>
            <p style={{ fontSize: '13px', color: '#8b8fa8' }}>{skills.length} skill{skills.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {skills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#8b8fa8' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌱</div>
            <p>No skills in this category yet.</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>Be the first to add one!</p>
          </div>
        ) : (
          <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {skills.map(skill => (
              <div
                key={skill.id}
                className="card card-interactive"
                onClick={() => onViewSkill && onViewSkill(skill.id)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '52px', height: '52px', background: '#252838', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>
                    {skill.thumbnail}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f0f0f5', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {skill.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#8b8fa8', marginBottom: '6px' }}>
                      <span>by {skill.author}</span>
                      {skill.rating > 0 && <span style={{ color: '#ffd700' }}>★ {skill.rating.toFixed(1)}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ background: getDifficultyColor(skill.difficulty), color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                        {skill.difficulty}
                      </span>
                      <span style={{ background: 'rgba(255,255,255,0.07)', color: '#8b8fa8', padding: '2px 8px', borderRadius: '20px', fontSize: '11px' }}>
                        {skill.duration}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Overview
  return (
    <div className="fade-in" style={{ paddingTop: '20px', paddingBottom: '32px' }}>
      <button
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#8b8fa8', fontSize: '14px', fontWeight: '600', marginBottom: '16px', padding: 0 }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f0f0f5', marginBottom: '4px' }}>Browse Categories</h1>
      <p style={{ fontSize: '13px', color: '#555870', marginBottom: '20px' }}>
        {allSkills.length} skills across {CATEGORIES.filter(c => countFor(c.name) > 0).length} categories
      </p>

      {loading ? (
        <><SkillCardSkeleton /><SkillCardSkeleton /><SkillCardSkeleton /></>
      ) : (
        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {CATEGORIES.map(cat => {
            const count = countFor(cat.name);
            const preview = skillsFor(cat.name).slice(0, 3);
            return (
              <div
                key={cat.name}
                className="card card-interactive"
                onClick={() => setSelected(cat.name)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: count > 0 ? '12px' : 0 }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${cat.color}18`, border: `1px solid ${cat.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                    {cat.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#f0f0f5', marginBottom: '2px' }}>{cat.name}</h3>
                    <p style={{ fontSize: '12px', color: '#555870' }}>
                      {count === 0 ? 'No skills yet' : `${count} skill${count !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: '#555870', flexShrink: 0 }} />
                </div>

                {/* Preview thumbnails */}
                {preview.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {preview.map(s => (
                      <div key={s.id} style={{ fontSize: '20px', width: '36px', height: '36px', background: '#252838', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {s.thumbnail}
                      </div>
                    ))}
                    {count > 3 && (
                      <div style={{ width: '36px', height: '36px', background: '#252838', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#555870', border: '1px solid rgba(255,255,255,0.07)' }}>
                        +{count - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CategoriesScreen;
