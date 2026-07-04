import React from 'react';

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
}

export default function Logo({ size = 32, className = '', ...props }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Braudle Logo"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      {...props}
    />
  );
}
