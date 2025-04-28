import { useEffect, useState } from "react"

const MouseMoveBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      {/* Static background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, #0f172a, rgba(15, 23, 42, 0.9), #0f172a)",
        }}
      />

      {/* Top right blob */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          height: "500px",
          width: "500px",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          filter: "blur(100px)",
        }}
      />

      {/* Bottom left blob */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "500px",
          width: "500px",
          backgroundColor: "rgba(168, 85, 247, 0.1)",
          filter: "blur(100px)",
        }}
      />

      {/* Mouse move effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.15), transparent 80%)`,
          transition: "opacity 300ms",
        }}
      />
    </div>
  )
}

export default MouseMoveBackground

