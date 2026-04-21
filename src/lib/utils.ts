import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateDeviceId(): string {
  // Simple device fingerprinting helper
  const userAgent = navigator.userAgent;
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const language = navigator.language;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let canvasData = '';
  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125,1,62,20);
    ctx.fillStyle = "#069";
    ctx.fillText("CourseCore-DeviceID", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("CourseCore-DeviceID", 4, 17);
    canvasData = canvas.toDataURL();
  }
  
  const hashStr = `${userAgent}-${screenRes}-${language}-${canvasData}`;
  let hash = 0;
  for (let i = 0; i < hashStr.length; i++) {
    const char = hashStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `CC-${Math.abs(hash).toString(16)}`;
}
