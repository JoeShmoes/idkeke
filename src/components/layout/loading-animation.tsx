
import Logo from '@/components/logo';

export default function LoadingAnimation() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background dark:bg-gradient-to-br dark:from-[#1A1A1A] dark:to-[#000000] loading-container-animation">
      <div className="flex flex-col items-center gap-4">
        <Logo className="h-24 w-24 text-primary wayne-logo-animation" />
        <h1 className="text-3xl font-semibold text-foreground opacity-0 wayne-text-animation">
          Nexaris Module
        </h1>
      </div>
    </div>
  );
}
