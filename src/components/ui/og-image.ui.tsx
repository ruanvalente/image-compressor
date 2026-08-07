export function OgImage() {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
      }}
    >
      <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="8" y="8" width="80" height="80" rx="20" fill="#2563eb" />
        <rect x="22" y="22" width="52" height="52" rx="12" fill="#ffffff" />
        <circle cx="40" cy="38" r="7" fill="#2563eb" />
        <path d="M28 62 L42 46 L50 56 L56 48 L68 62 Z" fill="#2563eb" />
      </svg>
      <div
        style={{
          fontSize: 60,
          fontWeight: 700,
          color: "#171717",
          marginTop: 24,
        }}
      >
        Image Compressor
      </div>
      <div style={{ fontSize: 30, color: "#52525b", marginTop: 12 }}>
        Comprima imagens mantendo a melhor qualidade
      </div>
      <div style={{ fontSize: 24, color: "#2563eb", marginTop: 28 }}>
        JPEG · PNG · WebP · AVIF — rápido, seguro e gratuito
      </div>
    </div>
  );
}
