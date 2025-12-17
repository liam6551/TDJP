import React, { useState, useRef, useMemo, useEffect } from 'react';
import { StyleSheet, View, Platform, Linking, LayoutChangeEvent, BackHandler, Pressable, Text, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import TopBar from '@/shared/ui/TopBar';
import { t } from '@/shared/i18n';
import AthleteDetailsSection, { AthleteDetails } from '@/features/tariff/components/AthleteDetailsSection';
import ActionsBar from '@/features/elementKeyboard/components/ActionsBar';
import SortingBar from '@/features/elementKeyboard/components/SortingBar';
import ElementsGrid, { ElementsGridHandle } from '@/features/elementKeyboard/components/ElementsGrid';
import useTariffPassKeyboard from '@/features/tariff/state/useTariffPassKeyboard';
import TariffPassRow from '@/features/tariff/components/TariffPassRow';
import PassWarningOverlay from '@/features/tariff/components/PassWarningOverlay';
import type { DisplayItem } from '@/features/calculator/types';
import TariffStickyActions from '@/features/tariff/components/TariffStickyActions';
import TariffExportSuccessModal from '@/features/tariff/components/TariffExportSuccessModal';
import { exportTariffPdf } from '@/features/tariff/export/exportTariffPdf';
import { TariffExportData, TariffPassRowData } from '@/features/tariff/export/tariffOverlay';
import { TariffLang } from '@/features/tariff/background/tariffBackground';
import { getElementById } from '@/shared/data/elements';
import TariffSlotRow from '@/features/tariff/components/TariffSlotRow';
import { computePassBonuses } from '@/features/tariff/logic/tariffBonus';
import { validatePasses } from '@/features/tariff/logic/tariffLegality';
import TariffIllegalToast from '@/features/tariff/components/TariffIllegalToast';
import TariffIllegalExportConfirm from '@/features/tariff/components/TariffIllegalExportConfirm';


import { TariffSaveDialog } from '@/features/tariff/components/TariffSaveDialog';
import { TariffSuccessDialog } from '@/features/tariff/components/TariffSuccessDialog';
import { TariffService } from '@/features/tariff/services/TariffService';

import { saveFileToAppFolder } from '@/shared/filesystem/storage';

const TARIFF_DIR_KEY = 'tariffExportDirUri'
const ALLOW_ILLEGAL_TARIFF_KEY = 'tariffAllowIllegalExport'

function mapPassDisplayToExport(
  items: DisplayItem[],
  bonuses: (number | null)[]
): TariffPassRowData {
  const symbols: (string | null)[] = []
  const values: (number | string | null)[] = []
  const bonusesOut: (number | string | null)[] = []

  for (let i = 0; i < 8; i++) {
    const item = items[i] as any
    if (!item) {
      symbols.push(null)
      values.push(null)
      bonusesOut.push(null)
      continue
    }

    let symbol: string | null = null
    if (item.id) {
      const el = getElementById(String(item.id))
      symbol = el?.symbol ?? null
    }
    if (!symbol && typeof item.symbol === 'string') {
      symbol = item.symbol
    }
    if (!symbol && typeof item.label === 'string') {
      symbol = item.label
    }

    let value: number | string | null = null
    if (typeof item.value === 'number' || typeof item.value === 'string') {
      value = item.value
    } else if (typeof item.dd === 'number' || typeof item.dd === 'string') {
      value = item.dd
    }

    const bonus = i < bonuses.length ? bonuses[i] : null

    symbols.push(symbol)
    values.push(value)
    bonusesOut.push(bonus)
  }

  return { symbols, values, bonuses: bonusesOut }
}

async function savePdfToDownloads(tempUri: string): Promise<string> {
  if (Platform.OS !== 'android') {
    return tempUri
  }

  const fsAny = FileSystemLegacy as any
  const saf = fsAny.StorageAccessFramework

  if (!saf) {
    return tempUri
  }

  try {
    let directoryUri: string | null = await AsyncStorage.getItem(TARIFF_DIR_KEY)

    if (!directoryUri) {
      const permissions = await saf.requestDirectoryPermissionsAsync()
      if (!permissions.granted || !permissions.directoryUri) {
        return tempUri
      }
      const pickedDir: string = permissions.directoryUri
      directoryUri = pickedDir
      await AsyncStorage.setItem(TARIFF_DIR_KEY, pickedDir)
    }

    const base64 = await fsAny.readAsStringAsync(tempUri, {
      encoding: 'base64',
    })

    const fileName = `TDJP TariffShits - ${Date.now()}.pdf`

    const newUri = await saf.createFileAsync(
      directoryUri,
      fileName,
      'application/pdf'
    )

    await fsAny.writeAsStringAsync(newUri, base64, {
      encoding: 'base64',
    })

    return newUri
  } catch (e) {
    return tempUri
  }
}

// Step Constants
const STEP_HOME = 0;
const STEP_DETAILS = 1;
const STEP_PASSES = 2;

export default function TariffScreen() {
  const { colors } = useAppTheme()
  const { lang } = useLang()
  const nav = useNavigation<any>()
  const route = useRoute<any>() // Add route parsing
  const isRTL = lang === 'he'

  // Steps State
  const [currentStep, setCurrentStep] = useState(STEP_HOME);

  const [elementMode, setElementMode] = useState<'text' | 'symbol'>('text')
  const [showPassWarning, setShowPassWarning] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportedUri, setExportedUri] = useState<string | null>(null)
  const [tempPdfUri, setTempPdfUri] = useState<string | null>(null) // For Sharing (more robust with file://)
  const [showExportModal, setShowExportModal] = useState(false)

  // Save Feature State
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tariffName, setTariffName] = useState(''); // Only used for pre-fill if editing
  const [existingTariffId, setExistingTariffId] = useState<string | null>(null); // If editing an existing one
  const [showIllegalToast, setShowIllegalToast] = useState(false)
  const [allowIllegalExport, setAllowIllegalExport] = useState(false)
  const [showIllegalExportConfirm, setShowIllegalExportConfirm] = useState(false)

  const [athlete, setAthlete] = useState<AthleteDetails>({
    country: 'ISR',
    autoBonus: true,
    name: '',
    club: '',
    athleteNumber: '',
    round: '',
    gender: null,
    track: null,
    level: null,
  })

  // Handle Hardware Back Button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (currentStep === STEP_PASSES) {
          setCurrentStep(STEP_DETAILS);
          return true;
        }
        if (currentStep === STEP_DETAILS) {
          setCurrentStep(STEP_HOME);
          return true;
        }
        // If at Home, let default behavior happen (exit/nav back)
        // Actually user wants "Back" button behavior. 
        // If at Home, maybe just go to previous tab screen? 
        // Returning false falls back to default.
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [currentStep])
  );

  const [topBarHeight, setTopBarHeight] = useState(0)
  const [gridOffsetY, setGridOffsetY] = useState(0)

  // Layout tracking for sticky behavior
  const [passLayouts, setPassLayouts] = useState<{ [key: number]: number }>({});
  const [passesSectionY, setPassesSectionY] = useState(0);

  const [pass1SlotWidths, setPass1SlotWidths] = useState<number[]>([])
  const [pass2SlotWidths, setPass2SlotWidths] = useState<number[]>([])

  const gridRef = useRef<ElementsGridHandle | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(ALLOW_ILLEGAL_TARIFF_KEY)
      .then(value => {
        setAllowIllegalExport(value === '1')
      })
      .catch(() => { })
  }, [])

  const {
    elements,
    sortKey,
    sortOrder,
    cycleSortKey,
    toggleOrder,
    addElement,
    deleteLast,
    clearAll,
    activePass,
    setActivePass,
    maxSlots,
    pass1Display,
    pass2Display,
    setPass1,
    setPass2,
  } = useTariffPassKeyboard(athlete.track ?? null, elementMode)

  const barDirection: 'ltr' | 'rtl' =
    elementMode === 'symbol' ? 'ltr' : isRTL ? 'rtl' : 'ltr'

  const slotSymbolFontSize = 10
  const keyboardSymbolFontSize = 25

  const handleSelectFromKeyboard = (item: DisplayItem) => {
    if (!activePass) {
      if (!showPassWarning) setShowPassWarning(true)
      return
    }
    addElement(item.id, item.value)
  }

  const handleResetPage = () => {
    setAthlete({
      country: 'ISR',
      autoBonus: true,
      name: '',
      club: '',
      athleteNumber: '',
      round: '',
      gender: null,
      track: null,
      level: null,
    })
    clearAll()
    setActivePass(null)
    setCurrentStep(STEP_HOME);
  }

  // Effect to load initial data when editing
  useEffect(() => {
    if (route.params?.editTariffId && route.params?.initialData) {
      const { editTariffId, initialData } = route.params;
      const internal = initialData.internalState;

      if (internal) {
        // Restore Athlete Form
        if (internal.athlete) {
          setAthlete(internal.athlete);
        }

        // Restore Passes
        if (internal.pass1Display) {
          const p1 = internal.pass1Display
            .filter((x: any) => x && x.id)
            .map((x: any) => ({
              id: String(x.id),
              value: Number(x.value || x.points || 0)
            }));
          setPass1(p1);
        }
        if (internal.pass2Display) {
          const p2 = internal.pass2Display
            .filter((x: any) => x && x.id)
            .map((x: any) => ({
              id: String(x.id),
              value: Number(x.value || x.points || 0)
            }));
          setPass2(p2);
        }

        // Set Step based on data presence? User requested "pop you to first and second page". 
        // STEP_DETAILS (1) is good start.
        setCurrentStep(STEP_DETAILS);
      }

      setExistingTariffId(editTariffId);
      setTariffName(initialData.form?.athleteName || ''); // Pre-fill name for save dialog

      // Clear params to avoid loop if we re-render
      nav.setParams({ editTariffId: undefined, initialData: undefined });
    }
  }, [route.params?.editTariffId]);

  useEffect(() => {
    if (route.params?.resetTs) {
      handleResetPage();
      nav.setParams({ resetTs: undefined });
    }
  }, [route.params?.resetTs]);

  // --- Logic & Memos ---
  const bonusMeta = useMemo(() => ({
    track: athlete.track ?? null,
    level: athlete.level ?? null,
    gender: athlete.gender ?? null,
  }), [athlete.track, athlete.level, athlete.gender])

  const pass1Bonuses = useMemo<(number | null)[]>(() => {
    if (!athlete.autoBonus) return Array(8).fill(null)
    const values = pass1Display.map(x => x.value)
    return computePassBonuses(values, bonusMeta).perElement
  }, [athlete.autoBonus, pass1Display, bonusMeta])

  const pass2Bonuses = useMemo<(number | null)[]>(() => {
    if (!athlete.autoBonus) return Array(8).fill(null)
    const values = pass2Display.map(x => x.value)
    return computePassBonuses(values, bonusMeta).perElement
  }, [athlete.autoBonus, pass2Display, bonusMeta])

  const pass1Ids = useMemo(() => pass1Display.map((x: any) => (x && x.id ? String(x.id) : null)), [pass1Display])
  const pass2Ids = useMemo(() => pass2Display.map((x: any) => (x && x.id ? String(x.id) : null)), [pass2Display])

  const legality = useMemo(() => validatePasses(pass1Ids, pass2Ids, lang === 'he' ? 'he' : 'en'), [pass1Ids, pass2Ids, lang])
  const pass1IllegalIndices = legality?.p1?.badIdx ?? []
  const pass2IllegalIndices = legality?.p2?.badIdx ?? []
  const pass1Warnings = useMemo(() => legality ? Array.from(new Set(legality.p1?.messages ?? [])) : [], [legality])
  const pass2Warnings = useMemo(() => {
    if (!legality) return []
    const msgs = [...(legality.p2?.messages ?? [])]
    if (legality.both) msgs.push(...legality.both)
    return Array.from(new Set(msgs))
  }, [legality])
  const isLegal = legality?.isLegal ?? true

  // --- Actions ---

  const handleExport = async () => {
    if (isExporting) return
    try {
      setIsExporting(true)
      const tariffLang: TariffLang = lang === 'he' ? 'he' : 'en'
      const data: TariffExportData = {
        lang: tariffLang,
        form: {
          athleteName: athlete.name,
          club: athlete.club,
          gender: athlete.gender ? String(athlete.gender) : '',
          track: athlete.track ? String(athlete.track) : '',
          level: athlete.level ? String(athlete.level) : '',
          athleteNo: athlete.athleteNumber,
          rotation: athlete.round,
        },
        pass1: mapPassDisplayToExport(pass1Display, pass1Bonuses),
        pass2: mapPassDisplayToExport(pass2Display, pass2Bonuses),
      }
      const result = await exportTariffPdf(data)
      setTempPdfUri(result.uri) // Keep the original temp URI for sharing
      let finalUri = result.uri
      try {
        const fileName = `TDJP Tariff - ${athlete.name || 'Athlete'} - ${Date.now()}.pdf`;
        const storedUri = await saveFileToAppFolder(result.uri, fileName);
        if (storedUri) {
          finalUri = storedUri;
        }
      } catch (e) { }
      setExportedUri(finalUri)
      setShowExportModal(true)
    } catch (e) {
    } finally {
      setIsExporting(false)
    }
  }

  // --- SAVE LOGIC ---
  const prepareExportData = (): TariffExportData => {
    // 1. Prepare Export Data (Shared for Save & Export)
    const pass1Data = mapPassDisplayToExport(pass1Display, pass1Bonuses);
    const pass2Data = mapPassDisplayToExport(pass2Display, pass2Bonuses);

    const exportData: any = {
      lang: lang === 'he' ? 'he' : 'en',
      form: {
        athleteName: athlete.name || '',
        club: athlete.club || '',
        gender: athlete.gender === 'M' ? (lang === 'he' ? 'M' : 'M') : (lang === 'he' ? 'F' : 'F'),
        track: (athlete.track || '') as any,
        level: (athlete.level || '') as any,
        athleteNo: athlete.athleteNumber || '',
        rotation: (athlete.round || '') as any,
      },
      pass1: pass1Data,
      pass2: pass2Data,
      internalState: {
        athlete,
        pass1Display,
        pass2Display
      }
    };
    return exportData as TariffExportData;
  };

  const handleSavePress = () => {
    // Open Dialog to ask for name (or auto-save if we implement auto-save edit)
    // User requested dialog every time or with pre-fill?
    // User said: "It will open dialog... default name is athlete name... if exists (1)..."
    // "Edit button... handles save on existing" -> implying direct save if editing?

    // Logic:
    // If existingTariffId implies we are editing. BUT user description for "Save Tariff" button specifically mentioned opening the dialog.
    // However, later: "Edit button... upon 'save tariff' it will just save on existing".
    // So:
    if (existingTariffId) {
      // Direct update? Or ask? User said "just save already".
      // Let's do direct save (maybe with quick indicator or just success dialog).
      handleDialogSave(tariffName || athlete.name || 'Untitled', true);
    } else {
      // New save -> Open Dialog
      setTariffName(athlete.name); // Default to athlete name
      setShowSaveDialog(true);
    }
  };

  const handleDialogSave = async (nameToSave: string, isUpdate: boolean = false) => {
    setIsSaving(true);
    try {
      const data = prepareExportData();

      if (isUpdate && existingTariffId) {
        await TariffService.updateTariff(existingTariffId, { name: nameToSave, data });
        // Keep ID
      } else {
        const newTariff = await TariffService.createTariff(nameToSave, data);
        setExistingTariffId(newTariff.id);
        setTariffName(newTariff.name); // Server might have renamed it
      }

      setShowSaveDialog(false);
      setShowSuccessDialog(true); // "Green V"
    } catch (e) {
      // alert('Failed to save'); // Simple fallback
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccessFinish = () => {
    setShowSuccessDialog(false);
    // User said: "After 2 seconds... automatically move to first page (Home)"
    setCurrentStep(STEP_HOME);
    setExistingTariffId(null); // Clear edit state? Yes, going home usually resets or we just go back.
    // If we want to reset form:
    clearAll();
    setAthlete({
      country: 'ISR',
      name: '',
      club: '',
      athleteNumber: '',
      round: '',
      gender: null,
      track: null,
      level: null,
      autoBonus: true,
    });
  };

  // --- EXPORT LOGIC ---
  const handleExportPress = async () => {
    let allow = allowIllegalExport
    try {
      const raw = await AsyncStorage.getItem(ALLOW_ILLEGAL_TARIFF_KEY)
      allow = raw === '1'
      setAllowIllegalExport(allow)
    } catch { }

    if (!isLegal && allow) {
      setShowIllegalExportConfirm(true)
      return
    }
    if (!isLegal && !allow) {
      setShowIllegalToast(true)
      return
    }
    handleExport()
  }

  const handleConfirmIllegalExport = () => {
    setShowIllegalExportConfirm(false)
    handleExport()
  }
  const handleCancelIllegalExport = () => {
    setShowIllegalExportConfirm(false)
  }

  const handleOpenPdf = async () => {
    if (!exportedUri) return
    try {
      if (Platform.OS === 'android') {
        const isContent = exportedUri.startsWith('content://');
        let contentUri = exportedUri;
        if (!isContent) {
          // Only convert if it's not already a content URI
          contentUri = await (FileSystemLegacy as any).getContentUriAsync(exportedUri);
        }
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,
          type: 'application/pdf'
        });
      } else {
        await Sharing.shareAsync(exportedUri)
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open PDF');
    }
  }
  const handleSharePdf = async () => {
    // Prefer tempPdfUri for sharing as it is a standard file:// URI which is easier to share reliably
    const uriToShare = tempPdfUri || exportedUri;
    if (!uriToShare) return
    await Sharing.shareAsync(uriToShare)
  }

  const handleExportSuccessClose = () => {
    setShowExportModal(false);
    // User requested to stay on the same page, NOT reset.
    // handleResetPage(); 
  }

  // --- Step Navigation ---

  const goCreateNew = () => {
    handleResetPage(); // Clear old data
    setCurrentStep(STEP_DETAILS);
  }

  const goSaved = () => {
    nav.navigate('SavedTariffs');
  }

  const goNextFromDetails = () => {
    if (athlete.country !== 'ISR') {
      // Ideally show a toast, but user said "Coming Soon" text will be shown on screen
      // and button disabled. But double check logic here.
      return;
    }
    setCurrentStep(STEP_PASSES);
  }

  // --- Layout Helpers ---
  const handleTopBarLayout = (e: LayoutChangeEvent) => setTopBarHeight(e.nativeEvent.layout.height)
  const handlePass1SlotWidthMeasured = (idx: number, width: number) => {
    setPass1SlotWidths(prev => { if (prev[idx] === width) return prev; const next = [...prev]; next[idx] = width; return next })
  }
  const handlePass2SlotWidthMeasured = (idx: number, width: number) => {
    setPass2SlotWidths(prev => { if (prev[idx] === width) return prev; const next = [...prev]; next[idx] = width; return next })
  }

  const activePassY = activePass && passLayouts[activePass] !== undefined ? passLayouts[activePass] + passesSectionY : 99999;
  const stickyTriggerY = activePassY + 20;
  const showStickyPassHeader = useMemo(() => {
    // Only show in Passes step
    if (currentStep !== STEP_PASSES) return false;
    if (!activePass) return false;
    return gridOffsetY >= activePassY;
  }, [activePass, activePassY, gridOffsetY, currentStep]);

  const stickySlotWidths = activePass === 1 ? pass1SlotWidths : activePass === 2 ? pass2SlotWidths : []
  const activePassLabel = activePass === 1 ? t(lang, 'tariff.passes.pass1') : activePass === 2 ? t(lang, 'tariff.passes.pass2') : ''
  const activePassItems = activePass === 1 ? (pass1Display as any) : activePass === 2 ? (pass2Display as any) : []
  const activePassBonuses = activePass === 1 ? pass1Bonuses : activePass === 2 ? pass2Bonuses : []
  const activePassIllegalIndices = activePass === 1 ? pass1IllegalIndices : activePass === 2 ? pass2IllegalIndices : []

  // --- Render Steps ---

  // STEP 0: HOME
  const renderHome = () => (
    <View style={styles.homeContainer}>
      <Text style={[styles.homeTitle, { color: colors.text }]}>{t(lang, 'tariff.home.title')}</Text>
      <Text style={[styles.homeDesc, { color: colors.text }]}>{t(lang, 'tariff.home.description')}</Text>

      <View style={{ gap: 20, marginTop: 40, width: '100%', alignItems: 'center' }}>
        <Pressable
          style={[styles.homeBtn, { backgroundColor: colors.tint }]}
          onPress={goCreateNew}
        >
          <Text style={styles.homeBtnText}>{t(lang, 'tariff.home.newBtn')}</Text>
        </Pressable>

        <Pressable
          style={[styles.homeBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
          onPress={goSaved}
        >
          <Text style={[styles.homeBtnText, { color: colors.text }]}>{t(lang, 'tariff.home.savedBtn')}</Text>
        </Pressable>
      </View>
    </View>
  );

  // STEP 1: DETAILS
  const renderDetails = () => (
    <View style={styles.detailsContainer}>
      {/* Sub-Header */}
      <View style={styles.subHeader}>
        <Text style={[styles.subHeaderText, { color: colors.text }]}>{t(lang, 'tariff.steps.details')}</Text>
      </View>

      <View style={styles.formContainer}>
        <AthleteDetailsSection value={athlete} onChange={setAthlete} />

        {/* Coming Soon Warning */}
        {athlete.country && athlete.country !== 'ISR' && (
          <Text style={{
            color: '#ff3b30',
            textAlign: 'center',
            marginTop: 20,
            fontWeight: 'bold',
            fontSize: 18
          }}>
            {t(lang, 'tariff.athlete.countryComingSoon')}
          </Text>
        )}
      </View>

      <View style={styles.footerActions}>
        {/* Back Button */}
        <Pressable
          style={[styles.footerBtn, { backgroundColor: '#9ca3af' }]}
          onPress={() => setCurrentStep(STEP_HOME)}
        >
          <Text style={[styles.footerBtnText, { color: '#ffffff' }]}>{t(lang, 'tariff.actions.back')}</Text>
        </Pressable>

        {/* Next Button */}
        <Pressable
          style={[
            styles.footerBtn,
            { backgroundColor: (athlete.country !== 'ISR') ? colors.border : colors.tint }
          ]}
          disabled={athlete.country !== 'ISR'}
          onPress={goNextFromDetails}
        >
          <Text style={styles.actionBtnText}>{t(lang, 'tariff.actions.next')}</Text>
        </Pressable>
      </View>
    </View>
  );

  // STEP 2: PASSES (Header for ElementsGrid)
  const renderPassesHeader = () => (
    <View style={styles.headerWrapper}>
      <View style={styles.subHeader}>
        <Text style={[styles.subHeaderText, { color: colors.text }]}>{t(lang, 'tariff.steps.passes')}</Text>
      </View>

      <View
        style={styles.passesSection}
        onLayout={(e) => {
          const y = e.nativeEvent.layout.y + 12; // Approximation padding
          setPassesSectionY(y);
        }}
      >
        {/* Pass 1 - Wrapped in View for onLayout */}
        <View onLayout={(e: LayoutChangeEvent) => {
          const y = e.nativeEvent.layout.y;
          setPassLayouts(prev => ({ ...prev, 1: y }));
        }}>
          <TariffPassRow
            label={t(lang, 'tariff.passes.pass1')}
            items={pass1Display}
            maxSlots={maxSlots}
            direction={barDirection}
            isActive={activePass === 1}
            onPress={() => setActivePass(activePass === 1 ? null : 1)}
            isSymbolMode={elementMode === 'symbol'}
            symbolFontSize={slotSymbolFontSize}
            showBonusRow={athlete.autoBonus}
            bonusValues={pass1Bonuses}
            illegalIndices={pass1IllegalIndices}
            warningMessages={pass1Warnings}
            onSlotWidthMeasured={handlePass1SlotWidthMeasured}
          />
        </View>

        {/* Pass 2 - Wrapped in View for onLayout */}
        <View onLayout={(e: LayoutChangeEvent) => {
          const y = e.nativeEvent.layout.y;
          setPassLayouts(prev => ({ ...prev, 2: y }));
        }}>
          {/* Only show pass 2 if relevant? No, keeping existing logic, always 2 passes shown */}
          <TariffPassRow
            label={t(lang, 'tariff.passes.pass2')}
            items={pass2Display}
            maxSlots={maxSlots}
            direction={barDirection}
            isActive={activePass === 2}
            onPress={() => setActivePass(activePass === 2 ? null : 2)}
            isSymbolMode={elementMode === 'symbol'}
            symbolFontSize={slotSymbolFontSize}
            showBonusRow={athlete.autoBonus}
            bonusValues={pass2Bonuses}
            illegalIndices={pass2IllegalIndices}
            warningMessages={pass2Warnings}
            onSlotWidthMeasured={handlePass2SlotWidthMeasured}
          />
        </View>

        {/* Checkbox for Auto Bonus */}
        <Pressable
          onPress={() => setAthlete(p => ({ ...p, autoBonus: !p.autoBonus }))}
          style={({ pressed }) => [
            styles.autoBonusContainer,
            {
              flexDirection: isRTL ? 'row-reverse' : 'row',
              opacity: pressed ? 0.7 : 1,
              alignSelf: 'stretch',
            },
          ]}
        >
          <View
            style={[
              styles.checkboxOuter,
              {
                borderColor: colors.border,
                backgroundColor: athlete.autoBonus ? colors.text + '33' : colors.card,
              },
            ]}
          >
            {athlete.autoBonus ? (
              <View
                style={[
                  styles.checkboxInner,
                  {
                    backgroundColor: colors.text,
                  },
                ]}
              />
            ) : null}
          </View>
          <View style={styles.autoBonusTextWrapper}>
            <Text
              style={[
                styles.autoBonusLabel,
                {
                  color: colors.text,
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            >
              {t(lang, 'tariff.athlete.autoBonus')}
            </Text>
          </View>
        </Pressable>

        {/* Delete / Clear Buttons */}
        <View style={styles.keyboardHeader}>
          <View style={{ paddingTop: 8, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <ActionsBar
              onDelete={deleteLast}
              onClear={clearAll}
              alignSide={isRTL ? 'end' : 'start'}
            />
            <SortingBar
              sortKey={sortKey}
              sortOrder={sortOrder}
              onChangeKey={cycleSortKey}
              onToggleOrder={toggleOrder}
              isRTL={isRTL}
            />
          </View>
        </View>

      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]} >
      <View
        style={[styles.topBarWrapper, { borderBottomColor: colors.border, zIndex: 10 }]}
        onLayout={handleTopBarLayout}
      >
        <TopBar
          titleKey="tabs.tariff"
          showBack={currentStep !== STEP_HOME && currentStep !== STEP_DETAILS && currentStep !== STEP_PASSES} // Hide back on Detail & Passes (User Request)
          onBack={() => {
            if (currentStep === STEP_DETAILS) setCurrentStep(STEP_HOME);
            else if (currentStep === STEP_PASSES) setCurrentStep(STEP_DETAILS);
          }}
          showElementToggle={currentStep === STEP_PASSES} // Only on Passes step
          elementMode={elementMode}
          onToggleElementMode={() => setElementMode(prev => (prev === 'text' ? 'symbol' : 'text'))}
        />
      </View>

      <View style={styles.body}>
        {/* Step 0: Home */}
        {currentStep === STEP_HOME && renderHome()}

        {/* Step 1: Details */}
        {currentStep === STEP_DETAILS && renderDetails()}

        {/* Step 2: Passes */}
        {currentStep === STEP_PASSES && (
          <ElementsGrid
            ref={gridRef as any}
            elements={elements}
            onSelect={handleSelectFromKeyboard}
            titleFontSize={14}
            header={renderPassesHeader()}
            forceLTR={false}
            isSymbolMode={elementMode === 'symbol'}
            symbolFontSize={keyboardSymbolFontSize}
            extraBottomPadding={140} // Space for the bottom footer
            onScroll={(y) => setGridOffsetY(y)}
          />
        )}
      </View>

      {/* Sticky Header for Active Pass (Only Step 2) */}
      {showStickyPassHeader && activePass && (
        <View
          style={[
            styles.stickyPassWrapper,
            {
              top: topBarHeight + 4,
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
          ]}
        >
          <View style={{ backgroundColor: colors.bg, borderRadius: 12, overflow: 'hidden' }}>
            <TariffPassRow
              label={activePassLabel}
              items={activePassItems}
              maxSlots={maxSlots}
              direction={barDirection}
              isActive={true}
              onPress={() => setActivePass(null)}
              isSymbolMode={elementMode === 'symbol'}
              symbolFontSize={slotSymbolFontSize}
              showBonusRow={false}
              showValueRow={false}
              bonusValues={activePassBonuses}
              illegalIndices={activePassIllegalIndices}
              slotWidthOverrides={stickySlotWidths}
              isSticky={true}
            />
          </View>
        </View>
      )
      }

      {/* Footer Buttons for Step 2 */}
      {
        currentStep === STEP_PASSES && (
          <View style={styles.footerActions}>
            {/* Back - Swapped order */}
            <Pressable style={[styles.footerBtn, { backgroundColor: '#9ca3af' }]} onPress={() => setCurrentStep(STEP_DETAILS)}>
              <Text style={[styles.footerBtnText, { color: '#ffffff' }]}>{t(lang, 'tariff.actions.back')}</Text>
            </Pressable>
            {/* Export - Swapped order */}
            <Pressable style={[styles.footerBtn, { backgroundColor: colors.tint }]} onPress={handleExportPress}>
              <Text style={styles.footerBtnText}>{t(lang, 'tariff.actions.exportPdf')}</Text>
            </Pressable>
            {/* Save */}
            <Pressable style={[styles.footerBtn, { backgroundColor: colors.tint, borderWidth: 0 }]} onPress={handleSavePress}>
              <Text style={[styles.footerBtnText, { color: '#ffffff' }]}>{t(lang, 'tariff.actions.save')}</Text>
            </Pressable>
          </View>
        )
      }


      <PassWarningOverlay
        visible={showPassWarning}
        onHide={() => setShowPassWarning(false)}
      />

      <TariffExportSuccessModal
        visible={showExportModal}
        onClose={handleExportSuccessClose}
        onOpen={handleOpenPdf}
        onShare={handleSharePdf}
      />

      <TariffIllegalToast
        visible={showIllegalToast}
        onHide={() => setShowIllegalToast(false)}
      />

      <TariffIllegalExportConfirm
        visible={showIllegalExportConfirm}
        onConfirm={handleConfirmIllegalExport}
        onCancel={handleCancelIllegalExport}
      />

      <TariffSaveDialog
        visible={showSaveDialog}
        initialName={tariffName}
        loading={isSaving}
        onSave={(name) => handleDialogSave(name, false)}
        onCancel={() => setShowSaveDialog(false)}
      />

      <TariffSuccessDialog
        visible={showSuccessDialog}
        onFinish={handleSuccessFinish}
      />
    </View >
  )
}




const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBarWrapper: {
    borderBottomWidth: 1,
  },
  body: {
    flex: 1,
    position: 'relative',
  },
  headerWrapper: {
    paddingBottom: 4,
  },
  formWrapper: {
    paddingHorizontal: 8,
    marginTop: 8,
  },
  passesSection: {
    marginTop: 8,
    paddingHorizontal: 8,
  },
  keyboardHeader: {
    paddingHorizontal: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  stickyHeaderContainer: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  stickyBubble: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  stickyPassWrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 90,
  },
  homeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  homeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  homeDesc: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  homeBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 220,
    alignItems: 'center',
  },
  homeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  subHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  subHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    opacity: 0.7,
  },
  formContainer: {
    flex: 1,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    // Floating Container placement
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    // No background/shadow for container, purely layout
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 12, // Reduced slightly from 14
    borderRadius: 8,
    alignItems: 'center',
    // Individual Button Shadow/Elevation
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  footerBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16, // Reduced from 18 to fit text
  },
  // Auto Bonus Styles
  autoBonusContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  autoBonusTextWrapper: {
    flexShrink: 1,
    flexGrow: 1,
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  autoBonusLabel: {
    fontSize: 13,
  },
});
