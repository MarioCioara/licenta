import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'leaguehub-region';

export const REGIONS = [
  { id: 'all', name: 'All Regions', code: null },
  { id: 'europe', name: 'Europe', code: 'europe' },
  { id: 'north_america', name: 'North America', code: 'north_america' },
  { id: 'china', name: 'China', code: 'china' },
  { id: 'south_korea', name: 'South Korea', code: 'south_korea' },
  { id: 'apac', name: 'APAC', code: 'apac' },
];

const RegionContext = createContext();

export function RegionProvider({ children }) {
  const [selectedRegion, setSelectedRegionState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'all';
    } catch {
      return 'all';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, selectedRegion);
    } catch {}
  }, [selectedRegion]);

  const setSelectedRegion = (regionId) => {
    setSelectedRegionState(regionId);
  };

  const getSelectedRegionData = () => {
    return REGIONS.find(r => r.id === selectedRegion) || REGIONS[0];
  };

  const clearRegion = () => {
    setSelectedRegionState('all');
  };

  return (
    <RegionContext.Provider
      value={{
        selectedRegion,
        setSelectedRegion,
        getSelectedRegionData,
        clearRegion,
        regions: REGIONS
      }}
    >
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error('useRegion must be used within RegionProvider');
  return ctx;
}
