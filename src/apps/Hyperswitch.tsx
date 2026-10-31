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

  const cardStyle: React.CSSProperties = {
    background: 'var(--canvas-elevated, #ffffff)',
    borderColor: 'var(--hairline, #ebebeb)',
  };

  return (
    <div
      className="h-full flex flex-col text-xs font-sans overflow-hidden select-none"
      style={{ background: 'var(--canvas, #fafafa)', color: 'var(--text-body, #4d4d4d)' }}
    >
      {/* ── TOP HEADER: Juspay Hyperswitch Branding ────────────── */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ background: 'var(--canvas-elevated, #ffffff)', borderColor: 'var(--hairline, #ebebeb)' }}
      >
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-[6px] border" style={{ borderColor: 'var(--hairline, #ebebeb)', color: 'var(--link, #0070f3)' }}>
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold tracking-tight" style={{ color: 'var(--ink, #171717)' }}>Juspay Hyperswitch™</h2>
              <span
                className="px-1.5 py-0.5 rounded-[6px] text-[10px] font-mono font-semibold border"
                style={{ borderColor: 'var(--hairline, #ebebeb)', color: 'var(--link, #0070f3)' }}
              >
                PROD-BLR-01
              </span>
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-mute, #8f8f8f)' }}>High-Throughput Financial Switch & Payment Orchestrator</p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center space-x-3">
          <div
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-[6px] border font-mono text-[11px]"
            style={{ borderColor: 'var(--hairline, #ebebeb)', color: 'var(--status-success, #15803d)' }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{tps.toLocaleString()} TPS</span>
          </div>

          <div
            className="flex items-center space-x-1 px-2.5 py-1 rounded-[6px] border font-mono text-[11px]"
            style={{ borderColor: 'var(--hairline, #ebebeb)', color: 'var(--link, #0070f3)' }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PCI-DSS 4.0 L1</span>
          </div>
        </div>
      </div>

      {/* ── METRICS OVERVIEW CARDS ───────────────────────────── */}
      <div className="grid grid-cols-4 gap-2.5 p-3 border-b" style={{ background: 'var(--canvas, #fafafa)', borderColor: 'var(--hairline, #ebebeb)' }}>
        <div className="p-2.5 rounded-[12px] border" style={cardStyle}>
          <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-mute, #8f8f8f)' }}>Volume Today</div>
          <div className="text-base font-bold mt-0.5" style={{ color: 'var(--ink, #171717)' }}>₹142.89 Cr</div>
          <div className="text-[10px] flex items-center gap-0.5 mt-0.5" style={{ color: 'var(--status-success, #15803d)' }}>
            <TrendingUp className="w-3 h-3" /> +14.2% vs yesterday
          </div>
        </div>

        <div className="p-2.5 rounded-[12px] border" style={cardStyle}>
          <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-mute, #8f8f8f)' }}>Success Rate (SR)</div>
          <div className="text-base font-bold mt-0.5" style={{ color: sbiDegraded ? 'var(--status-warn, #b4760a)' : 'var(--status-success, #15803d)' }}>
            {sbiDegraded ? '94.12%' : '99.98%'}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-mute, #8f8f8f)' }}>Target SLA: &gt; 99.50%</div>
        </div>

        <div className="p-2.5 rounded-[12px] border" style={cardStyle}>
          <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-mute, #8f8f8f)' }}>P99 Gateway Latency</div>
          <div className="text-base font-bold mt-0.5" style={{ color: sbiDegraded ? 'var(--status-warn, #b4760a)' : 'var(--link, #0070f3)' }}>
            {sbiDegraded ? '184ms' : '16ms'}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-mute, #8f8f8f)' }}>Hyperswitch Native Engine</div>
        </div>

        <div className="p-2.5 rounded-[12px] border" style={cardStyle}>
          <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-mute, #8f8f8f)' }}>Routing Topology</div>
          <div className="text-xs font-bold mt-1 truncate" style={{ color: 'var(--status-reroute, #7928ca)' }}>
            {smartRouted ? 'Adaptive ML (HDFC+ICICI)' : 'Direct Multi-Bank Weighted'}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--status-success, #15803d)' }}>Active Auto-Failover</div>
        </div>
      </div>

      {/* ── GATEWAY STATUS & INTERACTIVE ACTIONS ────────────── */}
      <div className="p-3 border-b" style={{ background: 'var(--canvas, #fafafa)', borderColor: 'var(--hairline, #ebebeb)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-body, #4d4d4d)' }}>
            <Server className="w-3.5 h-3.5" style={{ color: 'var(--link, #0070f3)' }} />
            <span>Bank Payment Gateway Rails & Health</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateOutage}
              className="px-2.5 py-1 rounded-[6px] text-[10px] font-semibold border transition-all hover:scale-105"
              style={{ borderColor: 'rgba(238,0,0,0.3)', color: 'var(--status-error, #ee0000)', background: 'rgba(238,0,0,0.06)' }}
            >
              Simulate SBI Degradation
            </button>
            <button
              onClick={handleSmartFailover}
              className="px-2.5 py-1 rounded-[6px] text-[10px] font-semibold border transition-all hover:scale-105 flex items-center gap-1"
              style={{ borderColor: 'rgba(21,128,61,0.3)', color: 'var(--status-success, #15803d)', background: 'rgba(21,128,61,0.08)' }}
            >
              <RefreshCw className="w-3 h-3" />
              <span>Hyperswitch Smart Failover</span>
            </button>
            <button
              onClick={handleDropTableTest}
              className="px-2.5 py-1 rounded-[6px] text-[10px] font-semibold border transition-all hover:scale-105"
              style={{ borderColor: 'rgba(245,166,35,0.35)', color: 'var(--status-warn, #b4760a)', background: 'rgba(245,166,35,0.1)' }}
              title="Test Accidental Data Loss Guard on Payments DB"
            >
              Test Accidental DB Wipe
            </button>
          </div>
        </div>

        {/* 4 Gateway Cards */}
        <div className="grid grid-cols-4 gap-2">
          {/* HDFC */}
          <div className="p-2 rounded-[6px] border" style={cardStyle}>
            <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: 'var(--ink, #171717)' }}>
              <span>HDFC UPI</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-[6px] font-mono" style={{ color: 'var(--status-success, #15803d)', background: 'rgba(21,128,61,0.1)' }}>99.6%</span>
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--text-mute, #8f8f8f)' }}>P95: 12ms · Load: 42%</div>
            <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: 'var(--hairline, #ebebeb)' }}>
              <div className="h-full w-[99%]" style={{ background: 'var(--status-success-bar, #22c55e)' }} />
            </div>
          </div>

          {/* ICICI */}
          <div className="p-2 rounded-[6px] border" style={cardStyle}>
            <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: 'var(--ink, #171717)' }}>
              <span>ICICI Direct</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-[6px] font-mono" style={{ color: 'var(--status-success, #15803d)', background: 'rgba(21,128,61,0.1)' }}>99.2%</span>
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--text-mute, #8f8f8f)' }}>P95: 14ms · Load: 31%</div>
            <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: 'var(--hairline, #ebebeb)' }}>
              <div className="h-full w-[99%]" style={{ background: 'var(--status-success-bar, #22c55e)' }} />
            </div>
          </div>

          {/* SBI */}
          <div
            className="p-2 rounded-[6px] border transition-colors"
            style={sbiDegraded ? { background: 'rgba(238,0,0,0.06)', borderColor: 'rgba(238,0,0,0.5)' } : cardStyle}
          >
            <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: 'var(--ink, #171717)' }}>
              <span>SBI Switch</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-[6px] font-mono ${sbiDegraded ? 'animate-pulse' : ''}`}
                style={sbiDegraded ? { color: 'var(--status-error, #ee0000)', background: 'rgba(238,0,0,0.12)' } : { color: 'var(--status-success, #15803d)', background: 'rgba(21,128,61,0.1)' }}
              >
                {sbiDegraded ? '41.2% ERR' : '98.8%'}
              </span>
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--text-mute, #8f8f8f)' }}>
              {sbiDegraded ? 'Latency: 450ms (TIMEOUT)' : 'P95: 28ms · Load: 15%'}
            </div>
            <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: 'var(--hairline, #ebebeb)' }}>
              <div className="h-full" style={sbiDegraded ? { background: 'var(--status-error, #ee0000)', width: '41%' } : { background: 'var(--status-success-bar, #22c55e)', width: '98%' }} />
            </div>
          </div>

          {/* Axis */}
          <div className="p-2 rounded-[6px] border" style={cardStyle}>
            <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: 'var(--ink, #171717)' }}>
              <span>Axis Turbo</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-[6px] font-mono" style={{ color: 'var(--status-success, #15803d)', background: 'rgba(21,128,61,0.1)' }}>99.8%</span>
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--text-mute, #8f8f8f)' }}>P95: 8ms · Load: 12%</div>
            <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: 'var(--hairline, #ebebeb)' }}>
              <div className="h-full w-[99%]" style={{ background: 'var(--status-success-bar, #22c55e)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── LIVE TRANSACTIONS STREAM TABLE ───────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 p-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-body, #4d4d4d)' }}>
            <Activity className="w-3.5 h-3.5" style={{ color: 'var(--link, #0070f3)' }} />
            <span>Live Hyperswitch Routing Stream (Real-Time POSIX VFS /var/log/transactions.csv)</span>
          </div>
          <span className="text-[10px] font-mono" style={{ color: 'var(--text-mute, #8f8f8f)' }}>Click transaction for cryptographic trace</span>
        </div>

        <div className="flex-1 overflow-y-auto rounded-[12px] border" style={cardStyle}>
          <table className="w-full text-left border-collapse">
            <thead
              className="sticky top-0 border-b text-[10px] font-mono uppercase"
              style={{ background: 'var(--canvas, #fafafa)', borderColor: 'var(--hairline, #ebebeb)', color: 'var(--text-mute, #8f8f8f)' }}
            >
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
            <tbody className="font-mono text-[11px]">
              <AnimatePresence initial={false}>
                {transactions.map(txn => (
                  <motion.tr
                    key={txn.id}
                    initial={{ opacity: 0, y: -6, backgroundColor: 'rgba(0,112,243,0.08)' }}
                    animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(0,0,0,0)' }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setSelectedTxn(txn)}
                    className="cursor-pointer transition-colors border-t hover:bg-geist-hairlineSoft"
                    style={{ borderColor: 'var(--hairline-soft, #f2f2f2)' }}
                  >
                    <td className="py-2 px-3 font-bold" style={{ color: 'var(--link, #0070f3)' }}>{txn.id}</td>
                    <td className="py-2 px-3 text-[10px]" style={{ color: 'var(--text-mute, #8f8f8f)' }}>{txn.time}</td>
                    <td className="py-2 px-3 font-sans font-medium" style={{ color: 'var(--ink, #171717)' }}>{txn.merchant}</td>
                    <td className="py-2 px-3 font-semibold" style={{ color: 'var(--status-success, #15803d)' }}>₹{txn.amount.toLocaleString()}</td>
                    <td className="py-2 px-3" style={{ color: 'var(--text-body, #4d4d4d)' }}>{txn.method}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded-[6px] text-[10px] border" style={{ borderColor: 'var(--hairline, #ebebeb)', color: 'var(--link, #0070f3)' }}>
                        {txn.gateway}
                      </span>
                    </td>
                    <td className="py-2 px-3" style={{ color: 'var(--text-mute, #8f8f8f)' }}>{txn.latencyMs}ms</td>
                    <td className="py-2 px-3">
                      {txn.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: 'var(--status-success, #15803d)' }}>
                          <CheckCircle2 className="w-3 h-3" /> SUCCESS
                        </span>
                      ) : txn.status === 'ROUTED' ? (
                        <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: 'var(--status-reroute, #7928ca)' }}>
                          <ArrowRightLeft className="w-3 h-3" /> REROUTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: 'var(--status-error, #ee0000)' }}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-[16px] border p-4 space-y-3"
            style={{ background: 'var(--canvas-elevated, #ffffff)', borderColor: 'var(--hairline, #ebebeb)', boxShadow: 'var(--window-shadow-active, 0 12px 32px rgba(0,0,0,0.1))' }}
          >
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--hairline, #ebebeb)' }}>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" style={{ color: 'var(--link, #0070f3)' }} />
                <span className="font-bold text-sm" style={{ color: 'var(--ink, #171717)' }}>Juspay Audit: {selectedTxn.id}</span>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="px-2 py-0.5 rounded-[6px] hover:bg-geist-hairlineSoft"
                style={{ color: 'var(--text-mute, #8f8f8f)' }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--hairline-soft, #f2f2f2)' }}>
                <span style={{ color: 'var(--text-mute, #8f8f8f)' }}>Merchant Entity:</span>
                <span className="font-bold" style={{ color: 'var(--ink, #171717)' }}>{selectedTxn.merchant}</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--hairline-soft, #f2f2f2)' }}>
                <span style={{ color: 'var(--text-mute, #8f8f8f)' }}>Amount Settled:</span>
                <span className="font-bold" style={{ color: 'var(--status-success, #15803d)' }}>₹{selectedTxn.amount.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--hairline-soft, #f2f2f2)' }}>
                <span style={{ color: 'var(--text-mute, #8f8f8f)' }}>Payment Instrument:</span>
                <span style={{ color: 'var(--link, #0070f3)' }}>{selectedTxn.method}</span>
              </div>
              {selectedTxn.vpa && (
                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--hairline-soft, #f2f2f2)' }}>
                  <span style={{ color: 'var(--text-mute, #8f8f8f)' }}>VPA Identifier:</span>
                  <span style={{ color: 'var(--status-reroute, #7928ca)' }}>{selectedTxn.vpa}</span>
                </div>
              )}
              {selectedTxn.maskedCard && (
                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--hairline-soft, #f2f2f2)' }}>
                  <span style={{ color: 'var(--text-mute, #8f8f8f)' }}>PCI-DSS Token:</span>
                  <span className="font-bold" style={{ color: 'var(--status-warn, #b4760a)' }}>{selectedTxn.maskedCard}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--hairline-soft, #f2f2f2)' }}>
                <span style={{ color: 'var(--text-mute, #8f8f8f)' }}>Gateway Acquirer:</span>
                <span className="font-bold" style={{ color: 'var(--ink, #171717)' }}>{selectedTxn.gateway} Bank</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--hairline-soft, #f2f2f2)' }}>
                <span style={{ color: 'var(--text-mute, #8f8f8f)' }}>LSM Access Control:</span>
                <span style={{ color: 'var(--status-success, #15803d)' }}>ENFORCED (Audit Logged)</span>
              </div>
            </div>

            <div
              className="p-2 rounded-[6px] border text-[10px]"
              style={{ background: 'var(--canvas, #fafafa)', borderColor: 'var(--hairline, #ebebeb)', color: 'var(--text-body, #4d4d4d)' }}
            >
              🔒 <strong>PCI-DSS 4.0 Compliance Notice</strong>: Cardholder Data is cryptographically tokenized before leaving the microkernel VFS memory map.
            </div>

            <button
              onClick={() => setSelectedTxn(null)}
              className="w-full py-1.5 rounded-[6px] font-semibold transition-colors"
              style={{ background: 'var(--accent, #171717)', color: '#ffffff' }}
            >
              Close Audit Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
