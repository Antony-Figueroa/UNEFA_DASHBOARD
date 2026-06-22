/**
 * @file AuditoriaPage.tsx
 * @description Página unificada de Auditoría - Orquesta los 3 tabs de auditoría
 */

import { useEffect, useState } from 'react';
import PageMeta from '../../../components/common/PageMeta';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';
import { EyeIcon, EditIcon, CalendarIcon } from '../../../icons/actions';
import apiClient from '../../../api/apiClient';
import { AuthLogsTab } from '../components/AuthLogsTab';
import { DbChangesTab } from '../components/DbChangesTab';
import { ActivityLogTab } from '../components/ActivityLogTab';
import type { TabType } from '../components/utils';

export default function AuditoriaPage() {
  const [activeTab, setActiveTab] = useState<TabType>('auth');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hasNewChanges, setHasNewChanges] = useState(false);

  // Counts for tab badges
  const [authCount, setAuthCount] = useState(0);
  const [changeCount, setChangeCount] = useState(0);
  const [activityCount, setActivityCount] = useState(0);

  // Lightweight initial count load + new-changes detection
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [, authRes, actRes] = await Promise.allSettled([
          apiClient.get('/audit/stats?days=7'),
          apiClient.get('/auth/all-logs?limit=1'),
          apiClient.get('/activity-logs?limit=1'),
        ]);

        if (authRes.status === 'fulfilled' && authRes.value.data.success) {
          setAuthCount(authRes.value.data.meta?.total || 0);
        }
        if (actRes.status === 'fulfilled' && actRes.value.data.success) {
          setActivityCount(actRes.value.data.meta?.total || 0);
        }
      } catch (e) {
        console.error('[Auditoria] Error loading counts:', e);
      }
    };
    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load change count + detect new changes
  useEffect(() => {
    const loadChangeData = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          apiClient.get('/audit/stats?days=7'),
          apiClient.get('/audit?limit=1'),
        ]);
        if (statsRes.data.success) {
          setChangeCount(statsRes.data.data.totalChanges || 0);
        }
        if (logsRes.data.success && logsRes.data.data?.length > 0) {
          const lastDate = logsRes.data.data[0].dateTime;
          const lastViewed = localStorage.getItem('lastViewedChangeLog');
          if (lastViewed && lastDate > lastViewed) {
            setHasNewChanges(true);
          }
        }
      } catch (e) {
        console.error('[Auditoria] Error loading change data:', e);
      }
    };
    loadChangeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
    if (tabId === 'changes') {
      setHasNewChanges(false);
      localStorage.setItem('lastViewedChangeLog', new Date().toISOString());
    }
  };

  const tabs = [
    { id: 'auth' as TabType, label: 'Autenticación', icon: EyeIcon, count: authCount },
    { id: 'changes' as TabType, label: 'Cambios en BD', icon: EditIcon, count: changeCount, hasNew: hasNewChanges },
    { id: 'activities' as TabType, label: 'Bitácora Actividades', icon: CalendarIcon, count: activityCount },
  ];

  const sharedDateProps = {
    dateFrom,
    dateTo,
    onDateFromChange: setDateFrom,
    onDateToChange: setDateTo,
    onClearDates: () => {
      setDateFrom('');
      setDateTo('');
    },
  };

  return (
    <>
      <PageMeta
        title="Auditoría"
        description="Sistema unificado de auditoría - Autenticación, Cambios y Bitácora"
      />
      <PageBreadcrumb pageTitle="Auditoría" />

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                {tab.count}
              </span>
              {(tab as any).hasNew && activeTab !== tab.id && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-error-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'auth' && <AuthLogsTab {...sharedDateProps} />}
      {activeTab === 'changes' && <DbChangesTab {...sharedDateProps} />}
      {activeTab === 'activities' && <ActivityLogTab {...sharedDateProps} />}
    </>
  );
}
