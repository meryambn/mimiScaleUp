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
      <button
        style={{
          backgroundColor: currentView === 'list' ? '#0c4c80' : 'transparent',
          color: currentView === 'list' ? 'white' : '#0c4c80',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          height: '32px',
          fontSize: '0.875rem'
        }}
        onClick={() => onViewChange('list')}
      >
        <Columns className="h-4 w-4 mr-2" />
        Liste
      </button>
      <button
        style={{
          backgroundColor: currentView === 'kanban' ? '#0c4c80' : 'transparent',
          color: currentView === 'kanban' ? 'white' : '#0c4c80',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          height: '32px',
          fontSize: '0.875rem'
        }}
        onClick={() => onViewChange('kanban')}
      >
        <Trello className="h-4 w-4 mr-2" />
        Kanban
      </button>
    </div>
  );
};

export default ViewSelector;
