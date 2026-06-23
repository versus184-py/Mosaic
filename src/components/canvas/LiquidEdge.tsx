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
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <motion.path
      id={id}
      d={edgePath}
      fill="none"
      stroke="var(--glass-border)"
      strokeWidth={1.5}
      strokeDasharray="4 6"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    />
  );
}
