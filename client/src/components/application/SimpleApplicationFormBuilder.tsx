import * as React from "react";
import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  GripVertical,
  PlusCircle,
  TextIcon,
  CheckSquare,
  ListOrdered,
  FileText,
  Star
} from "lucide-react";

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

const SimpleApplicationFormBuilder: React.FC<ApplicationFormBuilderProps> = ({
  programId,
  defaultQuestions = [],
  onSave
}) => {
  const [questions, setQuestions] = useState<FormQuestion[]>(defaultQuestions);
  const [newQuestion, setNewQuestion] = useState<FormQuestion>({
    id: uuidv4(),
    type: "short_text",
    text: "",
    description: "",
    required: false,
    options: []
  });
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  const handleAddQuestion = () => {
    if (!newQuestion.text.trim()) {
      return;
    }

    const updatedQuestions = [...questions, newQuestion];
    setQuestions(updatedQuestions);
    onSave(updatedQuestions);

    // Reset the form
    setNewQuestion({
      id: uuidv4(),
      type: "short_text",
      text: "",
      description: "",
      required: false,
      options: []
    });
    setIsAddingQuestion(false);
  };

  const handleEditQuestion = (index: number) => {
    setEditingQuestionIndex(index);
    setNewQuestion({...questions[index]});
    setIsAddingQuestion(true);
  };

  const handleUpdateQuestion = () => {
    if (editingQuestionIndex === null) return;

    const updatedQuestions = [...questions];
    updatedQuestions[editingQuestionIndex] = newQuestion;

    setQuestions(updatedQuestions);
    onSave(updatedQuestions);

    // Reset form
    setNewQuestion({
      id: uuidv4(),
      type: "short_text",
      text: "",
      description: "",
      required: false,
      options: []
    });
    setIsAddingQuestion(false);
    setEditingQuestionIndex(null);
  };

  const handleRemoveQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
    onSave(updatedQuestions);
  };

  const handleMoveQuestion = (dragIndex: number, hoverIndex: number) => {
    const updatedQuestions = [...questions];
    const dragQuestion = updatedQuestions[dragIndex];

    updatedQuestions.splice(dragIndex, 1);
    updatedQuestions.splice(hoverIndex, 0, dragQuestion);

    setQuestions(updatedQuestions);
    onSave(updatedQuestions);
  };

  const handleAddOption = () => {
    const newOption: QuestionOption = {
      id: uuidv4(),
      text: ""
    };

    setNewQuestion({
      ...newQuestion,
      options: [...(newQuestion.options || []), newOption]
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...(newQuestion.options || [])];
    updatedOptions[index] = {
      ...updatedOptions[index],
      text: value
    };

    setNewQuestion({
      ...newQuestion,
      options: updatedOptions
    });
  };

  const handleRemoveOption = (index: number) => {
    const updatedOptions = (newQuestion.options || []).filter((_, i) => i !== index);
    setNewQuestion({
      ...newQuestion,
      options: updatedOptions
    });
  };

  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case "short_text":
        return <TextIcon className="h-4 w-4 mr-2" />;
      case "long_text":
        return <FileText className="h-4 w-4 mr-2" />;
      case "single_choice":
        return <CheckSquare className="h-4 w-4 mr-2" />;
      case "multiple_choice":
        return <CheckSquare className="h-4 w-4 mr-2" />;
      case "dropdown":
        return <ListOrdered className="h-4 w-4 mr-2" />;
      case "file_upload":
        return <FileText className="h-4 w-4 mr-2" />;
      case "rating":
        return <Star className="h-4 w-4 mr-2" />;
      default:
        return <TextIcon className="h-4 w-4 mr-2" />;
    }
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case "short_text":
        return "Texte court";
      case "long_text":
        return "Texte long";
      case "single_choice":
        return "Choix unique";
      case "multiple_choice":
        return "Choix multiple";
      case "dropdown":
        return "Liste déroulante";
      case "file_upload":
        return "Téléchargement de fichier";
      case "rating":
        return "Évaluation";
      default:
        return "Texte court";
    }
  };

  return (
    <div className="space-y-4">
      {/* Question list */}
      {questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id} className="relative">
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    {getQuestionTypeIcon(question.type)}
                    <h3 className="text-lg font-medium">{question.text}</h3>
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{getQuestionTypeLabel(question.type)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    style={{ backgroundColor: 'transparent', color: '#0c4c80', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                    onClick={() => handleEditQuestion(index)}
                  >
                    Edit
                  </button>
                  <button
                    style={{ backgroundColor: 'transparent', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => handleRemoveQuestion(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="cursor-move">
                    <GripVertical className="h-5 w-5 text-gray-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-0">
                {question.description && (
                  <p className="text-sm text-gray-500 mb-2">{question.description}</p>
                )}

                {(question.type === "single_choice" || question.type === "multiple_choice" || question.type === "dropdown") && question.options && (
                  <div className="pl-6 space-y-1">
                    {question.options.map((option) => (
                      <div key={option.id} className="flex items-center">
                        {question.type === "single_choice" && (
                          <div className="h-4 w-4 rounded-full border border-gray-300 mr-2" />
                        )}
                        {question.type === "multiple_choice" && (
                          <div className="h-4 w-4 rounded-sm border border-gray-300 mr-2" />
                        )}
                        <span className="text-sm">{option.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {question.type === "rating" && (
                  <div className="pl-6 flex space-x-2">
                    {Array.from({ length: (question.maxRating || 5) - (question.minRating || 1) + 1 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm"
                      >
                        {(question.minRating || 1) + i}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed rounded-md">
          <p className="text-gray-500">No questions added yet</p>
          <p className="text-sm text-gray-400 mt-1">Add questions to your application form</p>
        </div>
      )}

      {/* Add question dialog */}
      <Dialog open={isAddingQuestion} onOpenChange={setIsAddingQuestion}>
        <DialogTrigger asChild>
          <button
            className="w-full"
            style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
            onClick={() => {
              setNewQuestion({
                id: uuidv4(),
                type: "short_text",
                text: "",
                description: "",
                required: false,
                options: []
              });
              setEditingQuestionIndex(null);
              setIsAddingQuestion(true);
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Ajouter une question
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingQuestionIndex !== null ? "Modifier la question" : "Ajouter une nouvelle question"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question-type">Type de question</Label>
              <Select
                value={newQuestion.type}
                onValueChange={(value: QuestionType) => setNewQuestion({...newQuestion, type: value})}
              >
                <SelectTrigger id="question-type">
                  <SelectValue placeholder="Sélectionnez le type de question" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_text">
                    <div className="flex items-center">
                      <TextIcon className="h-4 w-4 mr-2" />
                      <span>Text (Single Line)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="long_text">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      <span>Text (Multi-Line)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="single_choice">
                    <div className="flex items-center">
                      <div className="h-4 w-4 mr-2 rounded-full border border-gray-500 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                      </div>
                      <span>Radio Buttons</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="multiple_choice">
                    <div className="flex items-center">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      <span>Checkboxes</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dropdown">
                    <div className="flex items-center">
                      <ListOrdered className="h-4 w-4 mr-2" />
                      <span>Liste déroulante</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="file_upload">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      <span>Téléchargement de fichier</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="rating">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-2" />
                      <span>Évaluation</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="question-text">Texte de la question</Label>
              <Input
                id="question-text"
                value={newQuestion.text}
                onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                placeholder="Entrez votre question ici"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="question-description">Description (Optionnelle)</Label>
              <Textarea
                id="question-description"
                value={newQuestion.description || ""}
                onChange={(e) => setNewQuestion({...newQuestion, description: e.target.value})}
                placeholder="Add a description to help applicants understand the question"
                rows={2}
              />
            </div>

            {(newQuestion.type === "single_choice" || newQuestion.type === "multiple_choice" || newQuestion.type === "dropdown") && (
              <div className="space-y-3">
                <Label>Options</Label>
                {(newQuestion.options || []).map((option, idx) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Input
                      value={option.text}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                    />
                    <button
                      onClick={() => handleRemoveOption(idx)}
                      style={{ backgroundColor: 'transparent', color: '#ef4444', border: 'none', padding: '4px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddOption}
                  className="mt-2"
                  style={{ backgroundColor: 'white', color: '#0c4c80', border: '1px solid #e5e7eb', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une option
                </button>
              </div>
            )}

            {newQuestion.type === "rating" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-rating">Évaluation minimale</Label>
                  <Input
                    id="min-rating"
                    type="number"
                    min={1}
                    max={10}
                    value={newQuestion.minRating || 1}
                    onChange={(e) => setNewQuestion({...newQuestion, minRating: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-rating">Évaluation maximale</Label>
                  <Input
                    id="max-rating"
                    type="number"
                    min={1}
                    max={10}
                    value={newQuestion.maxRating || 5}
                    onChange={(e) => setNewQuestion({...newQuestion, maxRating: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="required"
                checked={newQuestion.required}
                onCheckedChange={(checked) => setNewQuestion({...newQuestion, required: checked as boolean})}
              />
              <Label htmlFor="required" className="text-sm font-normal">Question obligatoire</Label>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsAddingQuestion(false)}
              style={{ backgroundColor: 'white', color: '#0c4c80', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              onClick={editingQuestionIndex !== null ? handleUpdateQuestion : handleAddQuestion}
              style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
            >
              {editingQuestionIndex !== null ? "Mettre à jour la question" : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Ajouter la question
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SimpleApplicationFormBuilder;