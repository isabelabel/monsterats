export function UserAvatar({
  name,
  imageUrl,
  size = 40,
  className = "",
}: {
  name: string;
  imageUrl: string | null | undefined;
  size?: number;
  /** Merged with default ring styles (e.g. dark surfaces). */
  className?: string;
}) {
  const initials = (() => {
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? "?";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase();
  })();

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        width={size}
        height={size}
        className={`ring-border rounded-full object-cover ring-2 ring-offset-2 ring-offset-white ${className}`}
      />
    );
  }

  return (
    <span
      className={`bg-accent flex items-center justify-center rounded-full font-semibold text-white shadow-md shadow-purple-900/20 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </span>
  );
}
