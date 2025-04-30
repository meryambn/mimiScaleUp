import React from 'react';
import { Route, Switch, useLocation } from 'wouter';
import Dashboard from './pages/dashboard';
import TeamsPage from './pages/teams';
import StartupDetailPage from './pages/teams/[id]';
import Programs from './pages/programs';
import CreateProgram from './pages/programs/create';
import Mentors from './pages/mentors';
import Applications from './pages/applications';
import CreateApplicationForm from './pages/applications/create';
import MeetingsPage from './pages/meetings';
import TasksPage from './pages/tasks';
import DeliverablesPage from './pages/deliverables';
import ResourcesPage from './pages/resources';
import CreateTestTeamPage from './pages/test/create-team';
import HomePage from './pages/home';
import NotificationsPage from './pages/particulier/notifications';
import StartupNotificationsPage from './pages/startup/notifications';

import NotFound from '@/pages/not-found';
import HomeLayout from '@/components/layout/HomeLayout';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProgramProvider } from "@/context/ProgramContext";
import { MeetingsProvider } from "@/context/MeetingsContext";
import { TasksProvider } from "@/context/TasksContext";
import { ResourcesProvider } from "@/context/ResourcesContext";
import { DeliverablesProvider } from "@/context/DeliverablesContext";
import Layout from "@/components/layout/Layout";
import Profile from './components/Profile';
import ParticulierProfilePage from './pages/particulier/profile';
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

const App = () => {
  // Removed redundant redirection logic from main component
  // since it's handled in the route component
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProgramProvider>
          <MeetingsProvider>
            <TasksProvider>
              <ResourcesProvider>
                <DeliverablesProvider>
                  <Switch>
                    <Route path="/">
                      {() => {
                        // Create a separate component to handle redirection
                        const RedirectToHome = () => {
                          const [, setLocation] = useLocation();
                          React.useEffect(() => {
                            setLocation('/home');
                          }, []);
                          return null;
                        };
                        return <RedirectToHome />;
                      }}
                    </Route>

                    <Route path="/home">
                      {() => (
                        <HomeLayout>
                          <HomePage />
                        </HomeLayout>
                      )}
                    </Route>

                    <Route path="/login">
                      {() => {
                        const [, setLocation] = useLocation();
                        React.useEffect(() => {
                          setLocation('/home');
                        }, [setLocation]);
                        return null;
                      }}
                    </Route>

                    <Route path="/startup/dashboard">
                      {() => <StartupDashboardPage />}
                    </Route>

                    <Route path="/particulier/dashboard">
                      {() => <ParticulierDashboardPage />}
                    </Route>

                    <Route path="/particulier/meetings">
                      {() => <ParticulierMeetingsPage />}
                    </Route>

                    <Route path="/startup/profile">
                      {() => <Profile />}
                    </Route>

                    <Route path="/particulier/profile">
                      {() => <ParticulierProfilePage />}
                    </Route>

                    <Route path="/startup/livrable">
                      {() => <StartupDeliverablesPage />}
                    </Route>

                    <Route path="/particulier/livrable">
                      {() => <ParticulierDeliverablesPage />}
                    </Route>

                    <Route path="/startup/ressource">
                      {() => <StartupResourcePage />}
                    </Route>

                    <Route path="/particulier/ressource">
                      {() => <ParticulierResourcePage />}
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

                    <Route path="/programs">
                      {() => {
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
                        }, []);
                        return null;
                      }}
                    </Route>

                    <Route path="/programs/create">
                      {() => {
                        const [, setLocation] = useLocation();
                        React.useEffect(() => {
                          setLocation('/admin/programs/create');
                        }, []);
                        return null;
                      }}
                    </Route>

                    <Route path="/mentors">
                      {() => {
                        const [, setLocation] = useLocation();
                        React.useEffect(() => {
                          setLocation('/admin/mentors');
                        }, []);
                        return null;
                      }}
                    </Route>

                    <Route path="/applications">
                      {() => {
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
                        }, []);
                        return null;
                      }}
                    </Route>

                    <Route path="/applications/create">
                      {() => {
                        const [, setLocation] = useLocation();
                        React.useEffect(() => {
                          setLocation('/admin/applications/create');
                        }, []);
                        return null;
                      }}
                    </Route>

                    <Route path="/meetings">
                      {() => {
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
                        }, []);
                        return null;
                      }}
                    </Route>

                    <Route path="/tasks">
                      {() => {
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
                        }, []);
                        return null;
                      }}
                    </Route>

                    <Route path="/deliverables">
                      {() => {
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
                        }, []);
                        return null;
                      }}
                    </Route>

                    <Route path="/resources">
                      {() => {
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
                        }, []);
                        return null;
                      }}
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
                      {() => {
                        const [, setLocation] = useLocation();
                        React.useEffect(() => {
                          setLocation('/admin/test/create-team');
                        }, []);
                        return null;
                      }}
                    </Route>

                    <Route path="/startup/meetings">
                      {() => <StartupMeetingsPage />}
                    </Route>

                    <Route path="/startup/tasks">
                      {() => <StartupTasksPage />}
                    </Route>

                    <Route path="/startup/analytics">
                      {() => <StartupAnalytics />}
                    </Route>

                    <Route path="/particulier/tasks">
                      {() => <ParticulierTasksPage />}
                    </Route>

                    {/* Handle singular mentor path for backward compatibility */}
                    <Route path="/mentor/dashboard">
                      {() => <MentorDashboardRedirect />}
                    </Route>

                    <Route path="/particulier/notifications">
                      {() => <NotificationsPage />}
                    </Route>

                    <Route path="/startup/notifications">
                      {() => <StartupNotificationsPage />}
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
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
