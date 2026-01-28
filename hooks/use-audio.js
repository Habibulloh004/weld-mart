import { useCallback } from "react";
import useSound from "use-sound";

const useAudio = () => {
  const [play1] = useSound("/notification.mp3");

  const playSound = useCallback(
    (sound) => {
      switch (sound) {
        case "sound1":
          play1();
          break;
        default:
          console.warn(`Sound "${sound}" not recognized`);
      }
    },
    [play1]
  );

  return { playSound };
};

export default useAudio;