import { getBezierPath, type EdgeProps } from "@xyflow/react";
import { motion } from "framer-motion";

export function DistillEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }: EdgeProps) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <motion.path
      id={id}
      d={edgePath}
      fill="none"
      stroke="hsla(45, 90%, 65%, 0.6)"
      strokeWidth={1.5}
      strokeDasharray="6 4"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1.0, ease: "easeOut" }}
    />
  );
}
