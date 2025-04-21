import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CalendarView from "@/components/meetings/CalendarView";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ListFilter,
  Search,
  List,
  CalendarIcon,
  Clock,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useProgramContext } from "@/context/ProgramContext";
import { useMeetings } from "@/context/MeetingsContext";
import { format } from "date-fns";

const MeetingsPage: React.FC = () => {
  const { selectedProgram, selectedProgramId } = useProgramContext();
  const [activeView, setActiveView] = useState<"list" | "calendar">("list");
  const [refreshKey, setRefreshKey] = useState(0); // Used to force re-render

  // Use the MeetingsContext
  const {
    meetings,
    phases,
    filteredMeetings,
    searchQuery,
    setSearchQuery,
    selectedPhase,
    setSelectedPhase,
    getPhaseById,
    today
  } = useMeetings();

  // Log meetings when they change
  useEffect(() => {
    console.log('MeetingsPage - Meetings:', meetings.length);
    console.log('MeetingsPage - Filtered Meetings:', filteredMeetings.length);
    if (selectedProgramId) {
      const programMeetings = meetings.filter(m => m.programId === selectedProgramId);
      console.log(`MeetingsPage - Meetings for program ${selectedProgramId}:`, programMeetings.length);
    }
  }, [meetings, filteredMeetings, selectedProgramId]);

  // Force refresh when selected program changes
  useEffect(() => {
    console.log('MeetingsPage - Selected program changed to:', selectedProgramId);
    setRefreshKey(prev => prev + 1);
  }, [selectedProgramId]);

  if (!selectedProgram) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Aucun programme sélectionné</h1>
        <p className="text-gray-500 mb-6">Veuillez sélectionner un programme pour voir ses réunions.</p>
      </div>
    );
  }

  // Count meetings for the selected program
  const programMeetings = meetings.filter(m => m.programId === selectedProgramId);
  const upcomingCount = programMeetings.filter(m => m.date >= today && !m.isCompleted).length;
  const pastCount = programMeetings.filter(m => m.date < today || m.isCompleted).length;

  return (
    <div className="container mx-auto py-6" key={refreshKey}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Réunions du programme</h1>
          <p className="text-gray-500">{selectedProgram.name}</p>
          <p className="text-xs text-gray-400">Total des réunions: {programMeetings.length} (À venir: {upcomingCount}, Passées: {pastCount})</p>
        </div>
        <div className="flex space-x-2">
          <div className="flex bg-muted rounded-md p-1">
            <Button
              variant={activeView === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("list")}
              className="rounded-sm"
            >
              <List className="h-4 w-4 mr-2" />
              Liste
            </Button>
            <Button
              variant={activeView === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("calendar")}
              className="rounded-sm"
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendrier
            </Button>
          </div>

        </div>
      </div>

      {/* Phase Timeline */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Chronologie des phases du programme</CardTitle>
          <CardDescription>Cliquez sur une phase pour filtrer les réunions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            {/* Phase Timeline Bar */}
            <div className="relative h-12 bg-gray-100 rounded-md overflow-hidden flex">
              {phases.map((phase, i) => {
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
                      opacity: phase.status === 'not_started' ? 0.5 : 1,
                      zIndex: phases.length - i // Pour s'assurer que les phases plus récentes sont au-dessus
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

            {/* Phase Details */}
            <div className="grid grid-cols-5 gap-2">
              {phases.map((phase) => (
                <div
                  key={`details-${phase.id}`}
                  className={`text-xs p-2 rounded ${selectedPhase === phase.id ? 'bg-gray-100' : ''}`}
                >
                  <div className="font-medium">{phase.name}</div>
                  <div className="text-gray-500">
                    {format(new Date(phase.startDate), 'MMM d')} - {format(new Date(phase.endDate), 'MMM d, yyyy')}
                  </div>
                  <div className="mt-1 flex items-center">
                    <CalendarIcon className="h-3 w-3 mr-1 text-gray-500" />
                    <span>{phase.meetingCount} Meetings</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher des réunions..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <ListFilter className="h-4 w-4 mr-2" />
            Filtrer
          </Button>
        </div>
      </div>

      {selectedPhase && (
        <div className="mb-6 px-4 py-3 bg-blue-50 rounded-lg flex justify-between items-center">
          <div className="flex items-center">
            <div
              className="w-4 h-4 rounded-full mr-2"
              style={{ backgroundColor: getPhaseById(selectedPhase)?.color }}
            ></div>
            <span className="font-medium">
              Filtré par phase : {getPhaseById(selectedPhase)?.name}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPhase(null)}
          >
            Effacer
          </Button>
        </div>
      )}

      {/* Meeting Content */}
      {activeView === "calendar" ? (
        <CalendarView
          meetings={filteredMeetings}
          getPhaseById={getPhaseById}
        />
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">Réunions à venir</TabsTrigger>
            <TabsTrigger value="past">Réunions passées</TabsTrigger>
          </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {filteredMeetings.filter(m => m.date >= today && !m.isCompleted).length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune réunion à venir</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedPhase
                  ? `Il n'y a pas de réunions à venir dans la phase ${getPhaseById(selectedPhase)?.name}.`
                  : "Les réunions à venir apparaîtront ici."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMeetings
                .filter(m => m.date >= today && !m.isCompleted)
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                .map(meeting => (
                  <Card key={meeting.id}>
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="p-4 md:p-6 md:w-1/4 border-b md:border-r md:border-b-0 border-gray-100">
                          <div className="text-sm text-gray-500">
                            {format(new Date(meeting.date), 'EEEE')}
                          </div>
                          <div className="text-2xl font-bold">
                            {format(new Date(meeting.date), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center mt-2 text-gray-700">
                            <Clock className="h-4 w-4 mr-1" />
                            {meeting.time}
                          </div>
                          <div
                            className="mt-2 px-2 py-1 text-xs font-medium rounded-full inline-flex items-center"
                            style={{
                              backgroundColor: getPhaseById(meeting.phaseId)?.color + '20',
                              color: getPhaseById(meeting.phaseId)?.color
                            }}
                          >
                            {getPhaseById(meeting.phaseId)?.name}
                          </div>
                        </div>
                        <div className="flex-1 p-4 md:p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <h3 className="text-lg font-semibold">{meeting.title}</h3>

                          </div>

                          <p className="mt-2 text-gray-600">
                            {meeting.description || "Aucune description fournie."}
                          </p>

                          <div className="mt-4 space-y-2">
                            <div className="flex items-start">
                              <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                              <div>
                                {meeting.location}
                                {meeting.isOnline && <span className="ml-2 text-sm text-blue-600">Réunion en ligne</span>}
                              </div>
                            </div>

                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {meeting.date >= today && !meeting.isCompleted ? (
                              <>
                                <Button size="sm" variant="outline">
                                  Modifier
                                </Button>
                                <Button size="sm" variant="ghost">
                                  Être notifié
                                </Button>
                              </>
                            ) : (
                              meeting.hasNotes ? (
                                <Button size="sm" variant="outline">
                                  Voir les notes
                                </Button>
                              ) : (
                                <Button size="sm">
                                  Ajouter des notes
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {filteredMeetings.filter(m => m.date < today || m.isCompleted).length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune réunion passée</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedPhase
                  ? `Il n'y a pas de réunions passées dans la phase ${getPhaseById(selectedPhase)?.name}.`
                  : "Les réunions passées apparaîtront ici lorsque les réunions seront terminées ou que la date sera passée."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMeetings
                .filter(m => m.date < today || m.isCompleted)
                .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
                .map(meeting => (
                  <Card key={meeting.id}>
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="p-4 md:p-6 md:w-1/4 border-b md:border-r md:border-b-0 border-gray-100">
                          <div className="text-sm text-gray-500">
                            {format(new Date(meeting.date), 'EEEE')}
                          </div>
                          <div className="text-2xl font-bold">
                            {format(new Date(meeting.date), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center mt-2 text-gray-700">
                            <Clock className="h-4 w-4 mr-1" />
                            {meeting.time}
                          </div>
                          <div
                            className="mt-2 px-2 py-1 text-xs font-medium rounded-full inline-flex items-center"
                            style={{
                              backgroundColor: getPhaseById(meeting.phaseId)?.color + '20',
                              color: getPhaseById(meeting.phaseId)?.color
                            }}
                          >
                            {getPhaseById(meeting.phaseId)?.name}
                          </div>
                        </div>
                        <div className="flex-1 p-4 md:p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <h3 className="text-lg font-semibold">{meeting.title}</h3>

                          </div>

                          <p className="mt-2 text-gray-600">
                            {meeting.description || "Aucune description fournie."}
                          </p>

                          <div className="mt-4 space-y-2">
                            <div className="flex items-start">
                              <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                              <div>
                                {meeting.location}
                                {meeting.isOnline && <span className="ml-2 text-sm text-blue-600">Réunion en ligne</span>}
                              </div>
                            </div>

                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {meeting.hasNotes ? (
                              <Button size="sm" variant="outline">
                                Voir les notes
                              </Button>
                            ) : (
                              <Button size="sm">
                                Ajouter des notes
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
};

export default MeetingsPage;