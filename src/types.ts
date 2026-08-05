import React from 'react';

export type Category = 
  | 'All' 
  | 'Base UI Primitives' 
  | 'Dashboards' 
  | 'SaaS & Pricing' 
  | 'Settings & Modals' 
  | 'Fintech & Cards';

export interface MockupItem {
  id: string;
  title: string;
  category: Exclude<Category, 'All'>;
  description: string;
  tags: string[];
  version: string;
  updatedAt: string;
  component: React.ComponentType;
  codeSnippet: string;
  previewGradient?: string;
}

export type ViewportMode = '100%' | '1440px' | '768px' | '375px';
