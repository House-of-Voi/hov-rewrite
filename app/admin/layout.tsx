import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-8">{children}</div>;
}
