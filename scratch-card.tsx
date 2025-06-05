"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"

export default function ScratchCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScratching, setIsScratching] = useState(false)
  const [scratchPercentage, setScratchPercentage] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Make canvas responsive
    const container = canvas.parentElement
    if (container) {
      const containerWidth = container.clientWidth
      canvas.width = containerWidth
      canvas.height = containerWidth * 0.75 // 4:3 aspect ratio
    } else {
      // Fallback sizes
      canvas.width = window.innerWidth < 500 ? window.innerWidth - 40 : 400
      canvas.height = window.innerWidth < 500 ? (window.innerWidth - 40) * 0.75 : 300
    }

    // Fill with scratch-off color (silver/gray)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, "#c0c0c0")
    gradient.addColorStop(0.5, "#e8e8e8")
    gradient.addColorStop(1, "#a8a8a8")

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add scratch-off texture
    ctx.fillStyle = "#d0d0d0"
    ctx.font = `bold ${canvas.width < 300 ? "18px" : "24px"} Arial`
    ctx.textAlign = "center"
    ctx.fillText("RASPE AQUI", canvas.width / 2, canvas.height / 2 - 10)
    ctx.font = `${canvas.width < 300 ? "14px" : "16px"} Arial`
    ctx.fillText("🪙 Raspadinha 🪙", canvas.width / 2, canvas.height / 2 + 20)
  }, [])

  const calculateScratchPercentage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let transparentPixels = 0

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentPixels++
      }
    }

    const percentage = (transparentPixels / (canvas.width * canvas.height)) * 100
    setScratchPercentage(Math.round(percentage))
  }, [])

  const scratch = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Smaller scratch radius on mobile
      const radius = canvas.width < 300 ? 15 : 20

      ctx.globalCompositeOperation = "destination-out"
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fill()

      calculateScratchPercentage()
    },
    [calculateScratchPercentage],
  )

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      setIsScratching(true)
      const pos = getMousePos(e)
      scratch(pos.x, pos.y)
    },
    [getMousePos, scratch],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isScratching) return
      const pos = getMousePos(e)
      scratch(pos.x, pos.y)
    },
    [isScratching, getMousePos, scratch],
  )

  const handleMouseUp = useCallback(() => {
    setIsScratching(false)
  }, [])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault() // Prevent scrolling while scratching
      setIsScratching(true)
      const touch = e.touches[0]
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      scratch(x, y)
    },
    [scratch],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault() // Prevent scrolling while scratching
      if (!isScratching) return
      const touch = e.touches[0]
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      scratch(x, y)
    },
    [isScratching, scratch],
  )

  const handleTouchEnd = useCallback(() => {
    setIsScratching(false)
  }, [])

  const resetCard = useCallback(() => {
    setScratchPercentage(0)
    initializeCanvas()
  }, [initializeCanvas])

  // Preload image to ensure it's ready when revealed
  useEffect(() => {
    const img = new Image()
    img.src = "/chimmy.png"
    img.onload = () => setImageLoaded(true)
    img.onerror = (e) => console.error("Error loading image:", e)

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [])

  useEffect(() => {
    initializeCanvas()

    // Resize canvas when window is resized
    const handleResize = () => {
      initializeCanvas()
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [initializeCanvas])

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-rose-200 via-pink-100 to-salmon flex items-center justify-center p-4"
      style={{ "--tw-gradient-to": "#ffa59e" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🎰 Raspadinha</h1>
          <p className="text-gray-600">Raspe com o mouse para revelar a imagem!</p>
        </div>

        <div className="relative mb-6">
          {/* Background image that will be revealed */}
          <div
            className="absolute inset-0 rounded-lg overflow-hidden"
            style={{
              backgroundImage: "url(/placeholder.svg?height=300&width=400)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="w-full h-full bg-white flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src="/chimmy.png"
                  alt="Chimmy"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Scratch canvas overlay */}
          <canvas
            ref={canvasRef}
            className="relative z-10 rounded-lg cursor-crosshair border-2 border-gray-300 touch-none w-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          />
        </div>

        <div className="text-center space-y-4">
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Progresso da raspagem</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-pink-400 to-rose-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${scratchPercentage}%` }}
              />
            </div>
            <div className="text-lg font-semibold text-gray-800 mt-1">{scratchPercentage}% raspado</div>
          </div>

        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 Dica: Clique e arraste o mouse sobre a área cinza</p>
          <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg">
            <p className="text-rose-600 font-medium">Válido exclusivamente para Luana 💖</p>
          </div>
        </div>
      </div>
    </div>
  )
}
