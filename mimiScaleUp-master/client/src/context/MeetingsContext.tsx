import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useProgramContext } from './ProgramContext';
import { v4 as uuidv4 } from 'uuid';

// Interfaces
export interface Phase {
  id: string;
  name: string;
  color: string;
  startDate: string;
  endDate: string;
  status: 'not_started' | 'in_progress' | 'completed';
  meetingCount?: number;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  type: 'group' | 'one-on-one' | 'info-session' | 'workshop';
  location: string;
  attendees: string[];
  phaseId: string;
  description: string;
  isCompleted: boolean;
  hasNotes: boolean;
  isOnline?: boolean;
  programId: string;
}

// Context type
export interface MeetingsContextType {
  meetings: Meeting[];
  phases: Phase[];
  upcomingMeetings: Meeting[];
  pastMeetings: Meeting[];
  filteredMeetings: Meeting[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedPhase: string | null;
  setSelectedPhase: (phaseId: string | null) => void;
  getPhaseById: (phaseId: string) => Phase | undefined;
  formatAttendees: (attendees: string[]) => string;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
  today: string;
  createMeeting: (meeting: Omit<Meeting, 'id'>) => string;
  addMeetings: (meetings: Omit<Meeting, 'id'>[]) => string[];
}

// Create context
const MeetingsContext = createContext<MeetingsContextType | undefined>(undefined);

// Provider component
export const MeetingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedProgramId, selectedProgram } = useProgramContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);

  // Get today's date for UI comparison
  const today = new Date().toISOString().split('T')[0];

  // Initialize meetings with program data or fallback to empty array
  useEffect(() => {
    if (selectedProgram && selectedProgram.phases) {
      console.log('Loading meetings from program phases...', selectedProgram);

      // No need to create test meetings - we're using backend data

      // Extract meetings from all phases
      const programMeetings: Meeting[] = [];

      // Also extract phases for the phase filter
      const programPhases: Phase[] = [];

      selectedProgram.phases.forEach((phase: any) => {
        // Add phase to phases list for filtering
        programPhases.push({
          id: String(phase.id),
          name: phase.name,
          color: phase.color || '#818cf8',
          startDate: phase.startDate instanceof Date ? phase.startDate.toISOString().split('T')[0] : String(phase.startDate),
          endDate: phase.endDate instanceof Date ? phase.endDate.toISOString().split('T')[0] : String(phase.endDate),
          status: phase.status || 'not_started',
          meetingCount: Array.isArray(phase.meetings) ? phase.meetings.length : 0
        });

        if (phase.meetings && Array.isArray(phase.meetings)) {
          console.log(`Processing ${phase.meetings.length} meetings for phase ${phase.id}`);

          // Use a Set to track unique meeting IDs we've already processed
          const processedIds = new Set<string>();

          const phaseMeetings = phase.meetings.map((meeting: any) => {
            console.log(`Processing meeting:`, meeting);

            // Skip if we've already processed this meeting
            const meetingId = String(meeting.id || '');
            if (processedIds.has(meetingId)) {
              console.log(`Skipping duplicate meeting with ID ${meetingId}`);
              return null;
            }

            processedIds.add(meetingId);

            // Format date if it's a Date object
            const formatDate = (date: Date | string) => {
              if (date instanceof Date) {
                return date.toISOString().split('T')[0];
              }
              return String(date);
            };

            // Create a properly formatted meeting object
            const formattedMeeting = {
              id: meetingId,
              title: meeting.title || meeting.nom_reunion || '',
              date: formatDate(meeting.date),
              time: meeting.time || meeting.heure || '00:00',
              duration: meeting.duration || 60,
              type: (meeting.type as 'group' | 'one-on-one' | 'info-session' | 'workshop') || 'group',
              location: meeting.location || meeting.lieu || '',
              attendees: Array.isArray(meeting.attendees) ? meeting.attendees : [],
              phaseId: String(phase.id),
              description: meeting.description || '',
              isCompleted: false,
              hasNotes: false,
              isOnline: (meeting.location?.toLowerCase().includes('zoom') ||
                         meeting.lieu?.toLowerCase().includes('zoom') ||
                         meeting.lieu?.toLowerCase().includes('virtuelle')) || false,
              programId: String(selectedProgram.id)
            };

            console.log(`Formatted meeting:`, formattedMeeting);
            return formattedMeeting;
          }).filter(Boolean); // Filter out null values

          console.log(`Adding ${phaseMeetings.length} meetings from phase ${phase.id} to program meetings`);
          programMeetings.push(...phaseMeetings);
        } else {
          console.log(`No meetings found for phase ${phase.id}`);
        }
      });

      // Update phases for filtering
      setPhases(programPhases);

      if (programMeetings.length > 0) {
        // Use ONLY program meetings when available
        console.log(`Using ${programMeetings.length} meetings from selected program`);
        setMeetings(programMeetings);
        return; // Exit early to avoid setting mock meetings
      }
    }

    // Only use empty array if no program is selected or no program meetings are available
    console.log('No meetings found in selected program, using empty array');
    setMeetings([]);

    // We're now using backend data, no need to load from localStorage
  }, [selectedProgram, selectedProgramId]);

  // Update phases when selected program changes
  useEffect(() => {
    if (selectedProgram && selectedProgram.phases && selectedProgram.phases.length > 0) {
      // Map program phases to the format needed by the context
      const mappedPhases = selectedProgram.phases.map((phase: any) => {
        // Calculate meeting count
        const meetingCount = Array.isArray(phase.meetings) ? phase.meetings.length : 0;

        return {
          id: String(phase.id),
          name: phase.name,
          color: phase.color || '#818cf8',
          startDate: phase.startDate instanceof Date ? phase.startDate.toISOString().split('T')[0] : String(phase.startDate),
          endDate: phase.endDate instanceof Date ? phase.endDate.toISOString().split('T')[0] : String(phase.endDate),
          status: phase.status as 'not_started' | 'in_progress' | 'completed' || 'not_started',
          meetingCount
        };
      });

      setPhases(mappedPhases);
    } else {
      // Use empty array if no program is selected
      setPhases([]);
    }
  }, [selectedProgram]);

  // Add event listener for new program creation
  useEffect(() => {
    const handleProgramCreated = (event: CustomEvent) => {
      const newProgram = event.detail;
      console.log('New program created event received:', newProgram);

      if (newProgram && newProgram.phases) {
        // Map new program phases to the format needed by the context
        const mappedPhases = newProgram.phases.map((phase: any) => {
          return {
            id: String(phase.id),
            name: phase.name,
            color: phase.color || '#818cf8',
            startDate: phase.startDate instanceof Date ? phase.startDate.toISOString().split('T')[0] : String(phase.startDate),
            endDate: phase.endDate instanceof Date ? phase.endDate.toISOString().split('T')[0] : String(phase.endDate),
            status: phase.status as 'not_started' | 'in_progress' | 'completed' || 'not_started',
            meetingCount: Array.isArray(phase.meetings) ? phase.meetings.length : 0
          };
        });

        setPhases(mappedPhases);
      }

      // Update meetings from the new program
      if (newProgram && newProgram.phases) {
        const allPhaseMeetings: Meeting[] = [];

        newProgram.phases.forEach((phase: any) => {
          if (phase.meetings && Array.isArray(phase.meetings)) {
            const phaseMeetings = phase.meetings.map((meeting: any) => {
              // Format date if it's a Date object
              const formatDate = (date: Date | string) => {
                if (date instanceof Date) {
                  return date.toISOString().split('T')[0];
                }
                return String(date);
              };

              return {
                id: String(meeting.id || ''),
                title: meeting.title || meeting.nom_reunion || '',
                date: formatDate(meeting.date),
                time: meeting.time || meeting.heure || '00:00',
                duration: meeting.duration || 60,
                type: (meeting.type as 'group' | 'one-on-one' | 'info-session' | 'workshop') || 'group',
                location: meeting.location || meeting.lieu || '',
                attendees: Array.isArray(meeting.attendees) ? meeting.attendees : [],
                phaseId: String(phase.id),
                description: meeting.description || '',
                isCompleted: false,
                hasNotes: false,
                isOnline: (meeting.location?.toLowerCase().includes('zoom') ||
                          meeting.lieu?.toLowerCase().includes('zoom') ||
                          meeting.lieu?.toLowerCase().includes('virtuelle')) || false,
                programId: String(newProgram.id)
              };
            });

            allPhaseMeetings.push(...phaseMeetings);
          }
        });

        if (allPhaseMeetings.length > 0) {
          console.log(`Adding ${allPhaseMeetings.length} meetings from new program:`, allPhaseMeetings);
          setMeetings(prevMeetings => [...prevMeetings, ...allPhaseMeetings]);
        } else {
          console.log('No meetings found in the created program');
        }
      }
    };

    // Add event listener
    window.addEventListener('programCreated', handleProgramCreated as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('programCreated', handleProgramCreated as EventListener);
    };
  }, []);

  // Filter meetings based on selected filters, search query, and program
  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (meeting.description && meeting.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPhase = !selectedPhase || meeting.phaseId === selectedPhase;
    const matchesProgram = !selectedProgramId || meeting.programId === selectedProgramId;
    return matchesSearch && matchesPhase && matchesProgram;
  });

  // Get upcoming and past meetings from the filtered meetings
  const upcomingMeetings = filteredMeetings.filter(m => m.date >= today && !m.isCompleted);
  const pastMeetings = filteredMeetings.filter(m => m.date < today || m.isCompleted);

  // Utility functions
  const getPhaseById = (phaseId: string): Phase | undefined => {
    return phases.find(phase => phase.id === phaseId);
  };

  const formatAttendees = (attendees: string[]): string => {
    if (!attendees || attendees.length === 0) return 'No attendees';
    if (attendees.length === 1) return attendees[0];
    if (attendees.length === 2) return `${attendees[0]} and ${attendees[1]}`;
    return `${attendees[0]}, ${attendees[1]}, and ${attendees.length - 2} more`;
  };

  const formatDate = (date: string): string => {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Create a new meeting
  const createMeeting = (meeting: Omit<Meeting, 'id'>): string => {
    const newMeetingId = uuidv4();
    const newMeeting: Meeting = {
      ...meeting,
      id: newMeetingId
    };

    // Update local state with the new meeting
    setMeetings(prevMeetings => [...prevMeetings, newMeeting]);

    // TODO: Add API call to save meeting to backend
    // Example:
    // if (meeting.phaseId) {
    //   try {
    //     await fetch(`http://localhost:8083/api/reunion/create/${meeting.phaseId}`, {
    //       method: 'POST',
    //       headers: { 'Content-Type': 'application/json' },
    //       body: JSON.stringify({
    //         nom_reunion: meeting.title,
    //         date: meeting.date,
    //         heure: meeting.time,
    //         lieu: meeting.location
    //       })
    //     });
    //   } catch (error) {
    //     console.error('Error saving meeting to backend:', error);
    //   }
    // }

    return newMeetingId;
  };

  // Add multiple meetings at once
  const addMeetings = (meetingsToAdd: Omit<Meeting, 'id'>[]): string[] => {
    const newMeetingIds: string[] = [];
    const newMeetings: Meeting[] = meetingsToAdd.map(meeting => {
      const newMeetingId = uuidv4();
      newMeetingIds.push(newMeetingId);
      return {
        ...meeting,
        id: newMeetingId
      };
    });

    // Update meetings state with all new meetings
    setMeetings(prevMeetings => [...prevMeetings, ...newMeetings]);
    return newMeetingIds;
  };

  // Value object for the context provider
  const value = {
    meetings,
    phases,
    upcomingMeetings,
    pastMeetings,
    filteredMeetings,
    searchQuery,
    setSearchQuery,
    selectedPhase,
    setSelectedPhase,
    getPhaseById,
    formatAttendees,
    formatDate,
    formatTime,
    today,
    createMeeting,
    addMeetings
  };

  return (
    <MeetingsContext.Provider value={value}>
      {children}
    </MeetingsContext.Provider>
  );
};

// Custom hook to use the meetings context
export const useMeetings = (): MeetingsContextType => {
  const context = useContext(MeetingsContext);
  if (context === undefined) {
    throw new Error('useMeetings must be used within a MeetingsProvider');
  }
  return context;
};
