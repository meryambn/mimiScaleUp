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
  meetingCount: number;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number; // in minutes
  type: 'group' | 'one-on-one' | 'info-session' | 'workshop';
  location?: string;
  attendees: string[];
  phaseId: string;
  description?: string;
  isCompleted?: boolean;
  hasNotes?: boolean;
  isOnline?: boolean;
  programId: string;
}

// Context interface
interface MeetingsContextType {
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
  formatDate: (dateStr: string, timeStr: string) => string;
  formatTime: (timeStr: string) => string;
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

  // Mock meetings data
  const meetingsData: Meeting[] = [
    {
      id: "1",
      title: "Program Kickoff Meeting",
      date: "2023-06-01",
      time: "10:00",
      duration: 60,
      type: "group",
      attendees: ["All Teams", "Program Managers", "Mentors"],
      phaseId: "phase-1",
      description: "Initial kickoff meeting for the summer program. Introduction to mentors and overview of the program structure.",
      location: "Main Conference Room",
      isCompleted: true,
      hasNotes: true,
      programId: "1"
    },
    {
      id: "meeting-2",
      title: "Application Workshop",
      date: "2023-01-25",
      time: "14:00",
      duration: 120,
      type: "workshop",
      location: "Zoom",
      attendees: ["Interested Teams", "Mentors"],
      phaseId: "phase-1",
      description: "Workshop to help teams prepare their applications.",
      isCompleted: true,
      hasNotes: true,
      isOnline: true,
      programId: "1"
    },
    {
      id: "meeting-3",
      title: "Application Q&A",
      date: "2023-02-05",
      time: "11:00",
      duration: 60,
      type: "info-session",
      location: "Zoom",
      attendees: ["Interested Teams", "Program Staff"],
      phaseId: "phase-1",
      description: "Q&A session for application questions.",
      isCompleted: true,
      hasNotes: false,
      isOnline: true,
      programId: "1"
    },
    {
      id: "meeting-4",
      title: "Selection Committee - Round 1",
      date: "2023-02-20",
      time: "09:00",
      duration: 180,
      type: "group",
      location: "Executive Boardroom",
      attendees: ["Selection Committee", "Program Directors"],
      phaseId: "phase-2",
      description: "First round of application reviews.",
      isCompleted: true,
      hasNotes: true,
      isOnline: false,
      programId: "1"
    },
    {
      id: "meeting-5",
      title: "Team Interview - EcoTech Solutions",
      date: "2023-03-02",
      time: "13:00",
      duration: 45,
      type: "one-on-one",
      location: "Zoom",
      attendees: ["EcoTech Solutions Team", "Selection Committee"],
      phaseId: "phase-2",
      description: "Interview with EcoTech Solutions team.",
      isCompleted: true,
      hasNotes: true,
      isOnline: true,
      programId: "1"
    },
    {
      id: "meeting-6",
      title: "Team Interview - HealthAI",
      date: "2023-03-03",
      time: "10:00",
      duration: 45,
      type: "one-on-one",
      location: "Zoom",
      attendees: ["HealthAI Team", "Selection Committee"],
      phaseId: "phase-2",
      description: "Interview with HealthAI team.",
      isCompleted: true,
      hasNotes: true,
      isOnline: true,
      programId: "1"
    },
    {
      id: "meeting-7",
      title: "Selection Committee - Final Decisions",
      date: "2023-03-10",
      time: "14:00",
      duration: 120,
      type: "group",
      location: "Executive Boardroom",
      attendees: ["Selection Committee", "Program Directors"],
      phaseId: "phase-2",
      description: "Final selection meeting to choose program participants.",
      isCompleted: true,
      hasNotes: true,
      isOnline: false,
      programId: "1"
    },
    {
      id: "meeting-8",
      title: "Welcome Session",
      date: "2023-03-18",
      time: "10:00",
      duration: 90,
      type: "info-session",
      location: "Main Hall",
      attendees: ["Selected Teams", "Program Staff", "Mentors"],
      phaseId: "phase-3",
      description: "Welcome session for the selected teams.",
      isCompleted: true,
      hasNotes: true,
      isOnline: false,
      programId: "1"
    },
    {
      id: "meeting-9",
      title: "Mentor Matching Event",
      date: "2023-03-25",
      time: "13:00",
      duration: 180,
      type: "group",
      location: "Main Hall",
      attendees: ["Selected Teams", "Mentors"],
      phaseId: "phase-3",
      description: "Event to match teams with mentors.",
      isCompleted: true,
      hasNotes: false,
      isOnline: false,
      programId: "1"
    },
    {
      id: "meeting-10",
      title: "Legal Workshop",
      date: "2023-04-05",
      time: "10:00",
      duration: 120,
      type: "workshop",
      location: "Zoom",
      attendees: ["Selected Teams", "Legal Mentors"],
      phaseId: "phase-3",
      description: "Workshop on legal aspects of startups.",
      isCompleted: false,
      hasNotes: false,
      isOnline: true,
      programId: "1"
    },
    {
      id: "meeting-11",
      title: "Pitch Training - Session 1",
      date: "2023-04-12",
      time: "14:00",
      duration: 150,
      type: "workshop",
      location: "Main Conference Room",
      attendees: ["Selected Teams", "Pitch Coach"],
      phaseId: "phase-3",
      description: "First session of pitch training.",
      isCompleted: false,
      hasNotes: false,
      isOnline: false,
      programId: "1"
    },
    {
      id: "meeting-12",
      title: "Financial Modeling Workshop",
      date: "2023-04-19",
      time: "10:00",
      duration: 180,
      type: "workshop",
      location: "Zoom",
      attendees: ["Selected Teams", "Finance Mentors"],
      phaseId: "phase-3",
      description: "Workshop on financial modeling for startups.",
      isCompleted: false,
      hasNotes: false,
      isOnline: true,
      programId: "1"
    }
  ];

  // Initialize meetings with mock data when component mounts
  useEffect(() => {
    setMeetings(meetingsData);
  }, []);

  // Update phases when selected program changes
  useEffect(() => {
    if (selectedProgram && selectedProgram.phases && selectedProgram.phases.length > 0) {
      // Map program phases to the format needed by the context
      const mappedPhases = selectedProgram.phases.map(phase => {
        // Calculate meeting count
        const meetingCount = Array.isArray(phase.meetings) ? phase.meetings.length : 0;
        
        // Format dates if needed
        const formatDate = (date: Date | string) => {
          if (date instanceof Date) {
            return date.toISOString().split('T')[0];
          }
          return date;
        };

        // Map status
        let mappedStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started';
        if (phase.status === 'completed') {
          mappedStatus = 'completed';
        } else if (phase.status === 'in_progress') {
          mappedStatus = 'in_progress';
        }

        return {
          id: phase.id.toString(),
          name: phase.name,
          color: phase.color || "#3b82f6", // Default to blue
          startDate: formatDate(phase.startDate),
          endDate: formatDate(phase.endDate),
          status: mappedStatus,
          meetingCount: meetingCount
        };
      });
      
      setPhases(mappedPhases);
    } else {
      // Use default phases if no program is selected
      setPhases([
        {
          id: "phase-1",
          name: "Application",
          color: "#3b82f6", // blue
          startDate: "2023-01-15",
          endDate: "2023-02-15",
          status: "completed",
          meetingCount: 3
        },
        {
          id: "phase-2",
          name: "Selection",
          color: "#10b981", // green
          startDate: "2023-02-16",
          endDate: "2023-03-15",
          status: "completed",
          meetingCount: 4
        },
        {
          id: "phase-3",
          name: "Onboarding",
          color: "#8b5cf6", // purple
          startDate: "2023-03-16",
          endDate: "2023-04-15",
          status: "in_progress",
          meetingCount: 5
        },
        {
          id: "phase-4",
          name: "Development",
          color: "#f59e0b", // amber
          startDate: "2023-04-16",
          endDate: "2023-05-15",
          status: "not_started",
          meetingCount: 8
        },
        {
          id: "phase-5",
          name: "Demo Day",
          color: "#ef4444", // red
          startDate: "2023-05-16",
          endDate: "2023-06-15",
          status: "not_started",
          meetingCount: 2
        }
      ]);
    }
  }, [selectedProgram]);

  // Add event listener for new program creation
  useEffect(() => {
    const handleProgramCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { programId, program } = customEvent.detail;
      
      console.log('Program created event received:', programId, program);
      
      // Update phases from the new program
      if (program && program.phases && Array.isArray(program.phases)) {
        const mappedPhases = program.phases.map((phase: any) => {
          // Calculate meeting count
          const meetingCount = Array.isArray(phase.meetings) ? phase.meetings.length : 0;
          
          // Format dates if needed
          const formatDate = (date: Date | string) => {
            if (date instanceof Date) {
              return date.toISOString().split('T')[0];
            }
            return date;
          };

          // Map status
          let mappedStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started';
          if (phase.status === 'completed') {
            mappedStatus = 'completed';
          } else if (phase.status === 'in_progress') {
            mappedStatus = 'in_progress';
          }

          return {
            id: phase.id.toString(),
            name: phase.name,
            color: phase.color || "#3b82f6", // Default to blue
            startDate: formatDate(phase.startDate),
            endDate: formatDate(phase.endDate),
            status: mappedStatus,
            meetingCount: meetingCount
          };
        });
        
        setPhases(mappedPhases);
      }
      
      // Update meetings from the new program
      if (program && program.phases) {
        console.log('Processing program phases for meetings:', program.phases);
        // Extract meetings from each phase
        const allPhaseMeetings: any[] = [];
        
        program.phases.forEach((phase: any) => {
          if (phase.meetings && Array.isArray(phase.meetings)) {
            // Process meetings from this phase
            const phaseMeetings = phase.meetings.map((meeting: any) => {
              // Ensure date is in the correct format (YYYY-MM-DD)
              const formatDate = (date: Date | string) => {
                if (date instanceof Date) {
                  return date.toISOString().split('T')[0];
                } else if (typeof date === 'string') {
                  // Try to convert if it's a string but not in the right format
                  try {
                    const dateObj = new Date(date);
                    return dateObj.toISOString().split('T')[0];
                  } catch (e) {
                    console.error("Error formatting date:", date, e);
                    return date;
                  }
                }
                return String(date);
              };
              
              // Ensure time is in the correct format (HH:MM)
              const formatTime = (time: any) => {
                if (!time) return "00:00";
                if (typeof time === 'string' && time.includes(':')) {
                  return time;
                }
                // If time is provided as a number of minutes since midnight
                if (typeof time === 'number') {
                  const hours = Math.floor(time / 60);
                  const minutes = time % 60;
                  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                }
                return String(time);
              };
              
              return {
                ...meeting,
                id: meeting.id || uuidv4(),
                title: meeting.title || meeting.name || 'Untitled Meeting',
                date: formatDate(meeting.date),
                time: formatTime(meeting.time),
                duration: Number(meeting.duration) || 60,
                type: meeting.type || 'group',
                attendees: Array.isArray(meeting.attendees) ? meeting.attendees : ['All Participants'],
                phaseId: phase.id.toString(),
                programId: programId,
                isCompleted: Boolean(meeting.isCompleted),
                hasNotes: Boolean(meeting.hasNotes),
                isOnline: Boolean(meeting.isOnline)
              };
            });
            
            allPhaseMeetings.push(...phaseMeetings);
          }
        });
        
        // Also check for direct meetings array at program level
        if (program.meetings && Array.isArray(program.meetings)) {
          console.log('Processing program-level meetings:', program.meetings);
          const programMeetings = program.meetings.map((meeting: any) => ({
            ...meeting,
            id: meeting.id || uuidv4(),
            programId: programId,
            title: meeting.title || meeting.name || 'Untitled Meeting',
            type: meeting.type || 'group',
            isCompleted: Boolean(meeting.isCompleted),
            hasNotes: Boolean(meeting.hasNotes),
            isOnline: Boolean(meeting.isOnline),
            attendees: Array.isArray(meeting.attendees) ? meeting.attendees : ['All Participants']
          }));
          
          allPhaseMeetings.push(...programMeetings);
        }
        
        if (allPhaseMeetings.length > 0) {
          console.log(`Adding ${allPhaseMeetings.length} meetings from new program:`, allPhaseMeetings);
          setMeetings(prevMeetings => [...prevMeetings, ...allPhaseMeetings]);
        } else {
          console.log('No meetings found in the created program');
        }
      }
    };
    
    document.addEventListener('program-created', handleProgramCreated);
    
    return () => {
      document.removeEventListener('program-created', handleProgramCreated);
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
    if (attendees.length <= 2) return attendees.join(", ");
    return `${attendees[0]}, ${attendees[1]}, +${attendees.length - 2} more`;
  };

  const formatDate = (dateStr: string, timeStr: string): string => {
    const date = new Date(`${dateStr}T${timeStr}`);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
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
    return newMeetingId;
  };
  
  // Add multiple meetings at once
  const addMeetings = (meetingsToAdd: Omit<Meeting, 'id'>[]): string[] => {
    const newMeetingIds: string[] = [];
    
    const newMeetings = meetingsToAdd.map(meeting => {
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