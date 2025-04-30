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
                <div className={`
                  ml-2 px-2 py-0.5 rounded-full text-xs font-medium
                  ${program.status === "draft"
                    ? "bg-gray-100 text-gray-800 border border-gray-300"
                    : program.status === "active"
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-blue-100 text-blue-800 border border-blue-300"}
                `}>
                  {program.status === "draft" ? "Brouillon" : program.status === "active" ? "Actif" : "Terminé"}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProgramSelector;