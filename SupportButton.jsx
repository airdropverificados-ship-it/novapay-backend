import React from 'react';
import { Headphones } from 'lucide-react';

export default function SupportButton() {
  return (
    <a
      href="https://t.me/Demobeta_bot"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed z-[999999] bottom-20 lg:bottom-5 right-4 flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 shadow-lg glow-primary text-sm font-medium hover:scale-105 transition-transform"
    >
      <Headphones className="w-4 h-4" />
      Contactar a Soporte
    </a>
  );
}