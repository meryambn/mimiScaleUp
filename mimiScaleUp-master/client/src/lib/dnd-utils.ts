import { XYCoord } from "react-dnd";

export interface DraggableItem {
  id: string | number;
  index: number;
  type: string;
}

export interface DragCollectedProps {
  isDragging: boolean;
}

export interface DropCollectedProps {
  isOver: boolean;
  canDrop: boolean;
  handlerId: string | symbol | null;
}

export const isHoveringOverTarget = (
  dragIndex: number,
  hoverIndex: number,
  monitor: any,
  ref: React.RefObject<HTMLElement>,
  isHorizontal: boolean = false
): boolean => {
  if (!ref.current) {
    return false;
  }

  // Don't replace items with themselves
  if (dragIndex === hoverIndex) {
    return false;
  }

  // Determine rectangle on screen
  const hoverBoundingRect = ref.current.getBoundingClientRect();

  // Get middle
  const middle = isHorizontal
    ? (hoverBoundingRect.right - hoverBoundingRect.left) / 2
    : (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

  // Determine mouse position
  const clientOffset = monitor.getClientOffset();

  // Get pixels to the edge
  const offset = isHorizontal
    ? (clientOffset as XYCoord).x - hoverBoundingRect.left
    : (clientOffset as XYCoord).y - hoverBoundingRect.top;

  // Only perform the move when the mouse has crossed half of the items height/width
  if (dragIndex < hoverIndex && offset < middle) {
    return false;
  }
  if (dragIndex > hoverIndex && offset > middle) {
    return false;
  }

  return true;
};
