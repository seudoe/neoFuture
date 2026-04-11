'use client';

import { useState } from 'react';
import SkillVideos from '@/components/SkillVideos';
import GovtSkillSchemes from '@/components/GovtSkillSchemes';
import TrainingCenters from '@/components/TrainingCenters';
import MySkills from '@/components/skill-marketplace/MySkills';
import MyWorks from '@/components/skill-marketplace/MyWorks';
import ExploreFarmers from '@/components/skill-marketplace/ExploreFarmers';
import LearningRequests from '@/components/skill-marketplace/LearningRequests';
import { useI18n } from '@/lib/i18n/context';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { GraduationCap, PlayCircle, Users, BookOpen } from 'lucide-react';

type Tab = 'marketplace' | 'learn';

export default function SkillDevelopmentPage() {
  const { t } = useI18n();
  const { user } = useDashboardData('seller');
  const [tab, setTab] = useState<Tab>('marketplace');

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
        <div className="flex items-center mb-3">
          <GraduationCap className="w-10 h-10 mr-4 shrink-0" />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">{t('skillDevelopment.title')}</h1>
            <p className="text-green-100 mt-1">{t('skillDevelopment.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 bg-white rounded-2xl shadow-sm p-2">
        <button onClick={() => setTab('marketplace')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            tab === 'marketplace' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}>
          <Users className="w-4 h-4" /> Skill Marketplace
        </button>
        <button onClick={() => setTab('learn')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            tab === 'learn' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}>
          <PlayCircle className="w-4 h-4" /> Learn & Schemes
        </button>
      </div>

      {tab === 'marketplace' ? (
        <>
          {/* My Skills */}
          <MySkills farmerId={user.id} />

          {/* My Recent Work */}
          <MyWorks farmerId={user.id} />

          {/* Explore other farmers */}
          <ExploreFarmers currentFarmerId={user.id} />

          {/* Learning Requests */}
          <LearningRequests farmerId={user.id} />
        </>
      ) : (
        <>
          {/* Skill-Based Videos */}
          <SkillVideos />

          {/* Government Schemes */}
          <GovtSkillSchemes />

          {/* Training Centers */}
          <TrainingCenters />
        </>
      )}
    </div>
  );
}
