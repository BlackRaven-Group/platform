import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileDown, Globe, Camera } from 'lucide-react';
import { supabase, type Dossier, type Target } from '../lib/supabase';
import { decryptPassword } from '../lib/crypto';

interface ReportExportProps {
  dossier: Dossier;
  targets: Target[];
  onBack: () => void;
}

export default function ReportExport({ dossier, targets, onBack }: ReportExportProps) {
  const [generating, setGenerating] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set(targets.map(t => t.id)));
  const [reportTheme, setReportTheme] = useState<'tactical' | 'classified'>('tactical');

  const toggleTarget = (id: string) => {
    setSelectedTargets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const generateHTML = async () => {
    setGenerating(true);

    const selectedTargetsList = targets.filter(t => selectedTargets.has(t.id));
    const allData: any = {};

    for (const target of selectedTargetsList) {
      const [phones, addresses, social, credentials, network, connections, employment, media, notes] = await Promise.all([
        supabase.from('phone_numbers').select('*').eq('target_id', target.id),
        supabase.from('addresses').select('*').eq('target_id', target.id),
        supabase.from('social_media').select('*').eq('target_id', target.id),
        supabase.from('credentials').select('*').eq('target_id', target.id),
        supabase.from('network_data').select('*').eq('target_id', target.id),
        supabase.from('connections').select('*').eq('target_id', target.id),
        supabase.from('employment').select('*').eq('target_id', target.id),
        supabase.from('media_files').select('*').eq('target_id', target.id),
        supabase.from('intelligence_notes').select('*').eq('target_id', target.id),
      ]);

      allData[target.id] = {
        target,
        phones: phones.data || [],
        addresses: addresses.data || [],
        social: social.data || [],
        credentials: credentials.data || [],
        network: network.data || [],
        connections: connections.data || [],
        employment: employment.data || [],
        media: media.data || [],
        notes: notes.data || [],
      };
    }

    const html = reportTheme === 'tactical'
      ? generateHTMLReport(dossier, allData)
      : generateClassifiedReport(dossier, allData);

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BlackRaven_INTEL_${dossier.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setGenerating(false);
  };

  const generatePDF = async () => {
    alert('PDF export uses the HTML file for best results. Please:\n\n1. Click "HTML REPORT" to download\n2. Open the HTML file in your browser\n3. Press Ctrl+P (or Cmd+P on Mac)\n4. Select "Save as PDF"\n5. Choose "Background graphics" in print settings\n\nThis ensures perfect rendering with maps, images, and exact colors.');
  };

  return (
    <div>
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={onBack} className="terminal-button">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {'>'} EXPORT BLACKRAVEN REPORT
          </h2>
          <p className="text-sm text-zinc-500">GENERATE COMPREHENSIVE INTELLIGENCE DOSSIER</p>
        </div>
      </div>

      <div className="terminal-box max-w-3xl">
        <h3 className="text-xl font-bold text-white mb-6">
          {'>'} {dossier.title}
        </h3>

        <div className="mb-6">
          <div className="data-label mb-3">SELECT TARGETS TO INCLUDE:</div>
          <div className="space-y-2">
            {targets.map(target => (
              <label key={target.id} className="flex items-center space-x-3 p-3 border border-zinc-800 rounded-sm hover:border-green-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTargets.has(target.id)}
                  onChange={() => toggleTarget(target.id)}
                  className="w-4 h-4"
                />
                <span className="data-value">
                  {target.first_name !== 'ND' && target.last_name !== 'ND'
                    ? `${target.first_name} ${target.last_name}`
                    : target.code_name}
                </span>
                <span className="text-green-800 text-xs">({target.code_name})</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t-2 border-zinc-800 pt-6 mt-6">
          <div className="data-label mb-4">REPORT THEME:</div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setReportTheme('tactical')}
              className={`p-4 border-2 rounded-sm transition-colors ${
                reportTheme === 'tactical'
                  ? 'border-green-500 bg-green-950/30'
                  : 'border-zinc-800 hover:border-green-700'
              }`}
            >
              <div className="font-bold text-zinc-200 mb-2">TACTICAL GREEN</div>
              <div className="text-xs text-zinc-500">Underground style terminal aesthetic</div>
            </button>
            <button
              onClick={() => setReportTheme('classified')}
              className={`p-4 border-2 rounded-sm transition-colors ${
                reportTheme === 'classified'
                  ? 'border-green-500 bg-green-950/30'
                  : 'border-zinc-800 hover:border-green-700'
              }`}
            >
              <div className="font-bold text-zinc-200 mb-2">CLASSIFIED B&W</div>
              <div className="text-xs text-zinc-500">Professional intelligence document</div>
            </button>
          </div>

          <div className="data-label mb-4">EXPORT OPTIONS:</div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={generateHTML}
              disabled={generating || selectedTargets.size === 0}
              className="terminal-button-primary flex items-center justify-center space-x-2 py-6"
            >
              <Globe className="w-6 h-6" />
              <div className="text-left">
                <div className="font-bold">HTML REPORT</div>
                <div className="text-xs opacity-70">Fully styled web page</div>
              </div>
            </button>

            <button
              onClick={generatePDF}
              disabled={generating || selectedTargets.size === 0}
              className="terminal-button-primary flex items-center justify-center space-x-2 py-6"
            >
              <FileDown className="w-6 h-6" />
              <div className="text-left">
                <div className="font-bold">PRINT TO PDF</div>
                <div className="text-xs opacity-70">Instructions for perfect export</div>
              </div>
            </button>
          </div>

          {selectedTargets.size === 0 && (
            <p className="text-yellow-600 text-sm mt-4">
              Please select at least one target to export.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function generateHTMLReport(dossier: Dossier, targetsData: any): string {
  const reportId = `K3P-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const timestamp = new Date().toISOString();

  const snakeLogo = `<svg width="60" height="60" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="92" stroke="#00ff00" stroke-width="1.5" fill="none" opacity="0.2"/><g opacity="0.3" stroke="#00ff00" stroke-width="1.5"><line x1="75" y1="92" x2="125" y2="92"/><line x1="100" y1="82" x2="100" y2="92"/></g><g fill="#00ff00" stroke="#00ff00" stroke-width="2.5"><path d="M 100 145 Q 75 145, 65 130 Q 58 115, 65 100 Q 72 85, 90 80" fill="none" stroke-width="14"/><path d="M 110 80 Q 128 85, 135 100 Q 142 115, 135 130 Q 125 145, 105 148" fill="none" stroke-width="14"/><path d="M 105 148 Q 92 152, 85 162 Q 82 172, 88 182" fill="none" stroke-width="13"/></g></svg>`;

  const watermarkLogo = `<svg width="120" height="120" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="92" stroke="#00ff00" stroke-width="1.5" fill="none" opacity="0.1"/><g opacity="0.15" stroke="#00ff00" stroke-width="1.5"><line x1="75" y1="92" x2="125" y2="92"/><line x1="100" y1="82" x2="100" y2="92"/></g><g fill="#00ff00" stroke="#00ff00" stroke-width="2.5" opacity="0.15"><path d="M 100 145 Q 75 145, 65 130 Q 58 115, 65 100 Q 72 85, 90 80" fill="none" stroke-width="14"/><path d="M 110 80 Q 128 85, 135 100 Q 142 115, 135 130 Q 125 145, 105 148" fill="none" stroke-width="14"/><path d="M 105 148 Q 92 152, 85 162 Q 82 172, 88 182" fill="none" stroke-width="13"/></g></svg>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="BlackRaven v1.0.0">
  <meta name="classification" content="${dossier.classification}">
  <meta name="report-id" content="${reportId}">
  <meta name="generated" content="${timestamp}">
  <title>BLACKRAVEN INTELLIGENCE REPORT - ${dossier.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      background: #000;
      color: #00ff00;
      padding: 40px;
      line-height: 1.6;
      position: relative;
    }
    body::before {
      content: '';
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 120px;
      height: 120px;
      opacity: 0.15;
      z-index: 0;
      pointer-events: none;
    }
    .container { max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; }
    .header {
      border: 3px solid #00ff00;
      padding: 40px;
      margin-bottom: 40px;
      background: rgba(0, 50, 0, 0.3);
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
    }
    .header h1 {
      font-size: 42px;
      color: #00ff00;
      text-shadow: 0 0 15px rgba(0, 255, 0, 0.9);
      margin-bottom: 12px;
      font-weight: bold;
    }
    .header .logo {
      opacity: 1;
      filter: drop-shadow(0 0 10px rgba(0, 255, 0, 0.6));
    }
    .header .meta {
      color: #00aa00;
      font-size: 12px;
    }
    .section {
      border: 2px solid #003300;
      padding: 20px;
      margin-bottom: 30px;
      background: rgba(0, 50, 0, 0.1);
      page-break-inside: avoid;
      position: relative;
    }
    .section::before {
      content: '⬢';
      position: absolute;
      top: 50%;
      right: 30px;
      transform: translateY(-50%);
      font-size: 80px;
      color: #00ff00;
      opacity: 0.05;
      pointer-events: none;
    }
    .section-title {
      font-size: 24px;
      color: #00ff00;
      border-bottom: 1px solid #003300;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .target-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 20px;
      padding: 20px;
      border: 1px solid #00aa00;
      background: rgba(0, 170, 0, 0.1);
    }
    .target-image {
      width: 150px;
      height: 150px;
      object-fit: cover;
      border: 2px solid #003300;
    }
    .target-info { flex: 1; }
    .data-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .data-item {
      padding: 10px;
      border: 1px solid #003300;
      background: rgba(0, 50, 0, 0.2);
    }
    .data-label {
      font-size: 10px;
      color: #00aa00;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }
    .data-value {
      color: #00ff00;
      font-size: 14px;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      font-size: 10px;
      border: 1px solid #00aa00;
      background: rgba(0, 170, 0, 0.2);
      margin-right: 5px;
    }
    .subsection {
      margin-top: 20px;
      padding: 15px;
      border-left: 3px solid #00aa00;
      background: rgba(0, 50, 0, 0.1);
    }
    .subsection-title {
      font-size: 16px;
      color: #00ff00;
      margin-bottom: 15px;
    }
    .record {
      padding: 10px;
      margin-bottom: 10px;
      border: 1px solid #003300;
      background: rgba(0, 30, 0, 0.3);
    }
    .media-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
    }
    .media-item img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border: 1px solid #003300;
    }
    .footer {
      margin-top: 40px;
      padding: 20px;
      border-top: 2px solid #003300;
      text-align: center;
      color: #00aa00;
      font-size: 10px;
    }
    @media print {
      @page {
        margin: 0.5in;
        size: letter;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        color-adjust: exact;
      }
      .section::before {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>⬢ BLACKRAVEN INTELLIGENCE REPORT</h1>
        <div class="meta">
          <div>REPORT ID: ${reportId}</div>
          <div>DOSSIER: ${dossier.title}</div>
        <div>CLASSIFICATION: ${dossier.classification.toUpperCase()}</div>
        <div>STATUS: ${dossier.status.toUpperCase()}</div>
        <div>TARGETS: ${Object.keys(targetsData).length}</div>
        <div>GENERATED: ${timestamp}</div>
        </div>
      </div>
      <div class="logo">${snakeLogo}</div>
    </div>

    ${dossier.description ? `
    <div style="border: 2px solid #003300; padding: 20px; margin-bottom: 30px; background: rgba(0, 50, 0, 0.1);">
      <div style="font-size: 14px; font-weight: bold; color: #00ff00; margin-bottom: 10px;">CASE BRIEF</div>
      <div style="color: #00aa00;">${dossier.description}</div>
    </div>
    ` : ''}

    ${Object.entries(targetsData).map(([targetId, data]: [string, any]) => {
      const target = data.target;
      const displayName = target.first_name !== 'ND' && target.last_name !== 'ND'
        ? `${target.first_name} ${target.last_name}`
        : target.code_name;

      const totalRecords = (data.phones?.length || 0) + (data.addresses?.length || 0) + (data.social?.length || 0) +
                           (data.credentials?.length || 0) + (data.network?.length || 0) +
                           (data.connections?.length || 0) + (data.employment?.length || 0) +
                           (data.media?.length || 0) + (data.notes?.length || 0);

      return `
        <div class="section">
          <div class="section-title">► TARGET: ${displayName} | RECORDS: ${totalRecords}</div>

          <div class="target-header">
            ${target.profile_image_url
              ? `<img src="${target.profile_image_url}" alt="${displayName}" class="target-image" />`
              : '<div class="target-image" style="background: rgba(0,50,0,0.3); display: flex; align-items: center; justify-content: center; color: #00aa00;">NO IMAGE</div>'
            }
            <div class="target-info">
              <h2 style="color: #00ff00; margin-bottom: 10px;">${displayName}</h2>
              <div class="data-label">CODE NAME: ${target.code_name}</div>
              <div style="margin-top: 10px;">
                <span class="badge">${target.status.toUpperCase()}</span>
                ${target.aliases && target.aliases.length > 0 ? `<span class="badge">ALIASES: ${target.aliases.join(', ')}</span>` : ''}
              </div>
            </div>
          </div>

          <div class="data-grid">
            <div class="data-item"><div class="data-label">First Name</div><div class="data-value">${target.first_name}</div></div>
            <div class="data-item"><div class="data-label">Last Name</div><div class="data-value">${target.last_name}</div></div>
            <div class="data-item"><div class="data-label">Date of Birth</div><div class="data-value">${target.date_of_birth || 'ND'}</div></div>
            <div class="data-item"><div class="data-label">Gender</div><div class="data-value">${target.gender}</div></div>
            <div class="data-item"><div class="data-label">Nationality</div><div class="data-value">${target.nationality}</div></div>
          </div>

          ${target.bio ? `<div class="subsection"><div class="data-label">BIOGRAPHY</div><div class="data-value">${target.bio}</div></div>` : ''}

          ${data.phones && data.phones.length > 0 ? `
            <div class="subsection">
              <div class="subsection-title">⬢ PHONE NUMBERS (${data.phones.length})</div>
              ${data.phones.map((phone: any) => `
                <div class="record">
                  <strong>${phone.phone_number}</strong>
                  <span class="badge">${phone.number_type.toUpperCase()}</span>
                  <span class="badge">${phone.status.toUpperCase()}</span>
                  ${phone.verified ? '<span class="badge" style="border-color: #00ff00;">VERIFIED</span>' : ''}
                  <div class="data-grid" style="margin-top: 10px;">
                    ${phone.country_code ? `<div class="data-item"><div class="data-label">Country</div><div class="data-value">${phone.country_code}</div></div>` : ''}
                    ${phone.carrier ? `<div class="data-item"><div class="data-label">Carrier</div><div class="data-value">${phone.carrier}</div></div>` : ''}
                    <div class="data-item"><div class="data-label">Confidence</div><div class="data-value">${phone.strength}/10</div></div>
                    ${phone.last_seen ? `<div class="data-item"><div class="data-label">Last Seen</div><div class="data-value">${new Date(phone.last_seen).toLocaleDateString()}</div></div>` : ''}
                    ${phone.source ? `<div class="data-item"><div class="data-label">Source</div><div class="data-value">${phone.source}</div></div>` : ''}
                  </div>
                  ${phone.notes ? `<div style="margin-top: 10px;"><div class="data-label">Notes</div><div class="data-value">${phone.notes}</div></div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${data.addresses && data.addresses.length > 0 ? `
            <div class="subsection">
              <div class="subsection-title">⬢ KNOWN LOCATIONS (${data.addresses.length})</div>
              ${data.addresses.map((addr: any) => `
                <div class="record">
                  <span class="badge">${addr.address_type.toUpperCase()}</span>
                  ${addr.verified ? '<span class="badge" style="border-color: #00ff00;">VERIFIED</span>' : ''}
                  <div class="data-grid" style="margin-top: 10px;">
                    ${addr.street_address ? `<div class="data-item"><div class="data-label">Street</div><div class="data-value">${addr.street_address}</div></div>` : ''}
                    ${addr.city ? `<div class="data-item"><div class="data-label">City</div><div class="data-value">${addr.city}</div></div>` : ''}
                    ${addr.state ? `<div class="data-item"><div class="data-label">State</div><div class="data-value">${addr.state}</div></div>` : ''}
                    ${addr.country ? `<div class="data-item"><div class="data-label">Country</div><div class="data-value">${addr.country}</div></div>` : ''}
                    ${addr.postal_code ? `<div class="data-item"><div class="data-label">Postal Code</div><div class="data-value">${addr.postal_code}</div></div>` : ''}
                    ${addr.latitude && addr.longitude ? `<div class="data-item"><div class="data-label">Coordinates</div><div class="data-value">${addr.latitude}, ${addr.longitude}</div></div>` : ''}
                    ${addr.last_seen ? `<div class="data-item"><div class="data-label">Last Seen</div><div class="data-value">${new Date(addr.last_seen).toLocaleDateString()}</div></div>` : ''}
                  </div>
                  ${addr.latitude && addr.longitude ? `
                    <div style="margin-top: 15px;">
                      <div class="data-label" style="margin-bottom: 8px;">⬢ GEOLOCATION INTEL</div>
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                          <div style="font-size: 10px; color: #00aa00; margin-bottom: 5px;">SATELLITE IMAGERY</div>
                          <div style="position: relative; width: 100%; height: 350px; border: 2px solid #003300; background: #1a1a1a; overflow: hidden;">
                            <iframe
                              width="100%"
                              height="100%"
                              frameborder="0"
                              scrolling="no"
                              marginheight="0"
                              marginwidth="0"
                              src="https://www.openstreetmap.org/export/embed.html?bbox=${addr.longitude - 0.01},${addr.latitude - 0.01},${addr.longitude + 0.01},${addr.latitude + 0.01}&layer=mapnik&marker=${addr.latitude},${addr.longitude}"
                              style="border: none; filter: contrast(1.1) saturate(0.9);"
                            ></iframe>
                            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: rgba(255,0,0,0.9); border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 15px rgba(255,0,0,0.9); pointer-events: none; z-index: 1000;"></div>
                          </div>
                        </div>
                        <div>
                          <div style="font-size: 10px; color: #00aa00; margin-bottom: 5px;">TACTICAL DATA</div>
                          <div style="width: 100%; height: 350px; border: 2px solid #003300; background: rgba(0,50,0,0.3); padding: 15px; overflow: auto;">
                            <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #003300;">
                              <div style="font-size: 9px; color: #00aa00; margin-bottom: 3px;">LATITUDE</div>
                              <div style="font-size: 14px; color: #00ff00; font-weight: bold;">${addr.latitude}°</div>
                            </div>
                            <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #003300;">
                              <div style="font-size: 9px; color: #00aa00; margin-bottom: 3px;">LONGITUDE</div>
                              <div style="font-size: 14px; color: #00ff00; font-weight: bold;">${addr.longitude}°</div>
                            </div>
                            <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #003300;">
                              <div style="font-size: 9px; color: #00aa00; margin-bottom: 3px;">DECIMAL FORMAT</div>
                              <div style="font-size: 11px; color: #00ff00; word-break: break-all;">${addr.latitude}, ${addr.longitude}</div>
                            </div>
                            <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #003300;">
                              <div style="font-size: 9px; color: #00aa00; margin-bottom: 3px;">DMS FORMAT</div>
                              <div style="font-size: 10px; color: #00ff00;">
                                ${Math.abs(addr.latitude).toFixed(0)}°${((Math.abs(addr.latitude) % 1) * 60).toFixed(0)}'${(((Math.abs(addr.latitude) * 60) % 1) * 60).toFixed(1)}"${addr.latitude >= 0 ? 'N' : 'S'}<br/>
                                ${Math.abs(addr.longitude).toFixed(0)}°${((Math.abs(addr.longitude) % 1) * 60).toFixed(0)}'${(((Math.abs(addr.longitude) * 60) % 1) * 60).toFixed(1)}"${addr.longitude >= 0 ? 'E' : 'W'}
                              </div>
                            </div>
                            <div style="font-size: 9px; color: #00aa00; margin-bottom: 3px;">VERIFICATION STATUS</div>
                            <div style="font-size: 11px; color: ${addr.verified ? '#00ff00' : '#ffaa00'};">
                              ${addr.verified ? '✓ COORDINATES VERIFIED' : '⚠ UNVERIFIED'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style="margin-top: 10px; padding: 10px; background: rgba(0,50,0,0.2); border-left: 3px solid #00aa00; font-size: 10px; color: #00aa00;">
                        <div style="margin-bottom: 5px; font-weight: bold;">EXTERNAL MAPPING LINKS:</div>
                        <a href="https://www.google.com/maps?q=${addr.latitude},${addr.longitude}&t=k" target="_blank" style="color: #00ff00; text-decoration: none; margin-right: 15px;">► Google Maps (Satellite)</a>
                        <a href="https://www.openstreetmap.org/?mlat=${addr.latitude}&mlon=${addr.longitude}&zoom=18" target="_blank" style="color: #00ff00; text-decoration: none; margin-right: 15px;">► OpenStreetMap</a>
                        <a href="https://www.bing.com/maps?cp=${addr.latitude}~${addr.longitude}&style=a" target="_blank" style="color: #00ff00; text-decoration: none;">► Bing Maps (Aerial)</a>
                      </div>
                    </div>
                  ` : ''}
                  ${addr.notes ? `<div style="margin-top: 10px;"><div class="data-label">Notes</div><div class="data-value">${addr.notes}</div></div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${data.social && data.social.length > 0 ? `
            <div class="subsection">
              <div class="subsection-title">⬢ SOCIAL MEDIA (${data.social.length})</div>
              ${data.social.map((social: any) => `
                <div class="record">
                  <strong>${social.platform.toUpperCase()}</strong> - @${social.username}
                  ${social.profile_url ? `<br/><a href="${social.profile_url}" style="color: #00ff00;">${social.profile_url}</a>` : ''}
                  <br/>Followers: ${social.follower_count.toLocaleString()} | Status: ${social.status.toUpperCase()}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${data.credentials && data.credentials.length > 0 ? `
            <div class="subsection">
              <div class="subsection-title">⬢ CREDENTIALS (${data.credentials.length})</div>
              ${data.credentials.map((cred: any) => `
                <div class="record">
                  <strong>${cred.service}</strong>
                  <div class="data-grid" style="margin-top: 10px;">
                    ${cred.username ? `<div class="data-item"><div class="data-label">Username</div><div class="data-value">${cred.username}</div></div>` : ''}
                    ${cred.email ? `<div class="data-item"><div class="data-label">Email</div><div class="data-value">${cred.email}</div></div>` : ''}
                    ${cred.password_encrypted ? `<div class="data-item"><div class="data-label">Password (Decrypted)</div><div class="data-value">${decryptPassword(cred.password_encrypted)}</div></div>` : ''}
                    ${cred.password_hash ? `<div class="data-item"><div class="data-label">Hash</div><div class="data-value">${cred.password_hash}</div></div>` : ''}
                    ${cred.breach_source ? `<div class="data-item"><div class="data-label">Breach Source</div><div class="data-value">${cred.breach_source}</div></div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${data.network && data.network.length > 0 ? `
            <div class="subsection">
              <div class="subsection-title">⬢ NETWORK DATA (${data.network.length})</div>
              ${data.network.map((net: any) => `
                <div class="record">
                  <strong>${net.ip_address}</strong> - ${net.ip_type.toUpperCase()}
                  <br/>ISP: ${net.isp} | Location: ${net.location} | Confidence: ${net.confidence.toUpperCase()}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${data.connections && data.connections.length > 0 ? `
            <div class="subsection">
              <div class="subsection-title">⬢ CONNECTIONS (${data.connections.length})</div>
              ${data.connections.map((conn: any) => `
                <div class="record">
                  <strong>${conn.connection_name}</strong> - ${conn.relationship_type.toUpperCase()}
                  ${conn.relationship_details ? `<br/>${conn.relationship_details}` : ''}
                  <br/>Strength: ${conn.strength}/10 ${conn.verified ? '| VERIFIED' : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${data.employment && data.employment.length > 0 ? `
            <div class="subsection">
              <div class="subsection-title">⬢ EMPLOYMENT & EDUCATION (${data.employment.length})</div>
              ${data.employment.map((emp: any) => `
                <div class="record">
                  <strong>${emp.organization}</strong> ${emp.position ? `- ${emp.position}` : ''}
                  <br/>${emp.record_type.toUpperCase()} | ${emp.start_date ? new Date(emp.start_date).toLocaleDateString() : 'ND'} - ${emp.current ? 'CURRENT' : emp.end_date ? new Date(emp.end_date).toLocaleDateString() : 'ND'}
                  ${emp.location ? `<br/>Location: ${emp.location}` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${data.media && data.media.length > 0 ? `
            <div class="subsection">
              <div class="subsection-title">⬢ MEDIA FILES (${data.media.length})</div>
              <div class="media-grid">
                ${data.media.map((media: any) => `
                  <div class="media-item">
                    ${['photo', 'screenshot', 'satellite-image'].includes(media.file_type)
                      ? `<img src="${media.file_url}" alt="${media.title || 'Media'}" />`
                      : '<div style="height: 150px; background: rgba(0,50,0,0.3); display: flex; align-items: center; justify-content: center; color: #00aa00;">FILE</div>'
                    }
                    <div style="padding: 10px; background: rgba(0,30,0,0.3);">
                      <div class="badge">${media.file_type.toUpperCase()}</div>
                      ${media.title ? `<div style="margin-top: 5px; color: #00ff00;">${media.title}</div>` : ''}
                      ${media.description ? `<div style="margin-top: 5px; font-size: 11px; color: #00aa00;">${media.description}</div>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${data.notes && data.notes.length > 0 ? `
            <div class="subsection">
              <div class="subsection-title">⬢ INTELLIGENCE NOTES (${data.notes.length})</div>
              ${data.notes.map((note: any) => `
                <div class="record">
                  <span class="badge">${note.category.toUpperCase()}</span>
                  <span class="badge">${note.priority.toUpperCase()} PRIORITY</span>
                  <div style="margin-top: 10px; white-space: pre-wrap;">${note.content}</div>
                  ${note.source ? `<div style="margin-top: 10px;"><span class="data-label">Source:</span> ${note.source}</div>` : ''}
                  <div style="margin-top: 5px; font-size: 10px; color: #00aa00;">${new Date(note.created_at).toLocaleString()}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('')}

    <div class="footer">
      <div style="font-size: 12px; font-weight: bold;">BLACKRAVEN INTELLIGENCE PLATFORM</div>
      <div style="margin-top: 8px;">REPORT ID: ${reportId} | GENERATED: ${timestamp}</div>
    </div>
  </div>
</body>
</html>`;
}


function generateClassifiedReport(dossier: Dossier, targetsData: any): string {
  const reportId = 'DOC-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
  const timestamp = new Date().toISOString();
  const formattedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const snakeLogo = '<svg width="50" height="50" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="92" stroke="#000" stroke-width="1.5" fill="none" opacity="0.2"/><g opacity="0.3" stroke="#000" stroke-width="1.5"><line x1="75" y1="92" x2="125" y2="92"/><line x1="100" y1="82" x2="100" y2="92"/></g><g fill="#000" stroke="#000" stroke-width="2.5"><path d="M 100 145 Q 75 145, 65 130 Q 58 115, 65 100 Q 72 85, 90 80" fill="none" stroke-width="14"/><path d="M 110 80 Q 128 85, 135 100 Q 142 115, 135 130 Q 125 145, 105 148" fill="none" stroke-width="14"/><path d="M 105 148 Q 92 152, 85 162 Q 82 172, 88 182" fill="none" stroke-width="13"/></g></svg>';

  let targetsHTML = '';
  for (const [targetId, data] of Object.entries(targetsData)) {
    const typedData: any = data;
    const target = typedData.target;
    
    const targetName = (target.first_name !== 'ND' && target.last_name !== 'ND')
      ? target.last_name + ', ' + target.first_name
      : 'IDENTITY UNKNOWN';

    targetsHTML += '<div class="section"><div class="section-header">Subject: ' + target.code_name + '</div>';

    if (target.profile_image_url) {
      targetsHTML += '<div style="margin-bottom:15px;text-align:center;"><img src="' + target.profile_image_url + '" alt="' + targetName + '" style="max-width:200px;max-height:200px;border:2px solid #000;"/></div>';
    }

    targetsHTML += '<div class="target-profile"><table class="profile-table"><tr><th colspan="2" style="text-align:left;font-size:16px;">' + targetName + '</th></tr>';

    if (target.date_of_birth) {
      targetsHTML += '<tr><td>Date of Birth</td><td>' + new Date(target.date_of_birth).toLocaleDateString() + '</td></tr>';
    }
    if (target.gender && target.gender !== 'ND') {
      targetsHTML += '<tr><td>Gender</td><td>' + target.gender + '</td></tr>';
    }
    if (target.nationality && target.nationality !== 'ND') {
      targetsHTML += '<tr><td>Nationality</td><td>' + target.nationality + '</td></tr>';
    }
    targetsHTML += '<tr><td>Status</td><td>' + target.status.toUpperCase() + '</td></tr>';
    if (target.bio) {
      targetsHTML += '<tr><td>Background</td><td>' + target.bio + '</td></tr>';
    }
    targetsHTML += '</table></div>';

    if (typedData.phones && typedData.phones.length > 0) {
      targetsHTML += '<div class="subsection"><div class="subsection-title">Phone Numbers</div><table class="data-table"><thead><tr><th>Number</th><th>Type</th><th>Carrier</th><th>Status</th></tr></thead><tbody>';
      typedData.phones.forEach((phone: any) => {
        targetsHTML += '<tr><td>' + phone.phone_number + (phone.verified ? ' ✓' : '') + '</td><td>' + phone.number_type + '</td><td>' + (phone.carrier || '-') + '</td><td>' + phone.status + '</td></tr>';
      });
      targetsHTML += '</tbody></table></div>';
    }

    if (typedData.addresses && typedData.addresses.length > 0) {
      targetsHTML += '<div class="subsection"><div class="subsection-title">Locations</div>';
      typedData.addresses.forEach((addr: any) => {
        let addrStr = '';
        if (addr.street_address) addrStr += addr.street_address + ', ';
        if (addr.city) addrStr += addr.city + ', ';
        if (addr.state) addrStr += addr.state + ' ';
        if (addr.postal_code) addrStr += addr.postal_code + ', ';
        if (addr.country) addrStr += addr.country;
        targetsHTML += '<div class="record">' + addrStr + '</div>';
      });
      targetsHTML += '</div>';
    }

    if (typedData.social && typedData.social.length > 0) {
      targetsHTML += '<div class="subsection"><div class="subsection-title">Online Accounts</div><table class="data-table"><thead><tr><th>Platform</th><th>Username</th><th>URL</th></tr></thead><tbody>';
      typedData.social.forEach((acc: any) => {
        targetsHTML += '<tr><td>' + acc.platform + '</td><td>' + (acc.username || '-') + '</td><td style="font-size:9px;">' + (acc.profile_url || '-') + '</td></tr>';
      });
      targetsHTML += '</tbody></table></div>';
    }

    if (typedData.credentials && typedData.credentials.length > 0) {
      targetsHTML += '<div class="subsection"><div class="subsection-title">Credentials</div><table class="data-table"><thead><tr><th>Service</th><th>Email/Username</th></tr></thead><tbody>';
      typedData.credentials.forEach((cred: any) => {
        targetsHTML += '<tr><td>' + cred.service + '</td><td>' + (cred.email || cred.username || '-') + '</td></tr>';
      });
      targetsHTML += '</tbody></table></div>';
    }

    if (typedData.network && typedData.network.length > 0) {
      targetsHTML += '<div class="subsection"><div class="subsection-title">Network Data</div><table class="data-table"><thead><tr><th>IP Address</th><th>Type</th><th>ISP</th><th>Location</th></tr></thead><tbody>';
      typedData.network.forEach((net: any) => {
        targetsHTML += '<tr><td>' + net.ip_address + '</td><td>' + net.ip_type + '</td><td>' + (net.isp || '-') + '</td><td>' + (net.location || '-') + '</td></tr>';
      });
      targetsHTML += '</tbody></table></div>';
    }

    if (typedData.connections && typedData.connections.length > 0) {
      targetsHTML += '<div class="subsection"><div class="subsection-title">Connections</div><table class="data-table"><thead><tr><th>Name</th><th>Relationship</th><th>Strength</th></tr></thead><tbody>';
      typedData.connections.forEach((conn: any) => {
        targetsHTML += '<tr><td>' + conn.connection_name + '</td><td>' + conn.relationship_type + '</td><td>' + conn.strength + '/10' + (conn.verified ? ' ✓' : '') + '</td></tr>';
      });
      targetsHTML += '</tbody></table></div>';
    }

    if (typedData.employment && typedData.employment.length > 0) {
      targetsHTML += '<div class="subsection"><div class="subsection-title">Employment & Education</div><table class="data-table"><thead><tr><th>Organization</th><th>Position</th><th>Type</th><th>Period</th></tr></thead><tbody>';
      typedData.employment.forEach((emp: any) => {
        const period = (emp.start_date ? new Date(emp.start_date).toLocaleDateString() : 'ND') + ' - ' + (emp.current ? 'Current' : emp.end_date ? new Date(emp.end_date).toLocaleDateString() : 'ND');
        targetsHTML += '<tr><td>' + emp.organization + '</td><td>' + (emp.position || '-') + '</td><td>' + emp.record_type + '</td><td>' + period + '</td></tr>';
      });
      targetsHTML += '</tbody></table></div>';
    }

    if (typedData.media && typedData.media.length > 0) {
      targetsHTML += '<div class="subsection"><div class="subsection-title">Media Files</div>';
      typedData.media.forEach((media: any) => {
        targetsHTML += '<div class="record"><strong>' + media.file_type.toUpperCase() + ':</strong> ' + (media.title || media.file_url);
        if (media.description) targetsHTML += '<br/>' + media.description;
        if (['photo', 'screenshot', 'satellite-image'].includes(media.file_type)) {
          targetsHTML += '<br/><img src="' + media.file_url + '" style="max-width:300px;margin-top:10px;border:1px solid #000;" />';
        }
        targetsHTML += '</div>';
      });
      targetsHTML += '</div>';
    }

    if (typedData.notes && typedData.notes.length > 0) {
      targetsHTML += '<div class="subsection"><div class="subsection-title">Intelligence Notes</div>';
      typedData.notes.forEach((note: any) => {
        targetsHTML += '<div class="record"><strong>' + note.category.toUpperCase() + ' [' + note.priority.toUpperCase() + ']:</strong> ' + note.content;
        if (note.source) targetsHTML += '<br/><em>Source: ' + note.source + '</em>';
        targetsHTML += '</div>';
      });
      targetsHTML += '</div>';
    }

    targetsHTML += '</div>';
  }

  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>INTELLIGENCE REPORT - ' + dossier.title + '</title><style>@media print{@page{margin:0.5in}}*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Times New Roman",serif;background:#fff;color:#000;padding:0;line-height:1.4;font-size:12px;position:relative}.page{max-width:8.5in;margin:0 auto;padding:0.5in;background:white;position:relative;z-index:1}.classification-bar{text-align:center;font-weight:bold;font-size:14px;letter-spacing:2px;padding:10px;background:#000;color:#fff;margin:15px 0}.document-header{border-bottom:3px solid #000;padding-bottom:20px;margin-bottom:25px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 5px rgba(0,0,0,0.1)}.document-header h1{font-size:24px;font-weight:bold;text-transform:uppercase;margin:0}.document-header .logo{opacity:1}.metadata{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;border:2px solid #000;padding:15px;margin-bottom:25px;font-size:10px;background:#f5f5f5}.metadata-item{padding:3px 0}.metadata-label{font-weight:bold;text-transform:uppercase}.metadata-value{margin-top:2px}.section{margin-bottom:30px;page-break-inside:avoid;position:relative}.section::before{content:"K3PR0S";position:absolute;top:50%;right:30px;transform:translateY(-50%) rotate(-15deg);font-size:60px;font-weight:bold;color:#ddd;opacity:0.08;pointer-events:none;font-family:monospace}.section-header{font-size:14px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #000;padding-bottom:5px;margin-bottom:15px}.subsection{margin-bottom:20px}.subsection-title{font-size:11px;font-weight:bold;text-transform:uppercase;margin-bottom:8px;letter-spacing:0.5px}.target-profile{margin-bottom:20px}.profile-table{width:100%;border-collapse:collapse}.profile-table td,.profile-table th{border:1px solid #000;padding:6px;text-align:left;font-size:11px}.profile-table th{background:#f5f5f5;font-weight:bold}.data-table{width:100%;border-collapse:collapse;margin:10px 0}.data-table th,.data-table td{border:1px solid #000;padding:5px;text-align:left;font-size:10px}.data-table th{background:#000;color:#fff;font-weight:bold}.record{padding:8px;margin-bottom:5px;border-left:2px solid #000;background:#f9f9f9;font-size:11px}.footer{margin-top:40px;padding-top:15px;border-top:1px solid #000;text-align:center;font-size:9px}@media print{.section::before{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="page"><div class="classification-bar">' + dossier.classification.toUpperCase() + '</div><div class="document-header"><div><h1>' + dossier.title + '</h1><div style="font-size:11px;margin-top:5px;">Intelligence Report</div></div><div class="logo">' + snakeLogo + '</div></div><div class="metadata"><div class="metadata-item"><div class="metadata-label">Document ID</div><div class="metadata-value">' + reportId + '</div></div><div class="metadata-item"><div class="metadata-label">Classification</div><div class="metadata-value">' + dossier.classification.toUpperCase() + '</div></div><div class="metadata-item"><div class="metadata-label">Date</div><div class="metadata-value">' + formattedDate + '</div></div><div class="metadata-item"><div class="metadata-label">Status</div><div class="metadata-value">' + dossier.status.toUpperCase() + '</div></div></div>' + targetsHTML + '<div class="footer"><div>Document ID: ' + reportId + ' | Generated: ' + timestamp + '</div><div style="margin-top:5px;">SENSITIVE INFORMATION - HANDLE ACCORDINGLY</div></div><div class="classification-bar">' + dossier.classification.toUpperCase() + '</div></div></body></html>';
}
