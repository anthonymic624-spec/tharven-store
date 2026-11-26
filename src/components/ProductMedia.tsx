import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface ProductMediaProps {
  src?: string;
  alt: string;
  productName: string;
  className?: string;
  aspectClassName?: string;
}

export function ProductMedia({
  src,
  alt,
  productName,
  className = '',
  aspectClassName = 'aspect-[4/5]',
}: ProductMediaProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center overflow-hidden bg-obsidian text-cream ${aspectClassName} ${className}`}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 35%, rgba(198,157,69,0.45), transparent 65%)',
          }}
        />
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center border border-gold/40 bg-charcoal text-gold">
            <ImageOff className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="font-display text-sm font-semibold tracking-wider text-cream uppercase">
            {productName}
          </p>
          <p className="mt-1 text-xs text-sand/75">
            Product photo pending upload
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-charcoal ${aspectClassName} ${className}`}
    >
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
      />
    </div>
  );
}
