import React from 'react';
import { Route, Switch } from 'wouter';
import Dashboard from './pages/dashboard';
import TeamsPage from './pages/teams';
import StartupDetailPage from './pages/teams/[id]';
import Programs from './pages/programs';
import CreateProgram from './pages/programs/create';
import Mentors from './pages/mentors';
import Applications from './pages/applications';
import CreateApplicationForm from './pages/applications/create';
import Evaluation from './pages/evaluation';
import CreateEvaluationCriteria from './pages/evaluation/create';
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

const App = () => {
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
                      {() => (
                        <HomeLayout>
                          <HomePage />
                        </HomeLayout>
                      )}
                    </Route>

                    <Route path="/dashboard">
                      {() => (
                        <Layout>
                          <Dashboard />
                        </Layout>
                      )}
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
                    <Route path="/evaluation">
                      {() => (
                        <Layout>
                          <Evaluation />
                        </Layout>
                      )}
                    </Route>
                    <Route path="/evaluation/create">
                      {() => (
                        <Layout>
                          <CreateEvaluationCriteria />
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
