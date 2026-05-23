import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { X, UserPlus, Users, Send, Check, XCircle, Trash2 } from 'lucide-react';
import { ActionButton, SoftButton } from '../ui/shell';

interface ShareUser {
    id: string;
    name: string;
    email: string;
}

interface SentShare {
    id: string;
    sharedWithEmail: string;
    sharedWithId: string;
    sharedWith: ShareUser;
    permission: 'view' | 'edit';
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

interface ReceivedShare {
    id: string;
    ownerId: string;
    owner: ShareUser;
    permission: 'view' | 'edit';
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

const getErrorMessage = (err: unknown) => {
    if (typeof err === 'object' && err !== null) {
        const response = 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response
            : undefined;
        if (response?.data?.message) return response.data.message;
        const message = 'message' in err ? (err as { message?: string }).message : undefined;
        if (message) return message;
    }
    return 'Unknown error';
};

const statusBadge = (status: string) => {
    if (status === 'accepted') return (
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Accepted
        </span>
    );
    if (status === 'pending') return (
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Pending
        </span>
    );
    return (
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400">
            Rejected
        </span>
    );
};

const permissionBadge = (permission: string) => (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
        permission === 'edit'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
    }`}>
        {permission === 'edit' ? 'Can Edit' : 'View Only'}
    </span>
);

interface Props {
    onClose: () => void;
}

export const FinanceShareModal: React.FC<Props> = ({ onClose }) => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
    const [inviteEmail, setInviteEmail] = useState('');
    const [invitePermission, setInvitePermission] = useState<'view' | 'edit'>('view');

    const invalidateShares = () => {
        queryClient.invalidateQueries({ queryKey: ['finance-shares-sent'] });
        queryClient.invalidateQueries({ queryKey: ['finance-shares-received'] });
    };

    const { data: sentShares = [], isLoading: loadingSent } = useQuery<SentShare[]>({
        queryKey: ['finance-shares-sent'],
        queryFn: async () => {
            const res = await api.get('/api/v1/finance/share/sent');
            return res.data;
        },
    });

    const { data: receivedShares = [], isLoading: loadingReceived } = useQuery<ReceivedShare[]>({
        queryKey: ['finance-shares-received'],
        queryFn: async () => {
            const res = await api.get('/api/v1/finance/share/received');
            return res.data;
        },
    });

    const inviteMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/api/v1/finance/share', {
                email: inviteEmail.trim(),
                permission: invitePermission,
            });
            return res.data;
        },
        onSuccess: () => {
            setInviteEmail('');
            invalidateShares();
        },
        onError: (err) => {
            alert('Failed to send invite: ' + getErrorMessage(err));
        },
    });

    const acceptMutation = useMutation({
        mutationFn: async (shareId: string) => {
            const res = await api.patch(`/api/v1/finance/share/${shareId}/accept`);
            return res.data;
        },
        onSuccess: invalidateShares,
        onError: (err) => alert('Failed to accept: ' + getErrorMessage(err)),
    });

    const rejectMutation = useMutation({
        mutationFn: async (shareId: string) => {
            const res = await api.patch(`/api/v1/finance/share/${shareId}/reject`);
            return res.data;
        },
        onSuccess: invalidateShares,
        onError: (err) => alert('Failed to reject: ' + getErrorMessage(err)),
    });

    const revokeMutation = useMutation({
        mutationFn: async (shareId: string) => {
            const res = await api.delete(`/api/v1/finance/share/${shareId}`);
            return res.data;
        },
        onSuccess: invalidateShares,
        onError: (err) => alert('Failed to revoke: ' + getErrorMessage(err)),
    });

    const pendingReceived = receivedShares.filter(s => s.status === 'pending');
    const activeReceived = receivedShares.filter(s => s.status === 'accepted');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Finance Sharing</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                            activeTab === 'sent'
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        Share Access
                        {sentShares.filter(s => s.status !== 'rejected').length > 0 && (
                            <span className="ml-1.5 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                                {sentShares.filter(s => s.status !== 'rejected').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('received')}
                        className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                            activeTab === 'received'
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        Invites Received
                        {pendingReceived.length > 0 && (
                            <span className="ml-1.5 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                                {pendingReceived.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5">
                    {activeTab === 'sent' && (
                        <>
                            {/* Invite form */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                    <UserPlus className="w-4 h-4 text-blue-500" />
                                    Invite someone
                                </h3>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    placeholder="Enter their account email..."
                                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-300 dark:focus:border-blue-700 transition-colors"
                                />
                                <div className="flex gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="permission"
                                            value="view"
                                            checked={invitePermission === 'view'}
                                            onChange={() => setInvitePermission('view')}
                                            className="accent-blue-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">View only</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="permission"
                                            value="edit"
                                            checked={invitePermission === 'edit'}
                                            onChange={() => setInvitePermission('edit')}
                                            className="accent-blue-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Can edit</span>
                                    </label>
                                </div>
                                <ActionButton
                                    onClick={() => inviteMutation.mutate()}
                                    disabled={!inviteEmail.trim() || inviteMutation.isPending}
                                    className="w-full"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                                </ActionButton>
                            </div>

                            {/* Sent shares list */}
                            {loadingSent ? (
                                <div className="space-y-2">
                                    {[1, 2].map(n => <div key={n} className="h-14 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-800" />)}
                                </div>
                            ) : sentShares.filter(s => s.status !== 'rejected').length === 0 ? (
                                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No active shares yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">People with access</h3>
                                    {sentShares.filter(s => s.status !== 'rejected').map(share => (
                                        <div key={share.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                    {share.sharedWith?.name || share.sharedWithEmail}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{share.sharedWithEmail}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    {permissionBadge(share.permission)}
                                                    {statusBadge(share.status)}
                                                </div>
                                            </div>
                                            <SoftButton
                                                onClick={() => {
                                                    if (window.confirm(`Remove access for ${share.sharedWith?.name || share.sharedWithEmail}?`)) {
                                                        revokeMutation.mutate(share.id);
                                                    }
                                                }}
                                                disabled={revokeMutation.isPending}
                                                className="ml-3 shrink-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </SoftButton>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'received' && (
                        <>
                            {loadingReceived ? (
                                <div className="space-y-2">
                                    {[1, 2].map(n => <div key={n} className="h-14 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-800" />)}
                                </div>
                            ) : receivedShares.length === 0 ? (
                                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No invites received yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {pendingReceived.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pending invites</h3>
                                            {pendingReceived.map(share => (
                                                <div key={share.id} className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                                {share.owner?.name || share.owner?.email}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{share.owner?.email}</p>
                                                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                                                wants to share their finance with you
                                                            </p>
                                                            <div className="mt-1">{permissionBadge(share.permission)}</div>
                                                        </div>
                                                        <div className="flex gap-2 shrink-0">
                                                            <SoftButton
                                                                onClick={() => acceptMutation.mutate(share.id)}
                                                                disabled={acceptMutation.isPending}
                                                                className="text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </SoftButton>
                                                            <SoftButton
                                                                onClick={() => rejectMutation.mutate(share.id)}
                                                                disabled={rejectMutation.isPending}
                                                                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </SoftButton>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {activeReceived.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Finance you can access</h3>
                                            {activeReceived.map(share => (
                                                <div key={share.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                            {share.owner?.name || share.owner?.email}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{share.owner?.email}</p>
                                                        <div className="mt-1">{permissionBadge(share.permission)}</div>
                                                    </div>
                                                    <SoftButton
                                                        onClick={() => {
                                                            if (window.confirm('Leave this shared finance? You will lose access.')) {
                                                                revokeMutation.mutate(share.id);
                                                            }
                                                        }}
                                                        disabled={revokeMutation.isPending}
                                                        className="ml-3 shrink-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs"
                                                    >
                                                        Leave
                                                    </SoftButton>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
