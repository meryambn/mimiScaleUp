import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EvaluationCriterion, EvaluationType } from "./EvaluationCriteriaBuilder";
import { 
  GripVertical, 
  Trash2, 
  InfoIcon,
  AlertCircle 
} from "lucide-react";

interface SortableCriterionItemProps {
  criterion: EvaluationCriterion;
  onChange: (field: keyof EvaluationCriterion, value: any) => void;
  onChangeType: (type: EvaluationType) => void;
  onRemove: () => void;
}

const SortableCriterionItem: React.FC<SortableCriterionItemProps> = ({
  criterion,
  onChange,
  onChangeType,
  onRemove
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: criterion.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0
  };

  const typeOptions = [
    { value: "scale", label: "Rating Scale" },
    { value: "numeric", label: "Numeric Score" },
    { value: "yes_no", label: "Yes/No" },
    { value: "text", label: "Text Feedback" }
  ];

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className="border relative"
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing h-full flex items-center px-2"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <CardContent className="p-4 pl-10">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Criterion name"
                    value={criterion.name}
                    onChange={(e) => onChange("name", e.target.value)}
                    className="font-medium"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onRemove}
                          className="h-10 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remove criterion</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <Textarea
                  placeholder="Description of this evaluation criterion"
                  value={criterion.description}
                  onChange={(e) => onChange("description", e.target.value)}
                  className="resize-none h-20"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Evaluation Type</label>
                    <Select
                      value={criterion.type}
                      onValueChange={(value) => onChangeType(value as EvaluationType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <label className="text-xs font-medium">Weight (%)</label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Weight determines the importance of this criterion relative to others.
                              All weights should sum to 100%.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={criterion.weight}
                      onChange={(e) => onChange("weight", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-5 space-y-3">
              {(criterion.type === "scale" || criterion.type === "numeric") && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Min Value</label>
                    <Input
                      type="number"
                      value={criterion.minValue !== undefined ? criterion.minValue : ""}
                      onChange={(e) => onChange("minValue", e.target.value ? parseInt(e.target.value) : undefined)}
                      min={criterion.type === "scale" ? 1 : 0}
                      max={criterion.maxValue ? criterion.maxValue - 1 : undefined}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Max Value</label>
                    <Input
                      type="number"
                      value={criterion.maxValue !== undefined ? criterion.maxValue : ""}
                      onChange={(e) => onChange("maxValue", e.target.value ? parseInt(e.target.value) : undefined)}
                      min={criterion.minValue ? criterion.minValue + 1 : 1}
                    />
                  </div>
                </div>
              )}
              
              {criterion.type !== "text" && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <label className="text-xs font-medium">Pass Threshold</label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Minimum score required to pass this criterion.
                            {criterion.type === "yes_no" && " For Yes/No, use 1 to require 'Yes' to pass."}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    type="number"
                    min={criterion.type === "yes_no" ? 0 : criterion.minValue}
                    max={criterion.type === "yes_no" ? 1 : criterion.maxValue}
                    step={criterion.type === "yes_no" ? 1 : 0.1}
                    value={criterion.passThreshold !== undefined ? criterion.passThreshold : ""}
                    onChange={(e) => onChange("passThreshold", e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder={criterion.type === "yes_no" ? "0 or 1" : "Enter threshold"}
                  />
                </div>
              )}
              
              <div className="flex items-start space-x-2 pt-1">
                <Checkbox
                  id={`required-${criterion.id}`}
                  checked={criterion.required}
                  onCheckedChange={(checked) => onChange("required", !!checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor={`required-${criterion.id}`}
                    className="text-sm font-medium leading-none"
                  >
                    Required
                  </label>
                  <p className="text-xs text-muted-foreground">
                    This criterion must be evaluated
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SortableCriterionItem;