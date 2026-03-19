// filepath: src/components/ui/ErrorBoundary.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  resetError = () => {
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>{this.state.error.message}</Text>
            {__DEV__ && this.state.errorInfo && (
              <View style={styles.stackContainer}>
                <Text style={styles.stackTitle}>Stack Trace:</Text>
                <Text style={styles.stackTrace}>{this.state.errorInfo.componentStack}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.button} onPress={this.resetError}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  message: {
    color: Colors.dark.muted,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  stackContainer: {
    width: '100%',
    backgroundColor: Colors.dark.bg2,
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  stackTitle: {
    color: Colors.dark.amber,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stackTrace: {
    color: Colors.dark.muted,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: Colors.dark.lime,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 20,
  },
  buttonText: {
    color: Colors.dark.bg,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
