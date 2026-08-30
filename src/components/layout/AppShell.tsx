import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppShell() {
  return (
    <div className="aegis-shell">
      <Header />
      <Sidebar />
      <main className="aegis-main">
        <Outlet />
      </main>
    </div>
  );
}
