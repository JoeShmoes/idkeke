import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function copyToClipboard(text: string) {
  try {
    if (!document.hasFocus()) return;

    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Clipboard blocked:", err);
  }
}
