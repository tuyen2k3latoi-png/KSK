import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  INITIAL_BHYT_VISITS,
  INITIAL_MEDICAL_PROFILE,
} from '../data/seedHealthData';
import {
  BhytVisitRecord,
  UserMedicalProfile,
} from '../types/health';
import { maskSensitiveIdentifier } from '../utils/healthCalculations';
import {
  FontSizeMode,
  PrivacyConsentRecord,
  readStorageJson,
  readStorageString,
  setStorageItemDebounced,
  STORAGE_KEYS,
  writeStorageIfChanged,
} from '../utils/storage';
import { initAuth, syncUserProfileToFirestore } from '../services/firebaseService';
import { EmergencyContactInput } from '../services/emergencyService';
import { parseMinimalModeFlag } from '../services/minimalModeService';
import { parseVoiceFeedbackFlag } from '../services/speechFeedbackService';

export function useProfile() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search.includes('autostart=1')) {
        return true;
      }
      return sessionStorage.getItem(STORAGE_KEYS.AUTH_STATE) === 'true';
    } catch {
      return false;
    }
  });

  const [nd13Consent, setNd13Consent] = useState<PrivacyConsentRecord | null>(() =>
    readStorageJson<PrivacyConsentRecord | null>(STORAGE_KEYS.PRIVACY_CONSENT, null)
  );

  const [fontSizeMode, setFontSizeModeState] = useState<FontSizeMode>(() => {
    const saved = readStorageString(STORAGE_KEYS.FONT_SIZE_MODE, 'normal');
    const resolved: FontSizeMode = saved === 'large' || saved === 'xlarge' ? saved : 'normal';
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-font-scale', resolved);
    }
    return resolved;
  });

  const setFontSizeMode = (mode: FontSizeMode) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-font-scale', mode);
    }
    setFontSizeModeState(mode);
  };

  const [isMinimalMode, setIsMinimalModeState] = useState<boolean>(() =>
    parseMinimalModeFlag(readStorageString(STORAGE_KEYS.MINIMAL_MODE, 'false'))
  );

  const setMinimalMode = (enabled: boolean) => {
    setIsMinimalModeState(enabled);
    writeStorageIfChanged(STORAGE_KEYS.MINIMAL_MODE, enabled ? 'true' : 'false');
  };

  const toggleMinimalMode = () => setMinimalMode(!isMinimalMode);

  const [isVoiceFeedbackEnabled, setIsVoiceFeedbackState] = useState<boolean>(() =>
    parseVoiceFeedbackFlag(readStorageString(STORAGE_KEYS.VOICE_FEEDBACK, 'true'))
  );

  const setVoiceFeedbackEnabled = (enabled: boolean) => {
    setIsVoiceFeedbackState(enabled);
    writeStorageIfChanged(STORAGE_KEYS.VOICE_FEEDBACK, enabled ? 'true' : 'false');
  };

  const toggleVoiceFeedback = () => setVoiceFeedbackEnabled(!isVoiceFeedbackEnabled);

  const [currentAccountId, setCurrentAccountId] = useState<string>(() =>
    readStorageString(STORAGE_KEYS.ACCOUNT_ID, 'citizen-nguyen-minh-quan')
  );

  const [profile, setProfile] = useState<UserMedicalProfile>(() =>
    readStorageJson<UserMedicalProfile>(STORAGE_KEYS.PROFILE, INITIAL_MEDICAL_PROFILE)
  );

  const [bhytVisits, setBhytVisits] = useState<BhytVisitRecord[]>(() =>
    readStorageJson<BhytVisitRecord[]>(STORAGE_KEYS.BHYT_VISITS, INITIAL_BHYT_VISITS)
  );

  const [cloudUser, setCloudUser] = useState<User | null>(null);
  const [hasCalendarToken, setHasCalendarToken] = useState<boolean>(false);
  const [showHeaderBhytFull, setShowHeaderBhytFull] = useState<boolean>(false);

  useEffect(() => {
    setStorageItemDebounced(STORAGE_KEYS.ACCOUNT_ID, currentAccountId);
  }, [currentAccountId]);

  useEffect(() => {
    setStorageItemDebounced(STORAGE_KEYS.PROFILE, profile);
  }, [profile]);

  useEffect(() => {
    setStorageItemDebounced(STORAGE_KEYS.BHYT_VISITS, bhytVisits);
  }, [bhytVisits]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-font-scale', fontSizeMode);
    }
    setStorageItemDebounced(STORAGE_KEYS.FONT_SIZE_MODE, fontSizeMode);
  }, [fontSizeMode]);

  useEffect(() => {
    const unsubAuth = initAuth((user, hasToken) => {
      setCloudUser(user);
      setHasCalendarToken(hasToken);
    });
    return () => unsubAuth();
  }, []);

  const handleLogoutToWelcomeScreen = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    } catch {
      // Ignore storage error
    }
  };

  const handleAcceptNd13Consent = () => {
    const record: PrivacyConsentRecord = {
      accepted: true,
      acceptedAt: new Date().toISOString(),
      version: 'nd13-2023-v1',
    };
    setNd13Consent(record);
    writeStorageIfChanged(STORAGE_KEYS.PRIVACY_CONSENT, record);
  };

  const handleWithdrawNd13Consent = () => {
    setNd13Consent(null);
    writeStorageIfChanged(STORAGE_KEYS.PRIVACY_CONSENT, {
      accepted: false,
      acceptedAt: '',
      version: 'nd13-2023-v1',
    });
  };

  const handleAddBhytVisit = (visitData: Omit<BhytVisitRecord, 'id'>) => {
    const newVisit: BhytVisitRecord = {
      ...visitData,
      id: `bhyt_visit_${Date.now()}`,
    };
    setBhytVisits((prev) => [newVisit, ...prev]);
    const condLabel = `${visitData.diagnosisSummary} (Mã ${visitData.icdCode})`;
    if (!profile.chronicConditions.some((c) => c.includes(visitData.icdCode))) {
      setProfile((prev) => ({
        ...prev,
        chronicConditions: [condLabel, ...prev.chronicConditions],
      }));
    }
  };

  const isDemoMode = Boolean(profile.isDemo ?? profile.bhytCard?.isDemo);
  const rawBhytCode = profile.bhytCard?.bhytCode || 'DN4700000000201';
  const displayedHeaderBhyt = showHeaderBhytFull
    ? rawBhytCode
    : maskSensitiveIdentifier(rawBhytCode, 'bhyt');

  const handleSaveEmergencyContacts = (
    contacts: EmergencyContactInput,
    waterIntakeMl: number
  ) => {
    const updated: UserMedicalProfile = {
      ...profile,
      emergencyContactName: contacts.emergencyContactName,
      emergencyContactPhone: contacts.emergencyContactPhone,
      primaryDoctor: contacts.primaryDoctor,
      primaryDoctorPhone: contacts.primaryDoctorPhone,
    };
    setProfile(updated);
    writeStorageIfChanged(STORAGE_KEYS.PROFILE, updated);
    if (cloudUser) {
      void syncUserProfileToFirestore(cloudUser.uid, updated, waterIntakeMl);
    }
  };

  return {
    isAuthenticated,
    setIsAuthenticated,
    nd13Consent,
    setNd13Consent,
    fontSizeMode,
    setFontSizeMode,
    isMinimalMode,
    setMinimalMode,
    toggleMinimalMode,
    isVoiceFeedbackEnabled,
    setVoiceFeedbackEnabled,
    toggleVoiceFeedback,
    currentAccountId,
    setCurrentAccountId,
    profile,
    setProfile,
    bhytVisits,
    setBhytVisits,
    cloudUser,
    setCloudUser,
    hasCalendarToken,
    setHasCalendarToken,
    showHeaderBhytFull,
    setShowHeaderBhytFull,
    isDemoMode,
    displayedHeaderBhyt,
    handleLogoutToWelcomeScreen,
    handleAcceptNd13Consent,
    handleWithdrawNd13Consent,
    handleAddBhytVisit,
    handleSaveEmergencyContacts,
  };
}
