import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Building,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Filter,
  AlertCircle
} from 'lucide-react';
import { useProgramContext } from '@/context/ProgramContext';
import { cn } from '@/lib/utils';
import { EligibilityCriteria } from '@/types/program';

// Using the EligibilityCriteria interface from types/program.ts

const EligibilityCriteriaWidget: React.FC = () => {
  const { selectedProgram, selectedProgramId } = useProgramContext();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<EligibilityCriteria | null>(null);

  // Effect to update criteria when selected program changes
  useEffect(() => {
    if (selectedProgram && selectedProgram.eligibilityCriteria) {
      setCriteria(selectedProgram.eligibilityCriteria);
      console.log('Eligibility criteria loaded:', selectedProgram.eligibilityCriteria);
    } else {
      // Try to load from localStorage if available
      try {
        if (selectedProgramId) {
          const programKey = `program_${selectedProgramId}`;
          const storedProgram = localStorage.getItem(programKey);
          if (storedProgram) {
            const parsedProgram = JSON.parse(storedProgram);
            if (parsedProgram && parsedProgram.eligibilityCriteria) {
              setCriteria(parsedProgram.eligibilityCriteria);
              console.log('Eligibility criteria loaded from localStorage:', parsedProgram.eligibilityCriteria);
            }
          }
        }
      } catch (error) {
        console.error('Error loading eligibility criteria from localStorage:', error);
      }
    }
  }, [selectedProgram, selectedProgramId]);

  // If no program is selected or no eligibility criteria is defined
  if (!criteria) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Critères d'éligibilité</h3>
          <Filter className="h-5 w-5 text-blue-500" />
        </div>
        <div className="text-center p-6">
          <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Aucun critère d'éligibilité défini pour ce programme.</p>
          <p className="text-gray-400 text-sm mt-2">Les critères apparaîtront ici une fois définis dans votre programme.</p>
        </div>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Critères d'éligibilité</h3>
        <Filter className="h-5 w-5 text-blue-500" />
      </div>

      <div className="space-y-3">
        {/* Team Size Section */}
        <div
          className={cn(
            "border rounded-lg overflow-hidden transition-all",
            expandedSection === 'teamSize' ? "shadow-md" : "",
            "hover:shadow-sm cursor-pointer"
          )}
          onClick={() => toggleSection('teamSize')}
        >
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Users className="h-4 w-4" />
                </div>
                <span className="font-medium">Team Size</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{criteria.minTeamSize} - {criteria.maxTeamSize} members</span>
                {expandedSection === 'teamSize' ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </div>

            {expandedSection === 'teamSize' && (
              <div className="mt-3 border-t pt-3 text-sm text-gray-600 animate-fadeIn">
                <p>Les équipes doivent avoir entre {criteria.minTeamSize} et {criteria.maxTeamSize} membres pour être éligibles à ce programme.</p>
              </div>
            )}
          </div>
        </div>

        {/* Stages Section */}
        {criteria.requiredStages && criteria.requiredStages.length > 0 ? (
          <div
            className={cn(
              "border rounded-lg overflow-hidden transition-all",
              expandedSection === 'stages' ? "shadow-md" : "",
              "hover:shadow-sm cursor-pointer"
            )}
            onClick={() => toggleSection('stages')}
          >
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Startup Stage</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{criteria.requiredStages.length} stages</span>
                  {expandedSection === 'stages' ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </div>

              {expandedSection === 'stages' && (
                <div className="mt-3 border-t pt-3 text-sm text-gray-600 animate-fadeIn">
                  <p className="mb-2">Phases de startup éligibles:</p>
                  <div className="flex flex-wrap gap-2">
                    {criteria.requiredStages.map((stage, index) => (
                      <Badge key={index} variant="outline" className="bg-purple-50">
                        {stage}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "border rounded-lg overflow-hidden transition-all",
              expandedSection === 'stages' ? "shadow-md" : "",
              "hover:shadow-sm cursor-pointer"
            )}
            onClick={() => toggleSection('stages')}
          >
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Startup Stage</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">No restrictions</span>
                  {expandedSection === 'stages' ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </div>

              {expandedSection === 'stages' && (
                <div className="mt-3 border-t pt-3 text-sm text-gray-600 animate-fadeIn">
                  <p>Ce programme n'a pas de restrictions de phase de startup. Les équipes à n'importe quelle phase peuvent postuler.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Industries Section */}
        {criteria.requiredIndustries && criteria.requiredIndustries.length > 0 ? (
          <div
            className={cn(
              "border rounded-lg overflow-hidden transition-all",
              expandedSection === 'industries' ? "shadow-md" : "",
              "hover:shadow-sm cursor-pointer"
            )}
            onClick={() => toggleSection('industries')}
          >
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Building className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Industries</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{criteria.requiredIndustries.length} industries</span>
                  {expandedSection === 'industries' ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </div>

              {expandedSection === 'industries' && (
                <div className="mt-3 border-t pt-3 text-sm text-gray-600 animate-fadeIn">
                  <p className="mb-2">Industries éligibles:</p>
                  <div className="flex flex-wrap gap-2">
                    {criteria.requiredIndustries.map((industry, index) => (
                      <Badge key={index} variant="outline" className="bg-green-50">
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "border rounded-lg overflow-hidden transition-all",
              expandedSection === 'industries' ? "shadow-md" : "",
              "hover:shadow-sm cursor-pointer"
            )}
            onClick={() => toggleSection('industries')}
          >
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Building className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Industries</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">No restrictions</span>
                  {expandedSection === 'industries' ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </div>

              {expandedSection === 'industries' && (
                <div className="mt-3 border-t pt-3 text-sm text-gray-600 animate-fadeIn">
                  <p>This program has no industry restrictions. Teams from any industry can apply.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Revenue Section */}
        <div
          className={cn(
            "border rounded-lg overflow-hidden transition-all",
            expandedSection === 'revenue' ? "shadow-md" : "",
            "hover:shadow-sm cursor-pointer"
          )}
          onClick={() => toggleSection('revenue')}
        >
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <DollarSign className="h-4 w-4" />
                </div>
                <span className="font-medium">Revenue Range</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {formatCurrency(criteria.minRevenue)} - {formatCurrency(criteria.maxRevenue)}
                </span>
                {expandedSection === 'revenue' ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </div>

            {expandedSection === 'revenue' && (
              <div className="mt-3 border-t pt-3 text-sm text-gray-600 animate-fadeIn">
                <p>Le chiffre d'affaires annuel doit être compris entre {formatCurrency(criteria.minRevenue)} et {formatCurrency(criteria.maxRevenue)} pour être éligible.</p>
              </div>
            )}
          </div>
        </div>

        {/* Required Documents Section */}
        {criteria.requiredDocuments && criteria.requiredDocuments.length > 0 ? (
          <div
            className={cn(
              "border rounded-lg overflow-hidden transition-all",
              expandedSection === 'documents' ? "shadow-md" : "",
              "hover:shadow-sm cursor-pointer"
            )}
            onClick={() => toggleSection('documents')}
          >
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Required Documents</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{criteria.requiredDocuments.length} documents</span>
                  {expandedSection === 'documents' ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </div>

              {expandedSection === 'documents' && (
                <div className="mt-3 border-t pt-3 text-sm text-gray-600 animate-fadeIn">
                  <p className="mb-2">Required documents for application:</p>
                  <ScrollArea className="h-[100px] pr-4">
                    <ul className="list-disc pl-5 space-y-1">
                      {criteria.requiredDocuments.map((document, index) => (
                        <li key={index}>{document}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "border rounded-lg overflow-hidden transition-all",
              expandedSection === 'documents' ? "shadow-md" : "",
              "hover:shadow-sm cursor-pointer"
            )}
            onClick={() => toggleSection('documents')}
          >
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Required Documents</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">None required</span>
                  {expandedSection === 'documents' ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </div>

              {expandedSection === 'documents' && (
                <div className="mt-3 border-t pt-3 text-sm text-gray-600 animate-fadeIn">
                  <p>No specific documents are required for application to this program.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EligibilityCriteriaWidget;
