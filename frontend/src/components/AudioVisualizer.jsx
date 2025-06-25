import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";

const listeningCooldownMs = 1000;

export function AudioVisualizer() {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const [activity, setActivity] = useState("speaking");
  const speaker = participants.find((p) => p.isSpeaking);
  const agent = useAgentParticipant();
  const mediaStream =
    activity === "listening"
      ? participants.find((p) => p.isLocalParticipant)?.audioStream
      : agent?.audioStream;
  const volume = useMediaStreamVolume(mediaStream ?? null);

  useEffect(() => {
    if (!speaker && activity === "listening") {
      const timeout = setTimeout(
        () => setActivity("speaking"),
        listeningCooldownMs
      );
      return () => clearTimeout(timeout);
    }

    const isUserSpeaking = speaker?.isLocalParticipant;
    setActivity(isUserSpeaking ? "listening" : "speaking");
  }, [speaker, activity]);

  return (
    <div
      className="audio-visualizer"
      style={{
        "--volumeter-scale": Math.min(1 + volume, 1.1),
        "--volumeter-brightness": Math.max(Math.min(1 + volume, 1.2), 1),
      }}
    >
      <div
        className={`audio-visualizer__aura audio-visualizer__aura_${activity}`}
      />
    </div>
  );
}

/**
 * Hook to calculate MediaStream volume using Web Audio API
 * @param {MediaStream} mediaStream - The media stream to analyze
 * @returns {number} The current volume level (0-1)
 */
function useMediaStreamVolume(mediaStream) {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    if (!mediaStream) {
      setVolume(0);
      return;
    }

    let audioContext;

    const promise = (async () => {
      audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();
      const data = new Float32Array(analyser.fftSize);
      source.connect(analyser);

      const updateVolume = () => {
        analyser.getFloatTimeDomainData(data);
        const volume = Math.sqrt(
          data.reduce((acc, amp) => acc + (amp * amp) / data.length, 0)
        );
        setVolume(volume);
        return requestAnimationFrame(updateVolume);
      };

      return updateVolume();
    })();

    return () => {
      const audioContextToClose = audioContext;
      promise.then((handle) => {
        cancelAnimationFrame(handle);
        audioContextToClose.close();
      });
    };
  }, [mediaStream]);

  return volume;
}

function useAgentParticipant() {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const agent = participants.find((p) => p.userId === "lucy") ?? null;
  return agent;
}

export default AudioVisualizer; 