import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Users, 
  VideoIcon,
  Check,
  AlertCircle
} from "lucide-react";
import { Meeting } from "@/context/MeetingsContext";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CalendarViewProps {
  meetings: Meeting[];
  getPhaseById: (phaseId: string) => any;
  formatAttendees: (attendees: string[]) => string;
  today: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  meetings, 
  getPhaseById,
  formatAttendees,
  today 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Navigation functions
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  
  // Get days in month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get day names in French
  const dayNames = Array.from({ length: 7 }, (_, i) => 
    format(new Date(2021, 0, i + 3), 'EEEEEE', { locale: fr })
  );
  
  // Get meetings for a specific day
  const getMeetingsForDay = (day: Date) => {
    return meetings.filter(meeting => {
      const meetingDate = parseISO(meeting.date);
      return isSameDay(meetingDate, day);
    });
  };

  // Get meetings for selected date
  const selectedDateMeetings = selectedDate 
    ? getMeetingsForDay(selectedDate)
    : [];
  
  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentMonth(new Date())}
          >
            Aujourd'hui
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day names */}
        {dayNames.map((day, i) => (
          <div 
            key={i} 
            className="text-center font-medium text-sm py-2 text-gray-500"
          >
            {day.toUpperCase()}
          </div>
        ))}
        
        {/* Empty cells for days before the start of the month */}
        {Array.from({ length: monthStart.getDay() }, (_, i) => (
          <div key={`empty-start-${i}`} className="h-24 bg-gray-50 rounded-md"></div>
        ))}
        
        {/* Days of the month */}
        {daysInMonth.map(day => {
          const dayMeetings = getMeetingsForDay(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);
          
          return (
            <div 
              key={day.toString()} 
              className={`
                h-24 p-1 border rounded-md overflow-hidden
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                ${isSelected ? 'ring-2 ring-primary' : ''}
                ${isCurrentDay ? 'border-primary' : 'border-gray-200'}
                hover:bg-gray-50 cursor-pointer transition-colors
              `}
              onClick={() => setSelectedDate(day)}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`
                  text-sm font-medium
                  ${isCurrentDay ? 'bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
                `}>
                  {format(day, 'd')}
                </span>
                {dayMeetings.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {dayMeetings.length}
                  </Badge>
                )}
              </div>
              
              {/* Show first 2 meetings for the day */}
              <div className="space-y-1">
                {dayMeetings.slice(0, 2).map(meeting => (
                  <div 
                    key={meeting.id}
                    className="text-xs p-1 rounded truncate"
                    style={{ 
                      backgroundColor: getPhaseById(meeting.phaseId)?.color + '20',
                      color: getPhaseById(meeting.phaseId)?.color
                    }}
                  >
                    {meeting.time} - {meeting.title}
                  </div>
                ))}
                {dayMeetings.length > 2 && (
                  <div className="text-xs text-gray-500 pl-1">
                    +{dayMeetings.length - 2} plus
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Empty cells for days after the end of the month */}
        {Array.from({ length: 6 - monthEnd.getDay() }, (_, i) => (
          <div key={`empty-end-${i}`} className="h-24 bg-gray-50 rounded-md"></div>
        ))}
      </div>
      
      {/* Selected Day Details */}
      {selectedDate && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </h3>
              <Badge variant={selectedDateMeetings.length > 0 ? "default" : "outline"}>
                {selectedDateMeetings.length} réunion{selectedDateMeetings.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {selectedDateMeetings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune réunion prévue pour cette date
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateMeetings
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map(meeting => (
                    <div 
                      key={meeting.id} 
                      className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{meeting.title}</h4>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {meeting.time} ({meeting.duration} min)
                          </div>
                        </div>
                        <Badge variant={meeting.isOnline ? "outline" : "secondary"} className="ml-2">
                          {meeting.type.replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        {meeting.description || "Aucune description fournie."}
                      </div>
                      
                      <div className="mt-2 flex flex-col space-y-1 text-sm">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                          <span>
                            {meeting.location}
                            {meeting.isOnline && (
                              <span className="ml-1 text-blue-600 text-xs">
                                <VideoIcon className="h-3 w-3 inline mr-1" />
                                En ligne
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1 text-gray-500" />
                          <span>{formatAttendees(meeting.attendees)}</span>
                        </div>
                        <div className="flex items-center">
                          {meeting.isCompleted ? (
                            <Check className="h-3 w-3 mr-1 text-green-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />
                          )}
                          <span>
                            {meeting.isCompleted ? 'Terminée' : 'À venir'}
                            {meeting.hasNotes && meeting.isCompleted && (
                              <span className="ml-2 text-blue-600">Notes disponibles</span>
                            )}
                          </span>
                        </div>
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
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalendarView;
