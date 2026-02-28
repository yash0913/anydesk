import React from 'react';
import ScreenShareTile from './ScreenShareTile.jsx';
import ParticipantTile from './ParticipantTile.jsx';
import RemoteVideoArea from '../../modules/desklink/components/RemoteVideoArea.jsx';

export default function ScreenShareView({
  screenStream,
  presenter,
  participants,
  localUserId,
  activeSpeakerId,
  onControlMessage,
  sessionId,
  sessionToken,
  permissions,
  stats,
}) {
  if (!screenStream) {
    return null;
  }

  // Check if this is remote desktop (presenter name is 'Remote Desktop')
  const isRemoteDesktop = presenter?.name === 'Remote Desktop';

  return (
    <div className="flex h-full">
      {/* Main screen share area - takes up 85% of width */}
      <div className="flex-[0.85] relative bg-black">
        {isRemoteDesktop ? (
          // Use RemoteVideoArea for remote desktop (has mouse/keyboard control)
          <RemoteVideoArea
            stream={screenStream}
            onControlMessage={onControlMessage}
            sessionId={sessionId}
            token={sessionToken}
            permissions={permissions}
            stats={stats}
          />
        ) : (
          // Use ScreenShareTile for regular screen share
          <ScreenShareTile
            screenStream={screenStream}
            presenterName={presenter?.name || 'Presenter'}
            isLocal={presenter?.id === localUserId}
            fullWidth={true}
          />
        )}

        {/* Presenter camera as small floating window in bottom right */}
        {presenter && presenter.videoStream && (
          <div className="absolute bottom-4 right-4 w-48 h-36 shadow-lg">
            <ParticipantTile
              participant={presenter}
              isLocal={presenter.id === localUserId}
              isActiveSpeaker={activeSpeakerId === presenter.id}
              compact={true}
            />
          </div>
        )}
      </div>

      {/* Participants sidebar - takes up 15% of width */}
      <div className="flex-[0.15] min-w-[200px] bg-slate-900 border-l border-slate-800 overflow-y-auto">
        <div className="p-3">
          <h3 className="text-xs font-semibold text-slate-400 mb-3">Participants</h3>
          <div className="space-y-2">
            {participants
              .filter(p => p.id !== presenter?.id) // Filter out presenter since they're shown as PiP
              .map((participant) => (
                <div key={participant.id}>
                  <ParticipantTile
                    participant={participant}
                    isLocal={participant.id === localUserId}
                    isActiveSpeaker={activeSpeakerId === participant.id}
                    compact={true}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
