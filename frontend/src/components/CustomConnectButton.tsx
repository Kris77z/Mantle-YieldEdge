
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CustomConnectButton = () => {
    return (
        <ConnectButton.Custom>
            {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
            }) => {
                // Note: If your app doesn't use authentication, you
                // can remove all 'authenticationStatus' checks
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                        authenticationStatus === 'authenticated');

                return (
                    <div
                        {...(!ready && {
                            'aria-hidden': true,
                            'style': {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                            },
                        })}
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <button
                                        onClick={openConnectModal}
                                        type="button"
                                        className="flex items-center gap-2 bg-[var(--primary)] text-white px-6 py-2.5 rounded-full font-bold uppercase tracking-wider text-xs hover:opacity-90 shadow-lg shadow-[rgba(148,116,147,0.3)] transition-all transform hover:scale-105"
                                    >
                                        <Wallet className="w-4 h-4" />
                                        Connect Wallet
                                    </button>
                                );
                            }

                            if (chain.unsupported) {
                                return (
                                    <button
                                        onClick={openChainModal}
                                        type="button"
                                        className="flex items-center gap-2 bg-red-500 text-white px-6 py-2.5 rounded-full font-bold uppercase tracking-wider text-xs hover:bg-red-600 shadow-md transition-all"
                                    >
                                        Wrong network
                                    </button>
                                );
                            }

                            return (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={openChainModal}
                                        type="button"
                                        className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(255,255,255,0.4)] border border-[var(--border)] hover:bg-[rgba(255,255,255,0.6)] transition-all overflow-hidden p-1.5"
                                    >
                                        {chain.hasIcon && (
                                            <div className="w-full h-full relative">
                                                {chain.iconUrl && (
                                                    <img
                                                        alt={chain.name ?? 'Chain icon'}
                                                        src={chain.iconUrl}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </button>

                                    <button
                                        onClick={openAccountModal}
                                        type="button"
                                        className="flex items-center gap-2 bg-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.6)] border border-[var(--border)] px-5 py-2 rounded-full transition-all group"
                                    >
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-serif font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                                                {account.displayName}
                                            </span>
                                            <span className="text-[10px] text-[var(--secondary)] font-mono">
                                                {account.displayBalance
                                                    ? ` (${account.displayBalance})`
                                                    : ''}
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
};
