"use client"

import { useState } from "react"

export default function ImageViewer({ imageSrc }: { imageSrc: string }) {
  const [zoom, setZoom] = useState(1)

  return (
    <div className="border p-4 flex flex-col items-center">
      <div className="overflow-hidden border w-full h-96 flex items-center justify-center">
        <img
          src={imageSrc}
          alt="Radiografía"
          style={{ transform: `scale(${zoom})`, transition: "transform 0.3s ease" }}
          className="max-h-full"
        />
      </div>
      <div className="flex gap-4 mt-4">
        <button onClick={() => setZoom((z) => z + 0.2)} className="px-3 py-1 bg-purple-600 text-white rounded">🔍+</button>
        <button onClick={() => setZoom((z) => Math.max(1, z - 0.2))} className="px-3 py-1 bg-purple-600 text-white rounded">🔍-</button>
        <button onClick={() => setZoom(1)} className="px-3 py-1 bg-gray-400 text-white rounded">🔄 Reset</button>
      </div>
    </div>
  )
}
