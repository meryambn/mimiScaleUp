import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgramTemplate } from '@/types/program';
import { Check, Eye } from 'lucide-react';

interface ProgramTemplateCardProps {
  template: ProgramTemplate;
  isSelected: boolean;
  onSelect: () => void;

}

const ProgramTemplateCard: React.FC<ProgramTemplateCardProps> = ({
  template,
  isSelected,
  onSelect,

}) => {
  console.log('ProgramTemplateCard props:', {
    template,
    isSelected,
  });

  return (
    <Card className={`relative transition-all duration-200 ${
      isSelected ? 'border-primary ring-2 ring-primary ring-opacity-50' : ''
    }`}>
      {isSelected && (
        <div className="absolute top-2 right-2">
          <Badge variant="default">
            <Check className="h-4 w-4 mr-1" />
            Sélectionné
          </Badge>
        </div>
      )}

      <CardHeader>
        <CardTitle>{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Phases:</span>
            <span className="font-medium">{template.phases?.length || 0}</span>
          </div>

        </div>
      </CardContent>

      <CardFooter className="flex justify-end">

        <button
          onClick={onSelect}
          style={{
            backgroundColor: isSelected ? '#f3f4f6' : 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)',
            background: isSelected ? '#f3f4f6' : 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)',
            color: isSelected ? '#111827' : 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          {isSelected ? 'Sélectionné' : 'Sélectionner le modèle'}
        </button>
      </CardFooter>
    </Card>
  );
};

export default ProgramTemplateCard;