import React, { useState } from 'react';
import { Factory } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  aspectClass?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  aspectClass = 'aspect-[4/3]',
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`${aspectClass} w-full bg-gradient-to-br from-[#F0F7F2] via-[#FAFBF9] to-[#E6EFE8] border border-[#E2E8E3] flex flex-col items-center justify-center p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Factory className="w-8 h-8 text-[#14532D]/40 mb-2" strokeWidth={1.5} />
        <span className="text-xs text-[#47544D] font-medium max-w-[220px] line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <div className={`${aspectClass} w-full overflow-hidden bg-[#F0F7F2] ${className}`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
