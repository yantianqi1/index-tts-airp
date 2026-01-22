'use client';

import { usePathname, useRouter } from 'next/navigation';
import { MessageSquare, Mic, Package, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';

const navItems = [
  { id: 'chat', label: 'AI 语音对话', icon: MessageSquare, path: '/chat' },
  { id: 'studio', label: '文本转语音', icon: Mic, path: '/studio' },
  { id: 'depot', label: '语音仓库', icon: Package, path: '/depot' },
  { id: 'settings', label: '全局设置', icon: Settings, path: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebar } = useGlobalStore();

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-800
        transition-all duration-300 ease-in-out z-50
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!sidebarCollapsed && (
          <h1 className="text-lg font-semibold text-white">Voice AI</h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={20} className="text-slate-400" />
          ) : (
            <ChevronLeft size={20} className="text-slate-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-lg
                transition-all duration-200 cursor-pointer
                ${isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }
                ${sidebarCollapsed ? 'justify-center' : ''}
              `}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="text-xs text-slate-500 text-center">
            Voice AI Workbench v1.0
          </div>
        </div>
      )}
    </aside>
  );
}
