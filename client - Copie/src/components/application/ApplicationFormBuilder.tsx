import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, GripVertical, Edit, Eye, Copy } from "lucide-react";

export type QuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multiple_choice"
  | "dropdown"
  | "file_upload"
  | "rating";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface FormQuestion {
  id: string;
  type: QuestionType;
  text: string;
  description?: string;
  required: boolean;
  options?: QuestionOption[];
  maxLength?: number;
  minRating?: number;
  maxRating?: number;
}

interface ApplicationFormBuilderProps {
  programId: number;
  defaultQuestions?: FormQuestion[];
  onSave: (questions: FormQuestion[]) => void;
}

const ApplicationFormBuilder: React.FC<ApplicationFormBuilderProps> = ({
  programId,
  defaultQuestions = [],
  onSave
}) => {
  const [questions, setQuestions] = useState<FormQuestion[]>(defaultQuestions);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // New question form state
  const [newQuestion, setNewQuestion] = useState<FormQuestion>({
    id: '',
    type: 'short_text',
    text: '',
    description: '',
    required: true,
    options: [],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddQuestion = () => {
    const newId = `question-${Date.now()}`;
    setNewQuestion({
      id: newId,
      type: 'short_text',
      text: '',
      description: '',
      required: true,
      options: [],
    });
    setIsAddingQuestion(true);
  };

  const handleEditQuestion = (id: string) => {
    const questionToEdit = questions.find(q => q.id === id);
    if (questionToEdit) {
      setNewQuestion({...questionToEdit});
      setEditingQuestionId(id);
      setIsAddingQuestion(true);
    }
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...(newQuestion.options || [])];
    if (updatedOptions[index]) {
      updatedOptions[index] = { ...updatedOptions[index], text: value };
    }
    setNewQuestion({
      ...newQuestion,
      options: updatedOptions
    });
  };

  const handleAddOption = () => {
    const newOption: QuestionOption = {
      id: `option-${Date.now()}`,
      text: ''
    };
    setNewQuestion({
      ...newQuestion,
      options: [...(newQuestion.options || []), newOption]
    });
  };

  const handleRemoveOption = (id: string) => {
    setNewQuestion({
      ...newQuestion,
      options: (newQuestion.options || []).filter(option => option.id !== id)
    });
  };

  const handleSaveQuestion = () => {
    if (editingQuestionId) {
      // Update existing question
      setQuestions(questions.map(q =>
        q.id === editingQuestionId ? newQuestion : q
      ));
      setEditingQuestionId(null);
    } else {
      // Add new question
      setQuestions([...questions, newQuestion]);
    }
    setIsAddingQuestion(false);
  };

  const handleSaveForm = () => {
    onSave(questions);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Questions</h2>
        <Button onClick={handleAddQuestion} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une question
        </Button>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-gray-300 rounded-md">
            <p className="text-gray-500">Aucune question ajoutée pour l'instant. Cliquez sur le bouton "Ajouter une question" pour créer votre première question.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map(q => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {questions.map((question) => {
                  // Inline sortable question item component
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
                      case 'short_text': return 'Texte court';
                      case 'long_text': return 'Texte long';
                      case 'single_choice': return 'Choix unique';
                      case 'multiple_choice': return 'Choix multiple';
                      case 'dropdown': return 'Liste déroulante';
                      case 'file_upload': return 'Téléchargement de fichier';
                      case 'rating': return 'Évaluation';
                      default: return type;
                    }
                  };

                  return (
                    <div
                      key={question.id}
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
                                <Badge variant="default" className="bg-red-100 text-red-800 hover:bg-red-200">Obligatoire</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditQuestion(question.id)} className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveQuestion(question.id)} className="h-8 w-8 text-red-500 hover:text-red-700">
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
                              Évaluation de {question.minRating || 1} à {question.maxRating || 5}
                            </div>
                          )}

                          {/* Show max length for text questions */}
                          {(question.type === 'short_text' || question.type === 'long_text') && question.maxLength && (
                            <div className="mt-2 text-sm text-gray-600">
                              Longueur maximale: {question.maxLength} caractères
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add/Edit Question Dialog */}
      <Dialog open={isAddingQuestion} onOpenChange={setIsAddingQuestion}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingQuestionId ? 'Modifier la question' : 'Ajouter une nouvelle question'}</DialogTitle>
            <DialogDescription>
              Créez une question pour votre formulaire de candidature.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="question-type" className="text-right">Type</Label>
              <Select
                value={newQuestion.type}
                onValueChange={(value: QuestionType) => setNewQuestion({...newQuestion, type: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionnez le type de question" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_text">Texte court</SelectItem>
                  <SelectItem value="long_text">Texte long</SelectItem>
                  <SelectItem value="single_choice">Choix unique</SelectItem>
                  <SelectItem value="multiple_choice">Choix multiple</SelectItem>
                  <SelectItem value="dropdown">Liste déroulante</SelectItem>
                  <SelectItem value="file_upload">Téléchargement de fichier</SelectItem>
                  <SelectItem value="rating">Évaluation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="question-text" className="text-right">Question</Label>
              <Input
                id="question-text"
                value={newQuestion.text}
                onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                className="col-span-3"
                placeholder="Entrez votre question"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="question-description" className="text-right pt-2">Description</Label>
              <Textarea
                id="question-description"
                value={newQuestion.description || ''}
                onChange={(e) => setNewQuestion({...newQuestion, description: e.target.value})}
                className="col-span-3"
                placeholder="Description ou instructions optionnelles"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">Obligatoire</div>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  checked={newQuestion.required}
                  onCheckedChange={(checked) => setNewQuestion({...newQuestion, required: checked})}
                />
                <Label>Cette question nécessite une réponse</Label>
              </div>
            </div>

            {/* Options for choice-based questions */}
            {(newQuestion.type === 'single_choice' || newQuestion.type === 'multiple_choice' || newQuestion.type === 'dropdown') && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Options</Label>
                <div className="col-span-3 space-y-2">
                  {(newQuestion.options || []).map((option, index) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Input
                        value={option.text}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(option.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une option
                  </Button>
                </div>
              </div>
            )}

            {/* Max length for text questions */}
            {(newQuestion.type === 'short_text' || newQuestion.type === 'long_text') && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="max-length" className="text-right">Longueur maximale</Label>
                <Input
                  id="max-length"
                  type="number"
                  value={newQuestion.maxLength || ''}
                  onChange={(e) => setNewQuestion({...newQuestion, maxLength: parseInt(e.target.value) || undefined})}
                  className="col-span-3"
                  placeholder="Laissez vide pour aucune limite"
                />
              </div>
            )}

            {/* Rating settings */}
            {newQuestion.type === 'rating' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="min-rating" className="text-right">Évaluation minimale</Label>
                  <Input
                    id="min-rating"
                    type="number"
                    value={newQuestion.minRating || 1}
                    onChange={(e) => setNewQuestion({...newQuestion, minRating: parseInt(e.target.value) || 1})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="max-rating" className="text-right">Évaluation maximale</Label>
                  <Input
                    id="max-rating"
                    type="number"
                    value={newQuestion.maxRating || 5}
                    onChange={(e) => setNewQuestion({...newQuestion, maxRating: parseInt(e.target.value) || 5})}
                    className="col-span-3"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddingQuestion(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSaveQuestion}>
              {editingQuestionId ? 'Mettre à jour la question' : 'Ajouter la question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form actions */}
      {questions.length > 0 && (
        <div className="flex justify-end pt-4">
          <Button onClick={handleSaveForm}>
            Enregistrer les questions
          </Button>
        </div>
      )}
    </div>
  );
};

export default ApplicationFormBuilder;