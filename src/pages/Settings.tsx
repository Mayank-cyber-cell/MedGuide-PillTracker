import { useState, useEffect, FormEvent } from 'react';
import { api } from '../services/api';
import { useApp } from '../App';
import { Shield, Bell, Eye, Type, Phone, Mail, User, Save } from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const { elderlyMode, setElderlyMode, highContrast, setHighContrast, user, setUser } = useApp();
  const [emergencyContact, setEmergencyContact] = useState({
    name: user?.emergency_contact_name || '',
    email: user?.emergency_contact_email || '',
    phone: user?.emergency_contact_phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(Notification.permission);

  const handleSaveContact = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updateResult = await api.emergencyContact.update(emergencyContact);
      const updatedUser = updateResult?.user || await api.auth.getUser();
      setUser(updatedUser);
      alert('Emergency contact updated successfully');
    } catch (e: any) {
      alert(e?.message || 'Failed to update contact');
    } finally {
      setSaving(false);
    }
  };

  const requestNotifications = async () => {
    const permission = await Notification.requestPermission();
    setNotificationStatus(permission);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Customize your experience and manage safety contacts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Accessibility Settings */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Eye size={20} className="text-sky-500" /> Accessibility
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-sky-600"><Type size={20} /></div>
                  <div>
                    <p className="font-bold text-gray-900">Elderly Mode</p>
                    <p className="text-xs text-gray-500">Larger fonts and buttons</p>
                  </div>
                </div>
                <button 
                  onClick={() => setElderlyMode(!elderlyMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${elderlyMode ? 'bg-sky-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${elderlyMode ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-sky-600"><Eye size={20} /></div>
                  <div>
                    <p className="font-bold text-gray-900">High Contrast</p>
                    <p className="text-xs text-gray-500">Better visibility for low vision</p>
                  </div>
                </div>
                <button 
                  onClick={() => setHighContrast(!highContrast)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${highContrast ? 'bg-sky-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${highContrast ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Bell size={20} className="text-sky-500" /> Notifications
            </h2>
            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
              <p className="text-sm text-sky-800 mb-4">
                Enable browser notifications to receive smart reminders for your medications.
              </p>
              <button 
                onClick={requestNotifications}
                disabled={notificationStatus === 'granted'}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  notificationStatus === 'granted' 
                  ? 'bg-green-100 text-green-600 cursor-default' 
                  : 'bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-100'
                }`}
              >
                {notificationStatus === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
              </button>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Shield size={20} className="text-sky-500" /> Emergency Contact
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            This person will be notified if you miss your medications repeatedly.
          </p>

          <form onSubmit={handleSaveContact} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                  value={emergencyContact.name}
                  onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                  value={emergencyContact.email}
                  onChange={(e) => setEmergencyContact({ ...emergencyContact, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="tel" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                  value={emergencyContact.phone}
                  onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100 flex items-center justify-center gap-2"
            >
              <Save size={20} /> {saving ? 'Saving...' : 'Save Contact'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
