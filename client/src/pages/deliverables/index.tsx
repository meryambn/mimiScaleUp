import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  FileText,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  Upload,
  ExternalLink,
  Filter,
  AlertCircle,
  Download,
  Eye,
  MessageSquare,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useProgramContext } from "@/context/ProgramContext";
import { useDeliverables, Deliverable, Phase } from "@/context/DeliverablesContext";
import { format } from "date-fns";

const DeliverablePage: React.FC = () => {
  const { selectedProgram } = useProgramContext();
  const {
    deliverables,
    phases,
    filteredDeliverables,
    upcomingDeliverables,
    searchQuery,
    setSearchQuery,
    selectedPhase,
    setSelectedPhase,
    selectedType,
    setSelectedType,
    getStatusBadgeClass,
    getStatusText,
    getSubmissionTypeIcon,
    getPhaseById,
    getPhaseColor,
    today
  } = useDeliverables();

  if (!selectedProgram) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">No Program Selected</h1>
        <p className="text-gray-500 mb-6">Please select a program to view its deliverables.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Program Deliverables</h1>
          <p className="text-gray-500">{selectedProgram.name}</p>
        </div>

      </div>

      {/* Phase Timeline */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Program Phase Timeline</CardTitle>
          <CardDescription>Click on a phase to filter deliverables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            {/* Phase Timeline Bar */}
            <div className="relative h-12 bg-gray-100 rounded-md overflow-hidden flex">
              {phases.map((phase) => {
                // Calculate width based on phase duration (for actual implementation, use date calculation)
                const width = `${100 / phases.length}%`;

                return (
                  <div
                    key={phase.id}
                    className={`h-full cursor-pointer hover:opacity-90 flex items-center justify-center
                      ${selectedPhase === phase.id ? 'ring-2 ring-offset-2 ring-offset-white ring-blue-500 z-10' : ''}
                    `}
                    style={{
                      width,
                      backgroundColor: phase.color,
                      opacity: phase.status === 'not_started' ? 0.5 : 1
                    }}
                    onClick={() => setSelectedPhase(phase.id === selectedPhase ? null : phase.id)}
                  >
                    <span className="text-white font-medium text-xs md:text-sm truncate px-2">
                      {phase.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter tags display */}
      {selectedPhase && (
        <div className="mb-4 flex items-center">
          <div
            className="flex items-center px-3 py-1 rounded-full text-sm"
            style={{
              backgroundColor: `${getPhaseColor(selectedPhase)}20`,
              color: getPhaseColor(selectedPhase)
            }}
          >
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: getPhaseColor(selectedPhase) }}
            ></div>
            <span className="font-medium">
              Filtered by phase: {getPhaseById(selectedPhase)?.name}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-7 px-2"
            onClick={() => setSelectedPhase(null)}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search deliverables..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm"
            value={selectedType || ''}
            onChange={(e) => setSelectedType(e.target.value || null)}
          >
            <option value="">All Types</option>
            <option value="file">File Upload</option>
            <option value="link">External Link</option>
            <option value="text">Text Entry</option>
          </select>
        </div>
      </div>

      {/* Deliverables Content */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="by-phase">By Phase</TabsTrigger>
        </TabsList>

        {/* Grid View */}
        <TabsContent value="grid">
          {filteredDeliverables.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No deliverables found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedPhase
                  ? `There are no deliverables in the ${getPhaseById(selectedPhase)?.name} phase matching your filters.`
                  : "Try adjusting your filters or create a new deliverable."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDeliverables.map(deliverable => (
                <DeliverableCard
                  key={deliverable.id}
                  deliverable={deliverable}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* List View */}
        <TabsContent value="list">
          {filteredDeliverables.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No deliverables found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedPhase
                  ? `There are no deliverables in the ${getPhaseById(selectedPhase)?.name} phase matching your filters.`
                  : "Try adjusting your filters or create a new deliverable."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDeliverables.map(deliverable => (
                <DeliverableRowCard
                  key={deliverable.id}
                  deliverable={deliverable}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* By Phase View */}
        <TabsContent value="by-phase">
          <div className="space-y-8">
            {phases.map(phase => {
              const phaseDeliverables = filteredDeliverables.filter(
                d => d.phaseId === phase.id
              );

              if (phaseDeliverables.length === 0) return null;

              return (
                <div key={phase.id} className="mb-8">
                  <div className="flex items-center mb-4">
                    <div
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: phase.color }}
                    />
                    <h3 className="text-lg font-medium">{phase.name}</h3>
                    <Badge className="ml-3">{phaseDeliverables.length}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {phaseDeliverables.map(deliverable => (
                      <DeliverableCard
                        key={deliverable.id}
                        deliverable={deliverable}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const DeliverableCard: React.FC<{ deliverable: Deliverable }> = ({ deliverable }) => {
  const { getStatusBadgeClass, getStatusText, getSubmissionTypeIcon, getPhaseColor } = useDeliverables();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div
            className="px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: `${getPhaseColor(deliverable.phaseId)}20`,
              color: getPhaseColor(deliverable.phaseId)
            }}
          >
            {deliverable.phaseName}
          </div>
          <Badge className="bg-gray-100 text-gray-800">
            Deliverable
          </Badge>
        </div>
        <CardTitle className="text-md mt-2">{deliverable.name}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <p className="text-sm text-gray-500 mb-4 line-clamp-3">{deliverable.description}</p>

        <div className="flex items-center text-xs text-gray-500 mb-1">
          <Calendar className="h-3.5 w-3.5 mr-1" />
          <span>Due: {format(new Date(deliverable.dueDate), 'MMM d, yyyy')}</span>
        </div>

        <div className="flex items-center text-xs text-gray-500">
          <User className="h-3.5 w-3.5 mr-1" />
          <span>Assigned by: {deliverable.assignedBy}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex flex-col items-stretch">
        <div className="flex items-center justify-between w-full text-xs text-gray-500 mb-3">
          <div className="flex items-center">
            {getSubmissionTypeIcon(deliverable.submissionType)}
            <span className="ml-1 capitalize">{deliverable.submissionType}</span>
          </div>
          {deliverable.required && (
            <Badge variant="outline" className="text-xs">Required</Badge>
          )}
        </div>

        <Button className="w-full" variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

const DeliverableRowCard: React.FC<{ deliverable: Deliverable }> = ({ deliverable }) => {
  const { getSubmissionTypeIcon, getPhaseColor } = useDeliverables();

  return (
    <Card>
      <div className="p-4 flex flex-col md:flex-row md:items-center">
        <div className="md:flex-grow mb-4 md:mb-0">
          <div className="flex items-center mb-2">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: getPhaseColor(deliverable.phaseId) }}
            />
            <span className="text-sm text-gray-500">{deliverable.phaseName}</span>
            <Badge className="ml-3 bg-gray-100 text-gray-800">
              Deliverable
            </Badge>
          </div>

          <h3 className="text-lg font-medium mb-1">{deliverable.name}</h3>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{deliverable.description}</p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span>Due: {format(new Date(deliverable.dueDate), 'MMM d, yyyy')}</span>
            </div>

            <div className="flex items-center">
              <User className="h-3.5 w-3.5 mr-1" />
              <span>Assigned by: {deliverable.assignedBy}</span>
            </div>

            <div className="flex items-center">
              {getSubmissionTypeIcon(deliverable.submissionType)}
              <span className="ml-1 capitalize">{deliverable.submissionType}</span>
            </div>

            {deliverable.required && (
              <Badge variant="outline" className="text-xs">Required</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 md:ml-4">
          <Button variant="default" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default DeliverablePage;