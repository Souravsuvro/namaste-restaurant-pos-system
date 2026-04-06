import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useSocket } from '@/hooks/useSocket';

export function Layout() {
  useSocket();

  return (
    <div className="h-screen flex overflow-hidden bg-navy">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
