import React from 'react';
import { useMeetingRemoteControl } from '../../../components/calling/meetingRemoteControlContext';

const AgentStatusBanner = () => {
    const { agentStatus, provisionAgent } = useMeetingRemoteControl();

    const getStatusConfig = () => {
        switch (agentStatus) {
            case 'online':
                return {
                    label: 'DeskLink Agent Active',
                    dotClass: 'pulse-green',
                    bannerClass: 'online',
                    showBtn: false
                };
            case 'provisioning':
                return {
                    label: 'Provisioning Agent...',
                    dotClass: 'spinner-small',
                    bannerClass: 'provisioning',
                    showBtn: false
                };
            case 'offline':
                return {
                    label: 'Agent Offline',
                    dotClass: 'red',
                    bannerClass: 'offline',
                    btnLabel: 'Reconnect',
                    onClick: provisionAgent
                };
            case 'disconnected':
            default:
                return {
                    label: 'Agent Not Detected',
                    dotClass: 'gray',
                    bannerClass: 'disconnected',
                    btnLabel: 'Download',
                    onClick: () => window.open('/download-agent', '_blank')
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div className={`agent-status-banner ${config.bannerClass}`}>
            <div className={`status-dot ${config.dotClass}`}></div>
            <span className="status-text">{config.label}</span>
            {config.btnLabel && (
                <button onClick={config.onClick} className="provision-btn">
                    {config.btnLabel}
                </button>
            )}
        </div>
    );
};

export default AgentStatusBanner;
