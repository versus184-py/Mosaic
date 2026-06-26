import { getBezierPath, type EdgeProps } from "@xyflow/react";
import { motion } from "framer-motion";

export function TendrilEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }: EdgeProps) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <motion.path
      id={id}
      d={edgePath}
      fill="none"
      stroke="var(--glass-border)"
      strokeWidth={1}
      strokeDasharray="3 8"
      opacity={0.4}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.4 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    />
  );
}
