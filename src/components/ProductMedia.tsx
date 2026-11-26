import { useState } from 'react';
import { BRAND_NAME } from '../brand.ts';

interface ProductMediaProps {
  src?: string;
  alt: string;
  productName: string;
  aspectClassName?: string;
  className?: string;
  imageClassName?: string;
}

export function ProductMedia({
  src,
  alt,
  productName,
  aspectClassName = 'aspect-[4/5]',
  className = '',
  imageClassName = '',
}: ProductMediaProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`relative flex w-full flex-col items-center justify-center overflow-hidden bg-surface px-6 text-center ${aspectClassName} ${className}`}
      >
        <p className="font-display text-xs font-semibold tracking-[0.24em] text-gold uppercase">
          {BRAND_NAME}
        </p>
        <p className="mt-2 font-display text-sm font-semibold text-ink">
          {productName}
        </p>
        <p className="mt-1 text-xs text-muted">Studio photograph pending</p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-surface ${aspectClassName} ${className}`}
    >
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] ${imageClassName}`}
      />
    </div>
  );
}
