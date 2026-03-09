import golfFlagImg from "@assets/golf_flag.png";

interface GolfFlagIconProps {
  className?: string;
}

export function GolfFlagIcon({ className = "w-4 h-4" }: GolfFlagIconProps) {
  return (
    <img
      src={golfFlagImg}
      alt=""
      className={`${className} object-contain rounded-sm`}
      draggable={false}
    />
  );
}
