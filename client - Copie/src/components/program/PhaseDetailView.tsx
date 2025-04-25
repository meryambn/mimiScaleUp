import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Phase, Task, Meeting, EvaluationCriterion } from '@/types/program';

// Define the Deliverable interface
export interface Deliverable {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'reviewed';
  submissionType?: 'file' | 'link' | 'text';
  required?: boolean;
  maxFileSize?: number;
  allowedFileTypes?: string[];
}

export interface PhaseDetails extends Phase {
  deliverables: Deliverable[];
  color?: string;
  hasWinner?: boolean;
}

export interface PhaseDetailViewProps {
  phase: PhaseDetails;
  onUpdate: (phase: PhaseDetails) => void;
  isLastPhase?: boolean;
}

type AccessibleBy = 'mentors' | 'teams';

const isValidRole = (role: string): role is AccessibleBy => {
  return role === 'mentors' || role === 'teams';
};

const PhaseDetailView: React.FC<PhaseDetailViewProps> = ({ phase, onUpdate, isLastPhase = false }) => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [showAddCriterion, setShowAddCriterion] = useState(false);
  const [showAddDeliverable, setShowAddDeliverable] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    id: '',
    name: '',
    description: '',
    dueDate: new Date(),
  });
  const [newMeeting, setNewMeeting] = useState<Partial<Meeting> & { name: string; date: Date; time: string; duration: number; description: string; attendees: string[]; location: string; meetingType: 'online' | 'in-person' | 'hybrid' }>({
    id: '',
    name: '',
    title: '',
    date: new Date(),
    type: 'group',
    time: '10:00',
    duration: 60,
    description: '',
    attendees: [],
    location: '',
    meetingType: 'online'
  });
  const [newCriterion, setNewCriterion] = useState<EvaluationCriterion>({
    id: '',
    name: '',
    type: 'star_rating',
    weight: 10,
    description: '',  // Keep this for type compatibility
    accessibleBy: ['mentors', 'teams'],
    filledBy: 'teams',
    requiresValidation: false,
    options: [],  // Options for liste_deroulante type
  });
  const [newDeliverable, setNewDeliverable] = useState<Deliverable>({
    id: '',
    name: '',
    description: '',
    dueDate: new Date(),
    status: 'pending',
    submissionType: 'file',
    required: true,
    maxFileSize: 10,
    allowedFileTypes: ['.pdf', '.doc', '.docx']
  });

  // Initialize phase arrays immediately if they don't exist
  React.useEffect(() => {
    const needsInitialization = !Array.isArray(phase.tasks) ||
                              !Array.isArray(phase.meetings) ||
                              !Array.isArray(phase.evaluationCriteria) ||
                              !Array.isArray(phase.deliverables);

    if (needsInitialization) {
      const updatedPhase = {
        ...phase,
        tasks: Array.isArray(phase.tasks) ? phase.tasks : [],
        meetings: Array.isArray(phase.meetings) ? phase.meetings : [],
        evaluationCriteria: Array.isArray(phase.evaluationCriteria) ? phase.evaluationCriteria : [],
        deliverables: Array.isArray(phase.deliverables) ? phase.deliverables : []
      };
      onUpdate(updatedPhase);
    }
  }, []);

  const handleAddTask = () => {
    if (!newTask.name) return;

    // Create new task with unique ID
    const taskToAdd: Task = {
      ...newTask as Task,
      id: `task-${Date.now()}`
    };

    // Create new phase with the added task
    const updatedPhase = {
      ...phase,
      tasks: Array.isArray(phase.tasks) ? [...phase.tasks, taskToAdd] : [taskToAdd]
    };

    // Update phase
    onUpdate(updatedPhase);

    // Reset form but keep it visible
    setNewTask({
      id: '',
      name: '',
      description: '',
      dueDate: new Date(),
    });
  };

  const handleRemoveTask = (taskId: string) => {
    if (!Array.isArray(phase.tasks)) return;

    const updatedPhase = {
      ...phase,
      tasks: phase.tasks.filter(task => task.id !== taskId)
    };
    onUpdate(updatedPhase);
  };

  const handleAddMeeting = () => {
    if (!newMeeting.name) return;

    const meetingToAdd: Meeting = {
      id: `meeting-${Date.now()}`,
      title: newMeeting.name,
      date: newMeeting.date,
      type: newMeeting.type || 'group',
      name: newMeeting.name,
      time: newMeeting.time,
      duration: newMeeting.duration,
      description: newMeeting.description,
      attendees: newMeeting.attendees,
      location: newMeeting.location,
      meetingType: newMeeting.meetingType
    };

    const updatedPhase = {
      ...phase,
      meetings: [
        ...(Array.isArray(phase.meetings) ? phase.meetings : []),
        meetingToAdd
      ]
    };

    onUpdate(updatedPhase);
    setNewMeeting({
      id: '',
      name: '',
      title: '',
      date: new Date(),
      type: 'group',
      time: '10:00',
      duration: 60,
      description: '',
      attendees: [],
      location: '',
      meetingType: 'online'
    });
  };

  const handleRemoveMeeting = (meetingId: string) => {
    const updatedPhase = {
      ...phase,
      meetings: phase.meetings.filter(meeting => meeting.id !== meetingId)
    };

    onUpdate(updatedPhase);
  };

  const handleAddCriterion = () => {
    if (!newCriterion.name) return;

    const updatedPhase = {
      ...phase,
      evaluationCriteria: [
        ...(Array.isArray(phase.evaluationCriteria) ? phase.evaluationCriteria : []),
        {
          ...newCriterion,
          id: `criterion-${Date.now()}`
        }
      ]
    };

    onUpdate(updatedPhase);
    setNewCriterion({
      id: '',
      name: '',
      type: 'star_rating',
      weight: 10,
      description: '',  // Keep this for type compatibility
      accessibleBy: ['mentors', 'teams'],
      filledBy: 'teams',
      requiresValidation: false,
      options: [],  // Options for liste_deroulante type
    });
  };

  const handleRemoveCriterion = (criterionId: string) => {
    const updatedPhase = {
      ...phase,
      evaluationCriteria: phase.evaluationCriteria.filter(criterion => criterion.id !== criterionId)
    };

    onUpdate(updatedPhase);
  };

  const handleAddDeliverable = () => {
    if (!newDeliverable.name) return;

    const deliverableToAdd = {
      ...newDeliverable,
      id: `deliverable-${Date.now()}`
    };

    const updatedPhase = {
      ...phase,
      deliverables: Array.isArray(phase.deliverables)
        ? [...phase.deliverables, deliverableToAdd]
        : [deliverableToAdd]
    };

    onUpdate(updatedPhase);

    setNewDeliverable({
      id: '',
      name: '',
      description: '',
      dueDate: new Date(),
      status: 'pending',
      submissionType: 'file',
      required: true,
      maxFileSize: 10,
      allowedFileTypes: ['.pdf', '.doc', '.docx']
    } );
  };

  const handleRemoveDeliverable = (deliverableId: string) => {
    if (!Array.isArray(phase.deliverables)) return;

    const updatedPhase = {
      ...phase,
      deliverables: phase.deliverables.filter(d => d.id !== deliverableId)
    };
    onUpdate(updatedPhase);
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      {/* Phase Details Section */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Détails de la phase</h3>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-blue-600 text-sm">Tâches:</span>
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                {Array.isArray(phase.tasks) ? phase.tasks.length : 0}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full">
              <span className="text-purple-600 text-sm">Réunions:</span>
              <span className="bg-purple-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                {Array.isArray(phase.meetings) ? phase.meetings.length : 0}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
              <span className="text-green-600 text-sm">Critères:</span>
              <span className="bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                {Array.isArray(phase.evaluationCriteria) ? phase.evaluationCriteria.length : 0}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full">
              <span className="text-amber-600 text-sm">Livrables:</span>
              <span className="bg-amber-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                {Array.isArray(phase.deliverables) ? phase.deliverables.length : 0}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label>Phase Name</Label>
            <Input
              value={phase.name}
              onChange={(e) => {
                const updatedPhase = {
                  ...phase,
                  name: e.target.value
                };
                onUpdate(updatedPhase);
              }}
              placeholder="Enter phase name"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={phase.description}
              onChange={(e) => {
                const updatedPhase = {
                  ...phase,
                  description: e.target.value
                };
                onUpdate(updatedPhase);
              }}
              placeholder="Enter phase description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    style={{
                      backgroundColor: 'white',
                      color: '#0c4c80',
                      border: '1px solid #e5e7eb',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      textAlign: 'left'
                    }}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !phase.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {phase.startDate ? format(phase.startDate, "PPP") : <span>Pick a date</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={phase.startDate}
                    onSelect={(date) => {
                      if (date) {
                        const updatedPhase = {
                          ...phase,
                          startDate: date
                        };
                        onUpdate(updatedPhase);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    style={{
                      backgroundColor: 'white',
                      color: '#0c4c80',
                      border: '1px solid #e5e7eb',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      textAlign: 'left'
                    }}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !phase.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {phase.endDate ? format(phase.endDate, "PPP") : <span>Pick a date</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={phase.endDate}
                    onSelect={(date) => {
                      if (date) {
                        const updatedPhase = {
                          ...phase,
                          endDate: date
                        };
                        onUpdate(updatedPhase);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {isLastPhase && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-winner"
                checked={phase.hasWinner || false}
                onCheckedChange={(checked) => {
                  const updatedPhase = {
                    ...phase,
                    hasWinner: !!checked
                  };
                  onUpdate(updatedPhase);
                }}
              />
              <Label htmlFor="has-winner">Cette phase aura un gagnant</Label>
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="meetings">Réunions</TabsTrigger>
          <TabsTrigger value="evaluation">Critères d'évaluation</TabsTrigger>
          <TabsTrigger value="deliverables">Livrables</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Tâches</h3>
            <button
              onClick={() => setShowAddTask(!showAddTask)}
              style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
            >
              <Plus className="h-4 w-4 mr-2" /> {showAddTask ? 'Masquer le formulaire' : 'Ajouter une tâche'}
            </button>
          </div>

          {/* Add Task Form */}
          {showAddTask && (
            <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
            <div>
              <Label>Nom de la tâche</Label>
              <Input
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                placeholder="Entrez le nom de la tâche"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Décrivez la tâche en détail"
                rows={3}
              />
            </div>
            <div>
              <Label>Date d'échéance</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    style={{
                      backgroundColor: 'white',
                      color: '#0c4c80',
                      border: '1px solid #e5e7eb',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      textAlign: 'left'
                    }}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newTask.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.dueDate ? format(newTask.dueDate, "PPP") : <span>Choisir une date</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newTask.dueDate}
                    onSelect={(date) => date && setNewTask({ ...newTask, dueDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <button
              onClick={handleAddTask}
              disabled={!newTask.name || newTask.name.trim() === ''}
              style={{
                background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: (!newTask.name || newTask.name.trim() === '') ? 'not-allowed' : 'pointer',
                border: 'none',
                width: '100%',
                opacity: (!newTask.name || newTask.name.trim() === '') ? '0.5' : '1'
              }}
            >
                Ajouter la tâche
            </button>
          </div>
          )}

          {/* Task List */}
          <div className="space-y-2">
            {Array.isArray(phase.tasks) && phase.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{task.name}</h4>
                  {task.description && (
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Échéance: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveTask(task.id)}
                  style={{ backgroundColor: 'transparent', color: '#9333ea', border: 'none', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Réunions</h3>
            <button
              onClick={() => setShowAddMeeting(!showAddMeeting)}
              style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
            >
              <Plus className="h-4 w-4 mr-2" /> {showAddMeeting ? 'Masquer le formulaire' : 'Ajouter des réunions'}
            </button>
          </div>

          {/* Add Meeting Form */}
          {showAddMeeting && (
            <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
            <div>
              <Label>Nom de la réunion</Label>
              <Input
                value={newMeeting.name}
                onChange={(e) => setNewMeeting({ ...newMeeting, name: e.target.value })}
                placeholder="Entrez le nom de la réunion"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      style={{
                        backgroundColor: 'white',
                        color: '#0c4c80',
                        border: '1px solid #e5e7eb',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        textAlign: 'left'
                      }}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newMeeting.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newMeeting.date ? format(newMeeting.date, "PPP") : <span>Choisir une date</span>}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newMeeting.date}
                      onSelect={(date) => date && setNewMeeting({ ...newMeeting, date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={newMeeting.time}
                  onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Lieu</Label>
              <Input
                value={newMeeting.location}
                onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                placeholder="Entrez le lieu de la réunion ou le lien Zoom"
              />
            </div>
            <button
              onClick={() => {
                handleAddMeeting();
                // Keep the form visible after adding a meeting
                setShowAddMeeting(true);
              }}
              disabled={!newMeeting.name || newMeeting.name.trim() === ''}
              style={{
                background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: (!newMeeting.name || newMeeting.name.trim() === '') ? 'not-allowed' : 'pointer',
                border: 'none',
                width: '100%',
                opacity: (!newMeeting.name || newMeeting.name.trim() === '') ? '0.5' : '1'
              }}
            >
                Ajouter la réunion
            </button>
          </div>
          )}

          {/* Meeting List */}
          <div className="space-y-2">
            {phase.meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{meeting.name}</h4>
                  <p className="text-sm text-gray-500">
                    {format(meeting.date, 'MMM d, yyyy')} at {meeting.time}
                  </p>
                  {meeting.description && (
                    <p className="text-sm text-gray-600 mt-1">{meeting.description}</p>
                  )}
                  {meeting.location && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Location:</span> {meeting.location}
                    </p>
                  )}
                  {meeting.attendees && meeting.attendees.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Attendees:</span> {meeting.attendees.join(', ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveMeeting(meeting.id)}
                  style={{ backgroundColor: 'transparent', color: '#9333ea', border: 'none', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Critères d'évaluation</h3>
            <button
              onClick={() => setShowAddCriterion(!showAddCriterion)}
              style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
            >
              <Plus className="h-4 w-4 mr-2" /> {showAddCriterion ? 'Masquer le formulaire' : 'Ajouter des critères'}
            </button>
          </div>

          {/* Add Criterion Form */}
          {showAddCriterion && (
            <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
            <div>
              <Label>Nom du critère</Label>
              <Input
                value={newCriterion.name}
                onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })}
                placeholder="Entrez le nom du critère"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={newCriterion.type}
                onValueChange={(value: 'numeric' | 'star_rating' | 'yes_no' | 'liste_deroulante') =>
                  setNewCriterion({ ...newCriterion, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="numeric">Numérique</SelectItem>
                  <SelectItem value="star_rating">Évaluation par étoiles</SelectItem>
                  <SelectItem value="yes_no">Oui/Non</SelectItem>
                  <SelectItem value="liste_deroulante">Liste déroulante</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newCriterion.type === 'liste_deroulante' && (
              <div>
                <Label className="mb-2 block">Options</Label>
                <div className="space-y-3">
                  {newCriterion.options && newCriterion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="relative flex-grow">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(newCriterion.options || [])];
                            newOptions[index] = e.target.value;
                            setNewCriterion({ ...newCriterion, options: newOptions });
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="pr-10 w-full"
                        />
                        <button
                          onClick={() => {
                            const newOptions = [...(newCriterion.options || [])];
                            newOptions.splice(index, 1);
                            setNewCriterion({ ...newCriterion, options: newOptions });
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700"
                          type="button"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newOptions = [...(newCriterion.options || []), ''];
                      setNewCriterion({ ...newCriterion, options: newOptions });
                    }}
                    className="flex items-center text-blue-600 hover:text-blue-800 border border-blue-600 rounded-md px-3 py-2 text-sm"
                    type="button"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Ajouter une option
                  </button>
                  {(newCriterion.options?.length || 0) < 2 && (
                    <p className="text-xs text-red-500 mt-2">Ajoutez au moins 2 options pour la liste déroulante</p>
                  )}
                </div>
              </div>
            )}
            <div>
              <Label>Poids</Label>
              <Input
                type="number"
                value={newCriterion.weight}
                onChange={(e) => setNewCriterion({ ...newCriterion, weight: parseInt(e.target.value) })}
                min="1"
                max="100"
              />
            </div>

            <div>
              <Label>Accessible par</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mentors"
                    checked={newCriterion.accessibleBy.includes('mentors')}
                    onCheckedChange={(checked) => {
                      const newAccessibleBy = checked
                        ? [...newCriterion.accessibleBy, 'mentors']
                        : newCriterion.accessibleBy.filter(role => role !== 'mentors');
                      setNewCriterion({
                        ...newCriterion,
                        accessibleBy: newAccessibleBy.filter(isValidRole)
                      });
                    }}
                  />
                  <Label htmlFor="mentors">Mentors</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="teams"
                    checked={newCriterion.accessibleBy.includes('teams')}
                    onCheckedChange={(checked) => {
                      const newAccessibleBy = checked
                        ? [...newCriterion.accessibleBy, 'teams']
                        : newCriterion.accessibleBy.filter(role => role !== 'teams');
                      setNewCriterion({
                        ...newCriterion,
                        accessibleBy: newAccessibleBy.filter(isValidRole)
                      });
                    }}
                  />
                  <Label htmlFor="teams">Équipes</Label>
                </div>
              </div>
            </div>

            <div>
              <Label>Rempli par</Label>
              <div className="flex items-center space-x-4 mt-2">
                <Select
                  value={newCriterion.filledBy}
                  onValueChange={(value: 'mentors' | 'teams') =>
                    setNewCriterion({ ...newCriterion, filledBy: value })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sélectionnez qui remplit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mentors">Mentors</SelectItem>
                    <SelectItem value="teams">Équipes</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="requires-validation"
                    checked={newCriterion.requiresValidation}
                    onCheckedChange={(checked) =>
                      setNewCriterion({ ...newCriterion, requiresValidation: checked })
                    }
                  />
                  <Label htmlFor="requires-validation">Nécessite une validation</Label>
                </div>
              </div>
            </div>

            <button
              className="w-full"
              onClick={() => {
                handleAddCriterion();
                // Keep the form visible after adding a criterion
                setShowAddCriterion(true);
              }}
              disabled={!newCriterion.name || newCriterion.name.trim() === ''}
              style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none', width: '100%' }}
            >
                Ajouter le critère
              </button>
            </div>
          )}

          {/* Criteria List */}
          <div className="space-y-2">
            {phase.evaluationCriteria.map((criterion) => (
              <div
                key={criterion.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{criterion.name}</h4>
                  <p className="text-sm text-gray-500">
                    Type: {criterion.type === 'numeric' ? 'Numérique' : criterion.type === 'star_rating' ? 'Évaluation par étoiles' : criterion.type === 'yes_no' ? 'Oui/Non' : criterion.type === 'liste_deroulante' ? 'Liste déroulante' : 'Autre'} | Poids: {criterion.weight}
                    {criterion.type === 'liste_deroulante' && criterion.options && criterion.options.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        Options: {criterion.options.join(', ')}
                      </div>
                    )}
                  </p>

                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs text-gray-500">
                      Accessible par:
                      {criterion.accessibleBy.includes('mentors') && 'Mentors'}
                      {criterion.accessibleBy.includes('mentors') && criterion.accessibleBy.includes('teams') && ', '}
                      {criterion.accessibleBy.includes('teams') && 'Équipes'}
                    </span>
                    <span className="text-xs text-gray-500 ml-4">
                      Rempli par: {criterion.filledBy === 'teams' ? 'Équipes' : 'Mentors'}
                      {criterion.requiresValidation && (
                        <span className="text-xs text-blue-500 ml-1">(Nécessite une validation)</span>
                      )}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveCriterion(criterion.id)}
                  style={{ backgroundColor: 'transparent', color: '#9333ea', border: 'none', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deliverables" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Livrables de la phase</h3>
            <button
              onClick={() => setShowAddDeliverable(!showAddDeliverable)}
              style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
            >
              <Plus className="h-4 w-4 mr-2" /> {showAddDeliverable ? 'Masquer le formulaire' : 'Ajouter un livrable'}
            </button>
          </div>

          {showAddDeliverable && (
            <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
              <div>
                <Label>Nom du livrable</Label>
                <Input
                  value={newDeliverable.name}
                  onChange={(e) => setNewDeliverable({ ...newDeliverable, name: e.target.value })}
                  placeholder="Entrez le nom du livrable"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={newDeliverable.description}
                  onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })}
                  placeholder="Décrivez ce que les équipes doivent livrer"
                  rows={3}
                />
              </div>

              <div>
                <Label>Date d'échéance</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      style={{ backgroundColor: 'white', color: '#9333ea', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center' }}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newDeliverable.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newDeliverable.dueDate ? format(newDeliverable.dueDate, "PPP") : <span>Choisir une date</span>}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newDeliverable.dueDate}
                      onSelect={(date) => date && setNewDeliverable({ ...newDeliverable, dueDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Types de documents acceptés</Label>
                <Input
                  value={newDeliverable.allowedFileTypes?.join(', ')}
                  onChange={(e) => setNewDeliverable({
                    ...newDeliverable,
                    allowedFileTypes: e.target.value.split(',').map(t => t.trim())
                  })}
                  placeholder=".pdf, .doc, .docx, .ppt, .xls"
                />
                <p className="text-xs text-gray-500 mt-1">Séparez les extensions par des virgules</p>
              </div>


              <button
                onClick={handleAddDeliverable}
                disabled={!newDeliverable.name || newDeliverable.name.trim() === ''}
                className="w-full"
                style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none', width: '100%' }}
              >
                Ajouter le livrable
              </button>
            </div>
          )}

          {/* Deliverables List */}
          <div className="space-y-2">
            {Array.isArray(phase.deliverables) && phase.deliverables.map((deliverable) => (
              <div
                key={deliverable.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{deliverable.name}</h4>

                  </div>
                  <p className="text-sm text-gray-600">{deliverable.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Échéance: {format(new Date(deliverable.dueDate), 'MMM d, yyyy')}</span>
                    {deliverable.allowedFileTypes && deliverable.allowedFileTypes.length > 0 && (
                      <span>Types: {deliverable.allowedFileTypes.join(', ')}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveDeliverable(deliverable.id)}
                  style={{ backgroundColor: 'transparent', color: '#9333ea', border: 'none', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PhaseDetailView;