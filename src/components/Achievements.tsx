import React from 'react';
import { motion } from 'motion/react';
import { 
  Award, Flame, Trophy, Zap, Star, Shield, 
  CheckCircle2, Clock, Calendar, Lock, Sparkles
} from 'lucide-react';
import { type UserGamification, type AchievementBadge } from '../types';

interface AchievementsProps {
  gamification: UserGamification;
  addSystemLog: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export default function Achievements({ gamification, addSystemLog }: AchievementsProps) {
  // Calculate Level completion percent
  const levelProgressPercent = Math.min(
    (gamification.xp / gamification.nextLevelXp) * 100, 
    100
  );

  return (
    <div id="gamified-achievements-center" className="space-y-6 animate-fadeIn">
      {/* 1. Header & Level Progression Bar */}
      <div className="relative overflow-hidden bg-[#111113] border border-border-tactical rounded-[24px] p-6 shadow-sm">
        <div className="absolute inset-0 hatch-pattern opacity-5 pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 items-center">
          {/* Level Badge Circle */}
          <div className="md:col-span-3 flex flex-col items-center justify-center space-y-2 border-r border-border-tactical pr-2">
            <div className="relative h-28 w-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="50" stroke="#09090b" strokeWidth="6" fill="transparent" />
                <circle cx="56" cy="56" r="50" stroke="#00ffaa" strokeWidth="6" fill="transparent" 
                  strokeDasharray={314} strokeDashoffset={314 - (314 * levelProgressPercent) / 100} strokeLinecap="round" />
              </svg>
              <div className="absolute text-center flex flex-col">
                <span className="text-[10px] font-mono text-ink-muted-tactical uppercase font-semibold">Rank</span>
                <span className="text-2xl font-mono font-bold text-accent-tactical tracking-tight uppercase">Lvl {gamification.level}</span>
              </div>
            </div>
          </div>

          {/* XP Progress info */}
          <div className="md:col-span-9 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-ink-tactical tracking-tight flex items-center gap-2 uppercase">
                  <Trophy className="text-accent-tactical animate-pulse" size={24} />
                  <span>Achievement & Streak Center</span>
                </h1>
                <p className="text-xs text-ink-muted-tactical">Unlock ranks, maintain daily streaks, and secure legendary productivity badges.</p>
              </div>
              <div className="text-right text-xs font-mono">
                <span className="text-accent-tactical font-bold">{gamification.xp}</span> 
                <span className="text-ink-muted-tactical"> / {gamification.nextLevelXp} XP</span>
              </div>
            </div>

            {/* Progress Gauge bar */}
            <div className="space-y-2">
              <div className="w-full bg-[#09090b] border border-border-tactical h-3 rounded overflow-hidden p-0.5">
                <motion.div 
                  className="h-full bg-accent-tactical rounded-sm"
                  initial={{ width: '0%' }}
                  animate={{ width: `${levelProgressPercent}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-ink-muted-tactical uppercase font-semibold">
                <span>Current Level Progress</span>
                <span>{Math.round(levelProgressPercent)}% to Lvl {gamification.level + 1}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Streak Bento Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Current streak card */}
        <div className="bg-[#111113] border border-border-tactical rounded-[16px] p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-mono text-ink-muted-tactical uppercase font-semibold">Commitment Streak</span>
            <div className="text-2xl font-mono font-bold text-ink-tactical">{gamification.currentStreak} Days</div>
            <span className="text-[10px] text-accent-tactical font-mono flex items-center gap-1 uppercase font-bold">
              <Flame size={12} className="animate-pulse" /> Active flame burning
            </span>
          </div>
          <div className="p-4 bg-accent-tactical/10 text-accent-tactical border border-accent-tactical/20 rounded">
            <Flame size={28} className="animate-pulse" />
          </div>
        </div>

        {/* Best Streak card */}
        <div className="bg-[#111113] border border-border-tactical rounded-[16px] p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-mono text-ink-muted-tactical uppercase font-semibold">Milestone Record</span>
            <div className="text-2xl font-mono font-bold text-ink-tactical">{gamification.bestStreak} Days</div>
            <span className="text-[10px] text-accent-tactical font-mono flex items-center gap-1 uppercase font-bold">
              <Star size={11} /> Secured consistency peak
            </span>
          </div>
          <div className="p-4 bg-accent-tactical/10 text-accent-tactical border border-accent-tactical/20 rounded">
            <Star size={28} />
          </div>
        </div>

        {/* XP Boost multiplier card */}
        <div className="bg-[#111113] border border-border-tactical rounded-[16px] p-5 flex items-center justify-between shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <span className="text-xs font-mono text-ink-muted-tactical uppercase font-semibold">Multiplier Boost</span>
            <div className="text-2xl font-mono font-bold text-ink-tactical">1.5x active</div>
            <span className="text-[10px] text-accent-tactical font-mono flex items-center gap-1 uppercase font-bold">
              <Zap size={11} className="animate-bounce" /> Early Bird focus bonus
            </span>
          </div>
          <div className="p-4 bg-accent-tactical/10 text-accent-tactical border border-accent-tactical/20 rounded">
            <Zap size={28} />
          </div>
        </div>
      </div>

      {/* 3. Badge Grid Section */}
      <div className="bg-[#111113] border border-border-tactical rounded-[16px] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border-tactical pb-3">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-accent-tactical" />
            <h3 className="font-semibold text-ink-tactical text-sm uppercase">Collectibles Wall of Fame</h3>
          </div>
          <span className="text-[10px] font-mono text-ink-muted-tactical uppercase font-bold">Lock Status Telemetry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {gamification.badges.map(badge => (
            <div
              key={badge.id}
              className={`border rounded p-5 flex flex-col items-center text-center space-y-3.5 transition-all relative overflow-hidden group ${
                badge.unlocked 
                  ? 'bg-[#09090b] border-accent-tactical/20 hover:border-accent-tactical/40 hover:bg-[#111113]' 
                  : 'bg-[#09090b]/40 border-border-tactical/50 opacity-40'
              }`}
            >
              {/* Unlock effect glow */}
              {badge.unlocked && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-accent-tactical/5 rounded-full blur-md" />
              )}

              {/* Icon Holder */}
              <div className={`p-4 rounded relative flex items-center justify-center ${
                badge.unlocked 
                  ? 'bg-accent-tactical/10 text-accent-tactical border border-accent-tactical/20 scale-100 group-hover:scale-105 transition-transform' 
                  : 'bg-[#111113] text-ink-muted-tactical border border-border-tactical'
              }`}>
                {badge.unlocked ? (
                  <span className="text-3xl">{badge.icon}</span>
                ) : (
                  <Lock size={24} className="text-ink-muted-tactical" />
                )}
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-ink-tactical uppercase font-mono">{badge.name}</h4>
                <p className="text-[10px] text-ink-muted-tactical leading-normal line-clamp-2 px-1">{badge.description}</p>
              </div>

              {/* XP Value tag */}
              <div className="pt-2 border-t border-border-tactical w-full flex justify-between items-center text-[10px] font-mono">
                <span className="text-ink-muted-tactical uppercase font-semibold">Value</span>
                <span className={badge.unlocked ? "text-accent-tactical font-bold" : "text-ink-muted-tactical"}>
                  +{badge.xpValue} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
