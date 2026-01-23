'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Mic, Package, Settings, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { motion } from 'framer-motion';

// Nav items with fun names and individual accent colors
const navItems = [
  {
    id: 'chat',
    label: '魔法对话',
    shortLabel: '对话',
    subtitle: '与AI畅聊',
    icon: MessageSquare,
    path: '/chat',
    color: 'from-rose-400 to-pink-500',
    iconColor: 'text-rose-500',
    emoji: '💬'
  },
  {
    id: 'studio',
    label: '声音画室',
    shortLabel: '画室',
    subtitle: '文字变声音',
    icon: Mic,
    path: '/studio',
    color: 'from-cyan-400 to-blue-500',
    iconColor: 'text-cyan-500',
    emoji: '🎨'
  },
  {
    id: 'depot',
    label: '声音宝库',
    shortLabel: '宝库',
    subtitle: '收藏与管理',
    icon: Package,
    path: '/depot',
    color: 'from-violet-400 to-purple-500',
    iconColor: 'text-violet-500',
    emoji: '📦'
  },
  {
    id: 'settings',
    label: '魔法设置',
    shortLabel: '设置',
    subtitle: '调整参数',
    icon: Settings,
    path: '/settings',
    color: 'from-amber-400 to-orange-500',
    iconColor: 'text-amber-500',
    emoji: '⚙️'
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useGlobalStore();

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={`
          hidden md:flex fixed left-0 top-0 h-screen flex-col
          glass-sidebar
          transition-all duration-300 ease-in-out z-50
          ${sidebarCollapsed ? 'w-20' : 'lg:w-64 w-20'}
        `}
      >
        {/* Header with cartoon-style brand */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-white/30">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden lg:flex items-center gap-2"
            >
              {/* Bouncing icon */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles size={24} className="text-amber-400" />
              </motion.div>
              {/* Cartoon-style brand name */}
              <div className="flex flex-col">
                <span
                  className="text-xl font-black tracking-tight"
                  style={{
                    background: 'linear-gradient(135deg, #f472b6, #a855f7, #3b82f6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '2px 2px 0 rgba(0,0,0,0.1)',
                    fontFamily: '"Comic Sans MS", "Chalkboard", "Marker Felt", cursive',
                  }}
                >
                  声音工坊
                </span>
                <span className="text-[10px] text-slate-400 -mt-1">Voice Workshop</span>
              </div>
            </motion.div>
          )}
          {(sidebarCollapsed || true) && (
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={sidebarCollapsed ? 'mx-auto' : 'lg:hidden mx-auto'}
            >
              <Sparkles size={24} className="text-amber-400" />
            </motion.div>
          )}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleSidebar}
            className="hidden lg:flex p-2 hover:bg-white/40 rounded-xl transition-colors cursor-pointer backdrop-blur-sm"
            aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={20} className="text-slate-600" />
            ) : (
              <ChevronLeft size={20} className="text-slate-600" />
            )}
          </motion.button>
        </div>

        {/* Navigation with candy-colored icons */}
        <nav className="flex-1 p-3 space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <motion.div
                key={item.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={item.path}>
                  <motion.div
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-2xl
                      transition-all duration-200 cursor-pointer
                      ${isActive
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                        : 'text-slate-600 hover:bg-white/50 hover:text-slate-800'
                      }
                      ${sidebarCollapsed ? 'justify-center lg:justify-center' : 'lg:justify-start justify-center'}
                    `}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <motion.div
                      whileHover={{ rotate: isActive ? 0 : 10 }}
                      className={`flex-shrink-0 ${!isActive ? item.iconColor : ''}`}
                    >
                      <Icon size={22} />
                    </motion.div>
                    {!sidebarCollapsed && (
                      <div className="hidden lg:flex flex-col">
                        <span className="text-sm font-bold">{item.label}</span>
                        <span className={`text-[10px] ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                          {item.subtitle}
                        </span>
                      </div>
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Footer with version info */}
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="hidden lg:block p-4 border-t border-white/30"
          >
            <div className="text-xs text-center">
              <span
                className="font-bold"
                style={{
                  background: 'linear-gradient(135deg, #f472b6, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: '"Comic Sans MS", cursive',
                }}
              >
                声音工坊
              </span>
              <span className="text-slate-400"> v1.0</span>
            </div>
          </motion.div>
        )}
      </motion.aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-container-solid rounded-none border-t border-white/30 safe-bottom">
        <div className="flex justify-around items-center h-14 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link key={item.id} href={item.path} className="flex-1">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`
                    flex flex-col items-center justify-center py-2 px-1 rounded-xl
                    transition-all duration-200
                    ${isActive
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg mx-1`
                      : 'text-slate-500'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-white' : 'text-slate-500'}`}>
                    {item.shortLabel}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
