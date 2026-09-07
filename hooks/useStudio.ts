// Powered by OnSpace.AI
import { useContext } from 'react';
import { StudioContext } from '@/contexts/StudioContext';

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used within StudioProvider');
  return ctx;
}

