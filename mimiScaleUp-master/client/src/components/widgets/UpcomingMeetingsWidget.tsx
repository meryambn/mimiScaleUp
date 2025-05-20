import React from 'react';
import { Calendar, Clock, MapPin, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useMeetings } from '@/context/MeetingsContext';
import { useProgramContext } from '@/context/ProgramContext';

interface UpcomingMeetingsWidgetProps {
  programId?: number | string;
  currentPhase?: number | string;
  meetings?: any[];
}

const UpcomingMeetingsWidget: React.FC<UpcomingMeetingsWidgetProps> = ({
  programId,
  currentPhase,
  meetings = []
}) => {
  const {
    upcomingMeetings: contextMeetings,
    formatDate,
    formatTime
  } = useMeetings();
  const { selectedPhaseId } = useProgramContext();

  // Use meetings prop if provided, otherwise use context
  const upcomingMeetings = meetings.length > 0 ? meetings : contextMeetings;

  // Format date function
  const formatMeetingDate = (date: string, time?: string) => {
    try {
      return new Date(date).toLocaleDateString('fr-FR');
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Format time function
  const formatMeetingTime = (time?: string) => {
    if (!time) return '00:00';
    return time;
  };

  // Filter meetings by selected phase if applicable
  // If currentPhase is null, undefined, or 0, show all meetings
  const phaseFilteredMeetings = currentPhase && Number(currentPhase) > 0
    ? upcomingMeetings.filter(meeting => {
        // If meeting has phaseId property, filter by it
        if (meeting.phaseId) {
          return String(meeting.phaseId) === String(currentPhase);
        }
        // Otherwise, include all meetings
        return true;
      })
    : upcomingMeetings; // Show all meetings when no phase is selected

  console.log('UpcomingMeetingsWidget - Filtered meetings:', phaseFilteredMeetings);

  // Get only the first 4 upcoming meetings
  const displayMeetings = phaseFilteredMeetings.slice(0, 4);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Réunions à venir</h3>
        <Calendar className="h-5 w-5 text-orange-500" />
      </div>

      {displayMeetings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Aucune réunion programmée</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {displayMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{meeting.title}</h4>

                  </div>
                  <Button variant="ghost" size="sm">
                    Rejoindre
                  </Button>
                </div>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatMeetingDate(meeting.date, meeting.time)}, {formatMeetingTime(meeting.time)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {meeting.isOnline ? (
                      <>
                        <Video className="h-4 w-4 text-blue-500" />
                        <span className="text-blue-600">Réunion en ligne</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4" />
                        <span>{meeting.location}</span>
                      </>
                    )}
                  </div>


                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default UpcomingMeetingsWidget;