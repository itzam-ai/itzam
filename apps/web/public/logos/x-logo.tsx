export default function X({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: 12,
    md: 16,
    lg: 24,
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={sizeMap[size as keyof typeof sizeMap]}
      height={sizeMap[size as keyof typeof sizeMap]}
      fill="none"
      viewBox="0 0 1200 1227"
      style={{ fill: "hsl(var(--foreground))" }}
    >
      <path d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z" />
    </svg>
  );
}
