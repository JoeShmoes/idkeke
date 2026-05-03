'use client';

import { useEffect, useRef } from 'react';

interface GoogleAdBannerProps {
  /** AdSense ad slot ID – get this from your AdSense account after creating an ad unit */
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  fullWidthResponsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

/**
 * GoogleAdBanner
 * Renders a single Google AdSense ad unit.
 *
 * Usage:
 *   <GoogleAdBanner adSlot="XXXXXXXXXX" adFormat="auto" fullWidthResponsive />
 *
 * Important:
 *   - Replace the adSlot value with a real slot ID from your AdSense account.
 *   - The global AdSense <script> is already loaded in src/app/layout.tsx.
 *   - Ads will only show after Google approves the site. In the meantime the
 *     space will be empty/invisible.
 */
export default function GoogleAdBanner({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
  style,
}: GoogleAdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    // Guard: only push once
    if (pushed.current) return;
    
    // Defer pushing the ad until the container actually has a width.
    // This prevents "No slot size for availableWidth=0" when ads are rendered
    // inside Dialogs or hidden panels that start with 0 width.
    const attemptPush = () => {
      if (!adRef.current) return;
      if (adRef.current.offsetWidth > 0) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushed.current = true;
        } catch (err) {
          // Silently ignore – happens in dev/localhost environments
        }
      } else {
        setTimeout(attemptPush, 100);
      }
    };

    // Run first check
    const timer = setTimeout(attemptPush, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={adRef} className={className} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...(style || {}) }}
        data-ad-client="ca-pub-9962241770739113"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </div>
  );
}
