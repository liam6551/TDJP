import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, BackHandler, ScrollView, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity, Animated, Easing } from 'react-native';
import TopBar from '@/shared/ui/TopBar';
import { useAppTheme } from '@/shared/theme/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StatsService, UserStatItem } from '@/shared/services/stats';
import { ELEMENTS } from '@/shared/data/elements';
import { useLang } from '@/shared/state/lang';
import { Ionicons } from '@expo/vector-icons';

// === TYPES ===
type Tier = 'locked' | 'novice' | 'apprentice' | 'competent' | 'proficient' | 'master';
type ScoreMode = 'all' | Tier;

type ElementStat = {
  id: string;
  name: string;
  symbol: string;
  score: number; // 0-100
  tier: Tier;
};

// === COLORS & TIERS ===
const TIERS: Record<Tier, { labelHe: string, labelEn: string, color: string, bg: string, range: [number, number] }> = {
  locked: { labelHe: 'נעול', labelEn: 'Locked', color: '#9ca3af', bg: '#f3f4f6', range: [0, 0] },
  novice: { labelHe: 'מתחיל', labelEn: 'Novice', color: '#ef4444', bg: '#fee2e2', range: [0, 20] }, // Red
  apprentice: { labelHe: 'מתלמד', labelEn: 'Apprentice', color: '#f97316', bg: '#ffedd5', range: [21, 40] }, // Orange
  competent: { labelHe: 'מוסמך', labelEn: 'Competent', color: '#eab308', bg: '#fef9c3', range: [41, 60] }, // Yellow
  proficient: { labelHe: 'מיומן', labelEn: 'Proficient', color: '#84cc16', bg: '#ecfccb', range: [61, 80] }, // Neon Green (Lime)
  master: { labelHe: 'מאסטר', labelEn: 'Master', color: '#15803d', bg: '#dcfce7', range: [81, 100] } // Strong Green
};

// === HELPER COMPONENTS ===

function MasteryCard({ item, colors }: { item: ElementStat, colors: any }) {
  const tierConfig = TIERS[item.tier];

  // Custom styling for Locked vs Active
  const isLocked = item.tier === 'locked';
  const borderColor = tierConfig.color;
  const bgColor = tierConfig.bg;

  return (
    <View style={[styles.masteryCard, { backgroundColor: bgColor, borderColor: borderColor, opacity: isLocked ? 0.6 : 1 }]}>
      <View style={styles.cardHeader}>
        {isLocked ? (
          <Ionicons name="lock-closed" size={16} color={borderColor} />
        ) : (
          <Text style={{ fontSize: 12, color: borderColor, fontWeight: '900' }}>{item.score}%</Text>
        )}
        <View style={[styles.tierBadge, { backgroundColor: borderColor }]}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
        </View>
      </View>

      <Text style={[styles.symbol, { color: 'black' }]}>{item.symbol}</Text>

      {/* 2 Lines for Name */}
      <Text style={[styles.name, { color: 'black' }]} numberOfLines={2}>{item.name}</Text>

      {/* Mini Progress Bar */}
      {!isLocked && (
        <View style={styles.miniBarBg}>
          <View style={[styles.miniBarFill, { width: `${item.score}%`, backgroundColor: borderColor }]} />
        </View>
      )}
    </View>
  );
}

export default function ProgressScreen() {
  const { colors } = useAppTheme();
  const nav = useNavigation<any>();
  const { lang } = useLang();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStatItem[]>([]);
  const [filter, setFilter] = useState<Tier | 'all'>('all');
  const [rotatingLevel, setRotatingLevel] = useState<Tier>('novice');

  const handleRotatingPress = () => {
    // If currently not on this level, just switch to it (without rotating)? 
    // OR always rotate? 
    // User logic: "And on click it will change according to order... and loop". 
    // Interpretation: User wants it to ACT as a filter button but ALSO rotate.
    // Let's say: If I click it and I am NOT on it, does it just select current? or select next?
    // "Pressing it will change by order". This implies every press changes the level.
    // But then how do I "Select" it without changing?
    // User: "Third one... default always starts with its color.. on click it changes".
    // So likely: It IS the filter. Clicking it updates the filter to the NEW level.

    // Always rotate to the next level and select it
    const levels: Tier[] = ['novice', 'apprentice', 'competent', 'proficient', 'master'];
    const currIdx = levels.indexOf(rotatingLevel);
    const nextLevel = levels[(currIdx + 1) % levels.length];

    setRotatingLevel(nextLevel);
    setFilter(nextLevel);
  };

  // Interactive Score Card
  const [scoreMode, setScoreMode] = useState<ScoreMode>('all');
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll tabs to right in Hebrew (because of row-reverse, "All" is at the end of scrollable area??)
  // Wait. In row-reverse: [Master] .. [All].
  // Rendered: Right side is All. Left side is Master.
  // ScrollView starts at x=0 (Left).
  // So we need to scroll to x=max (Right) to see "All".
  useEffect(() => {
    if (lang === 'he') {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 50);
    } else {
      scrollViewRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [lang, loading]);

  // === TEXTS ===
  const t = lang === 'he' ? {
    title: 'סטטיסטיקה',
    totalQs: 'מספר אימונים',
    masteryScore: 'הכל',
    filterAll: 'הכל',
    emptyState: 'עדיין לא אספת מספיק נתונים...',
  } : {
    title: 'Statistics',
    totalQs: 'Total Drills',
    masteryScore: 'Mastery %',
    filterAll: 'All',
    emptyState: 'Not enough data yet...',
  };

  useFocusEffect(
    React.useCallback(() => {
      // Reset to ALL on entry
      setScoreMode('all');
      const onBackPress = () => { nav.navigate('Tabs', { screen: 'Home' }); return true; };
      const s = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => s.remove();
    }, [nav])
  );

  // Fetch data
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      setLoading(true);

      const fetchData = async () => {
        try {
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 15000));
          const data = await Promise.race([StatsService.getUserStats(), timeoutPromise]);
          if (mounted) {
            setStats(data as UserStatItem[]);
            setLoading(false);
          }
        } catch (e) {
          console.error('[ProgressScreen] Fetch error:', e);
          if (mounted) setLoading(false);
        }
      };
      fetchData();
      return () => { mounted = false; };
    }, [])
  );

  const metrics = useMemo(() => {
    // 1. Group by Element ID
    const historyByElement: Record<string, boolean[]> = {}; // true=correct, false=wrong
    const sortedStats = [...stats].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    sortedStats.forEach(s => {
      if (!historyByElement[s.element_id]) historyByElement[s.element_id] = [];
      historyByElement[s.element_id].push(s.is_correct);
    });

    const items: ElementStat[] = ELEMENTS.map(elem => {
      const history = historyByElement[elem.id] || [];

      // Calculate Score: 0 start. +5 correct, -5 wrong. Min 0, Max 100.
      let score = 0;
      history.forEach(isCorrect => {
        if (isCorrect) score += 5;
        else score -= 5;

        if (score < 0) score = 0;
        if (score > 100) score = 100;
      });

      // Determine Tier
      let tier: Tier = 'locked';
      if (history.length > 0) {
        if (score <= 20) tier = 'novice';
        else if (score <= 40) tier = 'apprentice';
        else if (score <= 60) tier = 'competent';
        else if (score <= 80) tier = 'proficient';
        else tier = 'master';
      } else {
        // Explicit "Locked" for unplayed
        tier = 'locked';
      }

      return {
        id: elem.id,
        name: lang === 'he' ? elem.name.he : elem.name.en,
        symbol: elem.symbol,
        score,
        tier
      };
    });

    // Score calculations
    const totalScore = items.length > 0 ? Math.round(items.reduce((acc, i) => acc + i.score, 0) / items.length) : 0;

    // Counts per tier
    const counts: Record<Tier, number> = { locked: 0, novice: 0, apprentice: 0, competent: 0, proficient: 0, master: 0 };
    items.forEach(i => counts[i.tier]++);

    return { totalDrills: stats.length, masteryScore: totalScore, items, counts, totalItems: items.length };
  }, [stats, lang]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return metrics.items;
    return metrics.items.filter(i => i.tier === filter);
  }, [filter, metrics]);

  // Animation Logic
  const handleScorePress = () => {
    // Defne Cycle: All -> Novice -> Apprentice -> Competent -> Proficient -> Master -> Locked -> All
    const cycle: ScoreMode[] = ['all', 'novice', 'apprentice', 'competent', 'proficient', 'master', 'locked'];
    const currIdx = cycle.indexOf(scoreMode);
    const nextMode = cycle[(currIdx + 1) % cycle.length];

    // Spin!
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease)
    }).start(({ finished }) => {
      if (finished) {
        flipAnim.setValue(0); // Reset for next time
      }
    });

    // Change data halfway (300ms)
    setTimeout(() => {
      setScoreMode(nextMode);
    }, 300);
  };

  // Setup Rotation Interpolation
  const spin = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '0deg']
  });

  // Determine Card Display Data
  let cardTitle = t.masteryScore;
  let cardValue = `${metrics.masteryScore}%`;
  let cardColor = '#3b82f6'; // Default Blue for All

  if (scoreMode !== 'all') {
    const tier = TIERS[scoreMode];
    cardTitle = lang === 'he' ? tier.labelHe : tier.labelEn;
    cardColor = tier.color;
    // Calculate Percentage of Collection
    const count = metrics.counts[scoreMode];
    const pctOfTotal = metrics.totalItems > 0 ? Math.round((count / metrics.totalItems) * 100) : 0;
    cardValue = `${pctOfTotal}%`;
  } else {
    // Default Blue for "All" / Global Mastery
    // User requested "Mastery % (All) in Blue"
    cardColor = '#3b82f6';
  }

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

          {/* Drills (Static) */}
          <View style={styles.heroCol}>
            <Text style={[styles.heroLabel, { color: colors.text }]} numberOfLines={2}>{t.totalQs}</Text>
            <Text style={[styles.heroValue, { color: colors.tint }]}>{metrics.totalDrills}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Interactive Score Card */}
          <View style={styles.heroCol}>
            <TouchableOpacity onPress={handleScorePress} activeOpacity={0.8}>
              <Animated.View style={{ alignItems: 'center', transform: [{ rotateX: spin }] }}>
                <Text style={[styles.heroLabel, { color: colors.text }]} numberOfLines={2}>{cardTitle}</Text>
                <Text style={[styles.heroValue, { color: cardColor }]}>
                  {cardValue}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        {/* === FILTER BUTTONS === */}
        <View style={[styles.filterContainer, { flexDirection: lang === 'he' ? 'row-reverse' : 'row' }]}>

          {/* 1. All */}
          <TouchableOpacity
            onPress={() => setFilter('all')}
            style={[styles.tab, filter === 'all' && styles.activeTab, { borderColor: colors.border }]}
          >
            <Text style={[styles.tabText, filter === 'all' && styles.activeTabText, { color: colors.text }]}>{t.filterAll}</Text>
          </TouchableOpacity>

          {/* 2. Locked */}
          <TouchableOpacity
            onPress={() => setFilter('locked')}
            style={[
              styles.tab,
              filter === 'locked' && { backgroundColor: TIERS.locked.bg, borderColor: TIERS.locked.color },
              filter !== 'locked' && { borderColor: colors.border, opacity: 0.5 }
            ]}
          >
            <Text style={[
              styles.tabText,
              filter === 'locked' ? { color: TIERS.locked.color } : { color: colors.text }
            ]}>
              {lang === 'he' ? TIERS.locked.labelHe : TIERS.locked.labelEn}
            </Text>
          </TouchableOpacity>

          {/* 3. Rotating Level */}
          <TouchableOpacity
            onPress={handleRotatingPress}
            style={[
              styles.tab,
              filter === rotatingLevel && { backgroundColor: TIERS[rotatingLevel].bg, borderColor: TIERS[rotatingLevel].color },
              filter !== rotatingLevel && { borderColor: TIERS[rotatingLevel].color, borderWidth: 1.5, backgroundColor: colors.card }
            ]}
          >
            <Text style={[
              styles.tabText,
              // Always show the color of the current rotating level, even if not active (unless active, then maybe bolder or same?)
              // User said: "default always starting with its color"
              { color: TIERS[rotatingLevel].color }
            ]}>
              {lang === 'he' ? TIERS[rotatingLevel].labelHe : TIERS[rotatingLevel].labelEn}
            </Text>
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
    </View>

      </ScrollView >
    </View >
  );
}

const { width } = Dimensions.get('window');
const colWidth = (width - 48) / 3;

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 100 },
  hero: { flexDirection: 'row', borderRadius: 16, padding: 20, marginBottom: 24, elevation: 2, alignItems: 'center' },
  heroCol: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  divider: { width: 1, height: '80%', marginHorizontal: 10 },
  heroLabel: { fontSize: 14, opacity: 0.9, marginBottom: 4, textAlign: 'center', fontWeight: '600' },
  heroValue: { fontSize: 28, fontWeight: '900' },
  filterContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24, gap: 12 },
  tab: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 24, borderWidth: 1, minWidth: 80, alignItems: 'center' }, // Bigger touch area
  activeTab: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  tabText: { fontWeight: '700', fontSize: 13 },
  activeTabText: { color: 'white' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  masteryCard: {
    width: colWidth,
    height: colWidth * 1.25, // Fixed aspect for lining up
    borderRadius: 12,
    padding: 8,
    borderWidth: 2,
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tierBadge: { width: 12, height: 12, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  symbol: { fontSize: 26, fontWeight: 'bold', marginTop: 4 },
  name: { fontSize: 11, textAlign: 'center', opacity: 0.9, lineHeight: 14, fontWeight: '600' },
  miniBarBg: { width: '100%', height: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden', marginTop: 6 },
  miniBarFill: { height: '100%' }
});