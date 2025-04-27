import React from 'react';
import { BarChart, CheckCircle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const ProgressTrackerWidget: React.FC = () => {
  // This would typically fetch data from an API
  const data = {
    overallProgress: 65,
    milestones: [
      { id: 1, name: 'Application Review', progress: 100, status: 'completed' },
      { id: 2, name: 'Initial Screening', progress: 100, status: 'completed' },
      { id: 3, name: 'Technical Assessment', progress: 80, status: 'in-progress' },
      { id: 4, name: 'Final Interview', progress: 0, status: 'upcoming' }
    ]
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Program Progress</h3>
        <BarChart className="h-5 w-5 text-purple-500" />
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Overall Progress</span>
            <span className="text-sm font-medium">{data.overallProgress}%</span>
          </div>
          <Progress value={data.overallProgress} className="h-2" />
        </div>

        <div className="space-y-4">
          {data.milestones.map((milestone) => (
            <div key={milestone.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {milestone.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : milestone.status === 'in-progress' ? (
                    <Clock className="h-4 w-4 text-blue-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className="text-sm font-medium">{milestone.name}</span>
                </div>
                <Badge
                  variant={
                    milestone.status === 'completed'
                      ? 'default'
                      : milestone.status === 'in-progress'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {milestone.progress}%
                </Badge>
              </div>
              <Progress
                value={milestone.progress}
                className="h-1"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressTrackerWidget; 