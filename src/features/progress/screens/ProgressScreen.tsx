import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, BackHandler, ScrollView, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import TopBar from '@/shared/ui/TopBar';
import { useAppTheme } from '@/shared/theme/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StatsService, UserStatItem } from '@/shared/services/stats';
import { ELEMENTS } from '@/shared/data/elements';
import { Svg, Circle } from 'react-native-svg';
import { useLang } from '@/shared/state/lang';

// === CONSTANTS ===
const SCREEN_WIDTH = Dimensions.get('window').width;

// === TYPES ===
type ElementStat = {
  id: string;
  name: string;
  symbol: string;
  total: number;
  correct: number;
  pct: number; // 0-100
  status: 'mastered' | 'medium' | 'weak';
};

// === HELPER COMPONENTS ===

function StatCard({ label, value, color }: { label: string, value: string | number, color: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

function Donut({ data, size = 160, thickness = 20 }: { data: { key: string, val: number, color: string }[], size?: number, thickness?: number }) {
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((acc, d) => acc + d.val, 0);

  let startAngle = -90;

  if (total === 0) {
    return (
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={radius} stroke="#ccc" strokeWidth={thickness} fill="none" opacity={0.3} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size}>
      {data.map((d, i) => {
        const strokeDashoffset = circumference - (d.val / total) * circumference;
        const angle = (d.val / total) * 360;
        const currentStart = startAngle;
        startAngle += angle;

        return (
          <Circle
            key={d.key}
            cx={cx}
            cy={cy}
            r={radius}
            stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={`${(d.val / total) * circumference} ${circumference}`}
            strokeDashoffset={0}
            rotation={currentStart}
            originX={cx}
            originY={cy}
            fill="none"
            strokeLinecap="round"
          />
        );
      })}
      {/* Inner Text */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#888' }}>{total}</Text>
      </View>
    </Svg>
  );
}

function ProgressBar({ pct, color }: { pct: number, color: string }) {
  return (
    <View style={{ height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden', flex: 1 }}>
      <View style={{ width: `${pct}%`, backgroundColor: color, height: '100%' }} />
    </View>
  );
}

export default function ProgressScreen() {
  const { colors } = useAppTheme();
  const nav = useNavigation<any>();
  const { lang } = useLang();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStatItem[]>([]);

  // === TEXTS ===
  const t = lang === 'he' ? {
    title: 'הסטטיסטיקה שלי',
    totalQs: 'סה״כ שאלות',
    successRate: 'אחוזי הצלחה',
    mastered: 'שליטה מלאה',
    medium: 'בינוני',
    weak: 'טעון שיפור',
    noData: 'אין עדיין נתונים. צא לפתור מבחנים!',
    chartTitle: 'התפלגות תשובות',
    strongElements: 'אלמנטים חזקים 💪',
    weakElements: 'אלמנטים לחיזוק 🛠️',
  } : {
    title: 'My Statistics',
    totalQs: 'Total Questions',
    successRate: 'Success Rate',
    mastered: 'Mastered',
    medium: 'Average',
    weak: 'Needs Work',
    noData: 'No data yet. Go take a quiz!',
    chartTitle: 'Performance Breakdown',
    strongElements: 'Strong Elements 💪',
    weakElements: 'Elements to Practice 🛠️',
  };

  // === NAVIGATION BACK ===
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        nav.navigate('Tabs', { screen: 'Home' });
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [nav])
  );

  // === DATA FETCH ===
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        // Create a timeout promise to prevent indefinite loading
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));
        const data = await Promise.race([StatsService.getUserStats(), timeout]);

        if (mounted) {
          setStats(data as UserStatItem[]);
          setLoading(false);
        }
      } catch (e) {
        console.warn('Stats load error:', e);
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, []);

  // === METRIC CALCULATION ===
  const metrics = useMemo(() => {
    const totalCount = stats.length;
    const correctCount = stats.filter(s => s.is_correct).length;
    const successRate = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    // Group by Element - Pre-fill with all elements to ensure they appear
    const byElement: Record<string, { total: number, correct: number }> = {};

    // Initialize ALL elements from the database definition
    ELEMENTS.forEach(e => {
      byElement[e.id] = { total: 0, correct: 0 };
    });

    // Merge actual user stats
    stats.forEach(s => {
      if (byElement[s.element_id]) {
        byElement[s.element_id].total++;
        if (s.is_correct) byElement[s.element_id].correct++;
      }
    });

    // Create Stats Array
    const elementStats: ElementStat[] = Object.entries(byElement).map(([eid, val]) => {
      const elem = ELEMENTS.find(e => String(e.id) === String(eid));
      if (!elem) return null;

      const pct = val.total > 0 ? (val.correct / val.total) * 100 : 0;
      let status: 'mastered' | 'medium' | 'weak' = 'weak';

      if (val.total === 0) status = 'weak';
      else if (pct >= 80 && val.total >= 3) status = 'mastered';
      else if (pct >= 50 && val.total >= 3) status = 'medium';

      return {
        id: eid,
        name: lang === 'he' ? elem.name.he : elem.name.en,
        symbol: elem.symbol,
        total: val.total,
        correct: val.correct,
        pct,
        status
      };
    }).filter(Boolean) as ElementStat[];

    // Sort: Weakest first
    elementStats.sort((a, b) => a.pct - b.pct);

    return {
      totalCount,
      successRate,
      elementStats,
      masteredCount: elementStats.filter(e => e.status === 'mastered').length,
      mediumCount: elementStats.filter(e => e.status === 'medium').length,
      weakCount: elementStats.filter(e => e.status === 'weak').length,
    };
  }, [stats, lang]);

  const onBack = () => nav.navigate('Tabs', { screen: 'Home' });

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <TopBar title={t.title} showBack onBack={onBack} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </View>
    );
  }

  // Define data for rendering
  const donutData = [
    { key: 'mastered', val: metrics.masteredCount, color: '#4ade80' }, // Green
    { key: 'medium', val: metrics.mediumCount, color: '#facc15' },   // Yellow
    { key: 'weak', val: metrics.weakCount, color: '#f87171' },       // Red
  ].filter(d => d.val > 0);

  const strong = metrics.elementStats.filter(e => e.status === 'mastered');
  const weak = metrics.elementStats.filter(e => e.status === 'weak' || e.status === 'medium');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title={t.title} showBack onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Top Cards */}
        <View style={styles.row}>
          <StatCard label={t.totalQs} value={metrics.totalCount} color={colors.tint} />
          <StatCard label={t.successRate} value={`${metrics.successRate}%`} color={metrics.successRate > 80 ? '#4ade80' : metrics.successRate > 50 ? '#facc15' : '#f87171'} />
        </View>

        {/* Chart Section - Only show if there is actual data */}
        {metrics.totalCount > 0 ? (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.chartTitle}</Text>
            <View style={styles.chartRow}>
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Donut data={donutData} />
              </View>
              <View style={styles.legend}>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#4ade80' }]} /><Text style={{ color: colors.text }}>{t.mastered} ({metrics.masteredCount})</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#facc15' }]} /><Text style={{ color: colors.text }}>{t.medium} ({metrics.mediumCount})</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#f87171' }]} /><Text style={{ color: colors.text }}>{t.weak} ({metrics.weakCount})</Text></View>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.section, { backgroundColor: colors.card, alignItems: 'center', padding: 24 }]}>
            <Text style={{ color: colors.text, opacity: 0.7, textAlign: 'center' }}>{t.noData}</Text>
          </View>
        )}

        {/* Needs Work List - Always shows at least unpracticed items */}
        {weak.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.weakElements}</Text>
            {weak.map(e => (
              <View key={e.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                <View style={{ width: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{e.symbol}</Text>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <Text style={{ color: colors.text, fontWeight: 'bold' }}>{e.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <ProgressBar pct={e.pct} color={e.status === 'weak' ? '#f87171' : '#facc15'} />
                    <Text style={{ color: colors.text, fontSize: 12, marginLeft: 8 }}>{Math.round(e.pct)}%</Text>
                  </View>
                </View>
                <View>
                  <Text style={{ color: colors.text, fontSize: 12 }}>{e.correct}/{e.total}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Strong List */}
        {strong.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.strongElements}</Text>
            {strong.map(e => (
              <View key={e.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                <View style={{ width: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{e.symbol}</Text>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <Text style={{ color: colors.text, fontWeight: 'bold' }}>{e.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <ProgressBar pct={e.pct} color="#4ade80" />
                    <Text style={{ color: colors.text, fontSize: 12, marginLeft: 8 }}>{Math.round(e.pct)}%</Text>
                  </View>
                </View>
                <View>
                  <Text style={{ color: colors.text, fontSize: 12 }}>{e.correct}/{e.total}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, gap: 16 },
  row: { flexDirection: 'row', gap: 16 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, borderLeftWidth: 4, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 14, opacity: 0.7, marginTop: 4 },
  section: { borderRadius: 16, padding: 16, elevation: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, textAlign: 'left' },
  chartRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  legend: { gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
});