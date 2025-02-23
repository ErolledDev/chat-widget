import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HexColorPicker } from 'react-colorful';
import { supabase } from '../supabase';
import { ChatWidget } from '../chat';

export default function Dashboard({ session }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    primaryColor: '#2563eb',
    businessName: '',
    businessInfo: '',
    salesRepName: '',
  });
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (session) {
      getSettings();
    }
  }, [session]);

  async function getSettings() {
    try {
      setLoading(true);
      
      let { data, error } = await supabase
        .from('widget_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const latestSettings = data[0];
        setSettings({
          primaryColor: latestSettings.primary_color,
          businessName: latestSettings.business_name,
          businessInfo: latestSettings.business_info,
          salesRepName: latestSettings.sales_rep_name,
        });
      } else {
        const defaultSettings = {
          user_id: session.user.id,
          primary_color: '#2563eb',
          business_name: '',
          business_info: '',
          sales_rep_name: '',
        };

        const { error: insertError } = await supabase
          .from('widget_settings')
          .insert(defaultSettings);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      alert('Error loading settings. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function updateSettings() {
    try {
      setLoading(true);
      
      await supabase
        .from('widget_settings')
        .delete()
        .eq('user_id', session.user.id);

      const { error } = await supabase
        .from('widget_settings')
        .insert({
          user_id: session.user.id,
          primary_color: settings.primaryColor,
          business_name: settings.businessName,
          business_info: settings.businessInfo,
          sales_rep_name: settings.salesRepName,
        });

      if (error) throw error;
      alert('Settings saved successfully!');
      setShowCode(true);

      // Initialize widget for preview
      new ChatWidget(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/');
    }
  };

  const getWidgetCode = () => {
    const settingsStr = JSON.stringify({
      primaryColor: settings.primaryColor,
      businessName: settings.businessName,
      businessInfo: settings.businessInfo,
      salesRepName: settings.salesRepName
    }).replace(/"/g, '&quot;');

    return `<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://chatwidgetai.netlify.app/chat.js';
    script.onload = function() {
      var settings = JSON.parse('${settingsStr}');
      window.chatWidget = new ChatWidget(settings);
    };
    document.head.appendChild(script);
  })();
</script>`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getWidgetCode());
      alert('Widget code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy code:', err);
      alert('Failed to copy code. Please try selecting and copying manually.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Chat Widget Settings
            </h1>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800"
            >
              Sign Out
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Primary Color
              </label>
              <div className="mt-2">
                <HexColorPicker
                  color={settings.primaryColor}
                  onChange={(color) =>
                    setSettings({ ...settings, primaryColor: color })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Business Name
              </label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) =>
                  setSettings({ ...settings, businessName: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sales Representative Name
              </label>
              <input
                type="text"
                value={settings.salesRepName}
                onChange={(e) =>
                  setSettings({ ...settings, salesRepName: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Business Information
              </label>
              <textarea
                rows={4}
                value={settings.businessInfo}
                onChange={(e) =>
                  setSettings({ ...settings, businessInfo: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter information about your business, products, services, and any specific instructions for the AI..."
              />
            </div>

            <button
              onClick={updateSettings}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>

            {showCode && (
              <div className="mt-8 space-y-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Install Widget on Your Website
                </h2>
                <p className="text-sm text-gray-600">
                  Copy and paste this code snippet just before the closing &lt;/body&gt; tag of your website:
                </p>
                <div className="relative">
                  <pre className="bg-gray-50 rounded-md p-4 overflow-x-auto text-sm">
                    <code>{getWidgetCode()}</code>
                  </pre>
                  <button
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}