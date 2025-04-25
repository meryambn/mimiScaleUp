import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Edit, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FormQuestion } from './ApplicationFormBuilder';

interface SortableQuestionItemProps {
  question: FormQuestion;
  onEdit: () => void;
  onRemove: () => void;
}

const SortableQuestionItem: React.FC<SortableQuestionItemProps> = ({
  question,
  onEdit,
  onRemove
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 'auto',
  };
  
  // Function to render the question type in a user-friendly format
  const getQuestionTypeLabel = (type: string): string => {
    switch (type) {
      case 'short_text': return 'Short Text';
      case 'long_text': return 'Long Text';
      case 'single_choice': return 'Single Choice';
      case 'multiple_choice': return 'Multiple Choice';
      case 'dropdown': return 'Dropdown';
      case 'file_upload': return 'File Upload';
      case 'rating': return 'Rating';
      default: return type;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative"
    >
      <Card className={`border ${isDragging ? 'border-primary' : 'border-gray-200'} bg-white`}>
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <GripVertical className="h-5 w-5" />
            </div>
            <div>
              <Badge variant="outline" className="mr-2">{getQuestionTypeLabel(question.type)}</Badge>
              {question.required && (
                <Badge variant="default" className="bg-red-100 text-red-800 hover:bg-red-200">Required</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8 text-red-500 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="font-medium text-gray-900">{question.text}</div>
          {question.description && (
            <div className="text-sm text-gray-500 mt-1">{question.description}</div>
          )}
          
          {/* Show options for choice-based questions */}
          {question.options && question.options.length > 0 && (
            <div className="mt-2 space-y-1">
              {question.options.map((option) => (
                <div key={option.id} className="text-sm text-gray-600 flex items-center gap-2">
                  {question.type === 'single_choice' && (
                    <div className="h-3 w-3 rounded-full border border-gray-400"></div>
                  )}
                  {question.type === 'multiple_choice' && (
                    <div className="h-3 w-3 rounded-sm border border-gray-400"></div>
                  )}
                  {option.text || `Option ${option.id}`}
                </div>
              ))}
            </div>
          )}
          
          {/* Show min and max rating for rating questions */}
          {question.type === 'rating' && (
            <div className="mt-2 text-sm text-gray-600">
              Rating from {question.minRating || 1} to {question.maxRating || 5}
            </div>
          )}
          
          {/* Show max length for text questions */}
          {(question.type === 'short_text' || question.type === 'long_text') && question.maxLength && (
            <div className="mt-2 text-sm text-gray-600">
              Max length: {question.maxLength} characters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SortableQuestionItem;