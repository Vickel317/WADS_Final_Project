import Image from "next/image";

type ChatAvatarProps = {
  src: string;
  alt: string;
  className?: string;
  size?: number;
};

export function ChatAvatar({ src, alt, className = "w-full h-full object-cover", size = 40 }: ChatAvatarProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      className={className}
    />
  );
}
