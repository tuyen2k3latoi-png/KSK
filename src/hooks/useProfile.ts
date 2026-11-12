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
import { initAuth } from '../services/firebaseService';

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

  const [fontSizeMode, setFontSizeMode] = useState<FontSizeMode>(() => {
    const saved = readStorageString(STORAGE_KEYS.FONT_SIZE_MODE, 'normal');
    return saved === 'large' || saved === 'xlarge' ? saved : 'normal';
  });

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

  return {
    isAuthenticated,
    setIsAuthenticated,
    nd13Consent,
    setNd13Consent,
    fontSizeMode,
    setFontSizeMode,
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
  };
}
