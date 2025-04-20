import React from "react";
import { useDrag } from "react-dnd";
import { cn } from "@/lib/utils";
import { WidgetData } from "./types";

interface AvailableWidgetProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onAdd: () => void;
}

export const AvailableWidget: React.FC<AvailableWidgetProps> = ({
  id,
  title,
  description,
  icon,
  color,
  onAdd,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: "widget",
    item: { id, title, description, color },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
    end: (_item, monitor) => {
      if (monitor.didDrop()) {
        onAdd();
      }
    },
  });

  return (
    <div
      ref={drag}
      className={cn(
        "bg-white border border-gray-200 rounded-md p-3 shadow-sm cursor-move",
        isDragging ? "opacity-50" : ""
      )}
    >
      <div className="flex items-center">
        <div className={`flex-shrink-0 h-10 w-10 rounded-md flex items-center justify-center`} style={{ backgroundColor: color }}>
          {icon}
        </div>
        <div className="ml-3">
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}; 