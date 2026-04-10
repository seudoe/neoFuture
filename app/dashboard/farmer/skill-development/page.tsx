'use client';

import SkillVideos from '@/components/SkillVideos';
import GovtSkillSchemes from '@/components/GovtSkillSchemes';
import TrainingCenters from '@/components/TrainingCenters';
import { useI18n } from '@/lib/i18n/context';
import { GraduationCap } from 'lucide-react';

export default function SkillDevelopmentPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex items-center mb-3">
          <GraduationCap className="w-10 h-10 mr-4" />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">{t('skillDevelopment.title')}</h1>
            <p className="text-green-100 mt-1">{t('skillDevelopment.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Skill-Based Videos Section */}
      <SkillVideos />

      {/* Government Schemes Section */}
      <GovtSkillSchemes />

      {/* Training Centers Section */}
      <TrainingCenters />
    </div>
  );
}
