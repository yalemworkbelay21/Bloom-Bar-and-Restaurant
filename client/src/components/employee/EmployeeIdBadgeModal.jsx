import React, { useState, useEffect, useRef } from 'react';
import {
  X, Printer, RotateCw, CheckCircle2, ShieldCheck, Building2,
  Phone, Mail, Award, Sparkles, User, Camera, Upload, QrCode as QrIcon
} from 'lucide-react';
import QRCode from 'qrcode';
import { BloomAfricaIcon } from '../ui/BloomAfricaLogo';
import { normalizeFileUrl } from '../../utils/fileUrl';

/**
 * Corporate Digital Staff ID Badge Modal for Bloom Bar & Restaurant
 * Features 3×4 passport portrait, bilingual English/Amharic headers, diagonal accent stripes,
 * scannable QR verification, lanyard punch-hole casing, and isolated iframe print engine.
 */
export default function EmployeeIdBadgeModal({
  open,
  onClose,
  employee,
  onEdit,
  isNewlyCreated = false,
}) {
  const [side, setSide] = useState('front'); // 'front' | 'back'
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const badgeRef = useRef(null);

  const rolePositions = {
    admin: 'System Administrator',
    manager: 'General Manager',
    supervisor: 'Supervisor',
    storekeeper: 'Store Keeper',
    cashier: 'Cashier',
    waiter: 'Waiter',
    dev: 'System Developer',
  };

  const roleDepartments = {
    admin: 'Management',
    manager: 'Management',
    supervisor: 'Food & Beverage',
    storekeeper: 'Store & Inventory',
    cashier: 'Finance & Cashier',
    waiter: 'Dining & Service',
    dev: 'IT & Systems',
  };

  const fullName = employee
    ? (employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`).trim()
    : 'Staff Member';

  const employeeId = employee?.employeeId
    ? employee.employeeId
    : employee?._id
    ? `EMP-${String(employee._id).slice(-4).toUpperCase()}`
    : 'EMP-0001';

  const position = employee?.position
    || (employee?.role ? rolePositions[employee.role] || employee.role : 'Staff Member');

  const department = employee?.department
    || (employee?.role ? roleDepartments[employee.role] || 'Dining & Service' : 'Dining & Service');

  const hireDate = employee?.hireDate
    ? new Date(employee.hireDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : employee?.createdAt
    ? new Date(employee.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const rawPhoto = employee?.photoUrl || employee?.avatar || '';
  const photoSrc = rawPhoto ? normalizeFileUrl(rawPhoto) : '';

  const isCardActive = employee?.isActive !== undefined ? employee.isActive : (employee?.status !== 'inactive');

  // Compute initials
  const initials = (() => {
    if (employee?.firstName) {
      return `${employee.firstName[0]}${employee.lastName?.[0] || ''}`.toUpperCase();
    }
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    return 'BA';
  })();

  // Generate QR Code data URL
  useEffect(() => {
    if (!employee) return;
    const qrPayload = JSON.stringify({
      id: employeeId,
      name: fullName,
      dept: department,
      role: position,
      org: 'Bloom Bar & Restaurant',
      verify: 'OFFICIAL_STAFF_PASS',
    });

    QRCode.toDataURL(qrPayload, {
      width: 140,
      margin: 1,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('QR code generation failed:', err));
  }, [employee, fullName, employeeId, department, position]);

  // Reset photo load error when photo source changes
  useEffect(() => {
    setPhotoLoadError(false);
  }, [photoSrc]);

  // Isolated iframe print engine — works 100% reliably across all browsers without blank pages
  const handlePrint = (mode = 'both') => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const resolvedPhoto = photoSrc
      ? (photoSrc.startsWith('/') ? `${origin}${photoSrc}` : photoSrc)
      : '';
    const logoUrl = `${origin}/bloom-logo.png`;

    const frontCardHtml = `
      <div class="badge-card">
        <!-- Slot Hole -->
        <div class="slot-hole">
          <div class="slot-pill"></div>
        </div>

        <!-- Top Header: Logo + Diagonal Stripes -->
        <div class="header-row">
          <div class="brand-box">
            <img src="${logoUrl}" class="brand-logo" alt="Logo" onerror="this.style.display='none'">
            <div class="brand-text">
              <h1>BLOOM</h1>
              <p>BAR &amp; RESTAURANT</p>
            </div>
          </div>
          <div class="stripes-box">
            <div class="stripe-gold"></div>
            <div class="stripe-navy"></div>
          </div>
        </div>

        <!-- 3x4 Passport Photo Area -->
        <div class="photo-area">
          <div class="photo-frame">
            ${resolvedPhoto ? `
              <img src="${resolvedPhoto}" class="photo-img" alt="${fullName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div class="initials-fallback" style="display:none;">
                <div class="initials-circle">${initials}</div>
                <div style="font-size:9px;color:#64748b;font-weight:700;">3×4 Photo</div>
              </div>
            ` : `
              <div class="initials-fallback">
                <div class="initials-circle">${initials}</div>
                <div style="font-size:9px;color:#64748b;font-weight:700;">3×4 Photo</div>
              </div>
            `}
            <div class="status-dot"></div>
          </div>
        </div>

        <!-- Employee Info Block -->
        <div class="info-area">
          <div class="info-item">
            <div class="label">ስም / Name:</div>
            <div class="val-name">${fullName}</div>
          </div>

          <div class="info-item">
            <div class="label">የሥራ መደብ / Position:</div>
            <div class="val-position">
              <span>${position}</span>
              <span class="dept-pill">${department}</span>
            </div>
          </div>

          <div class="id-row">
            <div>
              <div class="label">መለያ ቁጥር / ID No:</div>
              <div class="val-id">${employeeId}</div>
              <div style="font-size:8px;color:#64748b;margin-top:2px;">Issue: ${hireDate}</div>
            </div>
            ${qrCodeUrl ? `
              <div style="text-align:center;">
                <img src="${qrCodeUrl}" class="qr-img" alt="QR">
                <div style="font-size:6px;font-weight:800;color:#94a3b8;letter-spacing:1px;margin-top:1px;">VERIFY</div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Footer -->
        <div class="footer-bar">
          <div>☎ +251 91 100 0000</div>
          <div>✉ info@bloombarrestaurant.com</div>
        </div>
      </div>
    `;

    const backCardHtml = `
      <div class="badge-card back-card">
        <div class="slot-hole">
          <div class="slot-pill"></div>
        </div>

        <div style="padding: 10px 14px 6px 14px; border-bottom: 1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="${logoUrl}" style="width:24px;height:24px;border-radius:6px;object-fit:cover;" onerror="this.style.display='none'">
            <div>
              <div style="font-size:10px;font-weight:900;color:#0f172a;letter-spacing:0.3px;">BLOOM BAR &amp; RESTAURANT</div>
              <div style="font-size:7.5px;font-weight:700;color:#1e3a8a;text-transform:uppercase;">Staff Pass Guidelines</div>
            </div>
          </div>
          <div style="font-family:monospace;font-size:9px;font-weight:800;color:#64748b;">${employeeId}</div>
        </div>

        <div style="padding: 10px 14px; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
          <div style="font-size:8px;color:#334155;line-height:1.5;">
            <p style="margin-bottom:3px;"><b>1.</b> ይህ መታወቂያ የብሉም ባር እና ሬስቶራንት ንብረት ሲሆን በሥራ ሰዓት መያዝ ግዴታ ነው። / Must be worn on duty.</p>
            <p style="margin-bottom:3px;"><b>2.</b> ካርዱ ለሌላ ሰው አሳልፎ መስጠት የተከለከለ ነው። / Strictly non-transferable.</p>
            <p style="margin-bottom:3px;"><b>3.</b> ቢጠፋ በአስቸኳይ ለሬስቶራንቱ አስተዳደር ያሳውቁ። / Report immediately if lost.</p>
            <p><b>4.</b> ያገኘ ሰው እባክዎ ለብሉም ባር እና ሬስቶራንት ቅርንጫፍ ያስረክቡ። / If found, please return to Bloom Bar &amp; Restaurant.</p>
          </div>

          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:5px 8px;font-size:8px;color:#1e3a8a;">
            <div style="font-weight:800;text-transform:uppercase;font-size:7.5px;margin-bottom:1px;">Bloom Bar &amp; Restaurant Management</div>
            <div>Tel: +251 91 100 0000 / +251 92 200 0000</div>
            <div>Email: info@bloombarrestaurant.com · Addis Ababa, Ethiopia</div>
          </div>

          <div style="border-top:1px solid #e2e8f0;padding-top:4px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:4px;">
              <div>
                <div style="font-size:7px;color:#94a3b8;font-family:monospace;">Card Serial</div>
                <div style="font-size:8.5px;font-weight:900;color:#0f172a;font-family:monospace;">${employeeId}</div>
              </div>
              <div style="text-align:center;">
                <div style="font-family:serif;font-style:italic;font-size:10px;color:#334155;border-bottom:1px solid #94a3b8;padding:0 10px 1px 10px;">Manager Signature</div>
                <div style="font-size:6.5px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-top:1px;">የሥራ ኃላፊ ፊርማ / Authorized Sign</div>
              </div>
            </div>

            <div style="display:flex;flex-direction:column;align-items:center;">
              <div style="display:flex;height:18px;gap:1.5px;justify-content:center;align-items:center;">
                ${[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 3].map(w => `<div style="width:${w}px;height:100%;background:#0f172a;"></div>`).join('')}
              </div>
              <div style="font-family:monospace;font-size:7.5px;color:#64748b;letter-spacing:1px;margin-top:1px;">*${employeeId}*</div>
            </div>
          </div>
        </div>
      </div>
    `;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Staff Identity Pass - ${fullName} (${employeeId})</title>
  <style>
    @page {
      size: auto;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      padding: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .print-sheet {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 20px;
      align-items: flex-start;
      justify-content: center;
    }
    .badge-card {
      width: 295px;
      height: 460px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      page-break-inside: avoid;
    }
    .back-card {
      background: #fafafa;
    }
    .slot-hole {
      width: 100%;
      display: flex;
      justify-content: center;
      padding: 6px 0 5px 0;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .slot-pill {
      width: 48px;
      height: 9px;
      border-radius: 999px;
      background: #e2e8f0;
      border: 1px solid #cbd5e1;
    }
    .header-row {
      padding: 8px 14px 4px 14px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }
    .brand-box {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .brand-logo {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      object-fit: cover;
      border: 2px solid #f59e0b;
    }
    .brand-text h1 {
      font-size: 11px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.1;
      text-transform: uppercase;
    }
    .brand-text p {
      font-size: 7.5px;
      font-weight: 700;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stripes-box {
      position: relative;
      width: 65px;
      height: 32px;
      overflow: hidden;
    }
    .stripe-gold {
      position: absolute;
      right: 0;
      top: 3px;
      width: 55px;
      height: 4.5px;
      background: #f59e0b;
      border-radius: 999px;
      transform: rotate(-25deg);
      transform-origin: top right;
    }
    .stripe-navy {
      position: absolute;
      right: 8px;
      top: 13px;
      width: 45px;
      height: 4.5px;
      background: #1e3a8a;
      border-radius: 999px;
      transform: rotate(-25deg);
      transform-origin: top right;
    }
    .photo-area {
      display: flex;
      justify-content: center;
      padding: 4px 0;
    }
    .photo-frame {
      width: 116px;
      height: 155px;
      border-radius: 7px;
      overflow: hidden;
      border: 1.5px solid #cbd5e1;
      background: #f8fafc;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .photo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
    }
    .initials-fallback {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 8px;
    }
    .initials-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #dbeafe;
      border: 2px solid #93c5fd;
      color: #1e3a8a;
      font-size: 17px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 5px;
    }
    .status-dot {
      position: absolute;
      top: 5px;
      right: 5px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      border: 2px solid #ffffff;
    }
    .info-area {
      padding: 6px 14px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .info-item {
      margin-bottom: 3px;
    }
    .label {
      font-size: 7.5px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .val-name {
      font-size: 12px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .val-position {
      font-size: 10.5px;
      font-weight: 800;
      color: #1e3a8a;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .dept-pill {
      font-size: 7.5px;
      font-weight: 700;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      padding: 1px 4px;
    }
    .id-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 3px;
    }
    .val-id {
      font-family: monospace;
      font-size: 12px;
      font-weight: 900;
      color: #1e3a8a;
    }
    .qr-img {
      width: 42px;
      height: 42px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 2px;
      background: #ffffff;
    }
    .footer-bar {
      margin-top: auto;
      background: #1e3a8a;
      color: #ffffff;
      padding: 5px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 8px;
      font-weight: 600;
      border-top: 2px solid #f59e0b;
    }
    .cut-guide {
      width: 100%;
      text-align: center;
      margin-top: 12px;
      font-size: 9.5px;
      color: #64748b;
      border-top: 1px dashed #cbd5e1;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <div class="print-sheet">
    ${mode === 'both' ? `
      ${frontCardHtml}
      ${backCardHtml}
      <div class="cut-guide">✂ Cut along card borders · Insert into standard physical badge pouch (CR80) · Bloom Bar &amp; Restaurant</div>
    ` : mode === 'back' ? backCardHtml : frontCardHtml}
  </div>
</body>
</html>`;

    // Remove any previous print frame
    const oldFrame = document.getElementById('__staff_badge_print_frame__');
    if (oldFrame) oldFrame.remove();

    const iframe = document.createElement('iframe');
    iframe.id = '__staff_badge_print_frame__';
    iframe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;border:none;opacity:0;pointer-events:none;z-index:-9999;';
    document.body.appendChild(iframe);

    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();

    const trigger = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print trigger error:', err);
      } finally {
        setTimeout(() => iframe.remove(), 2500);
      }
    };

    const imgs = iframe.contentDocument.images;
    if (imgs && imgs.length > 0) {
      let loaded = 0;
      const total = imgs.length;
      const onDone = () => {
        loaded++;
        if (loaded >= total) setTimeout(trigger, 150);
      };
      for (let i = 0; i < total; i++) {
        if (imgs[i].complete) onDone();
        else {
          imgs[i].onload = onDone;
          imgs[i].onerror = onDone;
        }
      }
      setTimeout(trigger, 1200);
    } else {
      setTimeout(trigger, 250);
    }
  };

  if (!open || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[96vh]">

        {/* Modal Header */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#0f284c] via-[#1e3a8a] to-[#1d4ed8] text-white">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
              <Award className="h-4 w-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                Official Staff Identity Badge
                {isNewlyCreated && (
                  <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    ✨ Registered!
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-blue-200/90">Corporate Staff Pass · Bloom Bar & Restaurant</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSide(s => s === 'front' ? 'back' : 'front')}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-blue-100 transition"
              title="Flip between Front and Back of badge"
            >
              <RotateCw size={13} />
              <span>{side === 'front' ? 'Show Back' : 'Show Front'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-blue-100/70 hover:text-white hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body / Badge Container */}
        <div className="p-4 sm:p-6 bg-slate-100 flex flex-col items-center justify-center overflow-y-auto">

          {/* Success toast when newly registered */}
          {isNewlyCreated && (
            <div className="no-print w-full max-w-sm mb-3 text-center bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>Staff profile created! Official ID Badge is ready to print.</span>
            </div>
          )}

          {/* ══════════════ PHYSICAL BADGE CASING (with lanyard clip) ══════════════ */}
          <div className="relative flex flex-col items-center">
            
            {/* Lanyard Strap & Metallic Swivel Hook */}
            <div className="no-print flex flex-col items-center -mb-2 z-20">
              <div className="w-8 h-10 bg-gradient-to-b from-[#1e3a8a] to-[#0f284c] rounded-t-sm shadow-md border-x border-[#0f284c] flex items-center justify-center">
                <div className="w-1.5 h-6 bg-amber-400/30 rounded-full" />
              </div>
              <div className="w-6 h-5 rounded-t-full border-2 border-slate-400 bg-gradient-to-b from-slate-200 to-slate-400 shadow-sm flex items-center justify-center -mt-1">
                <div className="w-3 h-3 rounded-full bg-slate-500 shadow-inner" />
              </div>
            </div>

            {/* Clear Protective ID Card Casing Holder */}
            <div
              id="printable-employee-badge-area"
              ref={badgeRef}
              className="w-[310px] sm:w-[330px] rounded-2xl bg-white shadow-2xl border-4 border-slate-200/90 overflow-hidden flex flex-col relative select-none"
              style={{
                minHeight: '500px',
              }}
            >
              {/* Lanyard Slot Hole at top of clear plastic holder */}
              <div className="w-full flex justify-center pt-2 pb-1.5 bg-slate-50 border-b border-slate-200/60 relative z-10">
                <div className="w-14 h-3 rounded-full bg-slate-200 border border-slate-300 shadow-inner flex items-center justify-center">
                  <div className="w-10 h-1 rounded-full bg-slate-300" />
                </div>
              </div>

              {side === 'front' ? (
                /* ══════════════ FRONT OF BADGE ══════════════ */
                <div className="flex-1 flex flex-col bg-white relative">
                  
                  {/* Top Header Row: Company Logo + Diagonal Corporate Stripes */}
                  <div className="px-4 pt-3 pb-2 flex items-start justify-between relative overflow-hidden">
                    
                    {/* Left: Bloom Bar & Restaurant Logo and Corporate Branding */}
                    <div className="flex items-center gap-2 z-10">
                      <BloomAfricaIcon size={36} className="ring-2 ring-emerald-500/80 shadow-md" />
                      <div>
                        <span className="block text-xs font-black tracking-tight text-slate-900 leading-tight uppercase font-sans">
                          BLOOM
                        </span>
                        <span className="block text-[9px] font-bold tracking-wider text-blue-700 uppercase">
                          BAR &amp; RESTAURANT
                        </span>
                      </div>
                    </div>

                    {/* Right: Modern Corporate Diagonal Accent Stripes */}
                    <div className="relative w-20 h-10 overflow-hidden pointer-events-none">
                      {/* Diagonal stripe 1: Amber / Gold */}
                      <div
                        className="absolute right-0 top-1 w-16 h-1.5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-xs"
                        style={{ transform: 'rotate(-25deg)', transformOrigin: 'top right' }}
                      />
                      {/* Diagonal stripe 2: Royal Blue */}
                      <div
                        className="absolute right-2 top-4 w-12 h-1.5 bg-gradient-to-r from-blue-700 to-blue-900 rounded-full shadow-xs"
                        style={{ transform: 'rotate(-25deg)', transformOrigin: 'top right' }}
                      />
                    </div>
                  </div>

                  {/* 3×4 Passport Photo Area (Centered) */}
                  <div className="px-4 py-2 flex justify-center">
                    <div
                      className="relative rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50 shadow-md flex items-center justify-center group"
                      style={{
                        width: '126px',
                        height: '168px', // Exact 3:4 aspect ratio
                      }}
                    >
                      {photoSrc && !photoLoadError ? (
                        <img
                          src={photoSrc}
                          alt={fullName}
                          className="w-full h-full object-cover object-top"
                          onError={() => setPhotoLoadError(true)}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100/60 text-blue-900 p-2 text-center">
                          <div className="h-14 w-14 rounded-full bg-blue-200/80 border-2 border-blue-400/50 flex items-center justify-center text-blue-900 text-lg font-black shadow-inner mb-1.5">
                            {initials}
                          </div>
                          <span className="text-[10px] font-bold tracking-tight text-blue-800">
                            3×4 Photo
                          </span>
                          <span className="text-[8px] text-blue-600">Standard Pass</span>
                        </div>
                      )}

                      {/* Card Active Status Dot */}
                      <span
                        className={`absolute top-2 right-2 h-3 w-3 rounded-full border-2 border-white shadow-xs ${
                          isCardActive ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                        title={isCardActive ? 'Active Employee' : 'Inactive'}
                      />
                    </div>
                  </div>

                  {/* Employee Corporate Details Block */}
                  <div className="px-5 pt-1 pb-3 flex-1 flex flex-col justify-between">
                    
                    {/* Full Name */}
                    <div className="mb-2">
                      <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                        ስም / Name:
                      </p>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug uppercase">
                        {fullName}
                      </h3>
                    </div>

                    {/* Position / Job Title with Department Pill */}
                    <div className="mb-2">
                      <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                        የሥራ መደብ / Position:
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="text-xs font-bold text-blue-800">
                          {position}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[9px] font-semibold text-blue-800">
                          <Building2 size={9} />
                          {department}
                        </span>
                      </div>
                    </div>

                    {/* ID Number + Scannable QR Code */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
                      <div>
                        <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                          መለያ ቁጥር / ID No:
                        </p>
                        <p className="font-mono text-sm font-black text-blue-700 tracking-wide">
                          {employeeId}
                        </p>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          Issue: {hireDate}
                        </p>
                      </div>

                      {/* Live Scannable QR Code */}
                      {qrCodeUrl && (
                        <div className="flex flex-col items-center">
                          <div className="p-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                            <img
                              src={qrCodeUrl}
                              alt="Staff Verification QR"
                              className="w-12 h-12"
                            />
                          </div>
                          <span className="text-[7px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            VERIFY
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Solid Corporate Footer Bar */}
                  <div className="bg-[#1e3a8a] text-white px-4 py-1.5 flex items-center justify-between text-[9px] font-medium border-t-2 border-amber-400">
                    <span className="flex items-center gap-1">
                      <Phone size={10} className="text-amber-300" />
                      +251 91 100 0000
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail size={10} className="text-amber-300" />
                      info@bloombarrestaurant.com
                    </span>
                  </div>
                </div>
              ) : (
                /* ══════════════ BACK OF BADGE ══════════════ */
                <div className="flex-1 flex flex-col bg-slate-50 relative p-4 text-slate-700 justify-between">
                  <div>
                    {/* Header with Emblem */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <BloomAfricaIcon size={26} className="ring-1 ring-slate-300 shadow-xs" />
                        <div>
                          <p className="text-xs font-black uppercase text-slate-900 leading-tight">
                            Bloom Bar &amp; Restaurant
                          </p>
                          <p className="text-[8px] font-bold uppercase tracking-wider text-blue-700">
                            Staff Pass Guidelines
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        {employeeId}
                      </span>
                    </div>

                    {/* Official Pass Rules (Amharic & English) */}
                    <div className="space-y-2 text-[9px] leading-relaxed text-slate-600 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-blue-700 shrink-0">1.</span>
                        <p>
                          <b>ይህ መታወቂያ የብሉም ባር እና ሬስቶራንት ንብረት ሲሆን በሥራ ሰዓት መያዝ ግዴታ ነው።</b><br />
                          This pass is property of Bloom Bar &amp; Restaurant and must be worn on duty.
                        </p>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-blue-700 shrink-0">2.</span>
                        <p>
                          <b>ካርዱ ለሌላ ሰው አሳልፎ መስጠት የተከለከለ ነው።</b><br />
                          Strictly non-transferable.
                        </p>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-blue-700 shrink-0">3.</span>
                        <p>
                          <b>ቢጠፋ በአስቸኳይ ለሬስቶራንቱ አስተዳደር ያሳውቁ።</b><br />
                          Report immediately if lost or damaged.
                        </p>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-blue-700 shrink-0">4.</span>
                        <p>
                          <b>ያገኘ ሰው እባክዎ ለብሉም ባር እና ሬስቶራንት ቅርንጫፍ ያስረክቡ።</b><br />
                          If found, please return to Bloom Bar &amp; Restaurant branch office.
                        </p>
                      </div>
                    </div>

                    {/* Management Emergency Contacts */}
                    <div className="mt-3 p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-[9px] text-blue-900 space-y-1">
                      <p className="font-bold text-[10px] text-blue-950 uppercase tracking-wide">
                        Bloom Bar &amp; Restaurant Management
                      </p>
                      <p className="flex items-center gap-1 text-slate-700">
                        <span>Tel:</span> +251 91 100 0000 / +251 92 200 0000
                      </p>
                      <p className="flex items-center gap-1 text-slate-700">
                        <span>Email:</span> info@bloombarrestaurant.com
                      </p>
                      <p className="text-[8px] text-slate-500">
                        Addis Ababa, Ethiopia
                      </p>
                    </div>
                  </div>

                  {/* Signatures & Barcode */}
                  <div className="border-t border-slate-200 pt-3 mt-2">
                    <div className="flex items-end justify-between px-2 mb-2">
                      <div className="text-left">
                        <p className="text-[7.5px] uppercase font-bold text-slate-400">Card Serial</p>
                        <p className="font-mono text-[9px] font-bold text-slate-700">{employeeId}</p>
                      </div>
                      <div className="text-right">
                        <div className="border-b border-slate-400 w-24 pb-0.5 text-center font-serif text-[11px] italic text-slate-700">
                          Manager Sign
                        </div>
                        <p className="text-[7.5px] uppercase font-bold text-slate-400 mt-0.5">
                          የሥራ ኃላፊ ፊርማ / Authorized Sign
                        </p>
                      </div>
                    </div>

                    {/* Serialized Barcode representation */}
                    <div className="flex flex-col items-center justify-center pt-1">
                      <div className="flex items-center gap-0.5 h-5 px-3">
                        {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 3].map((w, idx) => (
                          <div
                            key={idx}
                            className="h-full bg-slate-900"
                            style={{ width: `${w}px` }}
                          />
                        ))}
                      </div>
                      <p className="font-mono text-[8px] text-slate-500 tracking-widest mt-0.5">
                        *{employeeId}*
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Flip Hint */}
          <p className="no-print text-center text-[11px] text-slate-500 mt-3 flex items-center justify-center gap-1">
            <RotateCw size={12} className="text-blue-600" />
            <span>Viewing <b>{side === 'front' ? 'Front Side' : 'Back Side'}</b> · Click Flip or Print to print both sides</span>
          </p>
        </div>

        {/* Modal Actions Footer */}
        <div className="no-print px-5 py-3.5 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSide(s => s === 'front' ? 'back' : 'front')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition"
            >
              <RotateCw size={13} className="text-blue-600" />
              <span>Flip Card ({side === 'front' ? 'Back' : 'Front'})</span>
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(employee);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition"
              >
                <Camera size={13} className="text-slate-500" />
                <span>Change Photo</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePrint('front')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 transition"
              title="Print Front pass only"
            >
              <Printer size={13} />
              <span>Print Front</span>
            </button>
            <button
              type="button"
              onClick={() => handlePrint('both')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 px-4 py-2 text-xs font-bold text-white shadow-md transition"
              title="Print Front and Back side-by-side with scissors cutting guide"
            >
              <Printer size={14} />
              <span>Print Badge (Front &amp; Back)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
