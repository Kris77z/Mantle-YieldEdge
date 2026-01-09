'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CONTRACTS } from '@/config/contracts';

export type AssetType = 'usdy' | 'meth';

interface AssetConfig {
    symbol: string;
    name: string;
    address: string;
    vault: string;
    factory: string;
    decimals: number;
    apy: string;
    icon?: string;
}

interface AssetContextType {
    currentAsset: AssetType;
    assetConfig: AssetConfig;
    setAsset: (asset: AssetType) => void;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export function AssetProvider({ children }: { children: React.ReactNode }) {
    const [currentAsset, setCurrentAsset] = useState<AssetType>('usdy');

    const assetConfig = CONTRACTS.mantleSepolia.tokens[currentAsset];

    return (
        <AssetContext.Provider value={{ currentAsset, assetConfig, setAsset: setCurrentAsset }}>
            {children}
        </AssetContext.Provider>
    );
}

export function useAsset() {
    const context = useContext(AssetContext);
    if (context === undefined) {
        throw new Error('useAsset must be used within an AssetProvider');
    }
    return context;
}
