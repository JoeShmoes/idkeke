'use client';
import { cn } from "@/lib/utils";

export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
    >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M40,0 L65,14 V42 L55,36 V20 L40,28 L25,20 V48 L15,42 V14 L40,0 Z M40,56 L55,48 V64 L40,72 L25,64 V48 L40,56 Z M40,80 L65,66 V58 L40,72 V80 Z M15,58 L25,64 V70 L15,64 V58 Z"
            fill="currentColor"
        />
    </svg>
  );
}
