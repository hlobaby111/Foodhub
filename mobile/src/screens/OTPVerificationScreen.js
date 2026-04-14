import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../utils/theme';
import api from '../services/api';

export default function OTPVerificationScreen({ route, navigation }) {
  const { phone, otp: devOTP } = route.params;
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto-fill OTP in development
    if (devOTP && __DEV__) {
      const otpArray = devOTP.split('');
      setOTP(otpArray);
    }
  }, [devOTP]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOTPChange = (value, index) => {
    const newOTP = [...otp];
    newOTP[index] = value;
    setOTP(newOTP);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOTP.every((digit) => digit) && index === 5) {
      handleVerifyOTP(newOTP.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpString) => {
    const otpCode = otpString || otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/otp-auth/verify-otp', {
        phone,
        otp: otpCode,
      });

      if (response.data) {
        const { accessToken, refreshToken, user, isNewUser, needsProfile } = response.data;

        // Store tokens
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        // Navigate based on user status
        if (needsProfile) {
          navigation.replace('CompleteProfile');
        } else {
          navigation.replace('Main');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setOTP(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResending(true);
      setError('');
      const response = await api.post('/api/otp-auth/send-otp', { phone });

      if (response.data) {
        setTimer(60);
        setOTP(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        
        // Show success message
        alert('OTP sent successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.phone}>+91 {phone}</Text>
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.changeNumber}>Change number</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              value={digit}
              onChangeText={(value) => handleOTPChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              mode="outlined"
              keyboardType="number-pad"
              maxLength={1}
              style={styles.otpInput}
              outlineColor={theme.colors.border}
              activeOutlineColor={theme.colors.primary}
              textContentType="oneTimeCode"
              autoFocus={index === 0}
            />
          ))}
        </View>

        {error ? (
          <HelperText type="error" visible={!!error} style={styles.error}>
            {error}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          onPress={() => handleVerifyOTP()}
          loading={loading}
          disabled={loading || otp.some((d) => !d)}
          style={styles.button}
          buttonColor={theme.colors.primary}
          contentStyle={styles.buttonContent}
        >
          Verify OTP
        </Button>

        <View style={styles.resendContainer}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Resend OTP in {timer}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendOTP} disabled={resending}>
              <Text style={styles.resendText}>
                {resending ? 'Sending...' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {__DEV__ && devOTP && (
          <View style={styles.devInfo}>
            <Text style={styles.devText}>Dev Mode OTP: {devOTP}</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl * 2,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    lineHeight: 22,
  },
  phone: {
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  changeNumber: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  otpInput: {
    width: 50,
    height: 56,
    backgroundColor: theme.colors.surface,
    textAlign: 'center',
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
  },
  error: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  button: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  buttonContent: {
    height: 48,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  timerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  resendText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  devInfo: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.green[50],
    borderRadius: theme.borderRadius.md,
  },
  devText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.green[700],
    textAlign: 'center',
    fontWeight: theme.fontWeight.semibold,
  },
});
