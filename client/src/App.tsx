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
import NotFound from '@/pages/not-found';
import HomeLayout from '@/components/layout/HomeLayout';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
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

const App = () => {
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    const path = window.location.pathname;
    if (path === '/') {
      setLocation('/home');
    }
  }, []);

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
                        const [, setLocation] = useLocation();
                        React.useEffect(() => {
                          setLocation('/home');
                        }, []);
                        return null;
                      }}
                    </Route>

                    <Route path="/home">
                      {() => (
                        <HomeLayout>
                          <HomePage />
                        </HomeLayout>
                      )}
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

                    <Route path="/teams">
                      {() => (
                        <Layout>
                          <TeamsPage />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/teams/:id">
                      {() => (
                        <Layout>
                          <StartupDetailPage />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/programs">
                      {() => (
                        <Layout>
                          <Programs />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/programs/create">
                      {() => (
                        <Layout>
                          <CreateProgram />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/mentors">
                      {() => (
                        <Layout>
                          <Mentors />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/applications">
                      {() => (
                        <Layout>
                          <Applications />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/applications/create">
                      {() => (
                        <Layout>
                          <CreateApplicationForm />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/meetings">
                      {() => (
                        <Layout>
                          <MeetingsPage />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/tasks">
                      {() => (
                        <Layout>
                          <TasksPage />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/deliverables">
                      {() => (
                        <Layout>
                          <DeliverablesPage />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/resources">
                      {() => (
                        <Layout>
                          <ResourcesPage />
                        </Layout>
                      )}
                    </Route>

                    <Route path="/test/create-team">
                      {() => (
                        <Layout>
                          <CreateTestTeamPage />
                        </Layout>
                      )}
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
