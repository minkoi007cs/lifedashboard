import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import {
  Share2,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Users,
  Copy,
  Check,
} from 'lucide-react';
import { PageHeader, SurfaceCard } from '../components/ui/shell';
import { useToastStore } from '../store/toastStore';
import { SocialPostModal } from '../components/social/SocialPostModal';
import type {
  SocialChannel,
  SocialPost,
  SocialPlatform,
  SocialPostStatus,
} from '@life-dashboard/shared';
import { format } from 'date-fns';

export const SocialPage: React.FC = () => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const [activeTab, setActiveTab] = useState<'board' | 'channels' | 'ai-studio'>('board');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // AI Studio states
  const [aiTopic, setAiTopic] = useState('');
  const [aiPlatform, setAiPlatform] = useState<SocialPlatform>('tiktok');
  const [generatedResult, setGeneratedResult] = useState<{
    hook: string;
    caption: string;
    hashtags: string[];
  } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Queries
  const { data: channels = [] } = useQuery<SocialChannel[]>({
    queryKey: ['social-channels'],
    queryFn: async () => (await api.get('/api/v1/social/channels')).data,
  });

  const { data: posts = [] } = useQuery<SocialPost[]>({
    queryKey: ['social-posts'],
    queryFn: async () => (await api.get('/api/v1/social/posts')).data,
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SocialPostStatus }) =>
      api.patch(`/api/v1/social/posts/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      showToast('Đã cập nhật giai đoạn bài viết', 'success');
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/social/posts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      showToast('Đã xóa bài viết khỏi kế hoạch', 'info');
    },
  });

  const handleGenerateAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await api.post('/api/v1/social/ai-generate', {
        topic: aiTopic,
        platform: aiPlatform,
      });
      setGeneratedResult(res.data);
      showToast('AI đã hoàn tất kịch bản & caption!', 'success');
    } catch {
      showToast('Lỗi khi tạo kịch bản AI', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    showToast('Đã sao chép vào clipboard!', 'success');
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return '▶️';
      case 'tiktok':
        return '🎵';
      case 'facebook':
        return '📘';
      case 'instagram':
        return '📸';
      case 'linkedin':
        return '💼';
      case 'twitter':
        return '🐦';
      default:
        return '🌐';
    }
  };

  const totalFollowers = channels.reduce((acc, c) => acc + c.followersCount, 0);

  const COLUMNS: Array<{ id: SocialPostStatus; title: string; icon: string }> = [
    { id: 'idea', title: 'Ý tưởng (Idea)', icon: '💡' },
    { id: 'draft', title: 'Đang viết (Draft)', icon: '✍️' },
    { id: 'scheduled', title: 'Đã lên lịch (Scheduled)', icon: '📅' },
    { id: 'published', title: 'Đã xuất bản (Published)', icon: '✅' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Presence & Content"
        title="Social Media Hub & Content Studio"
        description="Lập kế hoạch nội dung đa nền tảng (YouTube, TikTok, Facebook, LinkedIn), trợ lý AI viết kịch bản & caption tối ưu tương tác, và theo dõi chỉ số tăng trưởng."
        icon={<Share2 className="h-6 w-6" />}
        actions={
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Soạn Bài Đăng Mới
          </button>
        }
      />

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tổng Followers
            </span>
            <Users className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {totalFollowers.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Kênh kết nối
            </span>
            <Share2 className="h-4 w-4 text-sky-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {channels.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Bài sắp lên sóng
            </span>
            <Calendar className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {posts.filter((p) => p.status === 'scheduled').length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Đã xuất bản
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {posts.filter((p) => p.status === 'published').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('board')}
          className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'board'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          🗂️ Bảng Kế Hoạch Nội Dung (Content Board)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('channels')}
          className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'channels'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          📡 Kênh Mạng Xã Hội ({channels.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai-studio')}
          className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'ai-studio'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          🤖 AI Content Studio
        </button>
      </div>

      {/* Tab 1: Content Workflow Kanban */}
      {activeTab === 'board' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {COLUMNS.map((col) => {
            const colPosts = posts.filter((p) => p.status === col.id);
            return (
              <div
                key={col.id}
                className="flex flex-col rounded-3xl border border-slate-200/70 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-900/40"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span>{col.icon}</span>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {col.title}
                    </h4>
                  </div>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {colPosts.length}
                  </span>
                </div>

                <div className="min-h-[450px] flex-1 space-y-3">
                  {colPosts.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-4 text-center dark:border-slate-800">
                      <p className="text-xs text-slate-400">Chưa có bài viết</p>
                    </div>
                  ) : (
                    colPosts.map((post) => (
                      <div
                        key={post.id}
                        className="group rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {post.platforms.map((p) => (
                              <span key={p} title={p} className="text-xs">
                                {getPlatformIcon(p)}
                              </span>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => deletePostMutation.mutate(post.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <h5 className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                          {post.title}
                        </h5>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                          {post.content}
                        </p>

                        {post.scheduledAt && (
                          <div className="mt-2.5 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                            <Calendar className="h-3 w-3" />
                            <span>Lên lịch: {format(new Date(post.scheduledAt), 'dd/MM HH:mm')}</span>
                          </div>
                        )}

                        {/* Fast Move Buttons */}
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                          {col.id === 'idea' && (
                            <button
                              type="button"
                              onClick={() =>
                                updateStatusMutation.mutate({ id: post.id, status: 'draft' })
                              }
                              className="ml-auto text-[10px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                              Viết kịch bản ➔
                            </button>
                          )}
                          {col.id === 'draft' && (
                            <button
                              type="button"
                              onClick={() =>
                                updateStatusMutation.mutate({ id: post.id, status: 'scheduled' })
                              }
                              className="ml-auto text-[10px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                              Lên lịch đăng ➔
                            </button>
                          )}
                          {col.id === 'scheduled' && (
                            <button
                              type="button"
                              onClick={() =>
                                updateStatusMutation.mutate({ id: post.id, status: 'published' })
                              }
                              className="ml-auto text-[10px] font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                            >
                              Đã xuất bản ✓
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Channels Management */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((chan) => (
            <SurfaceCard key={chan.id} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{getPlatformIcon(chan.platform)}</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  Hoạt động
                </span>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {chan.name}
                </h4>
                <p className="text-xs text-slate-400">{chan.handle}</p>
              </div>

              <div className="border-t border-slate-100 pt-3 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-100">
                    {chan.followersCount.toLocaleString()}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">
                    Followers / Subs
                  </p>
                </div>
                {chan.profileUrl && (
                  <a
                    href={chan.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Xem kênh ➔
                  </a>
                )}
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}

      {/* Tab 3: AI Content Studio */}
      {activeTab === 'ai-studio' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SurfaceCard className="p-5">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="h-5 w-5" />
                <h3 className="text-sm font-black uppercase tracking-wider">
                  Trợ Lý Sáng Tạo Nội Dung AI
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Nhập ý tưởng hoặc từ khóa chính, AI sẽ viết sẵn Hook 3 giây, nội dung caption và bộ hashtag tối ưu cho từng nền tảng.
              </p>

              <form onSubmit={handleGenerateAi} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Chọn Nền tảng
                  </label>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {[
                      { id: 'tiktok', label: 'TikTok' },
                      { id: 'youtube', label: 'YouTube' },
                      { id: 'facebook', label: 'Facebook' },
                      { id: 'linkedin', label: 'LinkedIn' },
                      { id: 'instagram', label: 'Instagram' },
                      { id: 'twitter', label: 'X (Twitter)' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setAiPlatform(p.id as SocialPlatform)}
                        className={`rounded-xl border py-2 text-xs font-bold transition ${
                          aiPlatform === p.id
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Chủ đề bài viết / video
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="VD: Cách mình quản lý tài chính và tiết kiệm 30% thu nhập mỗi tháng bằng ví tài chính LifeOS..."
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAiLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isAiLoading ? 'Đang tạo kịch bản...' : 'Tạo Kịch Bản & Caption Ngay'}</span>
                </button>
              </form>
            </SurfaceCard>
          </div>

          <div className="lg:col-span-7">
            {generatedResult ? (
              <SurfaceCard className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Kết quả từ Trợ lý AI ({aiPlatform.toUpperCase()})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(`${generatedResult.hook}\n\n${generatedResult.caption}\n\n${generatedResult.hashtags.join(' ')}`)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400"
                  >
                    {copiedCaption ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCaption ? 'Đã chép!' : 'Sao chép toàn bộ'}</span>
                  </button>
                </div>

                {/* Hook Box */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    🎯 Hook mở đầu (Giữ chân người xem trong 3s):
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                    {generatedResult.hook}
                  </p>
                </div>

                {/* Caption Box */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Nội dung Caption / Kịch bản:
                  </p>
                  <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs leading-6 text-slate-800 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
                    {generatedResult.caption}
                  </div>
                </div>

                {/* Hashtags */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Hashtags đề xuất:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {generatedResult.hashtags.map((h) => (
                      <span
                        key={h}
                        className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </SurfaceCard>
            ) : (
              <SurfaceCard className="flex flex-col items-center justify-center p-12 text-center h-full">
                <Sparkles className="h-10 w-10 text-indigo-300 dark:text-indigo-600" />
                <h4 className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                  AI Content Studio đã sẵn sàng
                </h4>
                <p className="mt-1 max-w-sm text-xs text-slate-400">
                  Hãy nhập chủ đề ở khung bên trái để nhận kịch bản, hook và hashtag chuẩn SEO ngay tức thì.
                </p>
              </SurfaceCard>
            )}
          </div>
        </div>
      )}

      <SocialPostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
