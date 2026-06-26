import { getBezierPath, type EdgeProps } from "@xyflow/react";
import { motion } from "framer-motion";

export function LiquidEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const pruned = (data as { pruned?: boolean })?.pruned;

  return (
    <motion.path
      id={id}
      d={edgePath}
      fill="none"
      stroke={pruned ? "rgba(255,255,255,0.1)" : "var(--glass-border)"}
      strokeWidth={1.5}
      strokeDasharray={pruned ? "2 8" : "4 6"}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: pruned ? 0.2 : 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    />
  );
}
