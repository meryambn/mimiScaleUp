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
import NotFound from '@/pages/not-found';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ProgramProvider } from "@/context/ProgramContext";
import { MeetingsProvider } from "@/context/MeetingsContext";
import { TasksProvider } from "@/context/TasksContext";
import { ResourcesProvider } from "@/context/ResourcesContext";
import { DeliverablesProvider } from "@/context/DeliverablesContext";
import Layout from "@/components/layout/Layout";

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ProgramProvider>
        <MeetingsProvider>
          <TasksProvider>
            <ResourcesProvider>
              <DeliverablesProvider>
                <Layout>
                  <Switch>
                    <Route path="/" component={Dashboard} />
                    <Route path="/dashboard" component={Dashboard} />
                    <Route path="/teams" component={TeamsPage} />
                    <Route path="/teams/:id" component={StartupDetailPage} />
                    <Route path="/programs" component={Programs} />
                    <Route path="/programs/create" component={CreateProgram} />
                    <Route path="/mentors" component={Mentors} />
                    <Route path="/applications" component={Applications} />
                    <Route path="/applications/create" component={CreateApplicationForm} />
                    <Route path="/meetings" component={MeetingsPage} />
                    <Route path="/tasks" component={TasksPage} />
                    <Route path="/deliverables" component={DeliverablesPage} />
                    <Route path="/resources" component={ResourcesPage} />
                    <Route path="/evaluation" component={Evaluation} />
                    <Route path="/evaluation/create" component={CreateEvaluationCriteria} />
                    <Route path="/test/create-team" component={CreateTestTeamPage} />
                    <Route component={NotFound} />
                  </Switch>
                </Layout>
                <Toaster />
              </DeliverablesProvider>
            </ResourcesProvider>
          </TasksProvider>
        </MeetingsProvider>
      </ProgramProvider>
    </QueryClientProvider>
  );
};

export default App;
