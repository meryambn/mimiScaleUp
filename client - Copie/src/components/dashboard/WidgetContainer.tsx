import React from 'react';
import { useDrop } from 'react-dnd';
import { WidgetData } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, X } from 'lucide-react';

interface WidgetContainerProps {
  widgets: WidgetData[];
  onWidgetsChange: (widgets: WidgetData[]) => void;
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({ widgets, onWidgetsChange }) => {
  const [, drop] = useDrop(() => ({
    accept: 'widget',
    drop: (item: WidgetData, monitor) => {
      if (!monitor.didDrop()) {
        const offset = monitor.getClientOffset();
        if (offset) {
          const newWidget = {
            ...item,
            position: {
              x: Math.floor(offset.x / 200),
              y: Math.floor(offset.y / 200),
              w: 2,
              h: 2
            }
          };
          onWidgetsChange([...widgets, newWidget]);
        }
      }
    }
  }));

  const handleResize = (widgetId: string, newSize: { w: number; h: number }) => {
    onWidgetsChange(
      widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, position: { ...widget.position, ...newSize } }
          : widget
      )
    );
  };

  const handleRemove = (widgetId: string) => {
    onWidgetsChange(widgets.filter(w => w.id !== widgetId));
  };

  return (
    <div
      ref={drop}
      className="grid grid-cols-6 gap-4 p-4 min-h-[600px] bg-gray-50 rounded-lg"
      style={{ gridAutoRows: 'minmax(200px, auto)' }}
    >
      {widgets.map((widget) => (
        <Card
          key={widget.id}
          className="relative"
          style={{
            gridColumn: `span ${widget.position.w}`,
            gridRow: `span ${widget.position.h}`,
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {widget.title}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleResize(widget.id, {
                  w: widget.position.w === 2 ? 4 : 2,
                  h: widget.position.h === 2 ? 4 : 2
                })}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(widget.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {widget.content}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default WidgetContainer;
