'use client'

import type { ItemRelation } from '@/server/actions/dashboard'
import { useEffect, useRef, useState } from 'react'

interface CardPosition {
  id: string
  x: number
  y: number
  width: number
  height: number
}

interface RelationConnectorsProps {
  relations: ItemRelation[]
  itemPositions: Map<string, CardPosition>
  highlightedItemId?: string | null
}

export function RelationConnectors({
  relations,
  itemPositions,
  highlightedItemId,
}: RelationConnectorsProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 })

  // Update SVG size when component mounts or window resizes
  useEffect(() => {
    const updateSize = () => {
      if (svgRef.current?.parentElement) {
        const parent = svgRef.current.parentElement
        setSvgSize({
          width: parent.clientWidth,
          height: parent.clientHeight,
        })
      }
    }

    updateSize()
    const resizeObserver = new ResizeObserver(updateSize)
    if (svgRef.current?.parentElement) {
      resizeObserver.observe(svgRef.current.parentElement)
    }

    window.addEventListener('resize', updateSize)
    return () => {
      window.removeEventListener('resize', updateSize)
      resizeObserver.disconnect()
    }
  }, [])

  // Generate SVG path with quadratic curve
  // Arrow goes from right middle of source card to left middle of target card
  const generatePath = (fromPos: CardPosition, toPos: CardPosition): string => {
    // Start from right middle of source card
    const fromCenterX = fromPos.x + fromPos.width
    const fromCenterY = fromPos.y + fromPos.height / 2

    // End at left middle of target card
    const toCenterX = toPos.x
    const toCenterY = toPos.y + toPos.height / 2

    // Control point for quadratic curve (offset vertically for visual depth)
    const controlX = (fromCenterX + toCenterX) / 2
    const controlY = (fromCenterY + toCenterY) / 2 - 40

    return `M ${fromCenterX} ${fromCenterY} Q ${controlX} ${controlY} ${toCenterX} ${toCenterY}`
  }

  const getLineColor = (relationType: string): string => {
    return relationType === 'next_step' ? '#10b981' : '#3b82f6' // green for next_step, blue for part_of
  }

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
      width={svgSize.width}
      height={svgSize.height}
    >
      <defs>
        <style>{`
          @keyframes dash-animation {
            to {
              stroke-dashoffset: -8;
            }
          }
          .relation-line {
            stroke-width: 2;
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
            animation: dash-animation 20s linear infinite;
            transition: stroke-width 0.2s ease, opacity 0.2s ease, filter 0.2s ease;
          }
          .relation-line.highlighted {
            stroke-width: 3;
            opacity: 1 !important;
            filter: drop-shadow(0 0 6px currentColor);
          }
        `}</style>
        <marker
          id="arrowhead-green"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
        </marker>
        <marker
          id="arrowhead-blue"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
        </marker>
      </defs>

      {relations.map((relation) => {
        const sourcePos = itemPositions.get(relation.source_item_id)
        const targetPos = itemPositions.get(relation.target_item_id)

        if (!sourcePos || !targetPos) return null

        const isHighlighted =
          relation.source_item_id === highlightedItemId ||
          relation.target_item_id === highlightedItemId
        const color = getLineColor(relation.relation_type)
        const markerUrl =
          relation.relation_type === 'next_step'
            ? 'url(#arrowhead-green)'
            : 'url(#arrowhead-blue)'

        return (
          <path
            key={relation.id}
            d={generatePath(sourcePos, targetPos)}
            stroke={color}
            className={`relation-line ${isHighlighted ? 'highlighted' : ''}`}
            strokeDasharray="4 4"
            opacity={isHighlighted ? 1 : 0.5}
            markerEnd={markerUrl}
          />
        )
      })}
    </svg>
  )
}
