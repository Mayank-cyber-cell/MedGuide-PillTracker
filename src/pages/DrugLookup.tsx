import { useState, FormEvent } from 'react';
import { Search, AlertCircle, TrendingUp, AlertTriangle, Check, Skull, Clock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { openFDA } from '../services/api';

interface DrugData {
  name: string;
  totalReports: number;
  seriousCases: number;
  sideEffects: string[];
  riskLevel: 'Low' | 'Moderate' | 'High';
  reactions: string[];
  overdoseCases: number;
  deathCases: number;
  hospitalizationCases: number;
  commonReportAge: string;
}

interface DrugUsageInfo {
  [key: string]: {
    uses: string[];
    doseRange: string;
    frequency: string;
    overdoseRisk: string;
    highDoseWarning: string;
  };
}

const drugAliases: Record<string, string> = {
  paracetamol: 'acetaminophen',
  tylenol: 'acetaminophen',
  dolo: 'acetaminophen',
  crocin: 'acetaminophen',
  calpol: 'acetaminophen',
  advil: 'ibuprofen',
  brufen: 'ibuprofen',
  combiflam: 'ibuprofen',
  disprin: 'aspirin',
  ecosprin: 'aspirin',
  glumetza: 'metformin',
  glucophage: 'metformin',
  zestril: 'lisinopril',
  prinivil: 'lisinopril'
};

// Common drug usage information and overdose risks
const drugUsageDatabase: DrugUsageInfo = {
  'aspirin': {
    uses: ['Pain relief', 'Fever reduction', 'Heart protection', 'Blood clotting prevention'],
    doseRange: '325-650 mg per dose',
    frequency: 'Every 4-6 hours, max 4000 mg/day',
    overdoseRisk: 'Aspirin overdose can cause ringing ears, stomach bleeding, respiratory problems, and metabolic acidosis. Toxicity begins around 150-250 mg/kg.',
    highDoseWarning: 'Regular high-dose aspirin increases risk of GI bleeding, kidney damage, and Reye syndrome in children. Always follow medical guidance.'
  },
  'ibuprofen': {
    uses: ['Pain relief', 'Inflammation reduction', 'Fever reduction', 'Menstrual cramp relief'],
    doseRange: '200-400 mg per dose',
    frequency: 'Every 4-6 hours, max 1200 mg/day (OTC), 3200 mg/day (prescription)',
    overdoseRisk: 'Ibuprofen overdose can cause abdominal pain, kidney failure, GI perforation, and cardiovascular effects. Serious at doses >100 mg/kg.',
    highDoseWarning: 'Long-term high-dose use increases risk of heart disease, stroke, kidney damage, and gastric ulcers. Use lowest effective dose for shortest duration.'
  },
  'acetaminophen': {
    uses: ['Pain relief', 'Fever reduction', 'Headache treatment', 'Cold and flu symptom relief'],
    doseRange: '325-650 mg per dose',
    frequency: 'Every 4-6 hours, max 3000-4000 mg/day',
    overdoseRisk: 'Acetaminophen overdose causes liver damage (hepatotoxicity). Toxic dose: >150 mg/kg. Even modest overdose can be fatal without treatment.',
    highDoseWarning: 'High doses significantly increase liver toxicity risk, especially combined with alcohol. Monitor total daily intake from all products (cold medicines may contain it).'
  },
  'amoxicillin': {
    uses: ['Bacterial infections', 'Strep throat', 'Ear infections', 'Urinary tract infections'],
    doseRange: '250-500 mg capsule per dose',
    frequency: 'Every 8 hours (3x daily) for 7-10 days',
    overdoseRisk: 'Overdose rarely causes death but may cause GI symptoms, nausea, vomiting, and increased allergic reactions. Effects usually mild at high doses.',
    highDoseWarning: 'High-dose use requires kidney monitoring. Risk of severe allergies, C. difficile infection, and diarrhea increased. Stop if severe allergic reaction occurs.'
  },
  'metformin': {
    uses: ['Type 2 diabetes management', 'Weight management', 'PCOS treatment', 'Prediabetes prevention'],
    doseRange: '500-1000 mg per dose',
    frequency: 'Usually twice daily with meals',
    overdoseRisk: 'Overdose can cause lactic acidosis (rare but serious). More common with kidney impairment. Symptoms include muscle pain, difficulty breathing.',
    highDoseWarning: 'High doses increase risk of vitamin B12 deficiency, kidney damage, and GI side effects. Contraindicated in severe kidney or liver disease. Monitor kidney function regularly.'
  },
  'lisinopril': {
    uses: ['High blood pressure control', 'Heart failure management', 'Post-MI protection', 'Kidney disease prevention'],
    doseRange: '10-40 mg per day',
    frequency: 'Once daily, usually in morning',
    overdoseRisk: 'Overdose causes severe hypotension, syncope, shock, and potentially cardiac arrhythmias. IV saline therapy typically needed.',
    highDoseWarning: 'High-dose use increases risk of kidney damage, hyperkalemia (high potassium), persistent cough, and severe hypotension. Monitor blood pressure and kidney function.'
  }
};

function resolveUsageInfo(name: string): DrugUsageInfo[string] | null {
  const normalized = name.toLowerCase().trim();
  const canonical = drugAliases[normalized] || normalized;

  const direct = drugUsageDatabase[canonical];
  if (direct) return direct;

  const loose = Object.entries(drugUsageDatabase).find(([key]) =>
    canonical.includes(key) || key.includes(canonical)
  );

  return loose ? loose[1] : null;
}

export default function DrugLookup() {
  const [searchQuery, setSearchQuery] = useState('');
  const [drugData, setDrugData] = useState<DrugData | null>(null);
  const [usageInfo, setUsageInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [searched, setSearched] = useState(false);

  const buildFallbackDrugData = (name: string): DrugData | null => {
    const usage = resolveUsageInfo(name);
    if (!usage) return null;

    return {
      name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
      totalReports: 0,
      seriousCases: 0,
      sideEffects: usage.uses.slice(0, 3),
      riskLevel: 'Low',
      reactions: usage.uses,
      overdoseCases: 0,
      deathCases: 0,
      hospitalizationCases: 0,
      commonReportAge: 'Not available offline'
    };
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setNotice('');
    setDrugData(null);
    setUsageInfo(null);
    setSearched(true);

    try {
      const data = await openFDA.getDrugReport(searchQuery);

      if (!data) {
        throw new Error('OpenFDA request failed or returned no data');
      }

      if (!data.results || data.results.length === 0) {
        const fallbackDrugData = buildFallbackDrugData(searchQuery);
        if (fallbackDrugData) {
          const lowerCaseName = searchQuery.toLowerCase();
          const info = Object.entries(drugUsageDatabase).find(([key]) =>
            lowerCaseName.includes(key) || key.includes(lowerCaseName)
          );

          setDrugData(fallbackDrugData);
          setUsageInfo(info?.[1] || null);
          setNotice('⚠️ Live drug data temporarily unavailable. Displaying general safety information.');
          setLoading(false);
          return;
        }

        setError(`No adverse event data found for "${searchQuery}" in the OpenFDA database.`);
        setLoading(false);
        return;
      }

      // Parse the first result
      const result = data.results[0];
      const reactions = result.patient?.reaction
        ? result.patient.reaction
            .slice(0, 10)
            .map((r: any) => r.reactionmeddrapt || 'Unknown reaction')
            .filter((r: any) => r !== 'Unknown reaction')
        : [];

      const sideEffects = reactions.slice(0, 3);
      const totalReports = data.meta?.results?.total || 0;
      const seriousCases = data.seriousCases || 0;

      // Count overdose and death cases
      let overdoseCases = 0;
      let deathCases = 0;
      let hospitalizationCases = 0;

      data.results.forEach((report: any) => {
        if (report.patient?.drug) {
          report.patient.drug.forEach((drug: any) => {
            if (drug.openfda?.indication?.some((ind: string) => ind.toLowerCase().includes('overdose'))) {
              overdoseCases++;
            }
          });
        }
        if (report.serious === 1) hospitalizationCases++;
        if (report.serious === 2) deathCases++;
      });

      let riskLevel: 'Low' | 'Moderate' | 'High' = 'Low';
      if (totalReports > 10000 || seriousCases > 1000 || deathCases > 50) {
        riskLevel = 'High';
      } else if (totalReports > 1000 || seriousCases > 100 || deathCases > 10) {
        riskLevel = 'Moderate';
      }

      const drugName = searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1).toLowerCase();
      setDrugData({
        name: drugName,
        totalReports,
        seriousCases,
        sideEffects: sideEffects as string[],
        riskLevel,
        reactions,
        overdoseCases,
        deathCases,
        hospitalizationCases,
        commonReportAge: 'Multiple age groups'
      });

      // Set usage information if available in database
      setUsageInfo(resolveUsageInfo(searchQuery));
    } catch (err: any) {
      const fallbackDrugData = buildFallbackDrugData(searchQuery);
      if (fallbackDrugData) {
        setDrugData(fallbackDrugData);
        setUsageInfo(resolveUsageInfo(searchQuery));
        setNotice('⚠️ Live drug data temporarily unavailable. Displaying general safety information.');
      } else {
        setError(`Error fetching data: ${err.message || 'Please try a common drug name like Aspirin, Ibuprofen, or Acetaminophen.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    if (level === 'High') return 'bg-red-50 border-red-200';
    if (level === 'Moderate') return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  const getRiskBadgeColor = (level: string) => {
    if (level === 'High') return 'bg-red-100 text-red-800';
    if (level === 'Moderate') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Drug Information Lookup</h1>
        <p className="text-gray-500">Search for detailed information about any medication from OpenFDA database</p>
      </div>

      {/* Search Form */}
      <motion.form
        onSubmit={handleSearch}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter drug name (e.g., Aspirin, Ibuprofen, Amoxicillin)..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-lg"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:cursor-not-allowed"
          >
            <Search size={20} />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </motion.form>

      <AnimatePresence mode="wait">
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3"
          >
            <AlertCircle className="text-blue-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-blue-900 mb-1">General Safety Information</h3>
              <p className="text-blue-700 text-sm">{notice}</p>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-6 flex gap-3"
          >
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-red-900 mb-1">No Data Found</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {drugData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className={`${getRiskColor(drugData.riskLevel)} border rounded-2xl p-6`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{drugData.name}</h2>
                  <p className="text-gray-600">OpenFDA Adverse Event Database</p>
                </div>
                <span className={`${getRiskBadgeColor(drugData.riskLevel)} px-4 py-2 rounded-full font-bold text-sm`}>
                  {drugData.riskLevel} Risk
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="text-blue-600" size={24} />
                  <span className="text-sm font-semibold text-blue-600 uppercase">Total Reports</span>
                </div>
                <p className="text-4xl font-bold text-blue-900">{drugData.totalReports.toLocaleString()}</p>
                <p className="text-blue-600 text-sm mt-1">Adverse events reported</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="text-red-600" size={24} />
                  <span className="text-sm font-semibold text-red-600 uppercase">Serious Cases</span>
                </div>
                <p className="text-4xl font-bold text-red-900">{drugData.seriousCases.toLocaleString()}</p>
                <p className="text-red-600 text-sm mt-1">Marked as serious</p>
              </motion.div>
            </div>

            {/* Overdose & Death Statistics */}
            {(drugData.deathCases > 0 || drugData.overdoseCases > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {drugData.deathCases > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                    className="bg-red-50 border border-red-300 rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Skull className="text-red-600" size={24} />
                      <span className="text-sm font-semibold text-red-600 uppercase">Deaths Reported</span>
                    </div>
                    <p className="text-4xl font-bold text-red-900">{drugData.deathCases}</p>
                    <p className="text-red-600 text-sm mt-1">Fatal outcomes</p>
                  </motion.div>
                )}

                {drugData.overdoseCases > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.27 }}
                    className="bg-orange-50 border border-orange-300 rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="text-orange-600" size={24} />
                      <span className="text-sm font-semibold text-orange-600 uppercase">Overdose Cases</span>
                    </div>
                    <p className="text-4xl font-bold text-orange-900">{drugData.overdoseCases}</p>
                    <p className="text-orange-600 text-sm mt-1">High-dose incidents</p>
                  </motion.div>
                )}

                {drugData.hospitalizationCases > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.29 }}
                    className="bg-purple-50 border border-purple-300 rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="text-purple-600" size={24} />
                      <span className="text-sm font-semibold text-purple-600 uppercase">Hospitalizations</span>
                    </div>
                    <p className="text-4xl font-bold text-purple-900">{drugData.hospitalizationCases}</p>
                    <p className="text-purple-600 text-sm mt-1">Required medical care</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Usage Information Section */}
            {usageInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.31 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-blue-600" />
                  Recommended Usage & Dosage
                </h3>
                
                <div className="space-y-4">
                  {/* Common Uses */}
                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Common Uses:</p>
                    <div className="flex flex-wrap gap-2">
                      {usageInfo.uses.map((use: string, idx: number) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {use}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Dosage Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-xs font-bold text-blue-600 uppercase mb-1">Standard Dose</p>
                      <p className="text-sm font-semibold text-gray-800">{usageInfo.doseRange}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-xs font-bold text-blue-600 uppercase mb-1">Frequency</p>
                      <p className="text-sm font-semibold text-gray-800">{usageInfo.frequency}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* High Dose Warning Section */}
            {usageInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.33 }}
                className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-400 rounded-2xl p-6"
              >
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-1" />
                  <h3 className="text-lg font-bold text-red-900">⚠️ High Dose & Overdose Risk</h3>
                </div>
                
                <div className="space-y-4">
                  {/* Overdose Risk */}
                  <div>
                    <p className="font-semibold text-red-900 mb-2">🚨 Overdose Danger:</p>
                    <p className="text-red-800 text-sm leading-relaxed">{usageInfo.overdoseRisk}</p>
                  </div>

                  {/* High Dose Warning */}
                  <div>
                    <p className="font-semibold text-red-900 mb-2">⚡ High Dose Warning:</p>
                    <p className="text-red-800 text-sm leading-relaxed">{usageInfo.highDoseWarning}</p>
                  </div>

                  {/* Emergency Info */}
                  <div className="bg-red-100 rounded-lg p-3 border border-red-300 mt-3">
                    <p className="text-xs font-bold text-red-700 uppercase mb-1">In Case of Overdose:</p>
                    <p className="text-sm text-red-800">Call Poison Control: <span className="font-bold">1-800-222-1222</span> (US) or Emergency Services: <span className="font-bold">911</span></p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Side Effects */}
            {drugData.sideEffects && drugData.sideEffects.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white border border-gray-100 rounded-2xl p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle size={20} className="text-amber-600" />
                  Most Reported Side Effects
                </h3>
                <div className="space-y-3">
                  {drugData.sideEffects.map((effect, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100"
                    >
                      <Check size={18} className="text-amber-600 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{effect}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* All Reactions */}
            {drugData.reactions && drugData.reactions.length > 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white border border-gray-100 rounded-2xl p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Other Reported Reactions</h3>
                <div className="flex flex-wrap gap-2">
                  {drugData.reactions.slice(3).map((reaction, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + idx * 0.05 }}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium"
                    >
                      {reaction}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-blue-700 text-sm">
                <strong>Medical Disclaimer:</strong> This information is for educational purposes only. Always consult with a healthcare provider before taking any medication.
              </p>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!drugData && searched && !loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Search size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No results to display</p>
          </motion.div>
        )}

        {/* Initial State */}
        {!searched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-2xl p-12 text-center"
          >
            <Search size={48} className="mx-auto text-sky-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Search for Drug Information</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Use the search bar above to find adverse event data, side effects, and safety information for any medication from the FDA's database.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
