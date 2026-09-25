import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { X, Sparkles } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';
import type {
  CreateSocialPostDto,
  SocialPlatform,
  SocialPostStatus,
} from '@life-dashboard/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PLATFORMS: Array<{ id: SocialPlatform; label: string; icon: string }> = [
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'facebook', label: 'Facebook', icon: '📘' },
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'twitter', label: 'X (Twitter)', icon: '🐦' },
];

export const SocialPostModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['facebook']);
  const [status, setStatus] = useState<SocialPostStatus>('idea');
  const [scheduledAt, setScheduledAt] = useState('');
  const [hashtagsStr, setHashtagsStr] = useState('#LifeOS, #Productivity');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const createPostMutation = useMutation({
    mutationFn: async (data: CreateSocialPostDto) =>
      api.post('/api/v1/social/posts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['social-overview'] });
      showToast('Đã lưu bài viết vào kế hoạch nội dung!', 'success');
      onClose();
      setTitle('');
      setContent('');
    },
    onError: () => {
      showToast('Không thể lưu bài viết. Vui lòng thử lại.', 'error');
    },
  });

  const togglePlatform = (p: SocialPlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p],
    );
  };

  const handleAiGenerate = async () => {
    if (!title.trim()) {
      showToast('Vui lòng nhập chủ đề bài viết trước', 'error');
      return;
    }
    setIsAiGenerating(true);
    try {
      const res = await api.post('/api/v1/social/ai-generate', {
        topic: title,
        platform: selectedPlatforms[0] || 'facebook',
      });
      setContent(res.data.caption);
      if (res.data.hashtags) {
        setHashtagsStr(res.data.hashtags.join(', '));
      }
      showToast('AI đã tạo caption và hook tối ưu!', 'success');
    } catch {
      showToast('Lỗi khi gọi AI. Vui lòng thử lại.', 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const hashtags = hashtagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    createPostMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['facebook'],
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      hashtags,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="themed-surface relative w-full max-w-lg rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Soạn Bài Đăng Mạng Xã Hội Mới
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Platform Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Nền tảng đăng tải (chọn nhiều)
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const isSelected = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-xs dark:bg-indigo-950/80 dark:text-indigo-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Topic */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tiêu đề / Chủ đề bài viết
              </label>
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={isAiGenerating}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                <Sparkles className="h-3 w-3" />
                <span>{isAiGenerating ? 'AI đang viết...' : 'AI gợi ý Caption'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: 3 thói quen buổi sáng thay đổi năng lượng ngày mới"
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {/* Content / Caption */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Nội dung Caption & Kịch bản
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung bài viết, hook video hoặc để AI hỗ trợ..."
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {/* Hashtags & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Hashtags
              </label>
              <input
                type="text"
                value={hashtagsStr}
                onChange={(e) => setHashtagsStr(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Giai đoạn (Status)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SocialPostStatus)}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="idea">💡 Ý tưởng (Idea)</option>
                <option value="draft">✍️ Đang viết (Draft)</option>
                <option value="scheduled">📅 Đã lên lịch (Scheduled)</option>
                <option value="published">✅ Đã đăng (Published)</option>
              </select>
            </div>
          </div>

          {/* Scheduled Time */}
          {status === 'scheduled' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Thời gian đăng dự kiến
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createPostMutation.isPending}
              className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 disabled:opacity-50"
            >
              Lưu vào Lịch Nội dung
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
