import tappLogoSrc from "@/assets/images/tapp-logo.png";

interface TappLogoProps {
  size?: number;
  className?: string;
}

export function TappLogo({ size = 32, className = "" }: TappLogoProps) {
  return (
    <img
      src={tappLogoSrc}
      alt="Tapp"
      width={size}
      height={size}
      className={`rounded-lg object-contain ${className}`}
      data-testid="img-tapp-logo"
    />
  );
}
