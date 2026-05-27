import HomeQuickStats from '../../../components/common/HomeQuickStats';

interface QuickStatsWidgetProps {
  stats: any;
  loading: boolean;
}

const QuickStatsWidget = ({ stats, loading }: QuickStatsWidgetProps) => {
  return <HomeQuickStats stats={stats} loading={loading} />;
};

export default QuickStatsWidget;
