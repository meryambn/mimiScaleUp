import React from 'react';
import { Calendar, Clock, MapPin, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useMeetings } from '@/context/MeetingsContext';

const UpcomingMeetingsWidget: React.FC = () => {
  const {
    upcomingMeetings,
    formatDate,
    formatTime
  } = useMeetings();

  // Get only the first 4 upcoming meetings
  const displayMeetings = upcomingMeetings.slice(0, 4);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Upcoming Meetings</h3>
        <Calendar className="h-5 w-5 text-orange-500" />
      </div>

      {displayMeetings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No upcoming meetings scheduled</p>
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
                    Join
                  </Button>
                </div>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDate(meeting.date, meeting.time)}, {formatTime(meeting.time)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {meeting.isOnline ? (
                      <>
                        <Video className="h-4 w-4 text-blue-500" />
                        <span className="text-blue-600">Online Meeting</span>
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