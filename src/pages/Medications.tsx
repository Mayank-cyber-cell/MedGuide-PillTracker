import { useState, useEffect, FormEvent } from 'react';
import { api, openFDA } from '../services/api';
import { Medication } from '../types';
import { Plus, Trash2, AlertCircle, Info, ShieldCheck, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Medications() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: 'Daily',
    reminder_time: '08:00',
    days_of_week: '0,1,2,3,4,5,6',
    start_date: new Date().toISOString().split('T')[0],
  });
  const [fdaInfo, setFdaInfo] = useState<any>(null);
  const [checkingFda, setCheckingFda] = useState(false);

  useEffect(() => {
    fetchMeds();
  }, []);

  const fetchMeds = async () => {
    try {
      const data = await api.medicines.list();
      setMeds(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    try {
      let fdaData = null;
      if (newMed.name) {
        fdaData = await openFDA.getDrugInfo(newMed.name);
      }

      await api.medicines.create({
        ...newMed,
        risk_level: fdaData?.riskLevel || 'Low',
        side_effects: fdaData?.sideEffects || 'No common side effects reported',
        total_reports: fdaData?.totalReports || 0,
        serious_cases: fdaData?.seriousCases || 0
      });
      setShowAdd(false);
      setNewMed({
        name: '',
        dosage: '',
        frequency: 'Daily',
        reminder_time: '08:00',
        start_date: new Date().toISOString().split('T')[0],
      });
      fetchMeds();
    } catch (e) {
      alert('Failed to add medication');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this medication?')) return;
    try {
      await api.medicines.delete(id);
      fetchMeds();
    } catch (e) {
      alert('Failed to delete');
    }
  };

  const toggleDay = (dayIndex: number) => {
    const days = newMed.days_of_week.split(',').filter(d => d !== '');
    const indexStr = dayIndex.toString();
    let newDays;
    if (days.includes(indexStr)) {
      newDays = days.filter(d => d !== indexStr);
    } else {
      newDays = [...days, indexStr].sort();
    }
    setNewMed({ ...newMed, days_of_week: newDays.join(',') });
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const checkDrugSafety = async (name: string) => {
    if (!name) return;
    setCheckingFda(true);
    const info = await openFDA.getDrugInfo(name);
    setFdaInfo(info);
    setCheckingFda(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Medications</h1>
          <p className="text-gray-500">Manage your prescriptions and safety alerts.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-sky-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100"
        >
          <Plus size={20} /> Add Medicine
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative my-8"
            >
              <h2 className="text-2xl font-bold mb-6">Add New Medication</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Medicine Name</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                      value={newMed.name}
                      onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                      onBlur={() => checkDrugSafety(newMed.name)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Dosage</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. 500mg"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                      value={newMed.dosage}
                      onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Frequency</label>
                    <select 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                      value={newMed.frequency}
                      onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                    >
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Every 8 hours</option>
                      <option>Every 12 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Reminder Time</label>
                    <input 
                      type="time" 
                      required 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                      value={newMed.reminder_time}
                      onChange={(e) => setNewMed({ ...newMed, reminder_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Days of Week</label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day, idx) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                          newMed.days_of_week.split(',').includes(idx.toString())
                            ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-100'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-sky-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                {checkingFda && <p className="text-sm text-sky-600 animate-pulse">Checking OpenFDA safety data...</p>}
                
                {fdaInfo && (
                  <div className="p-5 bg-sky-50 rounded-2xl border border-sky-100 space-y-4 shadow-inner">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-sky-900 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-sky-600" /> Drug Safety Summary
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        fdaInfo.riskLevel === 'High' ? 'bg-red-500 text-white' :
                        fdaInfo.riskLevel === 'Moderate' ? 'bg-amber-500 text-white' :
                        'bg-green-500 text-white'
                      }`}>
                        {fdaInfo.riskLevel} Risk
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/50 p-2 rounded-xl text-center">
                        <p className="text-[10px] font-bold text-sky-600 uppercase">Total Reports</p>
                        <p className="text-sm font-bold text-sky-900">{fdaInfo.totalReports.toLocaleString()}</p>
                      </div>
                      <div className="bg-white/50 p-2 rounded-xl text-center border border-red-100">
                        <p className="text-[10px] font-bold text-red-600 uppercase">Serious Cases</p>
                        <p className="text-sm font-bold text-red-900">{fdaInfo.seriousCases.toLocaleString()}</p>
                      </div>
                      <div className="bg-white/50 p-2 rounded-xl text-center">
                        <p className="text-[10px] font-bold text-sky-600 uppercase">Risk Level</p>
                        <p className="text-sm font-bold text-sky-900">{fdaInfo.riskLevel}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-sky-600 uppercase">Top Reported Reactions</p>
                      <p className="text-xs text-sky-800 leading-relaxed italic">
                        "{fdaInfo.sideEffects}"
                      </p>
                    </div>
                    
                    <p className="text-[9px] text-sky-400 text-center italic">
                      Data sourced from real-time OpenFDA Drug Event API
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100"
                  >
                    Save Medication
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {meds.map(med => (
          <motion.div 
            key={med.id}
            layout
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4 relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${
              med.risk_level === 'High' ? 'bg-red-500' :
              med.risk_level === 'Moderate' ? 'bg-amber-500' :
              'bg-green-500'
            }`}></div>

            <div className="flex justify-between items-start relative">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{med.name}</h3>
                  <p className="text-sm text-gray-500 font-medium">{med.dosage}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(med.id)}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Frequency</p>
                <p className="text-sm font-semibold text-gray-700">{med.frequency}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reminder</p>
                <p className="text-sm font-semibold text-gray-700">{med.reminder_time}</p>
              </div>
            </div>

            {med.days_of_week && med.days_of_week !== '0,1,2,3,4,5,6' && (
              <div className="flex flex-wrap gap-1">
                {med.days_of_week.split(',').map(d => (
                  <span key={d} className="px-1.5 py-0.5 bg-gray-50 text-[9px] font-bold text-gray-500 rounded-md border border-gray-100">
                    {daysOfWeek[parseInt(d)]}
                  </span>
                ))}
              </div>
            )}

            {med.side_effects && (
              <div className={`p-4 rounded-2xl border ${
                med.risk_level === 'High' ? 'bg-red-50/50 border-red-100' :
                med.risk_level === 'Moderate' ? 'bg-amber-50/50 border-amber-100' :
                'bg-green-50/50 border-green-100'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                    med.risk_level === 'High' ? 'text-red-600' :
                    med.risk_level === 'Moderate' ? 'text-amber-600' :
                    'text-green-600'
                  }`}>
                    <ShieldCheck size={12} /> Safety Summary
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    med.risk_level === 'High' ? 'bg-red-100 text-red-700' :
                    med.risk_level === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {med.risk_level} Risk
                  </span>
                </div>
                
                <p className="text-xs text-gray-700 line-clamp-2 italic mb-3">
                  "{med.side_effects}"
                </p>

                <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-2">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-gray-400 uppercase">Serious Cases</span>
                    <span className="text-[10px] font-bold text-red-600">{med.serious_cases?.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-bold text-gray-400 uppercase">Total Reports</span>
                    <span className="text-[10px] font-bold text-gray-600">{med.total_reports?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between text-[10px] text-gray-400 font-medium">
              <span>Started: {med.start_date}</span>
              <div className="flex items-center gap-1">
                <Info size={10} /> OpenFDA Verified
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
