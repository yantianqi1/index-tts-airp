'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, Users, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { fetchQueueStatus, QueueStatus } from '@/utils/ttsApi';
import { motion, AnimatePresence } from 'framer-motion';

interface QueueMonitorProps {
  collapsed?: boolean;
}

export default function QueueMonitor({ collapsed = false }: QueueMonitorProps) {
  const { tts } = useGlobalStore();
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const data = await fetchQueueStatus(tts.baseUrl);
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('连接失败');
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [tts.baseUrl]);

  useEffect(() => {
    loadStatus();
    // 每3秒刷新一次状态
    const interval = setInterval(loadStatus, 3000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  // 计算队列百分比
  const queuePercentage = status
    ? Math.round((status.queue_length / status.max_queue_size) * 100)
    : 0;

  // 根据队列状态决定颜色
  const getStatusColor = () => {
    if (error) return 'from-slate-400 to-slate-500';
    if (!status) return 'from-slate-400 to-slate-500';
    if (!status.can_submit) return 'from-rose-400 to-pink-500';
    if (queuePercentage >= 80) return 'from-amber-400 to-orange-500';
    if (queuePercentage >= 50) return 'from-yellow-400 to-amber-500';
    return 'from-emerald-400 to-teal-500';
  };

  const getStatusText = () => {
    if (error) return '离线';
    if (!status) return '检测中';
    if (!status.can_submit) return '队列已满';
    if (status.is_processing) return '处理中';
    return '空闲';
  };

  // 收起状态 - 只显示图标
  if (collapsed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative p-2 mx-auto"
        title={`队列: ${status?.queue_length || 0}/${status?.max_queue_size || 50}`}
      >
        <div
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            bg-gradient-to-br ${getStatusColor()}
            shadow-lg
          `}
        >
          {isLoading ? (
            <Loader2 size={18} className="text-white animate-spin" />
          ) : error ? (
            <XCircle size={18} className="text-white" />
          ) : (
            <Activity size={18} className="text-white" />
          )}
        </div>
        {/* 队列数量徽章 */}
        {status && status.queue_length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
                       bg-white rounded-full text-[10px] font-bold
                       flex items-center justify-center shadow-md
                       text-slate-700"
          >
            {status.queue_length}
          </motion.span>
        )}
      </motion.div>
    );
  }

  // 展开状态 - 完整显示
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-3 mb-3 p-3 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 shadow-sm"
    >
      {/* 标题行 */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`
            w-7 h-7 rounded-lg flex items-center justify-center
            bg-gradient-to-br ${getStatusColor()}
            shadow-sm
          `}
        >
          {isLoading ? (
            <Loader2 size={14} className="text-white animate-spin" />
          ) : (
            <Activity size={14} className="text-white" />
          )}
        </div>
        <span className="text-xs font-bold text-slate-600">项目监控</span>
        <span
          className={`
            ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full
            ${error
              ? 'bg-slate-100 text-slate-500'
              : status?.can_submit
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-rose-100 text-rose-600'
            }
          `}
        >
          {getStatusText()}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-slate-400 text-center py-2"
          >
            <XCircle size={16} className="mx-auto mb-1 text-slate-400" />
            服务未连接
          </motion.div>
        ) : status ? (
          <motion.div
            key="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 队列进度条 */}
            <div className="relative h-2 bg-slate-200/60 rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${queuePercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${getStatusColor()}`}
              />
            </div>

            {/* 队列数据 */}
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1 text-slate-500">
                <Users size={12} />
                <span>队列</span>
              </div>
              <div className="font-bold">
                <span className={`${!status.can_submit ? 'text-rose-500' : 'text-slate-700'}`}>
                  {status.queue_length}
                </span>
                <span className="text-slate-400">/{status.max_queue_size}</span>
              </div>
            </div>

            {/* 提交状态提示 */}
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/40">
              {status.can_submit ? (
                <>
                  <CheckCircle size={12} className="text-emerald-500" />
                  <span className="text-[10px] text-emerald-600">可以提交语音请求</span>
                </>
              ) : (
                <>
                  <XCircle size={12} className="text-rose-500" />
                  <span className="text-[10px] text-rose-600">队列已满，请稍后重试</span>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-2"
          >
            <Loader2 size={16} className="text-slate-400 animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
