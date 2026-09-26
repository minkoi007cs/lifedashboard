import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import {
  X,
  Cpu,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Terminal,
  RefreshCw,
  Code2,
} from 'lucide-react';
import { useToastStore } from '../../store/toastStore';
import type { MailMcpStatus } from '@life-dashboard/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const McpServerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const showToast = useToastStore((state) => state.showToast);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [isTestingTool, setIsTestingTool] = useState(false);
  const [testResponse, setTestResponse] = useState<string | null>(null);

  const { data: mcpStatus, isLoading, refetch } = useQuery<MailMcpStatus>({
    queryKey: ['mail-mcp-status'],
    queryFn: async () => (await api.get('/api/v1/mail/mcp/status')).data,
    enabled: isOpen,
  });

  const configSnippet = JSON.stringify(
    {
      mcpServers: {
        'life-mail-hub': {
          url: 'http://localhost:3000/api/v1/mail/mcp',
          description: 'LifeDashboard Smart Mail Copilot MCP Server',
        },
      },
    },
    null,
    2,
  );

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(configSnippet);
    setCopiedConfig(true);
    showToast('Đã sao chép cấu hình MCP Server vào clipboard!', 'success');
    setTimeout(() => setCopiedConfig(false), 2500);
  };

  const handleTestPing = async () => {
    setIsTestingTool(true);
    setTestResponse(null);
    try {
      const res = await api.post('/api/v1/mail/mcp/call', {
        tool: 'fetch_unread_emails',
        arguments: { limit: 2 },
      });
      setTestResponse(JSON.stringify(res.data, null, 2));
      showToast('Kiểm thử gọi MCP Tool thành công!', 'success');
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setTestResponse(`Lỗi: ${e.response?.data?.message || e.message}`);
      showToast('Kiểm thử MCP thất bại', 'error');
    } finally {
      setIsTestingTool(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="themed-surface relative w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 transition-all max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Model Context Protocol (MCP) Server
                </h2>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đang hoạt động
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kết nối Smart Mail với các AI Agent (Antigravity, Claude Desktop, Cursor) qua chuẩn MCP.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status Metric Card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Giao thức MCP
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                {mcpStatus?.protocolVersion || '2024-11-05'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Hòm thư kết nối
              </p>
              <p className="mt-1 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {mcpStatus?.activeAccountsCount || 0} tài khoản
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Công cụ (Tools)
              </p>
              <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {mcpStatus?.supportedTools.length || 7} Tools kích hoạt
              </p>
            </div>
          </div>

          {/* Tools Registry */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Danh mục MCP Tools đã đăng ký
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
              {(mcpStatus?.supportedTools || [
                { name: 'list_mail_accounts', description: 'Liệt kê tất cả tài khoản Gmail & Outlook' },
                { name: 'fetch_unread_emails', description: 'Đọc email chưa đọc kèm lọc theo phân loại AI' },
                { name: 'summarize_email', description: 'Tóm tắt sâu TL;DR và trích xuất danh sách việc cần làm' },
                { name: 'classify_email', description: 'Tự động phân loại: Học vấn, Công việc, Thư rác, Quảng cáo' },
                { name: 'clean_spam', description: 'Quét và dọn sạch thư rác & quảng cáo chỉ với 1 lệnh' },
                { name: 'convert_to_task', description: 'Chuyển email thành nhiệm vụ vào hệ thống Tasks' },
                { name: 'draft_reply', description: 'Sinh bản nháp phản hồi AI chuyên nghiệp' },
              ]).map((t) => (
                <div key={t.name} className="p-3 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <code className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-md">
                      {t.name}
                    </code>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {t.description}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          </div>

          {/* Config Snippet */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-indigo-500" />
                Cấu hình Claude Desktop & Cursor (claude_desktop_config.json)
              </p>
              <button
                type="button"
                onClick={handleCopyConfig}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-xs hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
              >
                {copiedConfig ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    Đã chép
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Sao chép JSON
                  </>
                )}
              </button>
            </div>
            <pre className="rounded-2xl bg-slate-900 p-3.5 text-[11px] font-mono text-emerald-400 overflow-x-auto border border-slate-800">
              {configSnippet}
            </pre>
          </div>

          {/* Live Test Panel */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-slate-500" />
                Thử nghiệm gọi MCP Tool trực tiếp
              </p>
              <button
                type="button"
                onClick={handleTestPing}
                disabled={isTestingTool}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
              >
                {isTestingTool ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                Gọi thử tool fetch_unread_emails
              </button>
            </div>

            {testResponse && (
              <pre className="mt-2 rounded-2xl bg-slate-950 p-3.5 text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800 max-h-48">
                {testResponse}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-200 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
