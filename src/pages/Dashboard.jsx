import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HexColorPicker } from 'react-colorful';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { ClipboardDocumentIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

export default function Dashboard({ session }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    primaryColor: '#2563eb',
    businessName: '',
    businessInfo: '',
    salesRepName: ''
  });
  const [showCode, setShowCode] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        if (!session?.user?.id) return;

        const { data, error } = await supabase
          .from('widget_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (!mounted) return;

        if (error) {
          if (error.code === 'PGRST116') { // Not found error
            // Create default settings
            const defaultSettings = {
              user_id: session.user.id,
              primary_color: '#2563eb',
              business_name: '',
              business_info: '',
              sales_rep_name: ''
            };

            const { data: insertedData, error: insertError } = await supabase
              .from('widget_settings')
              .insert(defaultSettings)
              .select()
              .single();

            if (insertError) throw insertError;
            
            if (insertedData) {
              setSettings({
                primaryColor: insertedData.primary_color,
                businessName: insertedData.business_name,
                businessInfo: insertedData.business_info,
                salesRepName: insertedData.sales_rep_name
              });
            }
          } else {
            throw error;
          }
        } else if (data) {
          setSettings({
            primaryColor: data.primary_color,
            businessName: data.business_name,
            businessInfo: data.business_info,
            salesRepName: data.sales_rep_name
          });
        }
        
        setShowCode(true);
      } catch (error) {
        console.error('Error loading settings:', error);
        if (mounted) {
          toast.error('Error loading settings. Please try again.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      mounted = false;
      const existingWidget = document.querySelector('.chat-widget');
      if (existingWidget) {
        existingWidget.remove();
      }
    };
  }, [session]);

  // Initialize widget when settings change
  useEffect(() => {
    if (!loading && session?.user?.id) {
      const existingWidget = document.querySelector('.chat-widget');
      if (existingWidget) {
        existingWidget.remove();
      }

      const baseUrl = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
        ? window.location.origin
        : 'https://chatwidgetai.netlify.app';

      const script = document.createElement('script');
      script.src = `${baseUrl}/chat.js`;
      script.async = true;
      script.onload = () => {
        new window.ChatWidget({
          uid: session.user.id,
          ...settings
        });
      };
      document.head.appendChild(script);
    }
  }, [loading, session, settings]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateSettings = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('widget_settings')
        .upsert({
          user_id: session.user.id,
          primary_color: settings.primaryColor,
          business_name: settings.businessName,
          business_info: settings.businessInfo,
          sales_rep_name: settings.salesRepName
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Fetch updated settings to confirm changes
      const { data: updatedData, error: fetchError } = await supabase
        .from('widget_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (fetchError) throw fetchError;

      if (updatedData) {
        setSettings({
          primaryColor: updatedData.primary_color,
          businessName: updatedData.business_name,
          businessInfo: updatedData.business_info,
          salesRepName: updatedData.sales_rep_name
        });
      }

      toast.success('Settings saved successfully!');
      setShowCode(true);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      const existingWidget = document.querySelector('.chat-widget');
      if (existingWidget) {
        existingWidget.remove();
      }
      
      toast.success('Signed out successfully');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const getWidgetCode = () => {
    const baseUrl = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
      ? window.location.origin
      : 'https://chatwidgetai.netlify.app';

    return `<!-- AI Chat Widget -->
<script>
(function() {
  var script = document.createElement('script');
  script.src = '${baseUrl}/chat.js';
  script.async = true;
  script.crossOrigin = "anonymous";
  script.onload = function() {
    new ChatWidget({
      uid: '${session.user.id}'
    });
  };
  document.head.appendChild(script);
})();
</script>`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getWidgetCode());
      toast.success('Widget code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy code:', err);
      toast.error('Failed to copy code. Please try selecting and copying manually.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-indigo-600 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">
              Chat Widget Settings
            </h1>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 text-sm text-white hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
              Sign Out
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Settings</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="w-full h-10 rounded-lg border shadow-sm transition-transform hover:scale-105"
                        style={{ backgroundColor: settings.primaryColor }}
                      />
                      {showColorPicker && (
                        <div className="absolute z-10 mt-2">
                          <div className="fixed inset-0" onClick={() => setShowColorPicker(false)} />
                          <HexColorPicker
                            color={settings.primaryColor}
                            onChange={(color) => handleSettingChange('primaryColor', color)}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={settings.businessName}
                      onChange={(e) => handleSettingChange('businessName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter your business name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Information
                    </label>
                    <textarea
                      rows={3}
                      value={settings.businessInfo}
                      onChange={(e) => handleSettingChange('businessInfo', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter information about your business..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sales Representative Name
                    </label>
                    <input
                      type="text"
                      value={settings.salesRepName}
                      onChange={(e) => handleSettingChange('salesRepName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter sales rep name"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={updateSettings}
              disabled={saving}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Please wait...
                </span>
              ) : (
                'Save Settings'
              )}
            </button>

            {showCode && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    Install Widget on Your Website
                  </h2>
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
                    Copy Code
                  </button>
                </div>
                <div className="relative">
                  <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm">
                    <code>{getWidgetCode()}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}