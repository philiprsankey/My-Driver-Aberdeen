import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? "h-6 w-6"}
      {...props}
    />
  );
}

export function DiamondIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 9h18L12 21 3 9Z" />
      <path d="M3 9 7.5 3h9L21 9" />
      <path d="M12 21 9 9l3-6 3 6" />
    </Svg>
  );
}

export function DriverIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="7.5" r="3" />
      <path d="M5 20c1.2-3.2 3.4-4.8 7-4.8s5.8 1.6 7 4.8" />
    </Svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 19.5 6v6.2c0 4.2-2.8 7.2-7.5 8.8-4.7-1.6-7.5-4.6-7.5-8.8V6L12 3Z" />
    </Svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 3h8v18H8V3Z" />
      <path d="M11 18h2" />
    </Svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="14" />
      <path d="m4 7 8 6 8-6" />
    </Svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21s6.5-5.6 6.5-10.2a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2" />
    </Svg>
  );
}

export function BriefcaseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="7" width="18" height="13" />
      <path d="M8 7V5h8v2M3 12h18" />
    </Svg>
  );
}

export function TreeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 7.5 10h2L6 17h3.2V21h5.6v-4H18l-3.5-7h2L12 3Z" />
    </Svg>
  );
}

export function TowerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2 8.5 8h7L12 2Z" />
      <path d="M9 8v13M15 8v13M8 21h8M9.5 12h5M9.5 16h5" />
    </Svg>
  );
}

export function ShipIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 15h18l-2.2 5H5.2L3 15Z" />
      <path d="M12 15V4M12 4h6l-2 5" />
    </Svg>
  );
}

export function LighthouseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 21V11l3-5 3 5v10" />
      <path d="M8 21h8M7.5 8h9M12 2v4" />
    </Svg>
  );
}

export function CastleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 21V9h3V5h2v4h2V5h2v4h2V5h2v4h3v12" />
      <path d="M10 21v-5h4v5" />
    </Svg>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 21V8l4-2v15M8 21V4h8v17M16 21V8l4 2v11M4 21h16" />
      <path d="M10.5 8h3M10.5 12h3M10.5 16h3" />
    </Svg>
  );
}

export function PlaneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 12.5 21 4l-5.2 16-3.2-5.2L8 17.5l1.2-4.2L3 12.5Z" />
    </Svg>
  );
}

export function DiningIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 3v7M5 3v5a2 2 0 0 0 4 0V3M7 10v11M15 3c2.2 2 2.2 5 0 7v11" />
    </Svg>
  );
}

export function CarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 15h16M6.2 15 8 10h8l1.8 5" />
      <path d="M5 15v3h2.2M17 18h2v-3" />
      <circle cx="8" cy="17.5" r="1.2" />
      <circle cx="16.5" cy="17.5" r="1.2" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props} className={props.className ?? "h-4 w-4"}>
      <path d="M4 12.5 8.2 17 20 6" />
    </Svg>
  );
}
