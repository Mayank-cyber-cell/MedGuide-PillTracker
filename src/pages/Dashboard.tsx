import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Medication, AdherenceRecord } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, TrendingDown, Calendar, Clock, ChevronRight, Plus } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [adherence, setAdherence] = useState<AdherenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'today' | 'weekly'>('today');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [medsData, adherenceData] = await Promise.all([
          api.medicines.list(),
          api.adherence.list()
        ]);
        setMeds(medsData);
        setAdherence(adherenceData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatus = async (medId: number, status: 'taken' | 'skipped' | 'missed') => {
    try {
      await api.adherence.record({ medication_id: medId, status });
      const adherenceData = await api.adherence.list();
      setAdherence(adherenceData);
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const stats = {
    taken: adherence.filter(a => a.status === 'taken').length,
    missed: adherence.filter(a => a.status === 'missed').length,
    skipped: adherence.filter(a => a.status === 'skipped').length,
  };

  const chartData = [
    { name: 'Taken', value: stats.taken, color: '#10b981' },
    { name: 'Missed', value: stats.missed, color: '#ef4444' },
    { name: 'Skipped', value: stats.skipped, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const compliance = adherence.length > 0 
    ? Math.round((stats.taken / adherence.length) * 100) 
    : 100;

  const missedStreak = () => {
    let streak = 0;
    for (const record of adherence) {
      if (record.status === 'missed') streak++;
      else break;
    }
    return streak;
  };

  const getTrend = (status: 'taken' | 'missed' | 'skipped') => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const currentPeriod = adherence.filter(a => {
      const date = new Date(a.timestamp);
      return date >= sevenDaysAgo && a.status === status;
    }).length;

    const previousPeriod = adherence.filter(a => {
      const date = new Date(a.timestamp);
      return date >= fourteenDaysAgo && date < sevenDaysAgo && a.status === status;
    }).length;

    if (previousPeriod === 0) return currentPeriod > 0 ? 100 : 0;
    return Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100);
  };

  const getComplianceTrend = () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const currentAdherence = adherence.filter(a => new Date(a.timestamp) >= sevenDaysAgo);
    const previousAdherence = adherence.filter(a => new Date(a.timestamp) >= fourteenDaysAgo && new Date(a.timestamp) < sevenDaysAgo);

    const currentTaken = currentAdherence.filter(a => a.status === 'taken').length;
    const previousTaken = previousAdherence.filter(a => a.status === 'taken').length;

    const currentRate = currentAdherence.length > 0 ? (currentTaken / currentAdherence.length) * 100 : 0;
    const previousRate = previousAdherence.length > 0 ? (previousTaken / previousAdherence.length) * 100 : 0;

    return Math.round(currentRate - previousRate);
  };

  const TrendIndicator = ({ value, inverse = false, isPercentagePoint = false }: { value: number, inverse?: boolean, isPercentagePoint?: boolean }) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    const isGood = inverse ? !isPositive : isPositive;
    
    return (
      <div className={`flex items-center gap-1 text-xs font-bold ${isGood ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {Math.abs(value)}{isPercentagePoint ? 'pp' : '%'}
      </div>
    );
  };

  const todayDay = new Date().getDay();
  const todaysMeds = meds
    .filter(med => {
      if (!med.days_of_week) return true;
      return med.days_of_week.split(',').includes(todayDay.toString());
    })
    .sort((a, b) => a.reminder_time.localeCompare(b.reminder_time));

  const getTimeOfDay = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 18) return 'Afternoon';
    return 'Night';
  };

  const groupedMeds = todaysMeds.reduce((acc, med) => {
    const timeOfDay = getTimeOfDay(med.reminder_time);
    if (!acc[timeOfDay]) acc[timeOfDay] = [];
    acc[timeOfDay].push(med);
    return acc;
  }, {} as Record<string, Medication[]>);

  const timeOrder = ['Morning', 'Afternoon', 'Night'];

  const getActionedRecord = (medId: number) => {
    const today = new Date().toISOString().split('T')[0];
    return adherence.find(a => {
      const recordDate = new Date(a.timestamp).toISOString().split('T')[0];
      return a.medication_id === medId && recordDate === today;
    });
  };

  const totalChartValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const radius = 54;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;

  const chartSegments = chartData.reduce((segments, item) => {
    const previousTotal = segments.length > 0 ? segments[segments.length - 1].end : 0;
    const segmentLength = totalChartValue > 0 ? (item.value / totalChartValue) * circumference : 0;
    const start = previousTotal;
    const end = start + segmentLength;
    segments.push({ ...item, start, end, dash: `${segmentLength} ${circumference - segmentLength}` });
    return segments;
  }, [] as Array<{ name: string; value: number; color: string; start: number; end: number; dash: string }>);

  const getChartTextClass = (name: string) => {
    if (name === 'Taken') return 'text-emerald-600';
    if (name === 'Missed') return 'text-red-600';
    return 'text-amber-600';
  };

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-32 bg-gray-100 rounded-2xl"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="h-48 bg-gray-100 rounded-2xl"></div>
      <div className="h-48 bg-gray-100 rounded-2xl"></div>
      <div className="h-48 bg-gray-100 rounded-2xl"></div>
      <div className="h-48 bg-gray-100 rounded-2xl"></div>
    </div>
  </div>;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Health Overview</h1>
          <p className="text-gray-500">Track your medication adherence and safety.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Toggle Bar Section */}
          <div className="bg-gray-100 p-1 rounded-2xl flex items-center gap-1 w-full sm:w-auto">
            <button 
              onClick={() => setView('today')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                view === 'today' 
                  ? 'bg-white text-sky-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Today
            </button>
            <button 
              onClick={() => setView('weekly')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                view === 'weekly' 
                  ? 'bg-white text-sky-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Weekly
            </button>
          </div>

          <button 
            onClick={() => navigate('/medications')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100"
          >
            <Plus size={20} /> Add Medicine
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ y: -4 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg"><TrendingUp size={20} /></div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-bold text-sky-600">{compliance}%</span>
              <TrendIndicator value={getComplianceTrend()} isPercentagePoint />
            </div>
          </div>
          <h3 className="font-bold text-gray-900">Compliance Rate</h3>
          <p className="text-sm text-gray-500 mt-1">Overall adherence score</p>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 size={20} /></div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-bold text-green-600">{stats.taken}</span>
              <TrendIndicator value={getTrend('taken')} />
            </div>
          </div>
          <h3 className="font-bold text-gray-900">Taken Total</h3>
          <p className="text-sm text-gray-500 mt-1">Medications successfully taken</p>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle size={20} /></div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-bold text-red-600">{stats.missed}</span>
              <TrendIndicator value={getTrend('missed')} inverse />
            </div>
          </div>
          <h3 className="font-bold text-gray-900">Missed Total</h3>
          <p className="text-sm text-gray-500 mt-1">Requires immediate attention</p>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><XCircle size={20} /></div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-bold text-amber-600">{stats.skipped}</span>
              <TrendIndicator value={getTrend('skipped')} inverse />
            </div>
          </div>
          <h3 className="font-bold text-gray-900">Skipped Total</h3>
          <p className="text-sm text-gray-500 mt-1">Medications intentionally skipped</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {view === 'today' ? (
                <><Calendar size={20} className="text-sky-500" /> Today's Schedule</>
              ) : (
                <><TrendingUp size={20} className="text-sky-500" /> Weekly Overview</>
              )}
            </h2>
          </div>

          <div className="space-y-8">
            {view === 'today' ? (
              todaysMeds.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                  <p className="text-gray-500">No medications scheduled for today.</p>
                  <button 
                    onClick={() => navigate('/medications')}
                    className="mt-4 text-sky-600 font-bold hover:underline"
                  >
                    Add or adjust your schedule
                  </button>
                </div>
              ) : (
                timeOrder.map(timeOfDay => {
                  const medsInGroup = groupedMeds[timeOfDay] || [];
                  if (medsInGroup.length === 0) return null;

                  return (
                    <div key={timeOfDay} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-grow bg-gray-100"></div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{timeOfDay}</span>
                        <div className="h-px flex-grow bg-gray-100"></div>
                      </div>
                      <div className="space-y-4">
                        {medsInGroup.map(med => {
                          const actioned = getActionedRecord(med.id);
                          return (
                            <div key={med.id} className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4 transition-all ${actioned ? 'opacity-60 bg-gray-50/50' : ''}`}>
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${actioned ? 'bg-gray-100 text-gray-400' : 'bg-sky-50 text-sky-600'}`}>
                                  <Clock size={24} />
                                </div>
                                <div>
                                  <h4 className={`font-bold ${actioned ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{med.name}</h4>
                                  <p className="text-sm text-gray-500">{med.dosage} • {med.reminder_time}</p>
                                </div>
                              </div>
                              
                              {actioned ? (
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border ${
                                  actioned.status === 'taken' ? 'bg-green-50 text-green-600 border-green-100' :
                                  actioned.status === 'skipped' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-red-50 text-red-600 border-red-100'
                                }`}>
                                  {actioned.status === 'taken' && <CheckCircle2 size={16} />}
                                  {actioned.status === 'skipped' && <XCircle size={16} />}
                                  {actioned.status === 'missed' && <AlertTriangle size={16} />}
                                  {actioned.status.charAt(0).toUpperCase() + actioned.status.slice(1)}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleStatus(med.id, 'taken')}
                                    className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                                    title="Mark as Taken"
                                  >
                                    <CheckCircle2 size={24} />
                                  </button>
                                  <button 
                                    onClick={() => handleStatus(med.id, 'skipped')}
                                    className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors"
                                    title="Mark as Skipped"
                                  >
                                    <XCircle size={24} />
                                  </button>
                                  <button 
                                    onClick={() => handleStatus(med.id, 'missed')}
                                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                    title="Mark as Missed"
                                  >
                                    <AlertTriangle size={24} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                  <div key={i} className="space-y-3">
                    <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">{day}</div>
                    <div className="space-y-2 min-h-[60px]">
                      {meds.filter(m => !m.days_of_week || m.days_of_week.split(',').includes(i.toString())).map(m => (
                        <div key={m.id} className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-[10px] font-bold text-gray-700 truncate hover:bg-gray-50 transition-colors cursor-default" title={m.name}>
                          {m.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Adherence Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
          <h2 className="text-xl font-bold text-gray-900 mb-6 self-start">Adherence Stats</h2>
          <div className="h-64 w-full">
            {chartSegments.length > 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      stroke="#e5e7eb"
                      strokeWidth={strokeWidth}
                      fill="none"
                    />
                    {chartSegments.map((segment, index) => (
                      <circle
                        key={segment.name}
                        cx="70"
                        cy="70"
                        r={radius}
                        stroke={segment.color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={segment.dash}
                        strokeDashoffset={-segment.start}
                        opacity={index === 0 ? 1 : 0.95}
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-gray-900">{compliance}%</span>
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Compliance</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 w-full mt-2">
                  {chartData.map(d => (
                    <div key={d.name} className="text-center">
                      <div className="text-xs font-bold text-gray-400 uppercase">{d.name}</div>
                      <div className={`text-lg font-bold ${getChartTextClass(d.name)}`}>{d.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
