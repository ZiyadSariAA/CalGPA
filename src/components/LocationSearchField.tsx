import { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text as RNText,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../utils/haptics';
import { Pressable } from './ui/pressable';
import { type ThemeColors } from '../theme';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/fonts';

type Props = {
  label: string;
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  colors: ThemeColors;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
};

export default function LocationSearchField({
  label,
  value,
  onSelect,
  placeholder,
  colors,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState(value);
  const [modalQuery, setModalQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { height: screenHeight } = useWindowDimensions();
  const s = createStyles(colors, screenHeight);

  const search = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setResults([]);
      setNoResults(false);
      return;
    }

    setLoading(true);
    setNoResults(false);

    try {
      const encoded = encodeURIComponent(text.trim());
      const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=6&featuretype=city&accept-language=en`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'CalGPA-App/1.0' },
      });
      const data: NominatimResult[] = await res.json();

      setResults(data);
      setNoResults(data.length === 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleModalQueryChange = useCallback((text: string) => {
    setModalQuery(text);

    if (text.trim() === '') {
      setResults([]);
      setNoResults(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(text), 400);
  }, [search]);

  const handleSelect = useCallback((item: NominatimResult) => {
    const city = item.address.city || item.address.town || item.address.village || item.address.state || '';
    const country = item.address.country || '';
    const formatted = city && country ? `${city}, ${country}` : item.display_name.split(',').slice(0, 2).join(',').trim();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuery(formatted);
    onSelect(formatted);
    setVisible(false);
    setResults([]);
    setModalQuery('');
  }, [onSelect]);

  const open = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalQuery('');
    setResults([]);
    setNoResults(false);
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
    setResults([]);
    setModalQuery('');
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const clear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuery('');
    onSelect('');
  };

  const hasValue = value !== '';
  const displayValue = value || placeholder || label;

  return (
    <>
      {/* Trigger */}
      <View style={s.fieldWrap}>
        <RNText style={s.fieldLabel}>{label}</RNText>
        <Pressable onPress={open}>
          <View style={s.triggerRow}>
            <Ionicons name="search" size={18} color={colors.primary} />
            <RNText
              style={[s.triggerText, !hasValue && s.triggerPlaceholder]}
              numberOfLines={1}
            >
              {displayValue}
            </RNText>
            {hasValue ? (
              <Pressable onPress={clear}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </Pressable>
            ) : (
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            )}
          </View>
        </Pressable>
      </View>

      {/* Search Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <Pressable onPress={close} style={{ flex: 1 }}>
          <View style={s.overlay} />
        </Pressable>

        <View style={s.sheet}>
          {/* Header */}
          <View style={s.sheetHeader}>
            <RNText style={s.sheetTitle}>{label}</RNText>
            <Pressable onPress={close}>
              <View style={s.closeBtn}>
                <Ionicons name="close" size={20} color={colors.text} />
              </View>
            </Pressable>
          </View>

          {/* Search input */}
          <View style={s.searchWrap}>
            <View style={s.searchInputRow}>
              <Ionicons name="search" size={18} color={colors.textSecondary} />
              <TextInput
                style={s.searchInput}
                value={modalQuery}
                onChangeText={handleModalQueryChange}
                placeholder="Search city..."
                placeholderTextColor={colors.textSecondary}
                textAlign="left"
                autoCorrect={false}
                autoFocus
              />
              {loading && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
            </View>
          </View>

          {/* Results */}
          {noResults ? (
            <View style={s.noResultsRow}>
              <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
              <RNText style={s.noResultsText}>No results found</RNText>
            </View>
          ) : results.length === 0 && !loading ? (
            <View style={s.hintRow}>
              <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
              <RNText style={s.hintText}>ابدأ بالكتابة للبحث عن مدينة</RNText>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => String(item.place_id)}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              style={s.list}
              renderItem={({ item }) => {
                const city = item.address.city || item.address.town || item.address.village || item.address.state || '';
                const country = item.address.country || '';
                const displayCity = city || item.display_name.split(',')[0].trim();

                return (
                  <Pressable onPress={() => handleSelect(item)}>
                    <View style={s.resultRow}>
                      <View style={s.locationIcon}>
                        <Ionicons name="location" size={18} color={colors.primary} />
                      </View>
                      <View style={s.resultTextWrap}>
                        <RNText style={s.resultCity} numberOfLines={1}>{displayCity}</RNText>
                        {country ? <RNText style={s.resultCountry} numberOfLines={1}>{country}</RNText> : null}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors, screenHeight: number) =>
  StyleSheet.create({
    fieldWrap: {
      marginBottom: spacing.sm,
    },
    fieldLabel: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: colors.text,
      marginBottom: 6,
      textAlign: 'center',
      writingDirection: 'rtl',
    },

    /* Trigger */
    triggerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    triggerText: {
      flex: 1,
      fontSize: 15,
      fontFamily: fonts.regular,
      color: colors.text,
    },
    triggerPlaceholder: {
      color: colors.textSecondary,
    },

    /* Modal */
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
    },
    sheet: {
      maxHeight: screenHeight * 0.7,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: spacing['3xl'],
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    sheetTitle: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.text,
      writingDirection: 'rtl',
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },

    /* Search input */
    searchWrap: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
    searchInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: fonts.regular,
      color: colors.text,
    },

    /* Results list */
    list: {
      paddingHorizontal: spacing.xl,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: 10,
    },
    locationIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    resultTextWrap: {
      flex: 1,
    },
    resultCity: {
      fontSize: 15,
      fontFamily: fonts.medium,
      color: colors.text,
    },
    resultCountry: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 2,
    },

    /* Empty states */
    noResultsRow: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing['3xl'],
      gap: 8,
    },
    noResultsText: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    hintRow: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing['3xl'],
      gap: 8,
    },
    hintText: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      writingDirection: 'rtl',
    },
  });
