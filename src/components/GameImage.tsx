import React, { useState } from 'react';
import { Gamepad2, Trophy, Crosshair, Gift, Sparkles, ImageOff } from 'lucide-react';

interface GameImageProps {
  src: string;
  alt: string;
  gameName?: string;
  genre?: string;
  aspectRatio?: 'video' | 'card' | 'portrait' | 'square' | 'auto';
  className?: string;
  badge?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
}

export function GameImage({
  src,
  alt,
  gameName,
  genre,
  aspectRatio = 'card',
  className = '',
  badge,
  objectFit = 'cover',
}: GameImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Normalize path if necessary (e.g. handle leading slash)
  const normalizedSrc = src.startsWith('http') || src.startsWith('/')
    ? src
    : `/${src}`;

  const aspectClass =
    aspectRatio === 'video' ? 'aspect-video' :
    aspectRatio === 'card' ? 'aspect-[4/3]' :
    aspectRatio === 'portrait' ? 'aspect-[3/4]' :
    aspectRatio === 'square' ? 'aspect-square' : '';

  const getGenreIcon = () => {
    const g = (genre || gameName || '').toLowerCase();
    if (g.includes('football') || g.includes('soccer') || g.includes('sports') || g.includes('fc')) {
      return <Trophy className="w-8 h-8 text-amber-400" />;
    }
    if (g.includes('free fire') || g.includes('pubg') || g.includes('royale') || g.includes('battle')) {
      return <Crosshair className="w-8 h-8 text-amber-400" />;
    }
    if (g.includes('playstation') || g.includes('google') || g.includes('card') || g.includes('gift')) {
      return <Gift className="w-8 h-8 text-amber-400" />;
    }
    return <Gamepad2 className="w-8 h-8 text-amber-400" />;
  };

  return (
    <div className={`relative overflow-hidden bg-zinc-950 ${aspectClass} ${className}`}>
      {/* Loading Shimmer State */}
      {loading && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse z-10" />
      )}

      {/* Actual Image */}
      {!error ? (
        <img
          src={normalizedSrc}
          alt={alt}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          className={`w-full h-full object-${objectFit} transition-all duration-500 ${
            loading ? 'opacity-0 scale-98' : 'opacity-100 scale-100'
          }`}
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      ) : (
        /* Graceful Styled Domain Fallback (Zero Broken Images) */
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-center border border-zinc-800">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2">
            {getGenreIcon()}
          </div>
          <span className="text-xs font-bold text-white tracking-wide">{gameName || alt}</span>
          {genre && <span className="text-[10px] text-zinc-400 mt-0.5">{genre}</span>}
        </div>
      )}

      {/* Optional Badge */}
      {badge && !loading && (
        <div className="absolute top-2.5 right-2.5 rtl:right-2.5 ltr:left-2.5 z-20">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-950/80 backdrop-blur-md text-amber-400 border border-amber-500/30 shadow">
            {badge}
          </span>
        </div>
      )}
    </div>
  );
}
