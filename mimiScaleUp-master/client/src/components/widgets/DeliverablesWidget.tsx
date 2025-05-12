import React, { useEffect, useState } from 'react';
import { Calendar, FileCheck, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, isBefore, isToday } from 'date-fns';
import { useDeliverables, Deliverable } from '@/context/DeliverablesContext';
import { useProgramContext } from '@/context/ProgramContext';

const DeliverablesWidget: React.FC = () => {
  // Use the context data directly - this is the same data used by the main page
  const {
    upcomingDeliverables,
    getStatusBadgeClass,
    getStatusText,
    getSubmissionTypeIcon,
    deliverables
  } = useDeliverables();

  const { selectedProgram } = useProgramContext();
  const [isLoading, setIsLoading] = useState(true);

  // Set loading to false when deliverables are loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [deliverables]);

  // Get only the first 5 deliverables for display
  const displayDeliverables = upcomingDeliverables.slice(0, 5);
  const today = new Date();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Livrables à venir</h3>
        <FileCheck className="h-5 w-5 text-indigo-500" />
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : displayDeliverables.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {selectedProgram ? (
              <>
                <p>Aucun livrable à venir</p>
                <p className="text-sm mt-2">Ajoutez des livrables dans la section Livrables</p>
              </>
            ) : (
              <p>Veuillez sélectionner un programme</p>
            )}
          </div>
        ) : (
          displayDeliverables.map((deliverable) => {
            const isLate = isBefore(new Date(deliverable.dueDate), today) &&
                          !isToday(new Date(deliverable.dueDate)) &&
                          deliverable.status === 'pending';

            return (
              <div
                key={deliverable.id}
                className={cn(
                  "p-3 rounded-lg border",
                  isLate ? "border-red-200 bg-red-50" :
                  deliverable.status === 'submitted' ? "border-green-200 bg-green-50" :
                  "border-gray-200 hover:bg-gray-50 transition-colors"
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{deliverable.name}</div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      Échéance {format(new Date(deliverable.dueDate), 'dd/MM/yyyy')}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <div className="flex items-center text-sm">
                      {isLate ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : deliverable.status === 'submitted' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500" />
                      )}
                      <span className={cn(
                        "ml-1.5",
                        isLate ? "text-red-600" :
                        deliverable.status === 'submitted' ? "text-green-600" :
                        "text-amber-600"
                      )}>
                        {getStatusText(deliverable.status, deliverable.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DeliverablesWidget;