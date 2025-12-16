import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, BackHandler, ScrollView, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import TopBar from '@/shared/ui/TopBar';
import { useAppTheme } from '@/shared/theme/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StatsService, UserStatItem } from '@/shared/services/stats';
import { ELEMENTS } from '@/shared/data/elements';
import { useLang } from '@/shared/state/lang';
import { Ionicons } from '@expo/vector-icons';

// === TYPES ===
type ElementStat = {
  id: string;
  name: string;
  symbol: string;
  total: number;
  correct: number;
  pct: number;
  status: 'mastered' | 'medium' | 'weak' | 'unplayed';
};

// === HELPER COMPONENTS ===

function MasteryCard({ item, colors }: { item: ElementStat, colors: any }) {
  // Mastery Colors
  let bg = colors.card;
  let border = colors.border;
  let icon = 'lock-closed-outline'; // Default for unplayed
  let opacity = 0.5;

  if (item.status === 'mastered') { // Gold / Green
    bg = '#dcfce7'; // Light green
    border = '#22c55e';
    icon = 'trophy';
    opacity = 1;
  } else if (item.status === 'medium') { // Silver / Yellow
    bg = '#fef9c3'; // Light yellow
    border = '#eab308';
    icon = 'ribbon';
    opacity = 1;
  } else if (item.status === 'weak') { // Bronze / Red
    bg = '#fee2e2'; // Light red
    border = '#ef4444';
    icon = 'construct'; // Work in progress
    opacity = 1;
  }

  return (
    <View style={[styles.masteryCard, { backgroundColor: bg, borderColor: border, opacity }]}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon as any} size={16} color={border} />
        {item.total > 0 && <Text style={{ fontSize: 10, color: border, fontWeight: 'bold' }}>{item.pct.toFixed(0)}%</Text>}
      </View>
      <Text style={[styles.symbol, { color: 'black' }]}>{item.symbol}</Text>
      <Text style={[styles.name, { color: 'black' }]} numberOfLines={1}>{item.name}</Text>

      {/* Mini Progress Bar */}
      <View style={styles.miniBarBg}>
        <View style={[styles.miniBarFill, { width: `${item.pct}%`, backgroundColor: border }]} />
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const { colors } = useAppTheme();
  const nav = useNavigation<any>();
  const { lang } = useLang();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStatItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'weak' | 'mastered'>('all');

  // === TEXTS ===
  const t = lang === 'he' ? {
    title: 'מעבדת השליטה',
    totalQs: 'אימונים שבוצעו',
    masteryScore: 'ציון שליטה כללי',
    filterAll: 'הכל',
    filterWeak: 'לחיזוק',
    filterMastered: 'המומחיות שלי',
    emptyState: 'עדיין לא אספת מספיק נתונים...',
  } : {
    title: 'Mastery Lab',
    totalQs: 'Total Drills',
    masteryScore: 'Mastery Score',
    filterAll: 'All',
    filterWeak: 'Needs Work',
    filterMastered: 'Mastered',
    emptyState: 'Not enough data yet...',
  };

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

  // Fetch data on focus
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      setLoading(true);

      const fetchData = async () => {
        try {
          console.log('[ProgressScreen] Fetching stats...');
          // Add timeout to prevent infinite hanging
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 5000));
          const data = await Promise.race([StatsService.getUserStats(), timeoutPromise]);

          console.log('[ProgressScreen] Stats received:', (data as any)?.length);
          if (mounted) {
            setStats(data as UserStatItem[]);
            setLoading(false);
          }
        } catch (e) {
          console.error('[ProgressScreen] Fetch error (timeout or net):', e);
          if (mounted) setLoading(false);
        }
      };

      fetchData();

      return () => { mounted = false; };
    }, [])
  );

  const metrics = useMemo(() => {
    const totalDrills = stats.length;

    const byElement: Record<string, { total: number, correct: number }> = {};
    ELEMENTS.forEach(e => { byElement[e.id] = { total: 0, correct: 0 }; });
    stats.forEach(s => {
      if (byElement[s.element_id]) {
        byElement[s.element_id].total++;
        if (s.is_correct) byElement[s.element_id].correct++;
      }
    });

    const items: ElementStat[] = Object.entries(byElement).map(([eid, val]) => {
      const elem = ELEMENTS.find(e => String(e.id) === String(eid));
      if (!elem) return null;
      const pct = val.total > 0 ? (val.correct / val.total) * 100 : 0;
      let status: ElementStat['status'] = 'unplayed';

      if (val.total > 0) {
        if (pct >= 80 && val.total >= 3) status = 'mastered';
        else if (pct >= 50) status = 'medium';
        else status = 'weak';
      }

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

    // Calculate Global Mastery Score (Average of all elements)
    const totalScore = items.reduce((acc, item) => acc + item.pct, 0);
    const masteryScore = Math.round(totalScore / items.length);

    items.sort((a, b) => b.pct - a.pct); // Strongest first

    return { totalDrills, masteryScore, items };
  }, [stats, lang]);

  const filteredItems = useMemo(() => {
    if (filter === 'mastered') return metrics.items.filter(i => i.status === 'mastered');
    if (filter === 'weak') return metrics.items.filter(i => i.status === 'weak' || i.status === 'medium');
    return metrics.items;
  }, [filter, metrics]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <TopBar title={t.title} showBack onBack={() => nav.navigate('Tabs', { screen: 'Home' })} />
        <View style={styles.center}><ActivityIndicator size="large" color={colors.tint} /></View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title={t.title} showBack onBack={() => nav.navigate('Tabs', { screen: 'Home' })} />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* === HERO SECTION === */}
        <View style={[styles.hero, { backgroundColor: colors.card }]}>
          <View style={styles.heroCol}>
            <Text style={[styles.heroLabel, { color: colors.text }]}>{t.totalQs}</Text>
            <Text style={[styles.heroValue, { color: colors.tint }]}>{metrics.totalDrills}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.heroCol}>
            <Text style={[styles.heroLabel, { color: colors.text }]}>{t.masteryScore}</Text>
            <Text style={[styles.heroValue, { color: metrics.masteryScore > 80 ? '#22c55e' : metrics.masteryScore > 50 ? '#eab308' : '#ef4444' }]}>
              {metrics.masteryScore}%
            </Text>
          </View>
        </View>

        {/* === TABS === */}
        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setFilter('all')} style={[styles.tab, filter === 'all' && styles.activeTab, { borderColor: colors.border }]}>
            <Text style={[styles.tabText, filter === 'all' && styles.activeTabText, { color: colors.text }]}>{t.filterAll}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilter('weak')} style={[styles.tab, filter === 'weak' && styles.activeTab, { borderColor: colors.border }]}>
            <Text style={[styles.tabText, filter === 'weak' && styles.activeTabText, { color: colors.text }]}>{t.filterWeak}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilter('mastered')} style={[styles.tab, filter === 'mastered' && styles.activeTab, { borderColor: colors.border }]}>
            <Text style={[styles.tabText, filter === 'mastered' && styles.activeTabText, { color: colors.text }]}>{t.filterMastered}</Text>
          </TouchableOpacity>
        </View>

        {/* === MASTERY GRID === */}
        <View style={styles.grid}>
          {filteredItems.map(item => (
            <MasteryCard key={item.id} item={item} colors={colors} />
          ))}
        </View>

        {filteredItems.length === 0 && (
          <Text style={{ textAlign: 'center', marginTop: 40, color: colors.text, opacity: 0.6 }}>{t.emptyState}</Text>
        )}

      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');
const colWidth = (width - 48) / 3; // 3 columns

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16 },
  hero: { flexDirection: 'row', borderRadius: 16, padding: 20, marginBottom: 24, elevation: 2, alignItems: 'center' },
  heroCol: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: '80%', marginHorizontal: 10 },
  heroLabel: { fontSize: 14, opacity: 0.7, marginBottom: 4 },
  heroValue: { fontSize: 32, fontWeight: '900' },
  tabs: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  activeTab: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  tabText: { fontWeight: '600' },
  activeTabText: { color: 'white' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  masteryCard: {
    width: colWidth,
    aspectRatio: 0.85,
    borderRadius: 12,
    padding: 8,
    borderWidth: 2,
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  symbol: { fontSize: 24, fontWeight: 'bold' },
  name: { fontSize: 10, textAlign: 'center', opacity: 0.8 },
  miniBarBg: { width: '100%', height: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden' },
  miniBarFill: { height: '100%' }
});