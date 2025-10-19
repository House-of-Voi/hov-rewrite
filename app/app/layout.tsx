import React from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8">
      {children}
    </div>
  );
}
