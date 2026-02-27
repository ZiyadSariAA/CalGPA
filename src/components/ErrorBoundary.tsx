import { Component, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Appearance } from 'react-native';
import { lightColors, darkColors, type ThemeColors } from '../theme/colors';
import { fonts } from '../theme/fonts';

type Props = { children: ReactNode };
type State = { hasError: boolean };

function getColors(): ThemeColors {
  return Appearance.getColorScheme() === 'dark' ? darkColors : lightColors;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) console.warn('[ErrorBoundary]', error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      const c = getColors();
      return (
        <View style={[styles.container, { backgroundColor: c.background }]}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={[styles.title, { color: c.text }]}>حدث خطأ غير متوقع</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>نعتذر عن هذا الخطأ، يرجى المحاولة مرة أخرى</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: c.primary }]} onPress={this.handleRetry} activeOpacity={0.8}>
            <Text style={styles.buttonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
