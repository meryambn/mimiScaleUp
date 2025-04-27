import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical, MoreVertical } from "lucide-react";
import { useDrag, useDrop, DropTargetMonitor } from "react-dnd";
import { cn } from "@/lib/utils";
import { WidgetData } from "./types";

interface DashboardWidgetProps {
  widget: WidgetData;
  index: number;
  moveWidget: (dragIndex: number, hoverIndex: number) => void;
  onRemove?: (id: string) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  widget,
  index,
  moveWidget,
  onRemove,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
    accept: 'WIDGET',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor: DropTargetMonitor<DragItem>) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveWidget(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'WIDGET',
    item: () => {
      return { id: widget.id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const getSizeClass = () => {
    switch (widget.size) {
      case "small":
        return "col-span-1";
      case "medium":
        return "col-span-1 md:col-span-2";
      case "large":
        return "col-span-1 md:col-span-3";
      case "full":
        return "col-span-1 md:col-span-full";
      default:
        return "col-span-1";
    }
  };

  drag(drop(ref));

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={cn(
        getSizeClass(),
        isDragging ? "opacity-50" : ""
      )}
    >
      <Card>
        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
          <div className="flex items-center">
            <button
              className="p-1 text-gray-400 hover:text-gray-500"
              onClick={() => onRemove && onRemove(widget.id)}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            <div className="cursor-move ml-1">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">{widget.content}</CardContent>
      </Card>
    </div>
  );
};

export default DashboardWidget;
