import drivingRangeImg from "@assets/driving_range.png";

interface DrivingRangeIconProps {
  className?: string;
}

export function DrivingRangeIcon({ className = "w-4 h-4" }: DrivingRangeIconProps) {
  return (
    <img
      src={drivingRangeImg}
      alt=""
      className={`${className} object-cover rounded-sm`}
      draggable={false}
    />
  );
}
