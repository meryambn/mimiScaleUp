import React from 'react';
import { Button } from "@/components/ui/button";
import { Columns, Trello } from 'lucide-react';

export type ViewType = 'list' | 'kanban';

interface ViewSelectorProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const ViewSelector: React.FC<ViewSelectorProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
      <Button
        variant={currentView === 'list' ? 'default' : 'ghost'}
        size="sm"
        className="h-8"
        onClick={() => onViewChange('list')}
      >
        <Columns className="h-4 w-4 mr-2" />
        Liste
      </Button>
      <Button
        variant={currentView === 'kanban' ? 'default' : 'ghost'}
        size="sm"
        className="h-8"
        onClick={() => onViewChange('kanban')}
      >
        <Trello className="h-4 w-4 mr-2" />
        Kanban
      </Button>
    </div>
  );
};

export default ViewSelector;
