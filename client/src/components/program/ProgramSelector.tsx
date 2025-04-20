import React from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useProgramContext } from '@/context/ProgramContext';
import { Badge } from '@/components/ui/badge';

const ProgramSelector: React.FC = () => {
  const { programs, selectedProgramId, setSelectedProgramId } = useProgramContext();

  if (programs.length === 0) {
    return <div className="text-sm text-gray-500">No programs available</div>;
  }

  return (
    <div className="w-full max-w-xs">
      <Select
        value={selectedProgramId || undefined}
        onValueChange={(value) => setSelectedProgramId(value)}
      >
        <SelectTrigger className="w-full bg-white border-primary">
          <SelectValue placeholder="Select a program" />
        </SelectTrigger>
        <SelectContent>
          {programs.map((program) => (
            <SelectItem key={program.id} value={program.id} className="flex items-center">
              <div className="flex items-center space-x-2">
                <span>{program.name}</span>
                <Badge
                  variant={program.status === "draft" ? "outline" : program.status === "active" ? "secondary" : "default"}
                  className="ml-2 text-xs"
                >
                  {program.status === "draft" ? "Brouillon" : program.status === "active" ? "Actif" : "Terminé"}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProgramSelector;