import React, { useRef, useEffect, useState } from 'react';
import { Shield, Eye, MousePointer2, X, UserCircle } from 'lucide-react';

/**
 * RemoteRequestPopover — AnyDesk-style compact request panel
 * Attached above the Pointer icon in the meeting control bar.
 */
export default function RemoteRequestPopover({
    requests = [],
    isOpen,
    onClose,
    onAccept,
    onReject,
}) {
    const panelRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                onClose();
            }
        };
        // Delay to avoid the same click that opens also closing
        const id = setTimeout(() => document.addEventListener('mousedown', handler), 0);
        return () => {
            clearTimeout(id);
            document.removeEventListener('mousedown', handler);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={panelRef}
            className="remote-request-popover"
            style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                marginBottom: 12,
                width: 370,
                maxHeight: 400,
                zIndex: 100,
            }}
        >
            {/* Glass panel */}
            <div
                style={{
                    background: 'rgba(15, 23, 42, 0.92)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: 16,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px 10px',
                        borderBottom: '1px solid rgba(148,163,184,0.1)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Shield size={16} style={{ color: '#818cf8' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                            Remote Access Requests
                        </span>
                        {requests.length > 0 && (
                            <span
                                style={{
                                    background: '#ef4444',
                                    color: '#fff',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    borderRadius: 10,
                                    padding: '1px 7px',
                                    lineHeight: '16px',
                                }}
                            >
                                {requests.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#e2e8f0')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: requests.length > 0 ? '8px 12px 12px' : '24px 16px',
                        maxHeight: 310,
                    }}
                >
                    {requests.length === 0 ? (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 8,
                                color: '#64748b',
                            }}
                        >
                            <Shield size={28} style={{ opacity: 0.4 }} />
                            <span style={{ fontSize: 12, fontWeight: 500 }}>No pending requests</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {requests.map((req) => (
                                <RequestCard
                                    key={req.sessionId}
                                    request={req}
                                    onAccept={onAccept}
                                    onReject={onReject}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function RequestCard({ request, onAccept, onReject }) {
    const [accessType, setAccessType] = useState(request.accessType || 'control');

    return (
        <div
            style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(148,163,184,0.1)',
                borderRadius: 12,
                padding: '12px 14px',
                transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(129,140,248,0.3)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(129,140,248,0.08)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(148,163,184,0.1)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {/* User info row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <UserCircle size={20} style={{ color: '#fff' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#e2e8f0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {request.callerName || 'Unknown User'}
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 500, marginTop: 1 }}>
                        Participant · Requesting Control
                    </div>
                </div>
            </div>

            {/* Access type selector */}
            <div
                style={{
                    display: 'flex',
                    gap: 6,
                    marginBottom: 12,
                    background: 'rgba(15,23,42,0.5)',
                    borderRadius: 8,
                    padding: 3,
                }}
            >
                <AccessTypeButton
                    active={accessType === 'view'}
                    onClick={() => setAccessType('view')}
                    icon={<Eye size={13} />}
                    label="View Only"
                />
                <AccessTypeButton
                    active={accessType === 'control'}
                    onClick={() => setAccessType('control')}
                    icon={<MousePointer2 size={13} />}
                    label="Full Control"
                />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
                <button
                    onClick={() => onReject(request.sessionId)}
                    style={{
                        flex: 1,
                        padding: '7px 0',
                        borderRadius: 8,
                        border: '1px solid rgba(148,163,184,0.15)',
                        background: 'rgba(51, 65, 85, 0.5)',
                        color: '#cbd5e1',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                        e.currentTarget.style.color = '#fca5a5';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(51, 65, 85, 0.5)';
                        e.currentTarget.style.borderColor = 'rgba(148,163,184,0.15)';
                        e.currentTarget.style.color = '#cbd5e1';
                    }}
                >
                    Reject
                </button>
                <button
                    onClick={() => onAccept(request.sessionId, accessType)}
                    style={{
                        flex: 1,
                        padding: '7px 0',
                        borderRadius: 8,
                        border: 'none',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.45)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(16,185,129,0.3)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    Accept
                </button>
            </div>
        </div>
    );
}

function AccessTypeButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '6px 8px',
                borderRadius: 6,
                border: 'none',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: active ? 'rgba(99,102,241,0.25)' : 'transparent',
                color: active ? '#a5b4fc' : '#64748b',
                boxShadow: active ? '0 0 0 1px rgba(99,102,241,0.3)' : 'none',
            }}
        >
            {icon}
            {label}
        </button>
    );
}
