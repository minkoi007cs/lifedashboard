import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('favicon.ico')
  @Header('Content-Type', 'image/svg+xml')
  getFavicon(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff007f" />
      <stop offset="50%" stop-color="#7928ca" />
      <stop offset="100%" stop-color="#00dfd8" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect x="24" y="24" width="464" height="464" rx="128" fill="url(#bgGrad)" />
  <rect x="40" y="40" width="432" height="432" rx="112" fill="none" stroke="#ffffff" stroke-width="8" stroke-opacity="0.15" />
  <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="190" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" filter="url(#glow)" letter-spacing="-10">LD</text>
  <circle cx="360" cy="180" r="16" fill="#ffffff" filter="url(#glow)" />
</svg>`;
  }
}
