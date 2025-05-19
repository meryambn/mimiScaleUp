import React from 'react';
import { Route, Switch, useLocation, useParams } from 'wouter';
import Dashboard from './pages/dashboard';
import TeamsPage from './pages/teams';
import StartupDetailPage from './pages/teams/[id]';
import Programs from './pages/programs';
import CreateProgram from './pages/programs/create';
import Mentors from './pages/mentors';
import Applications from './pages/applications';
import CreateApplicationForm from './pages/applications/create';
import CreateFormPage from './pages/forms/create';
import MeetingsPage from './pages/meetings';
import TasksPage from './pages/tasks';
import DeliverablesPage from './pages/deliverables';
import ResourcesPage from './pages/resources';
import CreateTestTeamPage from './pages/test/create-team';
import HomePage from './pages/home';
import NotificationsPage from './pages/particulier/notifications';
import StartupNotificationsPage from './pages/startup/notifications';
import FeedPage from './pages/startup/feed';

import NotFound from '@/pages/not-found';
import HomeLayout from '@/components/layout/HomeLayout';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ProgramProvider, useProgramContext } from "@/context/ProgramContext";
import { MeetingsProvider } from "@/context/MeetingsContext";
import { TasksProvider } from "@/context/TasksContext";
import { ResourcesProvider } from "@/context/ResourcesContext";
import { DeliverablesProvider } from "@/context/DeliverablesContext";
import Layout from "@/components/layout/Layout";
import StartupLayout from "./components/layout/StartupLayout";
import ParticulierLayout from "./components/layout/ParticulierLayout";
import Profile from './components/Profile';
import ParticulierProfilePage from './pages/particulier/profile';
import MentorProfilePage from './pages/MentorProfile';
import StartupDashboardPage from './pages/startup/dashboard';
import ParticulierDashboardPage from './pages/particulier/dashboard';
import ParticulierMeetingsPage from './pages/particulier/meetings';
import StartupMeetingsPage from './pages/startup/meetings';
import StartupDeliverablesPage from './pages/startup/deliverables';
import ParticulierDeliverablesPage from './pages/particulier/deliverables';
import StartupResourcePage from './pages/startup/resources';
import ParticulierResourcePage from './pages/particulier/resources';
import StartupTasksPage from './pages/startup/tasks';
import ParticulierTasksPage from './pages/particulier/tasks';
import StartupAnalytics from './pages/startup/analytics';
import FormulairePage from './pages/particulier/apply';
import ApplyRedirect from './components/redirects/ApplyRedirect';
import StartupProgramAccessWrapper from './components/StartupProgramAccessWrapper';

// Redirect components to fix hooks issues
const DashboardRedirect = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user?.role === 'admin') {
      setLocation('/admin/dashboard');
    } else if (user?.role === 'mentor') {
      setLocation('/mentors/dashboard');
    } else {
      setLocation('/home');
    }
  }, [user, setLocation]);

  return null;
};

const MentorDashboardRedirect = () => {
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    setLocation('/mentors/dashboard');
  }, [setLocation]);

  return null;
};

const TeamsRedirect = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user?.role === 'admin') {
      setLocation('/admin/teams');
    } else if (user?.role === 'mentor') {
      setLocation('/mentors/teams');
    } else {
      setLocation('/home');
    }
  }, [user, setLocation]);

  return null;
};

// Redirect for team detail pages
const TeamDetailRedirect = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();

  React.useEffect(() => {
    if (user?.role === 'admin') {
      setLocation(`/admin/teams/${id}`);
    } else if (user?.role === 'mentor') {
      setLocation(`/mentors/teams/${id}`);
    } else {
      setLocation('/home');
    }
  }, [user, setLocation, id]);

  return null;
};

// Additional redirect components
const RedirectToHome = () => {
  const [, setLocation] = useLocation();
  React.useEffect(() => {
    setLocation('/home');
  }, [setLocation]);
  return null;
};

const RedirectToLoginPage = () => {
  const [, setLocation] = useLocation();
  React.useEffect(() => {
    setLocation('/home');
  }, [setLocation]);
  return null;
};

const ProgramsRedirect = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  React.useEffect(() => {
    if (user?.role === 'admin') {
      setLocation('/admin/programs');
    } else if (user?.role === 'mentor') {
      setLocation('/mentors/programs');
    } else {
      setLocation('/home');
    }
  }, [user, setLocation]);
  return null;
};

const ProgramsCreateRedirect = () => {
  const [, setLocation] = useLocation();
  React.useEffect(() => {
    setLocation('/admin/programs/create');
  }, [setLocation]);
  return null;
};

const MentorsRedirect = () => {
  const [, setLocation] = useLocation();
  React.useEffect(() => {
    setLocation('/admin/mentors');
  }, [setLocation]);
  return null;
};

const ApplicationsRedirect = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  React.useEffect(() => {
    if (user?.role === 'admin') {
      setLocation('/admin/applications');
    } else if (user?.role === 'mentor') {
      setLocation('/mentors/applications');
    } else {
      setLocation('/home');
    }
  }, [user, setLocation]);
  return null;
};

const ApplicationsCreateRedirect = () => {
  const [, setLocation] = useLocation();
  React.useEffect(() => {
    setLocation('/admin/applications/create');
  }, [setLocation]);
  return null;
};

const MeetingsRedirect = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  React.useEffect(() => {
    if (user?.role === 'admin') {
      setLocation('/admin/meetings');
    } else if (user?.role === 'mentor') {
      setLocation('/mentors/meetings');
    } else {
      setLocation('/home');
    }
  }, [user, setLocation]);
  return null;
};

const TasksRedirect = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  React.useEffect(() => {
    if (user?.role === 'admin') {
      setLocation('/admin/tasks');
    } else if (user?.role === 'mentor') {
      setLocation('/mentors/tasks');
    } else {
      setLocation('/home');
    }
  }, [user, setLocation]);
  return null;
};

const DeliverablesRedirect = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  React.useEffect(() => {
    if (user?.role === 'admin') {
      setLocation('/admin/deliverables');
    } else if (user?.role === 'mentor') {
      setLocation('/mentors/deliverables');
    } else {
      setLocation('/home');
    }
  }, [user, setLocation]);
  return null;
};

const ResourcesRedirect = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  React.useEffect(() => {
    if (user?.role === 'admin') {
      setLocation('/admin/resources');
    } else if (user?.role === 'mentor') {
      setLocation('/mentors/resources');
    } else {
      setLocation('/home');
    }
  }, [user, setLocation]);
  return null;
};

const TestCreateTeamRedirect = () => {
  const [, setLocation] = useLocation();
  React.useEffect(() => {
    setLocation('/admin/test/create-team');
  }, [setLocation]);
  return null;
};

const NotificationsRedirect = () => {
  const [, setLocation] = useLocation();
  const { programs } = useProgramContext();

  React.useEffect(() => {
    // Trouver le premier programme actif
    const activeProgram = programs.find(p => p.status === "active");
    if (activeProgram) {
      setLocation(`/particulier/notifications/${activeProgram.id}`);
    } else {
      // Si aucun programme actif n'est trouvé, rediriger vers le profil
      setLocation('/particulier/profile');
    }
  }, [setLocation, programs]);
  return null;
};

const FormulaireRedirect = () => {
  const [, setLocation] = useLocation();
  const { programs } = useProgramContext();

  React.useEffect(() => {
    // Trouver le premier programme actif
    const activeProgram = programs.find(p => p.status === "active");
    if (activeProgram) {
      setLocation(`/particulier/apply/${activeProgram.id}`);
    } else {
      // Si aucun programme actif n'est trouvé, rediriger vers le profil
      setLocation('/particulier/profile');
    }
  }, [setLocation, programs]);
  return null;
};

const StartupNotificationsRedirect = () => {
  const [, setLocation] = useLocation();
  const { programs } = useProgramContext();

  React.useEffect(() => {
    // Trouver le premier programme actif
    const activeProgram = programs.find(p => p.status === "active");
    if (activeProgram) {
      setLocation(`/startup/notifications/${activeProgram.id}`);
    } else {
      // Si aucun programme actif n'est trouvé, rediriger vers le profil
      setLocation('/startup/profile');
    }
  }, [setLocation, programs]);
  return null;
};

const StartupFormulaireRedirect = () => {
  const [, setLocation] = useLocation();
  const { programs } = useProgramContext();

  React.useEffect(() => {
    // Trouver le premier programme actif
    const activeProgram = programs.find(p => p.status === "active");
    if (activeProgram) {
      setLocation(`/startup/apply/${activeProgram.id}`);
    } else {
      // Si aucun programme actif n'est trouvé, rediriger vers le profil
      setLocation('/startup/profile');
    }
  }, [setLocation, programs]);
  return null;
};

const StartupDashboardRedirect = () => {
  const [, setLocation] = useLocation();
  const { programs, selectedProgramId } = useProgramContext();

  React.useEffect(() => {
    // Utiliser le programme sélectionné s'il existe
    if (selectedProgramId) {
      setLocation(`/startup/dashboard/${selectedProgramId}`);
    } else {
      // Si aucun programme n'est sélectionné, rediriger vers le profil
      setLocation('/startup/profile');
    }
  }, [setLocation, selectedProgramId]);
  return null;
};

const StartupTasksRedirect = () => {
  const [, setLocation] = useLocation();
  const { programs } = useProgramContext();

  React.useEffect(() => {
    // Find the active program
    const activeProgram = programs.find(p => p.status === "active");
    if (activeProgram) {
      setLocation(`/startup/tasks/${activeProgram.id}`);
    } else {
      setLocation('/startup/profile');
    }
  }, [programs, setLocation]);

  return null;
};

const App = () => {
  // Removed redundant redirection logic from main component
  // since it's handled in the route component
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <ProgramProvider>
            <MeetingsProvider>
              <TasksProvider>
                <ResourcesProvider>
                  <DeliverablesProvider>
                  <Switch>
                    <Route path="/">
                      {() => <RedirectToHome />}
                    </Route>

                    <Route path="/home">
                      {() => (
                        <HomeLayout>
                          <HomePage />
                        </HomeLayout>
                      )}
                    </Route>

                    <Route path="/login">
                      {() => <RedirectToLoginPage />}
                    </Route>

                    <Route path="/startup/dashboard">
                      {() => (
                        <StartupLayout>
                          <StartupProgramAccessWrapper>
                            <StartupDashboardPage />
                          </StartupProgramAccessWrapper>
                        </StartupLayout>
                      )}
                    </Route>

                    <Route path="/startup/dashboard/:id">
                      {() => (
                        <StartupLayout>
                          <StartupProgramAccessWrapper>
                            <StartupDashboardPage />
                          </StartupProgramAccessWrapper>
                        </StartupLayout>
                      )}
                    </Route>

                    <Route path="/particulier/dashboard">
                      {() => <ParticulierDashboardPage />}
                    </Route>

                    <Route path="/particulier/meetings">
                      {() => (
                        <ParticulierLayout>
                          <ParticulierMeetingsPage />
                        </ParticulierLayout>
                      )}
                    </Route>

                    <Route path="/startup/profile">
                      {() => <Profile />}
                    </Route>

                    <Route path="/particulier/profile">
                      {() => <ParticulierProfilePage />}
                    </Route>

                    <Route path="/startup/livrable">
                      {() => (
                        <StartupLayout>
                          <StartupProgramAccessWrapper>
                            <StartupDeliverablesPage />
                          </StartupProgramAccessWrapper>
                        </StartupLayout>
                      )}
                    </Route>

                    <Route path="/particulier/livrable">
                      {() => (
                        <ParticulierLayout>
                          <ParticulierDeliverablesPage />
                        </ParticulierLayout>
                      )}
                    </Route>

                    <Route path="/startup/ressource">
                      {() => (
                        <StartupLayout>
                          <StartupProgramAccessWrapper>
                            <StartupResourcePage />
                          </StartupProgramAccessWrapper>
                        </StartupLayout>
                      )}
                    </Route>

                    <Route path="/particulier/ressource">
                      {() => (
                        <ParticulierLayout>
                          <ParticulierResourcePage />
                        </ParticulierLayout>
                      )}
                    </Route>

                    {/* Admin Routes */}
                    <Route path="/admin/dashboard">
                      {() => (
                        <Layout>
                          <Dashboard />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/admin/teams">
                      {() => (
                        <Layout>
                          <TeamsPage />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/admin/teams/:id">
                      {() => (
                        <Layout>
                          <StartupDetailPage />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/admin/programs">
                      {() => (
                        <Layout>
                          <Programs />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/admin/programs/create">
                      {() => (
                        <Layout>
                          <CreateProgram />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/admin/mentors">
                      {() => (
                        <Layout>
                          <Mentors />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/admin/applications">
                      {() => (
                        <Layout>
                          <Applications />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/admin/applications/create">
                      {() => (
                        <Layout>
                          <CreateApplicationForm />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/forms/create/:programId">
                      {({ programId }: { programId?: string }) => (
                        <Layout>
                          <CreateFormPage />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/admin/meetings">
                      {() => (
                        <Layout>
                          <MeetingsPage />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/admin/tasks">
                      {() => (
                        <Layout>
                          <TasksPage />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/admin/deliverables">
                      {() => (
                        <Layout>
                          <DeliverablesPage />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/admin/resources">
                      {() => (
                        <Layout>
                          <ResourcesPage />
                        </Layout>
                      )}
                    </Route>

                    {/* Mentor Routes */}
                    <Route path="/mentors/dashboard">
                      {() => (
                        <Layout>
                          <Dashboard />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/mentors/teams">
                      {() => (
                        <Layout>
                          <TeamsPage />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/mentors/teams/:id">
                      {() => (
                        <Layout>
                          <StartupDetailPage />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/mentors/programs">
                      {() => (
                        <Layout>
                          <Programs />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/mentors/applications">
                      {() => (
                        <Layout>
                          <Applications />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/mentors/meetings">
                      {() => (
                        <Layout>
                          <MeetingsPage />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/mentors/tasks">
                      {() => (
                        <Layout>
                          <TasksPage />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/mentors/deliverables">
                      {() => (
                        <Layout>
                          <DeliverablesPage />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/mentors/resources">
                      {() => (
                        <Layout>
                          <ResourcesPage />
                        </Layout>
                      )}
                    </Route>

                    {/* Legacy routes for backward compatibility - these should redirect to the new routes */}
                    <Route path="/dashboard">
                      {() => <DashboardRedirect />}
                    </Route>

                    {/* Additional legacy routes */}
                    <Route path="/teams">
                      {() => <TeamsRedirect />}
                    </Route>

                    <Route path="/teams/:id">
                      {({ id }: { id?: string }) => (
                        <Layout>
                          <StartupDetailPage />
                        </Layout>
                      )}
                    </Route>

                    <Route path="/programs">
                      {() => <ProgramsRedirect />}
                    </Route>

                    <Route path="/programs/create">
                      {() => <ProgramsCreateRedirect />}
                    </Route>

                    <Route path="/mentors">
                      {() => <MentorsRedirect />}
                    </Route>

                    <Route path="/applications">
                      {() => <ApplicationsRedirect />}
                    </Route>

                    <Route path="/applications/create">
                      {() => <ApplicationsCreateRedirect />}
                    </Route>

                    <Route path="/meetings">
                      {() => <MeetingsRedirect />}
                    </Route>

                    <Route path="/tasks">
                      {() => <TasksRedirect />}
                    </Route>

                    <Route path="/deliverables">
                      {() => <DeliverablesRedirect />}
                    </Route>

                    <Route path="/resources">
                      {() => <ResourcesRedirect />}
                    </Route>

                    <Route path="/admin/test/create-team">
                      {() => (
                        <Layout>
                          <CreateTestTeamPage />
                        </Layout>
                      )}
                    </Route>



                    {/* Legacy route for backward compatibility */}
                    <Route path="/test/create-team">
                      {() => <TestCreateTeamRedirect />}
                    </Route>

                    <Route path="/startup/meetings">
                      {() => (
                        <StartupLayout>
                          <StartupProgramAccessWrapper>
                            <StartupMeetingsPage />
                          </StartupProgramAccessWrapper>
                        </StartupLayout>
                      )}
                    </Route>

                    <Route path="/startup/tasks">
                      {() => (
                        <StartupLayout>
                          <StartupProgramAccessWrapper>
                            <StartupTasksPage />
                          </StartupProgramAccessWrapper>
                        </StartupLayout>
                      )}
                    </Route>

                    <Route path="/startup/tasks/:id">
                      {() => (
                         <StartupLayout>
                           <StartupProgramAccessWrapper>
                             <StartupTasksPage />
                           </StartupProgramAccessWrapper>
                         </StartupLayout>
                      )}
                    </Route>

                    <Route path="/startup/analytics">
                      {() => (
                        <StartupLayout>
                          <StartupProgramAccessWrapper>
                            <StartupAnalytics />
                          </StartupProgramAccessWrapper>
                        </StartupLayout>
                      )}
                    </Route>

                    <Route path="/particulier/tasks">
                      {() => (
                        <ParticulierLayout>
                          <ParticulierTasksPage />
                        </ParticulierLayout>
                      )}
                    </Route>

                    {/* Handle singular mentor path for backward compatibility */}
                    <Route path="/mentor/dashboard">
                      {() => <MentorDashboardRedirect />}
                    </Route>

                    {/* Mentor profile routes */}
                    <Route path="/mentor/profile">
                      {() => <MentorProfilePage />}
                    </Route>
                    <Route path="/mentors/profile">
                      {() => <MentorProfilePage />}
                    </Route>

                    {/* Route de base pour les notifications */}
                    <Route path="/startup/notifications">
                      {() => <StartupNotificationsRedirect />}
                    </Route>

                    <Route path="/startup/notifications/:id">
                      {() => (
                      
                         
                            <StartupNotificationsPage />
                         
                      )}
                    </Route>

                    <Route path="/particulier/notifications">
                      {() => <NotificationsRedirect />}
                    </Route>

                    <Route path="/particulier/notifications/:id">
                      {() => (
                        <ParticulierLayout>
                           <NotificationsPage />
                        </ParticulierLayout>
                      )}
                    </Route>

                    <Route path="/particulier/apply">
                      {() => <FormulaireRedirect />}
                    </Route>

                    <Route path="/particulier/apply/:id">
                      {() => (
                        <ParticulierLayout>
                          <FormulairePage />
                        </ParticulierLayout>
                      )}
                    </Route>

                    <Route path="/startup/apply">
                      {() => <StartupFormulaireRedirect />}
                    </Route>

                    <Route path="/startup/apply/:id">
                      {() => (
                        <StartupLayout>
                          <FormulairePage />
                        </StartupLayout>
                      )}
                    </Route>

                    <Route path="/particulier/formulaire">
                      {() => <FormulaireRedirect />}
                    </Route>

                    <Route path="/particulier/formulaire/:id">
                      {() => <FormulaireRedirect />}
                    </Route>

                    <Route path="/startup/formulaire">
                      {() => <StartupFormulaireRedirect />}
                    </Route>

                    <Route path="/startup/formulaire/:id">
                      {() => <StartupFormulaireRedirect />}
                    </Route>

                    <Route path="/startup/feed">
                      {() => (
                        <StartupLayout>
                          <StartupProgramAccessWrapper>
                            <FeedPage />
                          </StartupProgramAccessWrapper>
                        </StartupLayout>
                      )}
                    </Route>

                    <Route path="/particulier/feed">
                      {() => (
                        <ParticulierLayout>
                          <FeedPage />
                        </ParticulierLayout>
                      )}
                    </Route>

                    <Route path="/apply/:id">
                      {() => <ApplyRedirect />}
                    </Route>

                    <Route>
                      {() => (
                        <Layout>
                          <NotFound />
                        </Layout>
                      )}
                    </Route>
                  </Switch>
                  <Toaster />
                  </DeliverablesProvider>
                </ResourcesProvider>
              </TasksProvider>
            </MeetingsProvider>
          </ProgramProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
