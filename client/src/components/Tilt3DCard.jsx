import { useState, useRef } from "react";

export default function Tilt3DCard({
  children,
  className = "",
  style = {},
  maxTilt = 10,
  glare = true,
  scale = 1.02,
  onClick,
}) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    isHovered: false,
  });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTransform({
      rotateX,
      rotateY,
      glareX,
      glareY,
      isHovered: true,
    });
  };

  const handleMouseLeave = () => {
    setTransform({
      rotateX: 0,
      rotateY: 0,
      glareX: 50,
      glareY: 50,
      isHovered: false,
    });
  };

  return (
    <div
      ref={cardRef}
      className={`tl-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: transform.isHovered
          ? `perspective(1000px) rotateX(${transform.rotateX.toFixed(2)}deg) rotateY(${transform.rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        transition: transform.isHovered
          ? "transform 0.08s ease-out, box-shadow 0.2s ease"
          : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease",
        transformStyle: "preserve-3d",
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {glare && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle 220px at ${transform.glareX}% ${transform.glareY}%, rgba(255, 255, 255, 0.12), transparent 70%)`,
            pointerEvents: "none",
            zIndex: 2,
            opacity: transform.isHovered ? 1 : 0,
            transition: "opacity 0.25s ease",
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 1, transform: "translateZ(10px)" }}>
        {children}
      </div>
    </div>
  );
}
