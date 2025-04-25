import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Plus,
  Trash2,
  GripVertical,
  Star,
  Save,
  InfoIcon
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SortableCriterionItem from "./SortableCriterionItem";

export type EvaluationType = "numeric" | "scale" | "yes_no" | "text";

export interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  type: EvaluationType;
  weight: number;
  minValue?: number;
  maxValue?: number;
  required: boolean;
  passThreshold?: number;
}

interface EvaluationCriteriaBuilderProps {
  programId: number;
  defaultCriteria?: EvaluationCriterion[];
  onSave: (criteria: EvaluationCriterion[]) => void;
}

const EvaluationCriteriaBuilder: React.FC<EvaluationCriteriaBuilderProps> = ({
  programId,
  defaultCriteria = [],
  onSave
}) => {
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>(defaultCriteria);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCriteria((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddCriterion = () => {
    const newCriterion: EvaluationCriterion = {
      id: `criterion_${Date.now()}`,
      name: "",
      description: "",
      type: "scale",
      weight: 1,
      minValue: 1,
      maxValue: 5,
      required: true,
    };

    setCriteria([...criteria, newCriterion]);
  };

  const handleRemoveCriterion = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const handleCriterionChange = (id: string, field: keyof EvaluationCriterion, value: any) => {
    setCriteria(
      criteria.map(c =>
        c.id === id
          ? { ...c, [field]: value }
          : c
      )
    );
  };

  const handleTypeChange = (id: string, type: EvaluationType) => {
    setCriteria(
      criteria.map(c => {
        if (c.id !== id) return c;

        let updatedCriterion: EvaluationCriterion = { ...c, type };

        // Set default values based on type
        if (type === "numeric" || type === "scale") {
          updatedCriterion.minValue = type === "numeric" ? 0 : 1;
          updatedCriterion.maxValue = type === "numeric" ? 100 : 5;
        } else if (type === "yes_no") {
          updatedCriterion.minValue = undefined;
          updatedCriterion.maxValue = undefined;
        } else if (type === "text") {
          updatedCriterion.minValue = undefined;
          updatedCriterion.maxValue = undefined;
          updatedCriterion.passThreshold = undefined;
        }

        return updatedCriterion;
      })
    );
  };

  const getTotalWeight = () => {
    return criteria.reduce((sum, c) => sum + c.weight, 0);
  };

  const normalizeWeights = () => {
    const totalWeight = getTotalWeight();
    if (totalWeight === 0) return;

    setCriteria(
      criteria.map(c => ({
        ...c,
        weight: parseFloat((c.weight / totalWeight * 100).toFixed(1))
      }))
    );
  };

  const handleSave = () => {
    onSave(criteria);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Critères d'évaluation du programme</h3>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Enregistrer les critères
        </Button>
      </div>

      <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <InfoIcon className="h-5 w-5 text-blue-500" />
          <div className="text-sm">
            Evaluation criteria define how startups will be assessed. Drag to reorder criteria.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Total Weight:</div>
          <div className={`font-bold ${getTotalWeight() === 100 ? 'text-green-500' : 'text-amber-500'}`}>
            {getTotalWeight()}%
          </div>
          {getTotalWeight() !== 100 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={normalizeWeights}
              className="h-8 text-xs"
            >
              Normalize to 100%
            </Button>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={criteria.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {criteria.length === 0 && (
              <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                <p className="text-muted-foreground">No evaluation criteria defined yet. Add your first criterion below.</p>
              </div>
            )}

            {criteria.map((criterion, index) => (
              <SortableCriterionItem
                key={criterion.id}
                criterion={criterion}
                onChange={(field, value) => handleCriterionChange(criterion.id, field, value)}
                onChangeType={(type) => handleTypeChange(criterion.id, type)}
                onRemove={() => handleRemoveCriterion(criterion.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        variant="outline"
        onClick={handleAddCriterion}
        className="w-full"
      >
        <Plus className="mr-1 h-4 w-4" />
        Add Evaluation Criterion
      </Button>
    </div>
  );
};

export default EvaluationCriteriaBuilder;