
import Logo from '@/components/logo';

export default function LoadingAnimation() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background dark:bg-gradient-to-br dark:from-[#1A1A1A] dark:to-[#000000] loading-container-animation">
      <div className="flex flex-col items-center gap-4">
        <Logo className="h-24 w-24 text-primary wayne-logo-animation" />
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-primary font-medium tracking-widest text-sm animate-pulse whitespace-nowrap">
          Alfred AI
        </div>
      </div>
    </div>
  );
}
