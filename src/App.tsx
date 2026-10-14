/**
 * PRIVATE RESIDENCE — Main Application Entry Point
 *
 * Flow:
 * 1. Entrance: 3D Spatial Keypad controlled by real hand gestures / keyboard / touch.
 * 2. Successful PIN: Transitions into Music Invitation ("Wanna listen to Yeat?").
 * 3. Choice: YES (starts audio playback via explicit user gesture) or NO (enters silently).
 * 4. Residence Showcase: Scroll-controlled cinematic house video (strictly paused, advances with scroll).
 * 5. Persistent Soundtrack Bar: Allows pause, resume, mute/unmute throughout residence presentation.
 */

import React, { useState, useEffect } from 'react';
import { EntranceController } from './components/entrance/EntranceController';
import { MusicInvitation } from './components/music/MusicInvitation';
import { CinematicHouseExperience } from './components/cinema/CinematicHouseExperience';
import { PersistentMusicBar } from './components/music/PersistentMusicBar';
import { globalAudioController } from './engine/audio';

export type AppStage = 'entrance' | 'music-invitation' | 'unlocked';

export default function App() {
  const [stage, setStage] = useState<AppStage>('entrance');

  // When unlocked, scroll to top of document to begin video reel at 00:00
  useEffect(() => {
    if (stage === 'unlocked') {
      window.scrollTo(0, 0);
    }
  }, [stage]);

  const handleUnlockSuccess = () => {
    setStage('music-invitation');
  };

  const handleEnterSite = (_withMusic: boolean) => {
    setStage('unlocked');
  };

  const handleLockResidence = () => {
    globalAudioController.pause();
    setStage('entrance');
  };

  return (
    <div className="w-full min-h-screen bg-[#090a0c] text-stone-200 font-sans selection:bg-amber-400 selection:text-black">
      {stage === 'entrance' && (
        <EntranceController onUnlockSuccess={handleUnlockSuccess} />
      )}

      {stage === 'music-invitation' && (
        <MusicInvitation onEnterSite={handleEnterSite} />
      )}

      {stage === 'unlocked' && (
        <>
          <CinematicHouseExperience onLockResidence={handleLockResidence} />
          <PersistentMusicBar />
        </>
      )}
    </div>
  );
}
