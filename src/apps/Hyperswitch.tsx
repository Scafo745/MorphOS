import React, { useState, useEffect } from 'react';
import { useOSStore } from '../core/store';
import { executeShell } from '../kernel/shell';
import {
  Activity,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  ArrowRightLeft,
  Server,
  Zap,
  TrendingUp,
  RefreshCw,
  Lock,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Transaction {
  id: string;
  time: string;
  merchant: string;
  amount: number;
  method: string;
  gateway: 'HDFC' | 'ICICI' | 'SBI' | 'AXIS';
  status: 'SUCCESS' | 'ROUTED' | 'FAILED';
  latencyMs: number;
  maskedCard?: string;
  vpa?: string;
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'TXN_98421', time: '13:14:02', merchant: 'Swiggy Bangalore', amount: 840, method: 'UPI Intent (GPay)', gateway: 'HDFC', status: 'SUCCESS', latencyMs: 14, vpa: 'rahul***@okhdfcbank' },
  { id: 'TXN_98420', time: '13:13:58', merchant: 'Flipkart Big Billion', amount: 14999, method: 'Visa Credit', gateway: 'ICICI', status: 'SUCCESS', latencyMs: 22, maskedCard: '4111-XXXX-XXXX-8921' },
  { id: 'TXN_98419', time: '13:13:51', merchant: 'Zepto 10-Min Delivery', amount: 320, method: 'UPI Collect', gateway: 'AXIS', status: 'SUCCESS', latencyMs: 9, vpa: 'priya***@axisbank' },
  { id: 'TXN_98418', time: '13:13:45', merchant: 'Cred UPI Pay', amount: 5200, method: 'UPI P2M', gateway: 'HDFC', status: 'SUCCESS', latencyMs: 12, vpa: 'arjun***@cred' },
  { id: 'TXN_98417', time: '13:13:38', merchant: 'Uber India Bangalore', amount: 249, method: 'UPI AutoPay', gateway: 'AXIS', status: 'SUCCESS', latencyMs: 8, vpa: 'uber***@axis' },
];

export const Hyperswitch: React.FC = () => {
  const { profile, addAuditLog, triggerSudoChallenge } = useOSStore();
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [tps, setTps] = useState(1842);
  const [sbiDegraded, setSbiDegraded] = useState(false);
  const [smartRouted, setSmartRouted] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  // Live TPS jitter and new transaction generator
  useEffect(() => {
    const interval = setInterval(() => {
      // Jitter TPS
      setTps(prev => Math.floor(prev + (Math.random() * 40 - 20)));

      // Generate random transaction
      const merchants = ['Swiggy India', 'Zomato Gold', 'Flipkart Super', 'Cred Pay', 'Zepto Quick', 'Amazon Pay India', 'BookMyShow Bangalore'];
      const methods: Array<{ method: string; vpa?: string; card?: string; gw: 'HDFC' | 'ICICI' | 'SBI' | 'AXIS' }> = [
        { method: 'UPI Intent', vpa: 'user***@okaxis', gw: 'AXIS' },
        { method: 'Visa Debit', card: '4532-XXXX-XXXX-9012', gw: 'HDFC' },
        { method: 'Mastercard Platinum', card: '5412-XXXX-XXXX-4311', gw: 'ICICI' },
        { method: 'UPI Scan & Pay', vpa: 'pay***@okhdfc', gw: 'HDFC' },
        { method: 'SBI UPI Direct', vpa: 'user***@sbi', gw: 'SBI' },
      ];
      const pickM = methods[Math.floor(Math.random() * methods.length)];
      const gw = smartRouted && pickM.gw === 'SBI' ? 'HDFC' : pickM.gw;

      const newTxn: Transaction = {
        id: `TXN_${Math.floor(10000 + Math.random() * 90000)}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        merchant: merchants[Math.floor(Math.random() * merchants.length)],
        amount: Math.floor(Math.random() * 4500) + 99,
        method: pickM.method,
        gateway: gw,
        status: sbiDegraded && gw === 'SBI' ? 'FAILED' : smartRouted && gw === 'HDFC' ? 'ROUTED' : 'SUCCESS',
        latencyMs: Math.floor(Math.random() * 14) + 8,
        maskedCard: pickM.card,
        vpa: pickM.vpa,
      };

      setTransactions(prev => [newTxn, ...prev.slice(0, 19)]);
    }, 2200);

    return () => clearInterval(interval);
  }, [sbiDegraded, smartRouted]);

  // Handle Bank Degradation simulation
  const handleSimulateOutage = () => {
    setSbiDegraded(true);
    setSmartRouted(false);
    addAuditLog('hyperswitch.simulate_outage(SBI_UPI)', 'CHALLENGE_REQUIRED', 'SBI UPI gateway response latency spiked to 450ms (504 Timeouts detected)', 'WARNING');
  };

  // Handle Smart Reroute
  const handleSmartFailover = () => {
    setSmartRouted(true);
    setSbiDegraded(false);
    addAuditLog('hyperswitch.smart_reroute(source: SBI, target: [HDFC, ICICI])', 'ALLOWED', 'Dynamic ML route switch: 100% of SBI traffic rerouted. Success rate restored to 99.98%', 'INFO');
  };

  // Handle Catastrophic test inside payment switch
  const handleDropTableTest = () => {
    triggerSudoChallenge('DROP TABLE transactions_v2 (PCI-DSS Audit Interception)', () => {
      const res = executeShell('DROP TABLE transactions');
      addAuditLog('DROP TABLE transactions', 'BLOCKED', res.output, 'CRITICAL');
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#030d1a] text-slate-200 text-xs font-sans overflow-hidden select-none">
      {/* ── TOP HEADER: Juspay Hyperswitch Branding ────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#05162a] border-b border-sky-900/40">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.4)]">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white tracking-wide">Juspay Hyperswitch™</h2>
              <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-[10px] text-sky-300 font-mono font-semibold border border-sky-500/30">
                PROD-BLR-01
              </span>
            </div>
            <p className="text-[10px] text-sky-300/70">High-Throughput Financial Switch & Payment Orchestrator</p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{tps.toLocaleString()} TPS</span>
          </div>

          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>PCI-DSS 4.0 L1</span>
          </div>
        </div>
      </div>

      {/* ── METRICS OVERVIEW CARDS ───────────────────────────── */}
      <div className="grid grid-cols-4 gap-2.5 p-3 bg-[#041122] border-b border-sky-950">
        <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-800/30">
          <div className="text-[10px] text-sky-400/80 font-medium uppercase tracking-wider">Volume Today</div>
          <div className="text-base font-bold text-white mt-0.5">₹142.89 Cr</div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="w-3 h-3" /> +14.2% vs yesterday
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-800/30">
          <div className="text-[10px] text-sky-400/80 font-medium uppercase tracking-wider">Success Rate (SR)</div>
          <div className={`text-base font-bold mt-0.5 ${sbiDegraded ? 'text-amber-400' : 'text-emerald-400'}`}>
            {sbiDegraded ? '94.12%' : '99.98%'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Target SLA: &gt; 99.50%</div>
        </div>

        <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-800/30">
          <div className="text-[10px] text-sky-400/80 font-medium uppercase tracking-wider">P99 Gateway Latency</div>
          <div className={`text-base font-bold mt-0.5 ${sbiDegraded ? 'text-amber-400' : 'text-sky-300'}`}>
            {sbiDegraded ? '184ms' : '16ms'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Hyperswitch Native Engine</div>
        </div>

        <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-800/30">
          <div className="text-[10px] text-sky-400/80 font-medium uppercase tracking-wider">Routing Topology</div>
          <div className="text-xs font-bold text-purple-300 mt-1 truncate">
            {smartRouted ? 'Adaptive ML (HDFC+ICICI)' : 'Direct Multi-Bank Weighted'}
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Active Auto-Failover</div>
        </div>
      </div>

      {/* ── GATEWAY STATUS & INTERACTIVE ACTIONS ────────────── */}
      <div className="p-3 bg-[#030d1a] border-b border-sky-900/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-sky-400" />
            <span>Bank Payment Gateway Rails & Health</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateOutage}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all hover:scale-105"
            >
              Simulate SBI Degradation
            </button>
            <button
              onClick={handleSmartFailover}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all hover:scale-105 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Hyperswitch Smart Failover</span>
            </button>
            <button
              onClick={handleDropTableTest}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all hover:scale-105"
              title="Test Accidental Data Loss Guard on Payments DB"
            >
              Test Accidental DB Wipe
            </button>
          </div>
        </div>

        {/* 4 Gateway Cards */}
        <div className="grid grid-cols-4 gap-2">
          {/* HDFC */}
          <div className="p-2 rounded-lg bg-[#07192f] border border-sky-800/40">
            <div className="flex items-center justify-between text-[11px] font-bold text-white">
              <span>HDFC UPI</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">99.6%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">P95: 12ms · Load: 42%</div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-emerald-400 h-full w-[99%]" />
            </div>
          </div>

          {/* ICICI */}
          <div className="p-2 rounded-lg bg-[#07192f] border border-sky-800/40">
            <div className="flex items-center justify-between text-[11px] font-bold text-white">
              <span>ICICI Direct</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">99.2%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">P95: 14ms · Load: 31%</div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-emerald-400 h-full w-[99%]" />
            </div>
          </div>

          {/* SBI */}
          <div className={`p-2 rounded-lg border transition-colors ${
            sbiDegraded ? 'bg-rose-950/40 border-rose-500/60' : 'bg-[#07192f] border-sky-800/40'
          }`}>
            <div className="flex items-center justify-between text-[11px] font-bold text-white">
              <span>SBI Switch</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                sbiDegraded ? 'bg-rose-500/30 text-rose-300 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {sbiDegraded ? '41.2% ERR' : '98.8%'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {sbiDegraded ? 'Latency: 450ms (TIMEOUT)' : 'P95: 28ms · Load: 15%'}
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div className={`${sbiDegraded ? 'bg-rose-500 w-[41%]' : 'bg-emerald-400 w-[98%]'}`} />
            </div>
          </div>

          {/* Axis */}
          <div className="p-2 rounded-lg bg-[#07192f] border border-sky-800/40">
            <div className="flex items-center justify-between text-[11px] font-bold text-white">
              <span>Axis Turbo</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">99.8%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">P95: 8ms · Load: 12%</div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-emerald-400 h-full w-[99%]" />
            </div>
          </div>
        </div>
      </div>

      {/* ── LIVE TRANSACTIONS STREAM TABLE ───────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 p-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Live Hyperswitch Routing Stream (Real-Time POSIX VFS /var/log/transactions.csv)</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Click transaction for cryptographic trace</span>
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border border-sky-900/40 bg-[#020914]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#06182c] border-b border-sky-900/60 text-[10px] font-mono text-sky-300 uppercase">
              <tr>
                <th className="py-2 px-3">Txn ID</th>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Merchant</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Method</th>
                <th className="py-2 px-3">Route</th>
                <th className="py-2 px-3">Latency</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-950 font-mono text-[11px]">
              <AnimatePresence initial={false}>
                {transactions.map(txn => (
                  <motion.tr
                    key={txn.id}
                    initial={{ opacity: 0, y: -6, backgroundColor: 'rgba(56,189,248,0.15)' }}
                    animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setSelectedTxn(txn)}
                    className="hover:bg-sky-500/10 cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-3 text-sky-400 font-bold">{txn.id}</td>
                    <td className="py-2 px-3 text-slate-400 text-[10px]">{txn.time}</td>
                    <td className="py-2 px-3 text-white font-sans font-medium">{txn.merchant}</td>
                    <td className="py-2 px-3 text-emerald-400 font-semibold">₹{txn.amount.toLocaleString()}</td>
                    <td className="py-2 px-3 text-slate-300">{txn.method}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-sky-900/40 text-[10px] border border-sky-700/40 text-sky-200">
                        {txn.gateway}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400">{txn.latencyMs}ms</td>
                    <td className="py-2 px-3">
                      {txn.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> SUCCESS
                        </span>
                      ) : txn.status === 'ROUTED' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-purple-300">
                          <ArrowRightLeft className="w-3 h-3" /> REROUTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-400">
                          <XCircle className="w-3 h-3" /> FAILED
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TRANSACTION DEEP INSPECTION MODAL ────────────────── */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#05162a] border border-sky-500/40 rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-sky-900/50 pb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-white text-sm">Juspay Audit: {selectedTxn.id}</span>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="text-slate-400 hover:text-white px-2 py-0.5 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-sky-950">
                <span className="text-slate-400">Merchant Entity:</span>
                <span className="text-white font-bold">{selectedTxn.merchant}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-sky-950">
                <span className="text-slate-400">Amount Settled:</span>
                <span className="text-emerald-400 font-bold">₹{selectedTxn.amount.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-sky-950">
                <span className="text-slate-400">Payment Instrument:</span>
                <span className="text-sky-300">{selectedTxn.method}</span>
              </div>
              {selectedTxn.vpa && (
                <div className="flex justify-between py-1 border-b border-sky-950">
                  <span className="text-slate-400">VPA Identifier:</span>
                  <span className="text-purple-300">{selectedTxn.vpa}</span>
                </div>
              )}
              {selectedTxn.maskedCard && (
                <div className="flex justify-between py-1 border-b border-sky-950">
                  <span className="text-slate-400">PCI-DSS Token:</span>
                  <span className="text-amber-300 font-bold">{selectedTxn.maskedCard}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-sky-950">
                <span className="text-slate-400">Gateway Acquirer:</span>
                <span className="text-white font-bold">{selectedTxn.gateway} Bank</span>
              </div>
              <div className="flex justify-between py-1 border-b border-sky-950">
                <span className="text-slate-400">LSM Access Control:</span>
                <span className="text-emerald-400">ENFORCED (Audit Logged)</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-sky-950/60 border border-sky-800/40 text-[10px] text-sky-200">
              🔒 <strong>PCI-DSS 4.0 Compliance Notice</strong>: Cardholder Data is cryptographically tokenized before leaving the microkernel VFS memory map.
            </div>

            <button
              onClick={() => setSelectedTxn(null)}
              className="w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 font-semibold text-white transition-colors"
            >
              Close Audit Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
